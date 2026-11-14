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

/**
 * Sorts entries by their *publication* date descending.
 *
 * The sort ignores `modDatetime` on purpose. A revision date is a fact
 * about the editing of a work, and it belongs to a work that shows it —
 * an article says "updated on ..." next to its date. A note does not:
 * its date is the date it was written, and nothing on the page ever
 * mentions that it was edited later.
 *
 * Sorting by the revision date would therefore order the notes by
 * something the reader cannot see, and it would break the month groups
 * of the wall: a note written in August and edited in October sorts
 * among the October notes, so the August group ends up split in two and
 * the months come out in no order at all.
 */
export function sortByPubDateDesc<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      Math.floor(new Date(b.data.pubDatetime).getTime() / 1000) -
      Math.floor(new Date(a.data.pubDatetime).getTime() / 1000)
  );
}
