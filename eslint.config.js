// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
        "babel.config.js",
        "metro.config.js",
        "commit.bat",
        "commit.sh",
        "eas.json",
        ".expo/*",
        ".vscode/*"
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "no-irregular-whitespace": "off",
      "@typescript-eslint/no-unsafe-function-type": "off"
    }
  }
];