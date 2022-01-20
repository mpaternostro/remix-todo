/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
	root: true,
	overrides: [
		{
			files: ["*.ts", "*.tsx"],
			parser: "@typescript-eslint/parser",
			parserOptions: {
				tsconfigRootDir: __dirname,
				project: ["./tsconfig.json"],
			},
			plugins: ["@typescript-eslint"],
			extends: [
				"plugin:@typescript-eslint/recommended",
				"plugin:@typescript-eslint/recommended-requiring-type-checking",
			],
		},
	],
	extends: ["eslint:recommended", "prettier"],
	env: {
		browser: true,
		node: true,
	},
};
