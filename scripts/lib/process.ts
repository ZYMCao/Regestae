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
	env?: Record<string, string>;
}

const concatChunks = (chunks: ReadonlyArray<Uint8Array>): Uint8Array => {
	let total = 0;
	for (const chunk of chunks) total += chunk.length;
	const result = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		result.set(chunk, offset);
		offset += chunk.length;
	}
	return result;
};

export const runProcessCaptureBytes = (options: CaptureProcessOptions) =>
	Effect.scoped(
		Effect.gen(function* () {
			const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
			const handle = yield* spawner.spawn(ChildProcess.make(options.cmd, options.args, { cwd: options.cwd ?? repoRoot, env: options.env, extendEnv: true }));
			const [stdout, stderr, exitCode] = yield* Effect.all([Stream.runCollect(handle.stdout), Stream.runCollect(handle.stderr), handle.exitCode], { concurrency: 3 });
			return { stdout: concatChunks(stdout), stderr: concatChunks(stderr), exitCode: Number(exitCode) };
		}),
	);

export const runProcessCapture = (options: CaptureProcessOptions) =>
	runProcessCaptureBytes(options).pipe(
		Effect.map(({ stdout, stderr, exitCode }) => ({
			stdout: new TextDecoder().decode(stdout),
			stderr: new TextDecoder().decode(stderr),
			exitCode,
		})),
	);
