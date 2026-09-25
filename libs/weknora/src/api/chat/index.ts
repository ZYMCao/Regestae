import { get, post, put, del, getDown } from "../../utils/request";

export async function createSessions(data: Record<string, unknown> = {}) {
	return post("/api/v1/sessions", data);
}

export async function getSessionsList(page: number, page_size: number, source?: string) {
	const params = new URLSearchParams({ page: String(page), page_size: String(page_size) });
	if (source) {
		params.set("source", source);
	}
	return get(`/api/v1/sessions?${params.toString()}`);
}

export async function pinSession(session_id: string) {
	return post(`/api/v1/sessions/${session_id}/pin`, {});
}

export async function unpinSession(session_id: string) {
	return del(`/api/v1/sessions/${session_id}/pin`);
}

export async function generateSessionsTitle(session_id: string, data: any) {
	return post(`/api/v1/sessions/${session_id}/generate_title`, data);
}

export async function updateSession(session_id: string, data: { title: string; description?: string }) {
	return put(`/api/v1/sessions/${session_id}`, data);
}

export async function forkSession(session_id: string, data: { message_id: string; title?: string }) {
	return post(`/api/v1/sessions/${session_id}/fork`, data, { timeout: 180000 });
}

export async function rewindSession(session_id: string, data: { message_id: string }) {
	return post(`/api/v1/sessions/${session_id}/rewind`, data, { timeout: 180000 });
}

export async function getMessageList(data: { session_id: string; limit: number; created_at: string }) {
	if (data.created_at) {
		return get(`/api/v1/messages/${data.session_id}/load?before_time=${encodeURIComponent(data.created_at)}&limit=${data.limit}`);
	} else {
		return get(`/api/v1/messages/${data.session_id}/load?limit=${data.limit}`);
	}
}

export async function delSession(session_id: string) {
	return del(`/api/v1/sessions/${session_id}`);
}

export async function batchDelSessions(ids: string[]) {
	return del(`/api/v1/sessions/batch`, { ids });
}

export async function deleteAllSessions() {
	return del(`/api/v1/sessions/batch`, { delete_all: true });
}

export async function getSession(session_id: string) {
	return get(`/api/v1/sessions/${session_id}`);
}

export async function stopSession(session_id: string, message_id: string) {
	return post(`/api/v1/sessions/${session_id}/stop`, { message_id });
}

export async function clearSessionMessages(session_id: string) {
	return del(`/api/v1/sessions/${session_id}/messages`);
}

export interface ArtifactMeta {
	index: number;

	handle?: string;
	file_name: string;
	file_type: string;
	file_size: number;
	source_path: string;
	mod_time: string;
	created_at: string;

	deleted_at?: string;
}

export async function listMessageArtifacts(session_id: string, message_id: string) {
	return get(`/api/v1/sessions/${session_id}/messages/${message_id}/artifacts`);
}

export async function listSessionArtifacts(session_id: string) {
	return get(`/api/v1/sessions/${session_id}/artifacts`);
}

export async function downloadArtifact(session_id: string, message_id: string, index: number): Promise<Blob> {
	return getDown(`/api/v1/sessions/${session_id}/messages/${message_id}/artifacts/${index}/download`);
}

export async function deleteMessageArtifact(session_id: string, message_id: string, index: number, allVersions = false) {
	const query = allVersions ? "?all_versions=true" : "";
	return del(`/api/v1/sessions/${session_id}/messages/${message_id}/artifacts/${index}${query}`);
}
