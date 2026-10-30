import { getRelativeLocaleUrl } from "astro:i18n";
import { BLOG_PATH, NOTES_PATH, WRITING_PATH } from "@/content.config";
import { slugifyStr } from "./slugify";
import config from "@/config";

/**
 * Splits a file path into URL path segments, dropping the collection root,
 * underscore-prefixed (partial) folders and the file name itself.
 */
function getPathSegments(
  filePath: string | undefined,
  collectionPath: string
): string[] {
  return (
    filePath
      ?.replace(collectionPath, "")
      .split("/")
      .filter(path => path !== "")
      .filter(path => !path.startsWith("_"))
      .slice(0, -1)
      .map(segment => slugifyStr(segment)) ?? []
  );
}

/** The last segment of a content id, e.g. "my-post.md" → "my-post". */
function getIdSlug(id: string): string {
  const parts = id.split("/");
  return parts.length > 0 ? String(parts[parts.length - 1]) : id;
}

function buildSlugPath(
  id: string,
  filePath: string | undefined,
  collectionPath: string
): string {
  const pathSegments = getPathSegments(filePath, collectionPath);
  const slug = getIdSlug(id);
  return pathSegments.length > 0
    ? [...pathSegments, slug].join("/")
    : String(slug);
}

/**
 * Returns the slug-only path for use as a route param in `getStaticPaths`.
 * No base prefix, no locale — Astro handles those at a higher level.
 * e.g. `/examples/my-post`
 */
export function getPostSlug(id: string, filePath: string | undefined): string {
  return `/${buildSlugPath(id, filePath, BLOG_PATH)}`;
}

/**
 * Returns a fully navigable URL for use in `<a href>` and RSS links.
 * Applies both locale routing and the configured Astro base via
 * `getRelativeLocaleUrl`.
 * e.g. `/posts/my-post` or `/en/posts/my-post`
 */
export function getPostUrl(
  id: string,
  filePath: string | undefined,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(
    locale,
    `posts/${buildSlugPath(id, filePath, BLOG_PATH)}`
  );
}

/*
 * Notes have no page of their own — they live on the /notes/ listing and are
 * expanded in place. The tag index therefore points at the listing.
 */
export function getNotesUrl(
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, "notes");
}

/**
 * Writing works are addressed by their explicit `slug` frontmatter field so
 * that the URL is independent of the file name.
 */
export function getWritingSlug(slug: string): string {
  return `/${slugifyStr(slug)}`;
}

export function getWritingUrl(
  slug: string,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, `writing/${slugifyStr(slug)}`);
}

export { NOTES_PATH, WRITING_PATH };
