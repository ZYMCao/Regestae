import { placeholderT } from "./internal/i18n";

export interface WeKnoraTokens {
	token: string;
	refreshToken?: string;
}

export interface TokenRefreshResult {
	success: boolean;
	data?: { token: string; refreshToken: string };
	message?: string;
}

export interface WeKnoraLimits {
	maxFileSizeMb: number;
	maxSkillBundleSizeMb: number;
}

export interface WeKnoraConfig {
	baseUrl?: string;

	getToken?: () => string | null | undefined;

	getRefreshToken?: () => string | null | undefined;

	setTokens?: (tokens: WeKnoraTokens) => void;

	clearTokens?: () => void;

	getTenantId?: () => string | null | undefined;

	refreshToken?: (refreshToken: string) => Promise<TokenRefreshResult>;

	onAuthFailure?: () => void;

	isEmbedPage?: () => boolean;

	t?: (key: string, params?: Record<string, unknown>) => string;

	getLocale?: () => string;

	limits?: Partial<WeKnoraLimits>;

	notifyError?: (message: string) => void;
}

export interface ResolvedWeKnoraConfig {
	baseUrl: string;
	getToken: () => string | null;
	getRefreshToken: () => string | null;
	setTokens: (tokens: WeKnoraTokens) => void;
	clearTokens: () => void;
	getTenantId: () => string | null;
	refreshToken: ((refreshToken: string) => Promise<TokenRefreshResult>) | null;
	onAuthFailure: () => void;
	isEmbedPage: () => boolean;
	t: (key: string, params?: Record<string, unknown>) => string;
	getLocale: () => string;
	limits: WeKnoraLimits;
	notifyError: (message: string) => void;
}

const DEFAULT_MAX_FILE_SIZE_MB = 50;
const DEFAULT_MAX_SKILL_BUNDLE_SIZE_MB = 256;

const SKILL_BUNDLE_CEILING_MB = 512;

const TOKEN_KEY = "weknora_token";
const REFRESH_TOKEN_KEY = "weknora_refresh_token";
const TENANT_KEY = "weknora_selected_tenant_id";
const LOCALE_KEY = "locale";

export const WEKNORA_BROWSER_STORAGE_KEYS = [
	TOKEN_KEY,
	REFRESH_TOKEN_KEY,
	"weknora_user",
	"weknora_tenant",
	"weknora_knowledge_bases",
	"weknora_current_kb",
	TENANT_KEY,
	"weknora_selected_tenant_name",
	"weknora_memberships",
] as const;

function positiveMegabytes(value: unknown, fallback: number): number {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

function defaultIsEmbedPage(): boolean {
	if (typeof window === "undefined") return false;
	return window.location.pathname.startsWith("/embed/");
}

function resolve(config: WeKnoraConfig): ResolvedWeKnoraConfig {
	const maxFileSizeMb = positiveMegabytes(config.limits?.maxFileSizeMb, DEFAULT_MAX_FILE_SIZE_MB);
	const maxSkillBundleSizeMb = Math.min(SKILL_BUNDLE_CEILING_MB, Math.max(positiveMegabytes(config.limits?.maxSkillBundleSizeMb, DEFAULT_MAX_SKILL_BUNDLE_SIZE_MB), maxFileSizeMb));
	return {
		baseUrl: config.baseUrl ?? "",
		getToken: () => config.getToken?.() ?? null,
		getRefreshToken: () => config.getRefreshToken?.() ?? null,
		setTokens: config.setTokens ?? (() => {}),
		clearTokens: config.clearTokens ?? (() => {}),
		getTenantId: () => config.getTenantId?.() ?? null,
		refreshToken: config.refreshToken ?? null,
		onAuthFailure: config.onAuthFailure ?? (() => {}),
		isEmbedPage: config.isEmbedPage ?? defaultIsEmbedPage,
		t: config.t ?? placeholderT,
		getLocale: config.getLocale ?? (() => "zh-CN"),
		limits: { maxFileSizeMb, maxSkillBundleSizeMb },
		notifyError: config.notifyError ?? (() => {}),
	};
}

let current: ResolvedWeKnoraConfig | null = null;

export function configureWeKnora(config: WeKnoraConfig = {}): ResolvedWeKnoraConfig {
	current = resolve(config);
	return current;
}

export function getWeKnoraConfig(): ResolvedWeKnoraConfig {
	return current ?? (current = resolve({}));
}

export function resetWeKnoraConfigForTests(): void {
	current = null;
}

function hasLocalStorage(): boolean {
	return typeof localStorage !== "undefined";
}

function readViteEnv(): Record<string, string | undefined> {
	return (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
}

interface WeKnoraRuntimeConfig {
	MAX_FILE_SIZE_MB?: number;
	MAX_SKILL_BUNDLE_SIZE_MB?: number;
	DEFAULT_LOCALE?: string;
}

function readRuntimeConfig(): WeKnoraRuntimeConfig | undefined {
	if (typeof window === "undefined") return undefined;
	return (window as unknown as { __RUNTIME_CONFIG__?: WeKnoraRuntimeConfig }).__RUNTIME_CONFIG__;
}

export function browserDefaults(overrides: WeKnoraConfig = {}): WeKnoraConfig {
	const viteEnv = readViteEnv();
	const runtime = readRuntimeConfig();
	return {
		baseUrl: (viteEnv.BASE_URL ?? "/").replace(/\/+$/, ""),
		getToken: () => (hasLocalStorage() ? localStorage.getItem(TOKEN_KEY) : null),
		getRefreshToken: () => (hasLocalStorage() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null),
		setTokens: ({ token, refreshToken }) => {
			if (!hasLocalStorage()) return;
			localStorage.setItem(TOKEN_KEY, token);
			if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
		},
		clearTokens: () => {
			if (!hasLocalStorage()) return;
			for (const key of WEKNORA_BROWSER_STORAGE_KEYS) localStorage.removeItem(key);
		},
		getTenantId: () => (hasLocalStorage() ? localStorage.getItem(TENANT_KEY) : null),
		getLocale: () => (hasLocalStorage() ? localStorage.getItem(LOCALE_KEY) : null) ?? runtime?.DEFAULT_LOCALE ?? "zh-CN",
		limits: {
			maxFileSizeMb: positiveMegabytes(runtime?.MAX_FILE_SIZE_MB ?? viteEnv.VITE_MAX_FILE_SIZE_MB, DEFAULT_MAX_FILE_SIZE_MB),
			maxSkillBundleSizeMb: positiveMegabytes(runtime?.MAX_SKILL_BUNDLE_SIZE_MB ?? viteEnv.VITE_MAX_SKILL_BUNDLE_SIZE_MB, DEFAULT_MAX_SKILL_BUNDLE_SIZE_MB),
		},
		onAuthFailure: () => {
			if (typeof window === "undefined") return;
			if (defaultIsEmbedPage()) return;
			if (window.location.pathname === "/login") return;
			window.location.href = "/login";
		},
		...overrides,
	};
}
