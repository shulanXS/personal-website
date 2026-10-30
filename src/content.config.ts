import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";
export const NOTES_PATH = "src/content/notes";
export const WRITING_PATH = "src/content/writing";

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
      ogImage: image().or(z.string()).optional(),
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
      cover: image().or(z.string()).optional(),
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
