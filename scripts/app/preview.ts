export const task = { dependsOn: ["build"] };

import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv, repoRoot } from "../lib/env.ts";
import { runProcess } from "../lib/spawn.ts";
import { parseServeArgs, resolveApp } from "../lib/serve.ts";

const PREVIEW_APP = "monolithic";
const DEFAULT_PORT = "3000";

async function main() {
	const { app: appInput, env, port, passthrough } = parseServeArgs(process.argv.slice(2));
	const app = resolveApp(appInput);
	if (app !== PREVIEW_APP) {
		console.error(`Error: '${app}' has no production build. The 'build' task produces only apps/${PREVIEW_APP}; add the app to scripts/app/build.ts to make it previewable.`);
		process.exit(1);
	}

	const serverDir = path.resolve(repoRoot, "apps", app, ".output", "server");
	const entry = path.join(serverDir, "index.mjs");
	if (!existsSync(entry)) {
		console.error(`Error: missing build output at ${path.relative(repoRoot, entry)}. Run 'vp run build' first.`);
		process.exit(1);
	}

	const envVars = env === "inherit" ? {} : loadLocalEnv(env);

	await runProcess({
		cmd: "node",
		args: [entry, ...passthrough],
		cwd: serverDir,
		env: { PORT: DEFAULT_PORT, ...envVars, ...(port ? { PORT: port } : {}) },
		logFileName: `${app}.${env}.preview.log`,
	});
}

main().catch((err) => {
	console.error("Preview Runner error:", err);
	process.exit(1);
});
