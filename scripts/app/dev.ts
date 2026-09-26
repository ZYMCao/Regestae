import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Effect, Option, Path } from "effect";
import { Command } from "effect/unstable/cli";
import { resolveApp } from "../lib/apps.ts";
import { loadEnvironmentProfile } from "../lib/config.ts";
import { appFlag, envFlag, passthrough, portFlag } from "../lib/flag.ts";
import { repoRoot, viteBin } from "../lib/paths.ts";
import { runProcess } from "../lib/process.ts";
import { VERSION } from "../lib/runtime.ts";

const command = Command.make("dev", { app: appFlag, env: envFlag, port: portFlag, arguments: passthrough }, ({ app, env, port, arguments: rest }) =>
	Effect.gen(function* () {
		const resolved = yield* resolveApp(Option.getOrUndefined(app));
		const envVars = yield* loadEnvironmentProfile(env);
		const path = yield* Path.Path;
		yield* runProcess({
			cmd: viteBin,
			args: ["dev", ...(Option.isSome(port) ? ["--port", port.value] : []), ...rest],
			cwd: path.resolve(repoRoot, "apps", resolved),
			env: envVars,
			logFileName: `${resolved}.${env}.log`,
		});
	}),
);

if (import.meta.main) {
	BunRuntime.runMain(command.pipe(Command.run({ version: VERSION }), Effect.provide(BunServices.layer)));
}
