import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import rehypeCallouts from "rehype-callouts";
import remarkCollapse from "remark-collapse";

/**
 * Rendering of the Markdown body of a note.
 *
 * A note stores its text in the `content` field of the frontmatter rather
 * than in the body of the file. That is deliberate: the CMS writes a single
 * text field, and a note has no layout of its own to hang frontmatter off.
 *
 * The price of that choice is that the text never goes through Astro's own
 * Markdown pipeline, so it has to be rendered here. The processor below is
 * the same one the site uses for its articles — the same Shiki themes, the
 * same callouts — so that a note and an article written in Markdown look
 * like they come from the same place.
 *
 * The renderer is created once and kept: creating a Markdown processor means
 * loading the whole unified pipeline, and the notes list renders every note
 * on the page.
 */
let rendererPromise: Promise<
  Awaited<ReturnType<typeof createMarkdownProcessor>>
> | null = null;

function getRenderer() {
  if (!rendererPromise) {
    rendererPromise = createMarkdownProcessor({
      /**
       * The Shiki configuration mirrors `astro.config.ts`.
       *
       * Without the dual themes a code block inside a note would be
       * highlighted in the default palette, which does not match the rest of
       * the site in either colour scheme.
       */
      shikiConfig: {
        themes: { light: "min-light", dark: "night-owl" },
        defaultColor: false,
      },
      remarkPlugins: [[remarkCollapse, { test: "Table of contents" }]],
      rehypePlugins: [rehypeCallouts],
    });
  }
  return rendererPromise;
}

/**
 * Renders a Markdown string into HTML.
 *
 * The result is inserted with `set:html`, so it must be produced by the
 * Markdown processor rather than by string concatenation — there is no
 * untrusted HTML in a note body, but the escaping is done by the pipeline
 * anyway.
 */
export async function renderMarkdown(source: string): Promise<string> {
  if (!source || !source.trim()) return "";
  const renderer = await getRenderer();
  const { code } = await renderer.render(source);
  return code;
}

/**
 * Strips the Markdown syntax from a string, leaving its plain text.
 *
 * Used where the raw source must not be shown: the fallback heading of a
 * note without a title (the heading is read by search engines and by screen
 * readers) and the summary of a note in the tag index.
 */
export function stripMarkdown(source: string): string {
  return (
    source
      // Fenced and inline code.
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      // Images and links: keep the text, drop the target.
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Headings, blockquotes and list markers.
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // Emphasis and strikethrough.
      .replace(/(\*\*\*|___)(.+?)\1/g, "$2")
      .replace(/(\*\*|__)(.+?)\1/g, "$2")
      .replace(/(\*|_)(.+?)\1/g, "$2")
      .replace(/~~(.+?)~~/g, "$1")
      // Horizontal rules.
      .replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/gm, "")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}

/**
 * The first line of a note, in plain text.
 *
 * A note without a title still needs a heading — the search index turns
 * every heading into its own result — so the opening of the note serves as
 * that heading.
 */
export function noteFallbackTitle(source: string): string {
  const text = stripMarkdown(source);
  return text.slice(0, 40).trim() || "note";
}
