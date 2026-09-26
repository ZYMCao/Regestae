import { Effect, FileSystem, Function, Path } from "effect";
import { repoRoot } from "./paths.ts";
import { failWith } from "./runtime.ts";

export interface AppMatch {
	app: string;
}

export interface AppMatchFailure {
	input: string | undefined;
	matches: string[];
}

export const matchApp: {
	(input: string | undefined, apps: string[]): AppMatch | AppMatchFailure;
	(apps: string[]): (input: string | undefined) => AppMatch | AppMatchFailure;
} = Function.dual(2, (input: string | undefined, apps: string[]): AppMatch | AppMatchFailure => {
	if (input === undefined || input === "" || /[/\\]/.test(input) || input.includes("..")) return { input, matches: [] };
	if (apps.includes(input)) return { app: input };
	const matches = apps.filter((app) => app.startsWith(input));
	if (matches.length === 1) return { app: matches[0] };
	return { input, matches };
});

export const availableApps = Effect.gen(function* () {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	const dir = path.join(repoRoot, "apps");
	const entries = yield* fs.readDirectory(dir);
	const present = yield* Effect.forEach(entries, (name) => fs.exists(path.join(dir, name, "vite.config.ts")).pipe(Effect.map((exists) => ({ name, exists }))));
	return present
		.filter((entry) => entry.exists)
		.map((entry) => entry.name)
		.sort();
});

export const resolveApp = (input: string | undefined) =>
	Effect.gen(function* () {
		const apps = yield* availableApps;
		const match = matchApp(input, [...apps]);
		if ("app" in match) return match.app;
		const hint = match.matches.length > 1 ? ` Ambiguous prefix, matches: ${match.matches.join(", ")}.` : "";
		return yield* failWith(`Error: Unknown app '${match.input ?? "<missing --app>"}'.${hint} Available apps (apps/*/vite.config.ts): ${apps.join(", ")}`);
	});
