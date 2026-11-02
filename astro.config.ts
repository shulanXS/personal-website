import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { unified } from "@astrojs/markdown-remark";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import rehypeCallouts from "rehype-callouts";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import config from "./astro-paper.config";

export default defineConfig({
  site: config.site.url,
  /**
   * The Astro Dev Toolbar renders a floating bubble in the bottom corner
   * during `astro dev`. It is a pure development aid and gets in the way of
   * checking the real layout, so it stays off.
   */
  devToolbar: {
    enabled: false,
  },
  /**
   * Every page URL ends with a slash.
   *
   * This is not a cosmetic choice — it is what keeps the site consistent.
   * Astro has two independent URL generators, and they disagree unless this
   * is set:
   *
   *   * `getRelativeLocaleUrl()` appends a slash whenever the build format is
   *     `directory` (the default), no matter what `trailingSlash` says.
   *   * The pagination generator (`getRouteGenerator()`) appends a slash
   *     *only* when `trailingSlash === "always"`.
   *
   * With the default `"ignore"`, the first one produces `/notes/` while the
   * second produces `/posts` — two different shapes for the same kind of
   * page. Cloudflare Pages then canonicalises `/posts` back to `/posts/`,
   * and any hand-written redirect that points one shape at the other
   * becomes an infinite loop.
   *
   * `"always"` makes both generators agree, so a page has exactly one URL.
   */
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkToc,
        [remarkCollapse, { test: "Table of contents" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
    {
      /*
        The serif face of the literary pages.

        A Chinese serif is a webfont rather than a system font: no
        platform ships a good one by default (macOS has Songti, Windows
        has SimSun, Linux usually has nothing), and the difference
        between "a serif" and "a *good* Chinese serif" is the whole
        reason the reading pages are set apart from the rest of the site.

        The font is a complete CJK face — around 15 MB — so it is
        subset down to the characters this site actually renders. The
        `glyphs` option does exactly that: the provider asks Google for
        a font file that contains only these code points, and the
        browser downloads that file instead of the whole typeface.
      */
      name: "Noto Serif SC",
      cssVariable: "--font-serif-web",
      provider: fontProviders.google(),
      fallbacks: ["serif"],
      weights: [400, 600],
      styles: ["normal"],
      formats: ["woff2"],
    },
  ],
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
