import { BunRuntime, BunServices } from "@effect/platform-bun";
import { Console, Effect, FileSystem, Path, PlatformError, Stream } from "effect";
import { Command } from "effect/unstable/cli";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { repoRoot } from "../lib/paths.ts";
import { runProcess } from "../lib/process.ts";
import { failWith, VERSION } from "../lib/runtime.ts";

export const task = { cache: true };

const CHECK_CONCURRENCY = 16;

const walkMjs = (dir: string): Effect.Effect<Array<string>, PlatformError.PlatformError, FileSystem.FileSystem | Path.Path> =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const pathService = yield* Path.Path;
		const names = yield* fs.readDirectory(dir);
		const files: string[] = [];
		for (const name of names) {
			const full = pathService.join(dir, name);
			const info = yield* fs.stat(full);
			if (info.type === "Directory") {
				for (const nested of yield* walkMjs(full)) files.push(nested);
			} else if (name.endsWith(".mjs")) {
				files.push(full);
			}
		}
		return files;
	});

const check = (file: string) =>
	Effect.scoped(
		Effect.gen(function* () {
			const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
			const handle = yield* spawner.spawn(ChildProcess.make("node", ["--check", file]));
			const [output, exitCode] = yield* Effect.all([handle.all.pipe(Stream.decodeText(), Stream.mkString), handle.exitCode], { concurrency: 2 });
			return { file, code: Number(exitCode), output };
		}),
	);

export const checkServerOutput = (targetDir: string) =>
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		if (!(yield* fs.exists(targetDir))) return yield* failWith(`Error: server output directory not found: ${targetDir}`);
		const files = yield* walkMjs(targetDir);
		if (files.length === 0) return yield* failWith(`Error: no .mjs modules found under ${targetDir}`);

		const results = yield* Effect.forEach(files, check, { concurrency: CHECK_CONCURRENCY });
		const failures = results.filter((result) => result.code !== 0).map((result) => ({ file: result.file, message: result.output.split("\n").slice(0, 6).join("\n") }));

		if (failures.length > 0) {
			yield* Console.error(`Error: ${failures.length}/${files.length} server modules failed node --check. Build output is not servable.`);
			yield* Effect.forEach(failures, ({ file, message }) => Console.error(`--- ${path.relative(repoRoot, file)}\n${message}`), { discard: true });
			return yield* failWith(`Error: ${failures.length}/${files.length} server modules failed node --check`);
		}

		yield* Console.log(`Server output gate: ${files.length} modules passed node --check.`);
	});

const run = (cmd: string, args: string[], cwd: string) =>
	Effect.gen(function* () {
		const path = yield* Path.Path;
		yield* Console.log(`$ ${cmd} ${args.join(" ")}  (cwd: ${path.relative(repoRoot, cwd) || "."})`);
		yield* runProcess({ cmd, args, cwd });
	}).pipe(Effect.catchTag("TaskFailure", (error) => Console.error(`Error: ${cmd} ${args.join(" ")} exited with code ${error.code}`).pipe(Effect.andThen(Effect.fail(error)))));

const command = Command.make("build", {}, () =>
	Effect.gen(function* () {
		const path = yield* Path.Path;
		const monolithicDir = path.resolve(repoRoot, "apps/monolithic");
		const serverOutputDir = path.resolve(monolithicDir, ".output/server");
		yield* run("vite", ["build"], monolithicDir);
		yield* run("bun", ["install", "--production"], serverOutputDir);
		yield* checkServerOutput(serverOutputDir);
	}),
);

if (import.meta.main) {
	BunRuntime.runMain(command.pipe(Command.run({ version: VERSION }), Effect.provide(BunServices.layer)));
}
