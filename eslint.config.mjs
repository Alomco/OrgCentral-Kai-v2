import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import unicorn from "eslint-plugin-unicorn";
import sonarjs from "eslint-plugin-sonarjs";
import importPlugin from "eslint-plugin-import";
import boundaries from "eslint-plugin-boundaries";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const tsconfigPath = join(projectRoot, "tsconfig.json");

const typescriptConfigs = [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked].map(
  (config) => {
    const parserOptions = { ...(config.languageOptions?.parserOptions ?? {}) };
    delete parserOptions.projectService;

    return {
      ...config,
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        ...(config.languageOptions ?? {}),
        parserOptions: {
          ...parserOptions,
          project: [tsconfigPath],
          tsconfigRootDir: projectRoot,
        },
      },
    };
  },
);

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  ...typescriptConfigs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "max-lines": ["error", 250],
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
        { type: "apiRoutes", pattern: "src/app/api/**" },
        { type: "workers", pattern: "src/server/workers/**" },
        { type: "apiAdapters", pattern: "src/server/api-adapters/**" },
        { type: "useCases", pattern: "src/server/use-cases/**" },
        { type: "services", pattern: "src/server/services/**" },
        { type: "prismaRepositories", pattern: "src/server/repositories/prisma/**" },
        { type: "contracts", pattern: "src/server/repositories/contracts/**" },
        { type: "repositories", pattern: "src/server/repositories/**" },
        { type: "lib", pattern: "src/server/lib/**" },
        { type: "types", pattern: "src/server/types/**" },
      ],
      "import/resolver": {
        typescript: {
          project: [tsconfigPath],
        },
      },
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
            dev: true,
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
        {
          devDependencies: [
            "**/*.test.{ts,tsx,js,jsx}",
            "**/*.spec.{ts,tsx,js,jsx}",
            "**/src/test/**/*.{ts,tsx,js,jsx}",
            "test/**",
            "scripts/**",
          ],
          packageDir: [projectRoot],
          optionalDependencies: false,
          peerDependencies: false,
        },
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
              from: ["apiRoutes"],
              allow: ["apiRoutes", "apiAdapters", "useCases", "services", "lib", "types"],
            },
            {
              from: ["workers"],
              allow: ["workers", "useCases", "services", "repositories", "lib", "types", "contracts"],
            },
            {
              from: ["apiAdapters"],
              allow: ["apiAdapters", "useCases", "services", "lib", "types", "workers"],
            },
            {
              from: ["useCases"],
              allow: ["useCases", "services", "repositories", "contracts", "lib", "types"],
            },
            {
              from: ["services"],
              allow: ["services", "useCases", "repositories", "contracts", "lib", "types", "workers"],
            },
            {
              from: ["repositories"],
              allow: ["repositories", "prismaRepositories", "contracts", "lib", "types"],
            },
            {
              from: ["prismaRepositories"],
              allow: ["prismaRepositories", "repositories", "contracts", "types", "lib"],
            },
            {
              from: ["contracts"],
              allow: ["contracts", "types", "repositories", "prismaRepositories"],
            },
            {
              from: ["lib"],
              allow: ["lib", "types", "workers"],
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
  {
    files: ["src/server/workers/config/queue-registry.ts"],
    rules: {
      // This worker file is linted from multiple workspace roots where the dependency resolver cannot infer
      // the orgcentral package.json, so we disable the extraneous dependency rule locally.
      "import/no-extraneous-dependencies": "off",
    },
  },
  {
    files: ["scripts/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/lib/prisma", "@/server/repositories/prisma/**"],
        },
      ],
    },
  },
  {
    files: ["src/server/workers/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/lib/prisma", "@/server/repositories/prisma/**"],
        },
      ],
    },
  },
  {
    files: ["src/server/api-adapters/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/lib/prisma", "@/server/repositories/prisma/**"],
        },
      ],
    },
  },
  {
    files: ["src/server/services/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: ["@/server/lib/prisma", "@/server/repositories/prisma/**"],
        },
      ],
    },
  },
  globalIgnores([
    "node_modules/**", // vendor libraries stay untouched
    ".agents/**",
    "components.json", // shadcn-ui registry config
    ".next/**",
    ".tmp/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**", // shadcn-ui generated components
    "src/hooks/use-mobile.ts",
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
  ]),
]);

export default eslintConfig;
