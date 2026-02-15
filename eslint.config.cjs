const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

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
      ".eslintrc.cjs",
      "eslint.config.cjs",
      "src/eslint.config.js",
      "app.config.js",
      "metro.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "import/no-unused-modules": [
        "error",
        {
          unusedExports: true,
          missingExports: false,
        },
      ],
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
]);
