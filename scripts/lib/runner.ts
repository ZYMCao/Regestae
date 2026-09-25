import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { repoRoot } from "./env.ts";

export interface RunProcessOptions {
	cmd: string;
	args: string[];
	cwd: string;
	env?: Record<string, string>;
	logFileName?: string;
}

export async function runProcess(options: RunProcessOptions): Promise<void> {
	const logDir = path.resolve(repoRoot, ".log");
	fs.mkdirSync(logDir, { recursive: true });

	let logStream: fs.WriteStream | null = null;
	if (options.logFileName) {
		const logPath = path.join(logDir, options.logFileName);
		logStream = fs.createWriteStream(logPath, { flags: "a" });
	}

	const child = spawn(options.cmd, options.args, {
		cwd: options.cwd,
		stdio: ["inherit", "pipe", "pipe"],
		env: {
			...process.env,
			...options.env,
			FORCE_COLOR: "1",
		},
	});

	child.stdout?.on("data", (chunk: Buffer) => {
		process.stdout.write(chunk);
		logStream?.write(chunk);
	});

	child.stderr?.on("data", (chunk: Buffer) => {
		process.stderr.write(chunk);
		logStream?.write(chunk);
	});

	const forwardSignal = (sig: NodeJS.Signals) => {
		if (child.pid && !child.killed) {
			child.kill(sig);
		}
	};

	process.on("SIGINT", () => forwardSignal("SIGINT"));
	process.on("SIGTERM", () => forwardSignal("SIGTERM"));
	process.on("SIGHUP", () => forwardSignal("SIGHUP"));

	child.on("close", (code, signal) => {
		const handleExit = () => {
			if (code !== null) {
				process.exit(code);
			} else if (signal) {
				process.kill(process.pid, signal);
			} else {
				process.exit(1);
			}
		};

		if (logStream) {
			logStream.end(handleExit);
		} else {
			handleExit();
		}
	});
}
