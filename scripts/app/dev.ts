import path from "node:path";
import process from "node:process";
import { loadLocalEnv, repoRoot } from "../lib/env.ts";
import { runProcess } from "../lib/spawn.ts";
import { parseServeArgs, resolveApp, viteBin } from "../lib/serve.ts";

async function main() {
	const { app: appInput, env, port, passthrough } = parseServeArgs(process.argv.slice(2));
	const app = resolveApp(appInput);

	await runProcess({
		cmd: viteBin,
		args: ["dev", ...(port ? ["--port", port] : []), ...passthrough],
		cwd: path.resolve(repoRoot, "apps", app),
		env: env === "inherit" ? {} : loadLocalEnv(env),
		logFileName: `${app}.${env}.log`,
	});
}

main().catch((err) => {
	console.error("Dev Runner error:", err);
	process.exit(1);
});
