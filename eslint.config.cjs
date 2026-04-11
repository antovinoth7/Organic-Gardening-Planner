const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const rnPlugin = require("eslint-plugin-react-native");
const prettier = require("eslint-config-prettier");

module.exports = defineConfig([
  ...expoConfig,
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
      "eslint.config.cjs",
      "app.config.js",
      "metro.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-native": rnPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "react-native/no-color-literals": "error",
      "react-native/no-inline-styles": "error",
      "react-native/no-raw-text": ["error", { skip: ["Text"] }],
    },
  },
  prettier,
]);
