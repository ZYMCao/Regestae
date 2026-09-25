import { get, put } from "../utils/request";

export interface RetrievalConfig {
	embedding_top_k: number;
	vector_threshold: number;
	keyword_threshold: number;
	rerank_top_k: number;
	rerank_threshold: number;
	rerank_model_id: string;
}

export function getTenantRetrievalConfig() {
	return get("/api/v1/tenants/kv/retrieval-config");
}

export function updateTenantRetrievalConfig(config: RetrievalConfig) {
	return put("/api/v1/tenants/kv/retrieval-config", config);
}
