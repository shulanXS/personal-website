import { postFilter } from "./postFilter";
import { aggregateTags, tagSlug } from "./tagIndex";

/**
 * Builds a de-duplicated, sorted tag list from entries.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 *
 * The aggregation itself lives in `tagIndex.ts` so that this helper and the
 * cross-collection tag bar cannot drift apart.
 */
export function getUniqueTags<
  T extends { data: { pubDatetime: Date; tags?: string[] | undefined } },
>(posts: T[]) {
  const labels = posts.filter(postFilter).flatMap(post => post.data.tags ?? []);

  return aggregateTags({ posts: labels, notes: [], writing: [], projects: [] })
    .map(tag => ({ tag: tag.slug, tagName: tag.name }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export { tagSlug };
