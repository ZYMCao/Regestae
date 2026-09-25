import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { HOST_ENV, repoRoot } from "./env.ts";

export const viteBin = path.join(repoRoot, "node_modules", ".bin", "vite");

export interface AppMatch {
	app: string;
}

export interface AppMatchFailure {
	input: string | undefined;
	matches: string[];
}

export interface ServeArgs {
	app: string | undefined;
	env: string;
	port: string | undefined;
	passthrough: string[];
}

export function availableApps(): string[] {
	return readdirSync(path.resolve(repoRoot, "apps"), { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(path.resolve(repoRoot, "apps", e.name, "vite.config.ts")))
		.map((e) => e.name)
		.sort();
}

export function matchApp(input: string | undefined, apps: string[]): AppMatch | AppMatchFailure {
	if (!input || /[/\\]/.test(input) || input.includes("..")) return { input, matches: [] };
	if (apps.includes(input)) return { app: input };
	const matches = apps.filter((a) => a.startsWith(input));
	if (matches.length === 1) return { app: matches[0] };
	return { input, matches };
}

export function resolveApp(input: string | undefined): string {
	const apps = availableApps();
	const match = matchApp(input, apps);
	if ("app" in match) return match.app;
	const hint = match.matches.length > 1 ? ` Ambiguous prefix, matches: ${match.matches.join(", ")}.` : "";
	console.error(`Error: Unknown app '${match.input ?? "<missing --app>"}'.${hint} Available apps (apps/*/vite.config.ts): ${apps.join(", ")}`);
	process.exit(1);
}

export function parseServeArgs(argv: string[]): ServeArgs {
	let app: string | undefined;
	let env = HOST_ENV;
	let port: string | undefined;
	const passthrough: string[] = [];

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--") continue;
		if (arg.startsWith("--app=")) app = arg.slice(6);
		else if (arg === "--app" && i + 1 < argv.length) app = argv[++i];
		else if (arg.startsWith("-a=")) app = arg.slice(3);
		else if (arg === "-a" && i + 1 < argv.length) app = argv[++i];
		else if (arg.startsWith("--env=")) env = arg.slice(6);
		else if (arg === "--env" && i + 1 < argv.length) env = argv[++i];
		else if (arg.startsWith("--port=")) port = arg.slice(7);
		else if (arg === "--port" && i + 1 < argv.length) port = argv[++i];
		else passthrough.push(arg);
	}

	return { app, env, port, passthrough };
}
