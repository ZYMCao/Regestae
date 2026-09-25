import { getWeKnoraConfig, type TokenRefreshResult } from "../config";

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (error: unknown) => void;
}> = [];

export type RefreshAccessTokenOptions = {
	refresh?: (refreshToken: string) => Promise<TokenRefreshResult>;
	messages?: {
		pleaseRelogin: string;
		tokenRefreshFailed: string;
	};
};

const defaultMessages = {
	pleaseRelogin: "Please log in again",
	tokenRefreshFailed: "Token refresh failed",
};

export class StreamAuthError extends Error {
	constructor(readonly status: number) {
		super(`HTTP ${status}`);
		this.name = "StreamAuthError";
	}
}

export function isStreamAuthError(err: unknown): boolean {
	if (!err || typeof err !== "object") return false;
	if (err instanceof StreamAuthError) return true;
	return (err as { name?: string }).name === "StreamAuthError";
}

export function isEmbedPage(): boolean {
	return getWeKnoraConfig().isEmbedPage();
}

export function redirectToLogin() {
	getWeKnoraConfig().onAuthFailure();
}

export function clearAuthStorage() {
	getWeKnoraConfig().clearTokens();
}

export function forceReloginRedirect() {
	clearAuthStorage();
	redirectToLogin();
}

function processQueue(error: unknown, token: string | null = null) {
	failedQueue.forEach(({ resolve, reject }) => {
		if (error) {
			reject(error);
		} else {
			resolve(token as string);
		}
	});
	failedQueue = [];
}

async function defaultRefresh(refreshToken: string): Promise<TokenRefreshResult> {
	const refresh = getWeKnoraConfig().refreshToken;
	if (!refresh) {
		throw new Error("No refresh handler configured; call configureWeKnora({ refreshToken }).");
	}
	return refresh(refreshToken);
}

export async function refreshAccessTokenShared(options: RefreshAccessTokenOptions = {}): Promise<string> {
	const config = getWeKnoraConfig();
	const messages = { ...defaultMessages, ...options.messages };
	const refresh = options.refresh ?? defaultRefresh;

	if (isRefreshing) {
		return new Promise<string>((resolve, reject) => {
			failedQueue.push({ resolve, reject });
		});
	}

	isRefreshing = true;
	const storedRefreshToken = config.getRefreshToken();

	if (!storedRefreshToken) {
		clearAuthStorage();
		const noRefreshTokenError = new Error(messages.pleaseRelogin);
		processQueue(noRefreshTokenError, null);
		isRefreshing = false;
		redirectToLogin();
		throw noRefreshTokenError;
	}

	try {
		const response = await refresh(storedRefreshToken);

		if (!response.success || !response.data?.token) {
			throw new Error(response.message || messages.tokenRefreshFailed);
		}

		const { token, refreshToken: newRefreshToken } = response.data;
		config.setTokens({ token, refreshToken: newRefreshToken });
		processQueue(null, token);
		return token;
	} catch (refreshError) {
		clearAuthStorage();
		processQueue(refreshError, null);
		redirectToLogin();
		throw refreshError;
	} finally {
		isRefreshing = false;
	}
}

export async function runStreamWithAuthRetry<T>(options: {
	run: (token: string) => Promise<T>;
	initialToken: string;
	isEmbed: boolean;
	isCurrent: () => boolean;
	refreshAccessToken: () => Promise<string>;
	reloginMessage: string;
}): Promise<T | undefined> {
	try {
		return await options.run(options.initialToken);
	} catch (err) {
		if (!isStreamAuthError(err) || options.isEmbed) throw err;

		let refreshedToken: string;
		try {
			refreshedToken = await options.refreshAccessToken();
		} catch {
			throw new Error(options.reloginMessage);
		}

		if (!options.isCurrent()) return undefined;

		try {
			return await options.run(refreshedToken);
		} catch (retryErr) {
			if (isStreamAuthError(retryErr)) {
				throw new Error(options.reloginMessage);
			}
			throw retryErr;
		}
	}
}

export function resetAuthRefreshStateForTests() {
	isRefreshing = false;
	failedQueue = [];
}
