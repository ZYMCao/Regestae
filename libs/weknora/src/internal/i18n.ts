const messages: Record<string, string> = {
	"error.requestTimeout": "请求超时",
	"error.networkError": "网络连接异常",
	"error.invalidCredentials": "用户名或密码错误",
	"error.pleaseRelogin": "登录状态已过期，请重新登录",
	"error.tokenRefreshFailed": "登录状态刷新失败",
	"error.streamFailed": "流式请求失败",
	"error.tokenNotFound": "未找到访问令牌",
	"error.fileSizeExceeded": "文件大小超过 {size}MB 限制",
	"error.unsupportedFileType": "不支持的文件类型",
	"settings.sandbox.skillBundleTooLarge": "技能包大小超过 {size}MB 限制",
};

export function placeholderT(key: string, params?: Record<string, unknown>): string {
	const template = messages[key] ?? key;
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}
