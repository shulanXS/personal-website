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
  {
    /*
     * The scratch files are gitignored — they are one-off probes written
     * while working on a design question. ESLint still walks them, because
     * they exist on disk, and they are not held to the project's standards:
     * `pnpm run lint` should pass on a fresh clone, and it would not if the
     * lint depended on which scratch files happen to be lying around.
     */
    ignores: ["*-tmp.mjs", "outline-test.html", "design-proposals-*.html"],
  },
];
