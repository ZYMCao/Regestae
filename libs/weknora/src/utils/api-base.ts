import { getWeKnoraConfig } from "../config";

export function getApiBaseUrl(): string {
	return getWeKnoraConfig().baseUrl;
}
