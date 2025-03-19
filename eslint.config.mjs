import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginReact from "eslint-plugin-react";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigNext from "eslint-config-next";

export default [
  {
    ignores: ["node_modules/", ".next/", "dist/"],
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
      import: eslintPluginImport,
      jsxA11y: eslintPluginJsxA11y,
      react: eslintPluginReact,
      reactHooks: eslintPluginReactHooks,
      "@typescript-eslint": ts,
    },
    rules: {
      // NEXT.js recommended rules
      ...eslintConfigNext.rules,

      // General best practices
      "no-console": "warn",
      "no-debugger": "warn",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-invalid-this": "off", // Prevent 'Unexpected this' issues
      "valid-this": "off", // Allow 'this' in class methods

      // Complexity & Statements
      "max-statements": ["warn", 50], // Adjust for complex logic
      "complexity": ["warn", 25],

      // Import Rules
      "import/no-unresolved": "off",
      "import/no-extraneous-dependencies": "off",

      // React & JSX
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Accessibility
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "off",

      // TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-expressions": "off", // Disable unused expressions rule globally
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
