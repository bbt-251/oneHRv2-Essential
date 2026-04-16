import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import path from "path";
import { createRequire } from "module";

export default defineConfig([
    ...nextVitals,
    globalIgnores([".next/**", "out/**", "build/**", "node_modules/**", "next-env.d.ts"]),
    {
        files: ["**/*.{js,jsx,ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "explicit-usestate": createRequire(import.meta.url)(
                path.resolve("./eslint-plugin-explicit-usestate.js"),
            ),
        },
        rules: {
            indent: ["error", 4, { SwitchCase: 1 }],
            "max-lines": [
                "error",
                {
                    max: 800,
                    skipBlankLines: true,
                    skipComments: true,
                },
            ],
            semi: ["error", "always"],
            "no-tabs": "error",
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "explicit-usestate/explicit-usestate-type": "error",
        },
    },
]);
