// @ts-check

import eslint from '@eslint/js';
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
  prettierConfig,
  {
    rules: {
      "no-unused-vars": "off",
      "no-explicit-any": "off",
      "no-require-imports": "off",
      "no-irregular-whitespace": "off",
      "no-console": "off"
    }
  }
];