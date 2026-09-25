import { getWeKnoraConfig } from "../config";
import { shouldRejectKnowledgeFileType } from "./fileTypeVerification";

function positiveMegabytes(value: unknown, fallback: number): number {
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getMaxFileSizeMb(): number {
	return getWeKnoraConfig().limits.maxFileSizeMb;
}

export function getMaxFileSizeBytes(): number {
	return getMaxFileSizeMb() * 1024 * 1024;
}

export function getMaxSkillBundleSizeMb(): number {
	const { maxFileSizeMb, maxSkillBundleSizeMb } = getWeKnoraConfig().limits;
	return Math.min(512, Math.max(positiveMegabytes(maxSkillBundleSizeMb, 256), maxFileSizeMb));
}

export function getMaxSkillBundleSizeBytes(): number {
	return getMaxSkillBundleSizeMb() * 1024 * 1024;
}

export function generateRandomString(length: number) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

export function formatStringDate(date: string | number | Date) {
	const data = new Date(date);
	const year = data.getFullYear();
	const month = String(data.getMonth() + 1).padStart(2, "0");
	const day = String(data.getDate()).padStart(2, "0");
	const hour = String(data.getHours()).padStart(2, "0");
	const minute = String(data.getMinutes()).padStart(2, "0");
	const second = String(data.getSeconds()).padStart(2, "0");
	return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

export function fileSizeVerification(file: Pick<File, "size">, silent = false) {
	const maxFileSizeMb = getMaxFileSizeMb();
	if (file.size <= maxFileSizeMb * 1024 * 1024) return false;
	if (!silent) {
		getWeKnoraConfig().notifyError(getWeKnoraConfig().t("error.fileSizeExceeded", { size: maxFileSizeMb }));
	}
	return true;
}

export function kbFileTypeVerification(file: Pick<File, "name" | "size">, silent = false, validTypes?: Set<string> | string[]) {
	if (shouldRejectKnowledgeFileType(file.name, validTypes)) {
		if (!silent) {
			getWeKnoraConfig().notifyError(getWeKnoraConfig().t("error.unsupportedFileType"));
		}
		return true;
	}
	return fileSizeVerification(file, silent);
}
