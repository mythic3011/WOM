import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

export default [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
      },
    },
    settings: {
      "import/resolver": {
        alias: {
          map: [
            ["@", "./src"],
            ["@config", "./src/config"],
            ["@controllers", "./src/controllers"],
            ["@services", "./src/services"],
            ["@models", "./src/models"],
            ["@middleware", "./src/middleware"],
            ["@utils", "./src/utils"],
            ["@db", "./src/db"],
            ["@routes", "./src/routes"],
          ],
          extensions: [".js", ".cjs"],
        },
      },
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
      "prefer-const": "warn",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-throw-literal": "error",
      "prefer-template": "warn",
      "prefer-arrow-callback": "warn",
      "arrow-body-style": ["warn", "as-needed"],
      "no-duplicate-imports": "error",
    },
  },
  {
    files: ["**/__tests__/**/*.js", "**/*.test.js", "**/*.spec.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        performance: "readonly",
      },
    },
  },
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "logs/**",
      "coverage/**",
      "*.cjs",
    ],
  },
];




