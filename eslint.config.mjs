import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default defineConfig([
	{
		extends: compat.extends(
			"eslint:recommended",
			"plugin:@typescript-eslint/eslint-recommended",
			"plugin:@typescript-eslint/recommended",
		),

		plugins: {
			"@typescript-eslint": typescriptEslint,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 5,
			sourceType: "module",
		},

		rules: {
			// "no-unused-vars": "off",
			"@typescript-eslint/no-unused-expressions": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					args: "none",
				},
			],
			"@typescript-eslint/ban-ts-comment": "off",
			"no-prototype-builtins": "off",
			"@typescript-eslint/no-empty-function": "off",
			"no-mixed-spaces-and-tabs": "off",
		},
	},
]);
