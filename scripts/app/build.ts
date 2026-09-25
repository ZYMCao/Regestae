export const task = { cache: true };

import { execFile, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { repoRoot } from "../lib/env.ts";

const execFileAsync = promisify(execFile);

const monolithicDir = path.resolve(repoRoot, "apps/monolithic");
const serverOutputDir = path.resolve(monolithicDir, ".output/server");

const CHECK_CONCURRENCY = 16;

function walkMjs(dir: string): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	return entries.flatMap((entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return walkMjs(full);
		return entry.name.endsWith(".mjs") ? [full] : [];
	});
}

async function checkAll(files: string[]): Promise<Array<{ file: string; message: string }>> {
	const failures: Array<{ file: string; message: string }> = [];
	let cursor = 0;

	async function worker() {
		while (cursor < files.length) {
			const file = files[cursor++];
			try {
				await execFileAsync("node", ["--check", file]);
			} catch (err) {
				const stderr = (err as { stderr?: string }).stderr ?? String(err);
				failures.push({ file, message: stderr.split("\n").slice(0, 6).join("\n") });
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(CHECK_CONCURRENCY, Math.max(files.length, 1)) }, worker));
	return failures;
}

export async function checkServerOutput(targetDir: string): Promise<void> {
	if (!fs.existsSync(targetDir)) {
		throw new Error(`server output directory not found: ${targetDir}`);
	}
	const files = walkMjs(targetDir);
	if (files.length === 0) {
		throw new Error(`no .mjs modules found under ${targetDir}`);
	}
	const failures = await checkAll(files);
	if (failures.length > 0) {
		console.error(`Error: ${failures.length}/${files.length} server modules failed node --check. Build output is not servable.`);
		for (const { file, message } of failures) {
			console.error(`--- ${path.relative(repoRoot, file)}\n${message}`);
		}
		throw new Error(`${failures.length}/${files.length} server modules failed node --check`);
	}
	console.log(`Server output gate: ${files.length} modules passed node --check.`);
}

function run(cmd: string, args: string[], cwd: string): Promise<void> {
	console.log(`$ ${cmd} ${args.join(" ")}  (cwd: ${path.relative(repoRoot, cwd) || "."})`);
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, { cwd, stdio: "inherit" });
		child.on("close", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
			}
		});
		child.on("error", reject);
	});
}

async function main() {
	await run("vite", ["build"], monolithicDir);
	await run("bun", ["install", "--production"], serverOutputDir);
	await checkServerOutput(serverOutputDir);
}

if (import.meta.main) {
	main().catch((err) => {
		console.error(`Error: ${err instanceof Error ? err.message : err}`);
		process.exit(1);
	});
}
