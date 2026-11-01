import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";
export const NOTES_PATH = "src/content/notes";
export const WRITING_PATH = "src/content/writing";

/**
 * An image field that accepts both kinds of paths.
 *
 * Astro's `image()` resolves a path against the content folder and optimizes
 * it — which is what a repository asset such as `../../assets/images/x.png`
 * needs. It cannot resolve a path inside `public/`: such a file is served
 * as-is and has no build-time metadata, so `image()` fails with
 * "Could not find requested image".
 *
 * Pages CMS stores uploaded media under `public/uploads` and writes the
 * public path (`/uploads/abc.png`) into the frontmatter, so a public path has
 * to be accepted. A leading slash is what distinguishes the two: a repository
 * asset is always a relative path, a public file is always absolute.
 *
 * The branches are tried in order:
 *
 *   1. an absolute path — a file in `public/`, kept as-is;
 *   2. `image()` — a repository asset, resolved and optimized;
 *   3. a plain string — a remote URL, or any path Astro cannot resolve,
 *      which is then used verbatim.
 */
const contentImage = <T extends z.ZodType>(image: () => T) =>
  z.union([z.string().startsWith("/"), image(), z.string()]);

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      /**
       * Tags attached to the post.
       *
       * Empty by default: a post without tags simply has none, instead of
       * being filed under a made-up "others" bucket.
       */
      tags: z.array(z.string()).default([]),
      ogImage: contentImage(image).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
    }),
});

/**
 * Notes are short-form posts ("碎碎念").
 *
 * Uses an independent schema on purpose: `title` is optional and there is no
 * required `description`, so a note can consist of only images.
 *
 * `id` is a stable UUID (also used as the file name and the URL segment) so
 * that changing the publish date never changes the link.
 */
const notes = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${NOTES_PATH}` }),
  schema: z.object({
    id: z.string(),
    title: z.string().optional(),
    content: z.string().default(""),
    /**
     * Images attached to the note.
     *
     * Stored as plain paths (e.g. `/uploads/abc.png`) rather than through
     * Astro's `image()` helper, because Pages CMS writes plain strings and
     * the notes live in `public/` where they are not processed anyway.
     * `alt` is kept as a separate parallel list to keep the frontmatter
     * simple for the CMS form.
     */
    images: z.array(z.string()).optional(),
    /** Alt text for `images`, positionally matched. */
    imageAlts: z.array(z.string()).optional(),
    pubDatetime: z.date(),
    modDatetime: z.date().optional().nullable(),
    draft: z.boolean().optional(),
    /**
     * Tags attached to the note.
     *
     * Empty by default, so that a note without tags has none rather than
     * falling into a placeholder bucket.
     */
    tags: z.array(z.string()).default([]),
    canonicalURL: z.string().optional(),
  }),
});

/**
 * Writing holds literary work: novels, essays and short stories.
 *
 * `series`, `chapterNumber` and `status` are reserved for the multi-chapter
 * support so that adding it later does not require a schema migration of
 * already published content.
 */
const writing = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${WRITING_PATH}` }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      type: z.enum(["novel", "essay", "short"]).default("essay"),
      description: z.string().optional(),
      series: z.string().optional(),
      chapterNumber: z.number().optional(),
      status: z.enum(["ongoing", "completed"]).optional(),
      cover: contentImage(image).optional(),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      draft: z.boolean().optional(),
      /**
       * Tags attached to the work — e.g. a genre ("玄幻"), a theme
       * ("读后感") or a series name.
       */
      tags: z.array(z.string()).default([]),
      canonicalURL: z.string().optional(),
    }),
});

export const collections = { posts, notes, writing };
