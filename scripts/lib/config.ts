import { Effect, FileSystem, Path } from "effect";
import { repoRoot } from "./paths.ts";

export function parseEnvFile(content: string): Record<string, string> {
	const envVars: Record<string, string> = {};
	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (line === "" || line.startsWith("#")) continue;
		const stripped = line.startsWith("export ") ? line.slice(7).trim() : line;
		const eqIndex = stripped.indexOf("=");
		if (eqIndex === -1) continue;
		const key = stripped.slice(0, eqIndex).trim();
		let val = stripped.slice(eqIndex + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		envVars[key] = val;
	}
	return envVars;
}

export const loadEnvironmentProfile = (name: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const file = path.join(repoRoot, `.env.${name}`);
		const exists = yield* fs.exists(file);
		if (!exists) return {};
		const content = yield* fs.readFileString(file);
		return parseEnvFile(content);
	});
