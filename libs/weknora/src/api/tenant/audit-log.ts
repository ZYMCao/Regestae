import { get } from "../../utils/request";

export type AuditAction = "rbac.member_added" | "rbac.member_removed" | "rbac.member_role_changed" | "rbac.member_left" | "rbac.access_denied" | string;

export type AuditOutcome = "accepted" | "success" | "failed" | "partial" | "canceled" | "denied";

export interface AuditLog {
	id: number;
	tenant_id: number;
	actor_user_id: string;
	actor_role: string;
	action: AuditAction;
	scope_type: string;
	scope_id: string;
	target_type: string;
	target_id: string;
	target_user_id: string;
	request_path: string;
	request_method: string;
	outcome: AuditOutcome;
	details: Record<string, unknown> | string | null;
	created_at: string;
}

export interface ListAuditLogResponse {
	success: boolean;
	data?: AuditLog[];
	next_cursor?: number;
	message?: string;
}

export interface ListAuditLogParams {
	after_id?: number;

	limit?: number;

	action?: AuditAction;
	outcome?: AuditOutcome;
	actor?: string;
}

export async function listAuditLog(tenantId: number, params: ListAuditLogParams = {}): Promise<ListAuditLogResponse> {
	const qs = new URLSearchParams();
	if (params.after_id) qs.append("after_id", String(params.after_id));
	if (params.limit) qs.append("limit", String(params.limit));
	if (params.action) qs.append("action", params.action);
	if (params.outcome) qs.append("outcome", params.outcome);
	if (params.actor) qs.append("actor", params.actor);
	const tail = qs.toString();
	const url = `/api/v1/tenants/${tenantId}/audit-log${tail ? "?" + tail : ""}`;
	return (await get(url)) as unknown as ListAuditLogResponse;
}
