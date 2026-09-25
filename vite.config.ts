import { defineConfig } from "vite-plus";
import { deriveTasks } from "./scripts/lib/task.ts";

export default defineConfig({
	oxc: {
		jsx: {
			runtime: "automatic",
			importSource: "solid-js",
		},
	},
	staged: {
		"*": ["vp check --fix"], // vpr (not raw bun): vp injects its managed bun; hook env lacks bun on PATH
	},
	fmt: {
		ignorePatterns: ["apps/demo/**", "dist/**"],
		useTabs: true,
		singleQuote: false,
		trailingComma: "all",
		printWidth: 220,
		tabWidth: 4,
		semi: true,
		bracketSameLine: true,
		htmlWhitespaceSensitivity: "ignore",
		sortPackageJson: false,
	},
	lint: {
		ignorePatterns: ["apps/demo/**"],
		options: { typeAware: true, typeCheck: true },
		jsPlugins: [
			{
				name: "eslint-js",
				specifier: "oxlint-plugin-eslint",
			},
		],
		rules: {
			"no-unused-vars": [
				"error",
				{
					args: "none",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					fix: { imports: "safe-fix" },
				},
			],
			"no-explicit-any": "warn",
			"no-restricted-imports": ["error", { patterns: [{ group: ["@electronic-archive/*/src", "@electronic-archive/*/src/**"] }] }],
		},
	},
	run: {
		cache: {
			scripts: false,
			tasks: true,
		},
		tasks: deriveTasks("scripts"),
	},
});
