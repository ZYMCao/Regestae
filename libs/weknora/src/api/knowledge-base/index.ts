import { get, post, put, del, postUpload, getDown } from "../../utils/request";
import type { KnowledgeProcessOverrides } from "../../types/knowledgeProcess";
import type { AuditLog, AuditOutcome, ListAuditLogResponse } from "../tenant/audit-log";
import { buildListKnowledgeFilesQuery } from "./knowledgeFileListQuery";

export { buildListKnowledgeFilesQuery } from "./knowledgeFileListQuery";

export type KnowledgeBaseActivity = AuditLog;

export interface ListKnowledgeBaseActivityParams {
	after_id?: number;
	limit?: number;
	action?: string;
	outcome?: AuditOutcome;
	actor?: string;
}

export async function listKnowledgeBaseActivity(id: string, params: ListKnowledgeBaseActivityParams = {}): Promise<ListAuditLogResponse> {
	const query = new URLSearchParams();
	if (params.after_id) query.set("after_id", String(params.after_id));
	if (params.limit) query.set("limit", String(params.limit));
	if (params.action) query.set("action", params.action);
	if (params.outcome) query.set("outcome", params.outcome);
	if (params.actor) query.set("actor", params.actor);
	const qs = query.toString();
	return (await get(`/api/v1/knowledge-bases/${id}/activity${qs ? `?${qs}` : ""}`)) as unknown as ListAuditLogResponse;
}

export function listKnowledgeBases(params?: {
	agent_id?: string;
	agent_source_tenant_id?: string;

	creator?: "all" | "mine" | "others";
}) {
	const query = new URLSearchParams();
	if (params?.agent_id) query.set("agent_id", params.agent_id);
	if (params?.agent_source_tenant_id) query.set("agent_source_tenant_id", params.agent_source_tenant_id);
	if (params?.creator && params.creator !== "all") query.set("creator", params.creator);
	const qs = query.toString();
	return get(qs ? `/api/v1/knowledge-bases?${qs}` : "/api/v1/knowledge-bases");
}

export type VectorStoreSource = "env" | "user" | "shared" | "unavailable";
export type VectorStoreStatus = "available" | "unavailable";

export interface KnowledgeBaseStoreView {
	vector_store_id?: string | null;
	vector_store_name?: string;
	vector_store_engine_type?: string;
	vector_store_source?: VectorStoreSource;
	vector_store_status?: VectorStoreStatus;
}

export function createKnowledgeBase(data: {
	name: string;
	description?: string;
	type?: "document" | "faq";
	chunking_config?: any;
	embedding_model_id?: string;
	summary_model_id?: string;
	auto_tag_config?: { enabled: boolean; model_id?: string; max_tags?: number; skip_if_tagged?: boolean };

	vector_store_id?: string;

	storage_backend_id?: string;
	vlm_config?: {
		enabled: boolean;
		model_id?: string;
		description_language?: string;
		custom_instructions?: string;
	};
	storage_provider_config?: { provider: string };
	storage_config?: any;
	asr_config?: {
		enabled: boolean;
		model_id?: string;
		language?: string;
	};
	extract_config?: any;
	faq_config?: { index_mode: string; question_index_mode?: string };
	wiki_config?: {
		synthesis_model_id?: string;
		max_pages_per_ingest?: number;
		extraction_granularity?: "focused" | "standard" | "exhaustive";
		content_instructions?: string;
		extraction_instructions?: string;
	};
	indexing_strategy?: {
		vector_enabled: boolean;
		keyword_enabled: boolean;
		wiki_enabled: boolean;
		graph_enabled: boolean;
	};
}) {
	return post(`/api/v1/knowledge-bases`, data);
}

export function getKnowledgeBaseById(id: string, options?: { agent_id?: string; agent_source_tenant_id?: string }) {
	const query = new URLSearchParams();
	if (options?.agent_id) query.set("agent_id", options.agent_id);
	if (options?.agent_source_tenant_id) query.set("agent_source_tenant_id", options.agent_source_tenant_id);
	const qs = query.toString();
	return get(qs ? `/api/v1/knowledge-bases/${id}?${qs}` : `/api/v1/knowledge-bases/${id}`);
}

export function updateKnowledgeBase(
	id: string,
	data: {
		name: string;
		description?: string;
		config?: {
			chunking_config?: any;
			image_processing_config?: any;
			faq_config?: any;
			wiki_config?: {
				synthesis_model_id?: string;
				max_pages_per_ingest?: number;
				extraction_granularity?: "focused" | "standard" | "exhaustive";
				content_instructions?: string;
				extraction_instructions?: string;
			};
			auto_tag_config?: { enabled: boolean; model_id?: string; max_tags?: number; skip_if_tagged?: boolean };
			profile_config?: KnowledgeBaseProfileConfig;
			indexing_strategy?: {
				vector_enabled: boolean;
				keyword_enabled: boolean;
				wiki_enabled: boolean;
				graph_enabled: boolean;
			};
		};
	},
) {
	return put(`/api/v1/knowledge-bases/${id}`, data);
}

export interface KnowledgeBaseProfileConfig {
	enabled: boolean;
	model_id?: string;
	custom_instructions?: string;
}

export interface KnowledgeBaseProfileNamedCount {
	name: string;
	count: number;
}

export interface KnowledgeBaseProfile {
	gist?: string;
	topics?: string[];
	typical_questions?: string[];
	stats?: {
		document_count: number;
		profiled_count: number;
		file_types?: KnowledgeBaseProfileNamedCount[];
		tags?: KnowledgeBaseProfileNamedCount[];
		raw_topics?: KnowledgeBaseProfileNamedCount[];
		doc_types?: KnowledgeBaseProfileNamedCount[];
		folders?: string[];
		earliest_at?: string;
		latest_at?: string;
	};
	aggregate_hash?: string;
	status?: "ready" | "empty" | "failed" | string;
	error?: string;
	model_id?: string;
	generated_at?: string;
}

export function generateKnowledgeBaseProfile(id: string) {
	return post(`/api/v1/knowledge-bases/${id}/profile/generate`, {});
}

export function rebuildKBIndex(kbId: string) {
	return post(`/api/v1/knowledge-bases/${kbId}/rebuild-index`, {});
}

export function deleteKnowledgeBase(id: string) {
	return del(`/api/v1/knowledge-bases/${id}`);
}

export function copyKnowledgeBase(data: { source_id: string; target_id?: string }) {
	return post(`/api/v1/knowledge-bases/copy`, data);
}

export function duplicateKnowledgeBase(id: string) {
	return post(`/api/v1/knowledge-bases/${id}/duplicate`);
}

export function listMoveTargets(sourceKbId: string) {
	return get(`/api/v1/knowledge-bases/${sourceKbId}/move-targets`);
}

export function moveKnowledge(data: { knowledge_ids: string[]; source_kb_id: string; target_kb_id: string; mode: "reuse_vectors" | "reparse" }) {
	return post("/api/v1/knowledge/move", data);
}

export function getKnowledgeMoveProgress(taskId: string) {
	return get(`/api/v1/knowledge/move/progress/${taskId}`);
}

export function togglePinKnowledgeBase(id: string) {
	return put(`/api/v1/knowledge-bases/${id}/pin`);
}

export function uploadKnowledgeFile(
	kbId: string,
	data: {
		file: File;
		tag_ids?: string[];
		fileName?: string;
		process_config?: KnowledgeProcessOverrides | string;
		[key: string]: any;
	} = { file: new File([], "") },
	onProgress?: (progressEvent: any) => void,
	config?: { signal?: AbortSignal },
) {
	const formData = new FormData();
	Object.keys(data).forEach((key) => {
		const value = data[key];
		if (value === undefined) return;
		if (key === "tag_ids" && Array.isArray(value)) {
			formData.append(key, value.join(","));
		} else if (key === "process_config" && value && typeof value !== "string") {
			formData.append(key, JSON.stringify(value));
		} else {
			formData.append(key, value);
		}
	});
	return postUpload(`/api/v1/knowledge-bases/${kbId}/knowledge/file`, formData, onProgress, config);
}

export function createKnowledgeFromURL(kbId: string, data: { url: string; enable_multimodel?: boolean; tag_ids?: string[]; process_config?: KnowledgeProcessOverrides }) {
	return post(`/api/v1/knowledge-bases/${kbId}/knowledge/url`, data);
}

export function createManualKnowledge(
	kbId: string,
	data: {
		title: string;
		content: string;
		status: string;
		tag_ids?: string[];
		process_config?: KnowledgeProcessOverrides;
	},
) {
	return post(`/api/v1/knowledge-bases/${kbId}/knowledge/manual`, data);
}

export type KnowledgeListSortField = "updated_at" | "created_at" | "file_name";
export type KnowledgeListSortOrder = "asc" | "desc";

export interface ListKnowledgeFilesParams {
	page: number;
	page_size: number;
	tag_ids?: string;
	keyword?: string;
	file_type?: string;
	parse_status?: string;
	source?: string;
	start_time?: string;
	end_time?: string;
	sort_by?: KnowledgeListSortField;
	sort_order?: KnowledgeListSortOrder;

	folder_path?: string;

	folder_recursive?: boolean;
}

export function listKnowledgeFiles(kbId: string, params: ListKnowledgeFilesParams) {
	return get(`/api/v1/knowledge-bases/${kbId}/knowledge?${buildListKnowledgeFilesQuery(params)}`);
}

export interface KnowledgeFolderNode {
	path: string;

	name: string;

	document_count: number;

	total_count: number;
	children?: KnowledgeFolderNode[];
}

export interface KnowledgeFolderTree {
	root_document_count: number;

	total_document_count: number;
	folders: KnowledgeFolderNode[];
}

export function listKnowledgeFolders(kbId: string) {
	return get(`/api/v1/knowledge-bases/${kbId}/knowledge/folders`);
}

export function moveKnowledgeToFolder(kbId: string, ids: string[], folderPath: string) {
	return post("/api/v1/knowledge/folder", {
		kb_id: kbId,
		knowledge_ids: ids,
		folder_path: folderPath,
	});
}

export function renameKnowledgeFolder(kbId: string, from: string, to: string) {
	return put(`/api/v1/knowledge-bases/${kbId}/knowledge/folders`, { from, to });
}

export function getKnowledgeDetails(id: string, options?: { agent_id?: string; agent_source_tenant_id?: string }) {
	const query = new URLSearchParams();
	if (options?.agent_id) query.set("agent_id", options.agent_id);
	if (options?.agent_source_tenant_id) query.set("agent_source_tenant_id", options.agent_source_tenant_id);
	const qs = query.toString();
	return get(qs ? `/api/v1/knowledge/${id}?${qs}` : `/api/v1/knowledge/${id}`);
}

export function updateManualKnowledge(id: string, data: { title: string; content: string; status: string; process_config?: KnowledgeProcessOverrides }) {
	return put(`/api/v1/knowledge/manual/${id}`, data);
}

export function reparseKnowledge(id: string, data?: { process_config?: KnowledgeProcessOverrides }) {
	return post(`/api/v1/knowledge/${id}/reparse`, data);
}

export function cancelKnowledgeParse(id: string) {
	return post(`/api/v1/knowledge/${id}/cancel-parse`);
}

export function getKnowledgeSpans(id: string, attempt?: number) {
	const qs = attempt ? `?attempt=${attempt}` : "";
	return get(`/api/v1/knowledge/${id}/spans${qs}`);
}

export function delKnowledgeDetails(id: string) {
	return del(`/api/v1/knowledge/${id}`);
}

export function batchDeleteKnowledge(kbId: string, ids: string[]) {
	return post(`/api/v1/knowledge/batch-delete`, { kb_id: kbId, ids });
}

export function downKnowledgeDetails(id: string) {
	return getDown(`/api/v1/knowledge/${id}/download`);
}

export function batchDownloadKnowledge(kbId: string, ids: string[], signal?: AbortSignal): Promise<Blob> {
	return post<Blob>(
		`/api/v1/knowledge-bases/${encodeURIComponent(kbId)}/knowledge/batch-download`,
		{ ids },
		{
			responseType: "blob",
			timeout: 300000,
			signal,
		},
	);
}

export function previewKnowledgeFile(id: string) {
	return getDown(`/api/v1/knowledge/${id}/preview`);
}

export function batchQueryKnowledge(idsQueryString: string, kbId?: string, agentId?: string, agentSourceTenantId?: string) {
	let qs = idsQueryString;
	if (kbId) qs += `&kb_id=${encodeURIComponent(kbId)}`;
	if (agentId) qs += `&agent_id=${encodeURIComponent(agentId)}`;
	if (agentSourceTenantId) qs += `&agent_source_tenant_id=${encodeURIComponent(agentSourceTenantId)}`;
	return get(`/api/v1/knowledge/batch?${qs}`);
}

export const KNOWLEDGE_CHUNK_PAGE_SIZE = 25;

export function getKnowledgeDetailsCon(id: string, page: number) {
	return get(`/api/v1/chunks/${id}?page=${page}&page_size=${KNOWLEDGE_CHUNK_PAGE_SIZE}`);
}

export interface ChunkEditPayload {
	content?: string;
	is_enabled?: boolean;
	expected_revision?: number;
}

export function updateDocumentChunk(knowledgeId: string, chunkId: string, data: ChunkEditPayload) {
	return put(`/api/v1/chunks/${knowledgeId}/${chunkId}`, data);
}

export function listChunkRevisions(knowledgeId: string, chunkId: string) {
	return get(`/api/v1/chunks/${knowledgeId}/${chunkId}/revisions`);
}

export function revertDocumentChunk(knowledgeId: string, chunkId: string, revision: number, expectedRevision: number) {
	return post(`/api/v1/chunks/${knowledgeId}/${chunkId}/revert`, {
		revision,
		expected_revision: expectedRevision,
	});
}

export function updateKnowledgeMetadata(knowledgeId: string, customMetadata: Record<string, unknown>) {
	return put(`/api/v1/knowledge/${knowledgeId}`, { custom_metadata: customMetadata });
}

export function updateKnowledgeSummary(knowledgeId: string, description: string) {
	return put(`/api/v1/knowledge/${knowledgeId}`, { description });
}

export function regenerateKnowledgeSummary(knowledgeId: string) {
	return post(`/api/v1/knowledge/${knowledgeId}/regenerate-summary`, {});
}

export function getChunkByIdOnly(chunkId: string) {
	return get(`/api/v1/chunks/by-id/${chunkId}`);
}

export function deleteGeneratedQuestion(chunkId: string, questionId: string) {
	return del(`/api/v1/chunks/by-id/${chunkId}/questions`, { question_id: questionId });
}

export function upsertGeneratedQuestion(chunkId: string, question: string, questionId?: string) {
	return put(`/api/v1/chunks/by-id/${chunkId}/questions`, {
		question_id: questionId || "",
		question,
	});
}

export function regenerateGeneratedQuestions(chunkId: string) {
	return post(`/api/v1/chunks/by-id/${chunkId}/questions/regenerate`, {});
}

export function listKnowledgeTags(kbId: string, params?: { page?: number; page_size?: number; keyword?: string }) {
	const query = buildQuery(params);
	return get(`/api/v1/knowledge-bases/${kbId}/tags${query}`);
}

export function createKnowledgeBaseTag(kbId: string, data: { name: string; color?: string; sort_order?: number }) {
	return post(`/api/v1/knowledge-bases/${kbId}/tags`, data);
}

export function updateKnowledgeBaseTag(kbId: string, tagId: string, data: { name?: string; color?: string; sort_order?: number }) {
	return put(`/api/v1/knowledge-bases/${kbId}/tags/${tagId}`, data);
}

export function deleteKnowledgeBaseTag(kbId: string, tagSeqId: number, params?: { force?: boolean }) {
	const forceQuery = params?.force ? "?force=true" : "";
	return del(`/api/v1/knowledge-bases/${kbId}/tags/${tagSeqId}${forceQuery}`);
}

export function updateKnowledgeTagBatch(data: { updates: Record<string, string[]> }) {
	return put(`/api/v1/knowledge/tags`, data);
}

export function updateFAQEntryTagBatch(kbId: string, data: { updates: Record<number, number | null> }) {
	return put(`/api/v1/knowledge-bases/${kbId}/faq/entries/tags`, data);
}

const buildQuery = (params?: Record<string, any>) => {
	if (!params) return "";
	const query = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null || value === "") return;
		query.append(key, String(value));
	});
	const queryString = query.toString();
	return queryString ? `?${queryString}` : "";
};

export function listFAQEntries(
	kbId: string,
	params?: {
		page?: number;
		page_size?: number;
		tag_id?: number;
		tag_ids?: string;
		keyword?: string;
		is_enabled?: boolean;
	},
) {
	const query = buildQuery(params);
	return get(`/api/v1/knowledge-bases/${kbId}/faq/entries${query}`);
}

export function upsertFAQEntries(kbId: string, data: { entries: any[]; mode: "append" | "replace" }) {
	return post(`/api/v1/knowledge-bases/${kbId}/faq/entries`, data);
}

export function createFAQEntry(kbId: string, data: any) {
	return post(`/api/v1/knowledge-bases/${kbId}/faq/entry`, data);
}

export function updateFAQEntry(kbId: string, entryId: number, data: any) {
	return put(`/api/v1/knowledge-bases/${kbId}/faq/entries/${entryId}`, data);
}

export interface FAQEntryFieldsUpdate {
	is_enabled?: boolean;
	is_recommended?: boolean;
	tag_id?: number | null;
}

export interface FAQEntryFieldsBatchRequest {
	by_id?: Record<number, FAQEntryFieldsUpdate>;
	by_tag?: Record<number, FAQEntryFieldsUpdate>;
	exclude_ids?: number[];
}

export function updateFAQEntryFieldsBatch(kbId: string, data: FAQEntryFieldsBatchRequest) {
	return put(`/api/v1/knowledge-bases/${kbId}/faq/entries/fields`, data);
}

export function deleteFAQEntries(kbId: string, ids: number[]) {
	return del(`/api/v1/knowledge-bases/${kbId}/faq/entries`, { ids });
}

export function searchFAQEntries(
	kbId: string,
	data: {
		query_text: string;
		vector_threshold?: number;
		match_count?: number;
	},
) {
	return post(`/api/v1/knowledge-bases/${kbId}/faq/search`, data);
}

export async function exportFAQEntries(kbId: string, format: "csv" | "json" = "csv"): Promise<Blob> {
	const suffix = format === "json" ? "?format=json" : "";
	const response = await getDown(`/api/v1/knowledge-bases/${kbId}/faq/entries/export${suffix}`);
	return response as unknown as Blob;
}

export interface FAQBlockedEntry {
	index: number;
	standard_question: string;
	reason: string;
}

export interface FAQSuccessEntry {
	index: number;
	seq_id: number;
	tag_id?: number;
	tag_name?: string;
	standard_question: string;
}

export interface FAQImportProgress {
	task_id: string;
	kb_id: string;
	knowledge_id: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	total: number;
	processed: number;
	blocked: number;
	blocked_entries?: FAQBlockedEntry[];
	success_entries?: FAQSuccessEntry[];
	message: string;
	error: string;
	created_at: number;
	updated_at: number;
}

export function getFAQImportProgress(taskId: string) {
	return get(`/api/v1/faq/import/progress/${taskId}`);
}

export function updateFAQImportResultDisplayStatus(knowledgeBaseId: string, displayStatus: "open" | "close") {
	return put(`/api/v1/knowledge-bases/${knowledgeBaseId}/faq/import/last-result/display`, {
		display_status: displayStatus,
	});
}

export function searchKnowledge(keyword: string, offset = 0, limit = 20, fileTypes?: string[], options?: { agent_id?: string; agent_source_tenant_id?: string; recent?: boolean }) {
	const query = new URLSearchParams();
	if (keyword) {
		query.set("keyword", keyword);
	}
	query.set("offset", String(offset));
	query.set("limit", String(limit));
	if (fileTypes && fileTypes.length > 0) {
		query.set("file_types", fileTypes.join(","));
	}
	if (options?.agent_id) query.set("agent_id", options.agent_id);
	if (options?.agent_source_tenant_id) query.set("agent_source_tenant_id", options.agent_source_tenant_id);
	if (options?.recent) query.set("recent", "true");
	return get(`/api/v1/knowledge/search?${query.toString()}`);
}

export function knowledgeSemanticSearch(data: { query: string; knowledge_base_ids?: string[]; knowledge_ids?: string[] }) {
	return post("/api/v1/knowledge-search", data);
}

export function batchReparseKnowledge(kbId: string, ids: string[], processConfig?: KnowledgeProcessOverrides) {
	return post(`/api/v1/knowledge/batch-reparse`, {
		kb_id: kbId,
		ids,
		process_config: processConfig,
	});
}
