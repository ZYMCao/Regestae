export const task = { dependsOn: ["build"] };

import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, FileSystem, Option, Path } from "effect";
import { Command } from "effect/unstable/cli";
import { resolveApp } from "../lib/apps.ts";
import { loadEnvironmentProfile } from "../lib/config.ts";
import { appFlag, envFlag, passthrough, portFlag } from "../lib/flag.ts";
import { repoRoot } from "../lib/paths.ts";
import { runProcess } from "../lib/process.ts";
import { failWith, VERSION } from "../lib/runtime.ts";

const PREVIEW_APP = "monolithic";
const DEFAULT_PORT = "3000";

const command = Command.make("preview", { app: appFlag, env: envFlag, port: portFlag, arguments: passthrough }, ({ app, env, port, arguments: rest }) =>
	Effect.gen(function* () {
		const resolved = yield* resolveApp(Option.getOrUndefined(app));
		if (resolved !== PREVIEW_APP) {
			return yield* failWith(`[preview] '${resolved}' has no production build. The 'build' task produces only apps/${PREVIEW_APP}; add the app to scripts/app/build.ts to make it previewable.`);
		}

		const path = yield* Path.Path;
		const serverDir = path.resolve(repoRoot, "apps", resolved, ".output", "server");
		const entry = path.join(serverDir, "index.mjs");
		const fs = yield* FileSystem.FileSystem;
		if (!(yield* fs.exists(entry))) {
			return yield* failWith(`[preview] missing build output at ${path.relative(repoRoot, entry)}. Run 'vp run build' first.`);
		}

		const envVars = yield* loadEnvironmentProfile(env);
		yield* runProcess({
			cmd: "node",
			args: [entry, ...rest],
			cwd: serverDir,
			env: { PORT: DEFAULT_PORT, ...envVars, ...(Option.isSome(port) ? { PORT: port.value } : {}) },
			logFileName: `${resolved}.${env}.preview.log`,
		});
	}),
);

if (import.meta.main) {
	BunRuntime.runMain(command.pipe(Command.run({ version: VERSION }), Effect.provide(BunServices.layer)));
}
