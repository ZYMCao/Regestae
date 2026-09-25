import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getWeKnoraConfig } from "../../config";
import { StreamAuthError, isStreamAuthError, refreshAccessTokenShared, runStreamWithAuthRetry } from "../../utils/authRefresh";
import { sanitizeStreamRequestBody, type StreamRequestMeta } from "../../utils/chatRequestDebug";
import { generateRandomString } from "../../utils/index";

export type ChatStreamEvent = Record<string, unknown>;

export interface ChatStreamRequest {
	url?: string;

	method?: "GET" | "POST";
	sessionId?: string;
	query?: string;
	knowledge_base_ids?: string[];
	knowledge_ids?: string[];
	tag_ids?: string[];
	agent_enabled?: boolean;
	agent_id?: string;
	agent_source_tenant_id?: string | number;
	web_search_enabled?: boolean;
	local_browser_enabled?: boolean;
	summary_model_id?: string;
	reasoning_effort?: string;
	mcp_service_ids?: string[];
	skill_names?: string[];
	mentioned_items?: Array<{ id: string; name: string; type: string; kb_type?: string; kb_id?: string; kb_name?: string; service_id?: string; skill_name?: string }>;
	images?: Array<{ data: string }>;
	attachment_uploads?: Array<{ data: string; file_name: string; file_size: number }>;
	attachment_ids?: string[];
	suggestion_attribution?: { suggestion_set_id: string; question_id: string };
	question_origin?: { knowledge_base_id: string; knowledge_id?: string };
	embed_token?: string;
	embed_session_sig?: string;
	embed_visitor_id?: string;
}

export interface ChatStreamHandlers {
	onOpen?: () => void;

	onEvent?: (event: ChatStreamEvent) => void;

	onError?: (error: unknown) => void;

	onClose?: () => void;
}

export interface ChatStreamHandle {
	start: (request: ChatStreamRequest) => Promise<void>;

	stop: () => void;

	getLastRequest: () => StreamRequestMeta | null;
}

const DEFAULT_CHAT_URL = "/api/v1/knowledge-chat";

function buildPostBody(request: ChatStreamRequest, embedToken: string | undefined): Record<string, unknown> {
	const body: Record<string, unknown> = {
		query: request.query,
		agent_enabled: request.agent_enabled !== undefined ? request.agent_enabled : true,
	};
	if (request.knowledge_base_ids?.length) body.knowledge_base_ids = request.knowledge_base_ids;
	if (request.knowledge_ids?.length) body.knowledge_ids = request.knowledge_ids;
	if (request.agent_id) body.agent_id = request.agent_id;
	if (request.agent_source_tenant_id) body.agent_source_tenant_id = Number(request.agent_source_tenant_id);
	if (request.web_search_enabled !== undefined) body.web_search_enabled = request.web_search_enabled;
	if (request.local_browser_enabled !== undefined) body.local_browser_enabled = request.local_browser_enabled;
	if (request.summary_model_id) body.summary_model_id = request.summary_model_id;
	if (request.reasoning_effort) body.reasoning_effort = request.reasoning_effort;
	if (request.mcp_service_ids?.length) body.mcp_service_ids = request.mcp_service_ids;
	if (request.skill_names?.length) body.skill_names = request.skill_names;
	if (request.tag_ids?.length) body.tag_ids = request.tag_ids;
	if (request.mentioned_items?.length) body.mentioned_items = request.mentioned_items;
	if (request.images?.length) body.images = request.images;
	if (request.attachment_uploads?.length) body.attachment_uploads = request.attachment_uploads;
	if (request.attachment_ids?.length) body.attachment_ids = request.attachment_ids;
	if (request.suggestion_attribution) body.suggestion_attribution = request.suggestion_attribution;
	if (request.question_origin) body.question_origin = request.question_origin;
	body.channel = embedToken ? "embed" : "web";
	return body;
}

function parseEvent(data: string): ChatStreamEvent | undefined {
	try {
		return JSON.parse(data) as ChatStreamEvent;
	} catch {
		return undefined;
	}
}

export function createChatStream(handlers: ChatStreamHandlers = {}): ChatStreamHandle {
	let controller = new AbortController();
	let generation = 0;
	let lastRequest: StreamRequestMeta | null = null;

	const stop = () => {
		generation++;
		controller.abort();
		controller = new AbortController();
	};

	const start = async (request: ChatStreamRequest): Promise<void> => {
		const current = getWeKnoraConfig();
		const myGeneration = ++generation;
		const signal = controller.signal;
		const method = request.method ?? "POST";
		const embedToken = request.embed_token;
		const token = embedToken || current.getToken();

		if (!token) {
			const missingToken = new Error(current.t("error.tokenNotFound"));
			handlers.onError?.(missingToken);
			stop();
			return;
		}

		const path = request.url ?? DEFAULT_CHAT_URL;
		const url = request.sessionId != null ? `${current.baseUrl}${path}/${request.sessionId}` : `${current.baseUrl}${path}`;
		const postBody = buildPostBody(request, embedToken);
		const requestId = generateRandomString(12);

		lastRequest = {
			requestId,
			url,
			method,
			body: method === "POST" ? sanitizeStreamRequestBody(postBody) : null,
			sentAt: Date.now(),
		};

		const runStream = (authToken: string) =>
			fetchEventSource(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: embedToken ? `Embed ${embedToken}` : `Bearer ${authToken}`,
					"Accept-Language": current.getLocale(),
					"X-Request-ID": requestId,
					...(!embedToken && current.getTenantId() ? { "X-Tenant-ID": current.getTenantId() as string } : {}),
					...(request.embed_session_sig ? { "X-Embed-Session": request.embed_session_sig } : {}),
					...(request.embed_visitor_id ? { "X-Embed-Visitor": request.embed_visitor_id } : {}),
				},
				body: method === "POST" ? JSON.stringify(postBody) : null,
				signal,
				openWhenHidden: true,

				onopen: async (response) => {
					if (response.status === 401) throw new StreamAuthError(response.status);
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					handlers.onOpen?.();
				},

				onmessage: (event) => {
					if (myGeneration !== generation) return;
					const parsed = parseEvent(event.data);
					if (parsed !== undefined) handlers.onEvent?.(parsed);
				},

				onerror: (error) => {
					if (isStreamAuthError(error)) throw error;
					throw new Error(`${current.t("error.streamFailed")}: ${String(error)}`);
				},

				onclose: () => {
					if (myGeneration === generation) handlers.onClose?.();
				},
			});

		try {
			await runStreamWithAuthRetry({
				run: runStream,
				initialToken: token,
				isEmbed: Boolean(embedToken),
				isCurrent: () => myGeneration === generation && !signal.aborted,
				refreshAccessToken: () =>
					refreshAccessTokenShared({
						messages: {
							pleaseRelogin: current.t("error.pleaseRelogin"),
							tokenRefreshFailed: current.t("error.tokenRefreshFailed"),
						},
					}),
				reloginMessage: current.t("error.pleaseRelogin"),
			});
		} catch (error) {
			if (myGeneration === generation) handlers.onError?.(error);
		}
	};

	return { start, stop, getLastRequest: () => lastRequest };
}
