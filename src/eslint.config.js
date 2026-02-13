const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");

module.exports = [
  {
    ignores: [
      "node_modules/**",
      "android/**",
      "ios/**",
      ".expo/**",
      "assets/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "app.config.js",
      "metro.config.js",
      "eslint.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      ...(tsPlugin.configs.recommended?.rules || {}),
      ...(importPlugin.configs.recommended?.rules || {}),
      ...(importPlugin.configs.typescript?.rules || {}),
      "import/no-unused-modules": [
        "warn",
        {
          unusedExports: true,
          missingExports: false,
        },
      ],
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
    },
  },
];
