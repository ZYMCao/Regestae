import { Effect, FileSystem, Path, Stdio, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";
import { repoRoot } from "./paths.ts";
import { failCode } from "./runtime.ts";

export interface RunProcessOptions {
	cmd: string;
	args: string[];
	cwd: string;
	env?: Record<string, string>;
	logFileName?: string;
}

export const runProcess = (options: RunProcessOptions) =>
	Effect.gen(function* () {
		const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;
		const stdio = yield* Stdio.Stdio;

		const logDir = path.join(repoRoot, ".log");
		yield* fs.makeDirectory(logDir, { recursive: true });
		const logPath = options.logFileName !== undefined ? path.join(logDir, options.logFileName) : undefined;

		const command = ChildProcess.make(options.cmd, options.args, {
			cwd: options.cwd,
			env: { ...options.env, FORCE_COLOR: "1" },
			extendEnv: true,
			stdin: "inherit",
		});

		yield* Effect.scoped(
			Effect.gen(function* () {
				const handle = yield* spawner.spawn(command);
				const logFile = logPath !== undefined ? yield* fs.open(logPath, { flag: "a" }) : undefined;

				const write = (chunk: Uint8Array, sink: ReturnType<typeof stdio.stdout>) =>
					Effect.all([Stream.run(Stream.fromIterable([chunk]), sink), logFile !== undefined ? logFile.writeAll(chunk) : Effect.void], { discard: true });

				const [, , exitCode] = yield* Effect.all(
					[handle.stdout.pipe(Stream.runForEach((chunk) => write(chunk, stdio.stdout()))), handle.stderr.pipe(Stream.runForEach((chunk) => write(chunk, stdio.stderr()))), handle.exitCode],
					{ concurrency: 3 },
				);

				if (Number(exitCode) !== 0) return yield* failCode(Number(exitCode));
			}),
		);
	});

export interface CaptureProcessOptions {
	cmd: string;
	args: string[];
	cwd?: string;
}

export const runProcessCapture = (options: CaptureProcessOptions) =>
	Effect.scoped(
		Effect.gen(function* () {
			const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
			const handle = yield* spawner.spawn(ChildProcess.make(options.cmd, options.args, { cwd: options.cwd ?? repoRoot, extendEnv: true }));
			const [stdout, stderr, exitCode] = yield* Effect.all([handle.stdout.pipe(Stream.decodeText(), Stream.mkString), handle.stderr.pipe(Stream.decodeText(), Stream.mkString), handle.exitCode], { concurrency: 3 });
			return { stdout, stderr, exitCode: Number(exitCode) };
		}),
	);
