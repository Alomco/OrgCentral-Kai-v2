import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import importPlugin from "eslint-plugin-import";
import boundaries from "eslint-plugin-boundaries";

const typescriptConfigs = [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked].map(
  (config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...(config.languageOptions ?? {}),
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  }),
);

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  ...typescriptConfigs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-unnecessary-type-parameters": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-reduce-type-parameter": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-explicit-any": ["error", { "fixToUnknown": false }],
    },
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      unicorn,
      sonarjs,
      import: importPlugin,
      boundaries,
    },
    settings: {
      "boundaries/elements": [
        { type: "services", pattern: "src/server/services/**" },
        { type: "prismaRepositories", pattern: "src/server/repositories/prisma/**" },
        { type: "repositories", pattern: "src/server/repositories/**" },
        { type: "contracts", pattern: "src/server/repositories/contracts/**" },
        { type: "lib", pattern: "src/server/lib/**" },
        { type: "types", pattern: "src/server/types/**" },
      ],
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-alert": "error",
      "no-console": "error",
      "no-implicit-coercion": "error",
      "no-return-await": "error",
      "sonarjs/cognitive-complexity": ["warn", 20],
      "sonarjs/no-duplicate-string": ["warn", { threshold: 3 }],
      "sonarjs/no-identical-functions": "error",
      "unicorn/filename-case": [
        "error",
        { cases: { camelCase: true, pascalCase: true, kebabCase: true } },
      ],
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: { props: false, params: false },
          allowList: {
            args: true,
            env: true,
            props: true,
            params: true,
            ref: true,
            refs: true,
            req: true,
            res: true,
            utils: true,
            Utils: true,
          },
        },
      ],
      "import/no-cycle": ["error", { maxDepth: 1 }],
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: ["**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}", "scripts/**"] },
      ],
      "import/no-self-import": "error",
      "import/no-unresolved": "error",
      "import/no-useless-path-segments": "warn",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: ["services"],
              allow: ["services", "repositories", "prismaRepositories", "lib", "types"],
            },
            {
              from: ["repositories"],
              allow: ["repositories", "prismaRepositories", "lib", "types"],
            },
            {
              from: ["prismaRepositories"],
              allow: ["prismaRepositories", "repositories", "contracts", "types", "lib"],
            },
            {
              from: ["contracts"],
              allow: ["contracts", "types"],
            },
            {
              from: ["lib"],
              allow: ["lib", "types"],
            },
            {
              from: ["types"],
              allow: ["types"],
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**",
    "src/hooks/use-mobile.ts",
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
  ]),
]);

export default eslintConfig;
