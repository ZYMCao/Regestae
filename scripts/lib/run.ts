import fs from "node:fs";
import path from "node:path";
import type { UserConfig } from "vite-plus";

export type TaskMap = NonNullable<NonNullable<UserConfig["run"]>["tasks"]>;

export interface TaskDeclaration {
	cache?: boolean;
	dependsOn?: string[];
	args?: string[];
}

const DECLARATION_KEYS: readonly string[] = ["cache", "dependsOn", "args"];
const DECLARATION_HINT = 'expected single-line "export const task = { cache?: boolean, dependsOn?: string[], args?: string[] };"';
const TASK_DECLARATION = /export const task = (\{.*\});/g;
const NOT_A_TASK = /\.(test|spec)\.ts$/;

function splitDeclarationFields(literal: string): string[] {
	const fields: string[] = [];
	let depth = 0;
	let quoted = false;
	let start = 0;
	for (let i = 0; i < literal.length; i++) {
		const ch = literal[i];
		if (ch === '"') quoted = !quoted;
		else if (!quoted && ch === "[") depth += 1;
		else if (!quoted && ch === "]") depth -= 1;
		else if (!quoted && depth === 0 && ch === ",") {
			fields.push(literal.slice(start, i));
			start = i + 1;
		}
	}
	fields.push(literal.slice(start));
	return fields.filter((f) => f.trim().length > 0);
}

function parseArray(value: string, file: string): string[] {
	if (!/^\[\s*(?:"[^"]*"(?:\s*,\s*"[^"]*")*\s*)?\]$/.test(value)) {
		throw new Error(`[vite.config] malformed array "${value}" in task declaration of ${file} — ${DECLARATION_HINT}`);
	}
	return [...value.matchAll(/"([^"]*)"/g)].map((m) => m[1]);
}

function parseDeclaration(literal: string, file: string): TaskDeclaration {
	const decl: TaskDeclaration = {};
	const inner = literal.replace(/^\{/, "").replace(/\}$/, "");
	for (const field of splitDeclarationFields(inner)) {
		const sep = field.indexOf(":");
		const key = sep === -1 ? "" : field.slice(0, sep).trim();
		const value = field.slice(sep + 1).trim();
		if (!DECLARATION_KEYS.includes(key)) {
			throw new Error(`[vite.config] unknown task declaration key "${key || field.trim()}" in ${file} — allowed: ${DECLARATION_KEYS.join(", ")}`);
		}
		if (key === "cache") {
			if (value !== "true" && value !== "false") throw new Error(`[vite.config] malformed cache value "${value}" in task declaration of ${file} — ${DECLARATION_HINT}`);
			decl.cache = value === "true";
		} else if (key === "dependsOn") {
			decl.dependsOn = parseArray(value, file);
		} else {
			decl.args = parseArray(value, file);
		}
	}
	return decl;
}

export function deriveTasks(root: string): TaskMap {
	if (!fs.existsSync(root)) return {};
	const derived = new Map<string, { command: string; cache: boolean; dependsOn?: string[] }>();
	for (const e of fs.readdirSync(root, { withFileTypes: true })) {
		if (!e.isDirectory() || e.name === "lib") continue;
		for (const f of fs.readdirSync(path.join(root, e.name), { withFileTypes: true })) {
			if (!f.isFile() || !f.name.endsWith(".ts") || NOT_A_TASK.test(f.name)) continue;
			const name = f.name.replace(/\.ts$/, "");
			if (derived.has(name)) throw new Error(`[vite.config] duplicate task "${name}" in scripts/${e.name}/${f.name}`);
			const file = `scripts/${e.name}/${f.name}`;
			const raw = fs.readFileSync(path.join(root, e.name, f.name), "utf8");
			let decl: TaskDeclaration = {};
			if (/export const task\b/.test(raw)) {
				const matches = [...raw.matchAll(TASK_DECLARATION)];
				if (matches.length !== 1) throw new Error(`[vite.config] malformed task declaration in ${file} — ${DECLARATION_HINT}`);
				decl = parseDeclaration(matches[0][1], file);
			}
			derived.set(name, { command: ["bun", file, ...(decl.args ?? [])].join(" "), cache: decl.cache ?? false, dependsOn: decl.dependsOn });
		}
	}
	for (const [name, task] of derived) {
		for (const dep of task.dependsOn ?? []) {
			if (!derived.has(dep)) throw new Error(`[vite.config] task "${name}" depends on unknown task "${dep}"`);
		}
	}
	const tasks: TaskMap = {};
	for (const [name, task] of derived) {
		tasks[name] = { command: task.command, cache: task.cache, dependsOn: task.dependsOn };
	}
	return tasks;
}
