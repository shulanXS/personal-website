import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
    },
  },
  { rules: { "no-console": "error" } },
  {
    // The audit scripts are CLI tools — printing their findings is the whole
    // point, so `console` is allowed there.
    files: ["scripts/**/*.mjs"],
    rules: { "no-console": "off" },
  },
  { ignores: ["dist/**", ".astro/**", "public/pagefind/**"] },
];
