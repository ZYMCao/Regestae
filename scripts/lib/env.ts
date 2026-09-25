import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export const repoRoot = path.resolve(import.meta.dirname, "../..");

// macOS pitfall: os.hostname() is "Foo" or "Foo.local" depending on `scutil --get HostName`;
// .env files use bare LocalHostName, so fix with `scutil --set HostName <bare>`.
export const HOST_ENV = os.hostname();

export function getEnvFilePath(envName: string): string {
	return path.resolve(repoRoot, `.env.${envName}`);
}

export function loadEnvFile(envPath: string): Record<string, string> {
	const content = fs.readFileSync(envPath, "utf-8");
	const envVars: Record<string, string> = {};
	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;
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

export function loadLocalEnv(envName: string): Record<string, string> {
	const envPath = getEnvFilePath(envName);
	if (!fs.existsSync(envPath)) {
		console.error(`Error: Environment file not found at '${envPath}'. Create it (default name is verbatim 'os.hostname()') or pass an explicit --env.`);
		process.exit(1);
	}
	return loadEnvFile(envPath);
}
