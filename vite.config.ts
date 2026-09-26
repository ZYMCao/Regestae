import { defineConfig } from "vite-plus";
import { deriveOverrides, derivePlugins, deriveRules } from "./scripts/lib/lint.ts";
import { deriveTasks } from "./scripts/lib/run.ts";

export default defineConfig({
	oxc: {
		jsx: {
			runtime: "automatic",
			importSource: "solid-js",
		},
	},
	staged: {
		"*": ["vp check --fix"],
	},
	fmt: {
		ignorePatterns: ["apps/demo/**"],
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
		ignorePatterns: ["apps/demo/**", "libs/i18n/src/paraglide/**"],
		options: { typeAware: true, typeCheck: true },
		plugins: derivePlugins("rules"),
		jsPlugins: [
			{
				name: "eslint-js",
				specifier: "oxlint-plugin-eslint",
			},
			{
				name: "no-comments",
				specifier: "eslint-plugin-no-comments",
			},
		],
		rules: deriveRules("rules"),
		overrides: deriveOverrides("rules"),
	},
	run: {
		cache: {
			scripts: false,
			tasks: true,
		},
		tasks: deriveTasks("scripts"),
	},
});
