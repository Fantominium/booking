import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
      react,
      "react-hooks": reactHooks,
      security,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ClassDeclaration",
          message: "Classes are forbidden. Use functional patterns instead.",
        },
        {
          selector: "ClassExpression",
          message: "Classes are forbidden. Use functional patterns instead.",
        },
        {
          selector: "ThisExpression",
          message: "Avoid `this` bindings. Use functional patterns instead.",
        },
        {
          selector:
            "NewExpression[callee.type='Identifier'][callee.name!='Date'][callee.name!='URL'][callee.name!='Error'][callee.name!='Map'][callee.name!='Set'][callee.name!='PrismaClient'][callee.name!='Stripe'][callee.name!='Resend'][callee.name!='Queue'][callee.name!='Worker'][callee.name!='Redis']",
          message:
            "Avoid `new` for custom classes. Use functional factories or approved framework constructors.",
        },
      ],
      "no-param-reassign": ["error", { props: true }],
      "security/detect-object-injection": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "react/jsx-no-bind": ["error", { allowArrowFunctions: false }],
      "react/no-danger": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowConciseArrowFunctionExpressionsStartingWithVoid: true },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "public/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
