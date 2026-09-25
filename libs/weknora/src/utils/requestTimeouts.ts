export const UPLOAD_TIMEOUT_FLOOR_MS = 5 * 60 * 1000;

const UPLOAD_BYTES_PER_MINUTE = 10 * 1024 * 1024;

export function uploadPayloadBytes(data: unknown): number {
	if (typeof FormData === "undefined" || !(data instanceof FormData)) return 0;
	let total = 0;
	data.forEach((value) => {
		if (typeof Blob !== "undefined" && value instanceof Blob) total += value.size;
	});
	return total;
}

export function uploadTimeoutMs(data: unknown): number {
	const scaled = Math.ceil((uploadPayloadBytes(data) / UPLOAD_BYTES_PER_MINUTE) * 60_000);
	return Math.max(UPLOAD_TIMEOUT_FLOOR_MS, scaled);
}

export function isTimeoutError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const { code, message } = error as { code?: unknown; message?: unknown };
	if (code === "ECONNABORTED" || code === "ETIMEDOUT") return true;
	return typeof message === "string" && /timeout/i.test(message);
}
