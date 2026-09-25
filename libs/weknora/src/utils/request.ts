import { getWeKnoraConfig } from "../config";
import { isEmbedPage, refreshAccessTokenShared } from "./authRefresh";
import { generateRandomString } from "./index";
import { isTimeoutError, uploadTimeoutMs } from "./requestTimeouts";
import { isSkillBundleUploadUrl } from "./uploadLimit";

export type WithStatus<T> = T & {
	readonly $httpStatus: number;
};

const HTTP_STATUS_KEY = "$httpStatus";

const DEFAULT_TIMEOUT_MS = 30_000;
const ERR_ENTITY_TOO_LARGE = 413;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestConfig {
	headers?: Record<string, string>;
	params?: Record<string, string | number | boolean | null | undefined>;
	signal?: AbortSignal;
	timeout?: number;
	responseType?: "json" | "blob" | "text";
	onUploadProgress?: (event: { loaded: number; total?: number }) => void;
}

interface RequestOptions extends RequestConfig {
	data?: unknown;

	_retry?: boolean;
}

function withHttpStatus<T>(data: T, status: number): WithStatus<T> {
	if (data !== null && typeof data === "object") {
		Object.defineProperty(data, HTTP_STATUS_KEY, {
			value: status,
			configurable: true,
			enumerable: false,
			writable: false,
		});
	}
	return data as WithStatus<T>;
}

const PUBLIC_AUTH_PATHS = ["/auth/auto-setup", "/auth/login", "/auth/register", "/auth/oidc/", "/auth/invitations/lookup", "/api/v1/embed/"];

function isPublicAuthRequest(url: string): boolean {
	return PUBLIC_AUTH_PATHS.some((p) => url.includes(p));
}

function buildUrl(path: string, params?: RequestConfig["params"]): string {
	const { baseUrl } = getWeKnoraConfig();
	const absolute = /^https?:\/\//i.test(path);
	let url = absolute ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
	if (params) {
		const query = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined && value !== null) query.append(key, String(value));
		}
		const qs = query.toString();
		if (qs) url += (url.includes("?") ? "&" : "?") + qs;
	}
	return url;
}

interface BuiltHeaders {
	headers: Record<string, string>;
	embed: boolean;
}

function buildHeaders(path: string, explicit: Record<string, string> | undefined, hasJsonBody: boolean): BuiltHeaders {
	const config = getWeKnoraConfig();
	const headers: Record<string, string> = { "X-Request-ID": generateRandomString(12), ...explicit };

	const existingAuth = headers.Authorization ?? headers.authorization;
	const embed = (typeof existingAuth === "string" && existingAuth.startsWith("Embed ")) || path.includes("/api/v1/embed/");

	if (hasJsonBody && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
	if (!headers["Accept-Language"]) headers["Accept-Language"] = config.getLocale();

	if (!embed) {
		const token = config.getToken();
		if (token) headers.Authorization = `Bearer ${token}`;
		const tenantId = config.getTenantId();
		if (tenantId) headers["X-Tenant-ID"] = tenantId;
	}

	return { headers, embed };
}

function parseJson(text: string): unknown {
	if (!text) return undefined;
	try {
		return JSON.parse(text);
	} catch {
		return undefined;
	}
}

function extractMessage(payload: unknown): string | undefined {
	if (typeof payload === "string") return payload || undefined;
	if (payload && typeof payload === "object") {
		const data = payload as Record<string, unknown>;
		if (typeof data.error === "string") return data.error;
		if (data.error && typeof data.error === "object") {
			const nested = (data.error as Record<string, unknown>).message;
			if (typeof nested === "string") return nested;
		}
		if (typeof data.message === "string") return data.message;
	}
	return undefined;
}

function buildError(payload: unknown, status: number, path: string): WithStatus<Record<string, unknown>> {
	const config = getWeKnoraConfig();

	if (status === ERR_ENTITY_TOO_LARGE) {
		const skillUpload = isSkillBundleUploadUrl(path);
		const size = skillUpload ? config.limits.maxSkillBundleSizeMb : config.limits.maxFileSizeMb;
		const message = skillUpload ? config.t("settings.sandbox.skillBundleTooLarge", { size }) : config.t("error.fileSizeExceeded", { size });
		return withHttpStatus<Record<string, unknown>>({ status, message, success: false }, status);
	}

	const fallback = status === 401 || status === 403 ? (isPublicAuthRequest(path) ? config.t("error.invalidCredentials") : undefined) : undefined;
	const message = extractMessage(payload) ?? fallback;
	const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
	return withHttpStatus<Record<string, unknown>>({ status, message, ...body }, status);
}

async function buildErrorFromResponse(res: Response, path: string): Promise<WithStatus<Record<string, unknown>>> {
	const status = res.status;
	let payload: unknown;
	try {
		const text = (await res.text()).trim();
		if (text) {
			const contentType = res.headers.get("content-type") ?? "";
			payload = contentType.includes("json") || text.startsWith("{") || text.startsWith("[") ? (parseJson(text) ?? text) : text;
		}
	} catch {}
	return buildError(payload, status, path);
}

async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> {
	const config = getWeKnoraConfig();
	const url = buildUrl(path, options.params);
	const isForm = typeof FormData !== "undefined" && options.data instanceof FormData;
	const { headers, embed } = buildHeaders(path, options.headers, options.data !== undefined && !isForm);

	const controller = new AbortController();
	const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
	let timedOut = false;
	const timer =
		timeout > 0
			? setTimeout(() => {
					timedOut = true;
					controller.abort();
				}, timeout)
			: null;
	const onExternalAbort = () => controller.abort();
	if (options.signal) {
		if (options.signal.aborted) controller.abort();
		else options.signal.addEventListener("abort", onExternalAbort, { once: true });
	}

	let res: Response;
	try {
		res = await fetch(url, {
			method,
			headers,
			body: options.data === undefined ? undefined : isForm ? (options.data as FormData) : JSON.stringify(options.data),
			signal: controller.signal,
		});
	} catch (error) {
		if (timedOut || isTimeoutError(error)) {
			return Promise.reject({ message: config.t("error.requestTimeout") });
		}
		if (options.signal?.aborted) throw error;
		return Promise.reject({ message: config.t("error.networkError") });
	} finally {
		if (timer) clearTimeout(timer);
		options.signal?.removeEventListener("abort", onExternalAbort);
	}

	const status = res.status;

	if (status === 401 && !options._retry && !path.includes("/auth/refresh") && !isPublicAuthRequest(path) && !embed && !isEmbedPage()) {
		const token = await refreshAccessTokenShared({
			messages: {
				pleaseRelogin: config.t("error.pleaseRelogin"),
				tokenRefreshFailed: config.t("error.tokenRefreshFailed"),
			},
		});
		return request<T>(method, path, { ...options, _retry: true, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
	}

	if (options.responseType === "blob") {
		if (!res.ok) return Promise.reject(await buildErrorFromResponse(res, path));
		return (await res.blob()) as unknown as T;
	}

	if (options.responseType === "text") {
		const text = await res.text();
		if (!res.ok) return Promise.reject(buildError(parseJson(text) ?? text, status, path));
		return text as unknown as T;
	}

	const text = await res.text();
	const payload = parseJson(text) ?? (text ? text : undefined);
	if (!res.ok) return Promise.reject(buildError(payload, status, path));
	return withHttpStatus(payload, status) as unknown as T;
}

function xhrUpload(url: string, data: unknown, onUploadProgress: RequestConfig["onUploadProgress"], config: RequestConfig): Promise<WithStatus<unknown>> {
	const weknora = getWeKnoraConfig();
	const target = buildUrl(url, config.params);

	return new Promise<WithStatus<unknown>>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", target, true);
		xhr.timeout = config.timeout ?? uploadTimeoutMs(data);

		const { headers } = buildHeaders(url, config.headers, false);
		for (const [key, value] of Object.entries(headers)) {
			if (key.toLowerCase() === "content-type") continue;
			try {
				xhr.setRequestHeader(key, value);
			} catch {}
		}

		if (config.signal) {
			if (config.signal.aborted) {
				reject(config.signal.reason ?? new DOMException("Aborted", "AbortError"));
				return;
			}
			config.signal.addEventListener("abort", () => xhr.abort(), { once: true });
		}

		xhr.upload.onprogress = (event) => {
			onUploadProgress?.({ loaded: event.loaded, total: event.lengthComputable ? event.total : undefined });
		};
		xhr.onload = () => {
			const text = xhr.responseText ?? "";
			const payload = parseJson(text) ?? (text ? text : undefined);
			if (xhr.status >= 200 && xhr.status < 300) resolve(withHttpStatus<unknown>(payload, xhr.status));
			else reject(buildError(payload, xhr.status, url));
		};
		xhr.onerror = () => reject({ message: weknora.t("error.networkError") });
		xhr.ontimeout = () => reject({ message: weknora.t("error.requestTimeout") });
		xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));

		xhr.send((data ?? null) as XMLHttpRequestBodyInit | null);
	});
}

export function getCurrentLanguage(): string {
	return getWeKnoraConfig().getLocale();
}

export function get<T = unknown>(url: string, config?: RequestConfig): Promise<WithStatus<T>> {
	return request<WithStatus<T>>("GET", url, config);
}

export async function getDown(url: string): Promise<Blob> {
	return request<Blob>("GET", url, { responseType: "blob" });
}

export function postUpload<T = unknown>(url: string, data: unknown = {}, onUploadProgress?: (event: { loaded: number; total?: number }) => void, config: RequestConfig = {}): Promise<WithStatus<T>> {
	return xhrUpload(url, data, onUploadProgress, config) as Promise<WithStatus<T>>;
}

export function post<T = unknown>(url: string, data: unknown = {}, config?: RequestConfig): Promise<WithStatus<T>> {
	return request<WithStatus<T>>("POST", url, { ...config, data });
}

export function put<T = unknown>(url: string, data: unknown = {}, config?: RequestConfig): Promise<WithStatus<T>> {
	return request<WithStatus<T>>("PUT", url, { ...config, data });
}

export function patch<T = unknown>(url: string, data: unknown = {}, config?: RequestConfig): Promise<WithStatus<T>> {
	return request<WithStatus<T>>("PATCH", url, { ...config, data });
}

export function del<T = unknown>(url: string, data?: unknown): Promise<WithStatus<T>> {
	return request<WithStatus<T>>("DELETE", url, { data });
}
