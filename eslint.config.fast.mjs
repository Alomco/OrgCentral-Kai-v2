import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import sonarjs from "eslint-plugin-sonarjs";

export default defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".tmp/**",
    "node_modules/**",
    ".agents/**",
    "src/components/ui/**",
    "src/hooks/use-mobile.ts",
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
  ]),
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": ["error", { "fixToUnknown": false }]
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      import: importPlugin,
      sonarjs,
    },
    rules: {
      "no-console": "warn",
    }
  }
]);
