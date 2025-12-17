// eslint.config.mjs
import js from "@eslint/js";
import ts from "typescript-eslint";

export default [
  //
  // 1. Ignore patterns (replacement for .eslintignore)
  //
  {
    ignores: [
      "node_modules/",
      "builds",
      "dist/",
      "dist_chromium",
      "dist_firefox",
      "dist_ios",
      "dist_safari",
      "xcode",
      // Add any others:
      // '*.js.map',
      // 'build/',
    ],
  },

  //
  // 2. Base JS rules
  //
  js.configs.recommended,

  //
  // 3. TypeScript rules
  //
  ...ts.configs.recommended,

  //
  // 4. Project-specific overrides
  //
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: ts.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Add your own rules here
      "@typescript-eslint/no-explicit-any": "warn",
      '@typescript-eslint/no-unused-vars': [
        "warn",
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }
      ]
    },
  },
  {
    files: ["*.mjs", "*.config.mjs", "webpack.*.js"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        require: "readonly",
        module: "readonly",
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        "warn",
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }
      ]
    },
  },
];
