import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { OxlintConfig } from "oxlint";
import { repoRoot } from "./env.ts";

export type RuleMap = NonNullable<OxlintConfig["rules"]>;
export type PluginList = NonNullable<OxlintConfig["plugins"]>;

const require = createRequire(import.meta.url);

const RULE_FILE_KEYS = new Set(["presets", "plugins", "rule"]);

interface RuleFile {
	presets?: string[];
	plugins?: string[];
	rule?: RuleMap;
}

function loadRuleFile(file: string): RuleFile {
	const parsed = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
	for (const key of Object.keys(parsed)) {
		if (!RULE_FILE_KEYS.has(key)) throw new Error(`[vite.config] unknown key "${key}" in ${file} — allowed: ${[...RULE_FILE_KEYS].join(", ")}`);
	}
	return parsed as RuleFile;
}

function ruleFiles(root: string): string[] {
	const dir = path.join(repoRoot, root);
	if (!existsSync(dir)) return [];
	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
		.map((entry) => path.join(dir, entry.name))
		.sort();
}

function loadPreset(specifier: string): OxlintConfig {
	return JSON.parse(readFileSync(require.resolve(specifier), "utf8")) as OxlintConfig;
}

export function deriveRules(root: string): RuleMap {
	const rules: RuleMap = {};
	const owners = new Map<string, string>();
	for (const file of ruleFiles(root)) {
		const declared = loadRuleFile(file);
		for (const specifier of declared.presets ?? []) Object.assign(rules, loadPreset(specifier).rules);
		for (const key of Object.keys(declared.rule ?? {})) {
			const previous = owners.get(key);
			if (previous !== undefined) throw new Error(`[vite.config] duplicate rule "${key}" in ${file}, already defined in ${previous}`);
			owners.set(key, file);
		}
		Object.assign(rules, declared.rule ?? {});
	}
	return rules;
}

export function derivePlugins(root: string): PluginList {
	const plugins: string[] = [];
	const seen = new Set<string>();
	const collect = (names: readonly string[]) => {
		for (const name of names) {
			if (seen.has(name)) continue;
			seen.add(name);
			plugins.push(name);
		}
	};
	for (const file of ruleFiles(root)) {
		const declared = loadRuleFile(file);
		for (const specifier of declared.presets ?? []) collect(loadPreset(specifier).plugins ?? []);
		collect(declared.plugins ?? []);
	}
	return plugins as PluginList;
}
