import os from "node:os";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dirname, "../..");
export const HOST_ENV = os.hostname();
export const viteBin = path.join(repoRoot, "node_modules", ".bin", "vite");
