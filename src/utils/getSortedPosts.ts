import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";

/**
 * The shape needed to sort entries by their effective date.
 */
type DatedEntry = {
  data: {
    pubDatetime: Date;
    modDatetime?: Date | null | undefined;
  };
};

/**
 * Returns posts that are eligible to be shown to users, sorted by “last updated”
 * descending (uses `modDatetime` when present, otherwise `pubDatetime`).
 *
 * Note: filtering respects drafts and scheduled posts via `postFilter()`.
 */
export function getSortedPosts(posts: CollectionEntry<"posts">[]) {
  return sortByDateDesc(posts.filter(postFilter));
}

/**
 * Sorts entries by their effective date descending, preferring `modDatetime`
 * over `pubDatetime` when present.
 */
export function sortByDateDesc<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      Math.floor(
        new Date(b.data.modDatetime ?? b.data.pubDatetime).getTime() / 1000
      ) -
      Math.floor(
        new Date(a.data.modDatetime ?? a.data.pubDatetime).getTime() / 1000
      )
  );
}
