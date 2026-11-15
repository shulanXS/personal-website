import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";

/**
 * The shape needed to sort entries by their publish date.
 */
type DatedEntry = {
  data: {
    pubDatetime: Date;
    modDatetime?: Date | null | undefined;
  };
};

/**
 * Returns posts that are eligible to be shown to users, sorted by their
 * publish date descending.
 *
 * The sort is by the *publication* date — the moment the content was
 * created — rather than by its last revision.
 *
 * Why the publication date
 * -----------------------
 *
 * The site has one notion of "the order in which things happened", and
 * it is the one the author writes down: the `pubDatetime` in the
 * frontmatter of a file. The `modDatetime` field records a later edit,
 * but the editor of the CMS does not always maintain it, and a piece of
 * content whose revision date is newer than its publication date would
 * jump to the top of every listing after an edit that changed nothing
 * about when it appeared.
 *
 * Before, the two kinds of content used two different rules — notes by
 * their publication, articles and literary works by their revision — so
 * that "the most recent thing on this site" meant two different things
 * on the same page. One rule now governs all of them: the newest thing
 * is the newest thing that was *written*.
 *
 * The revision date still has a job: it is what the page of a single
 * work shows next to its publication date ("updated on ..."). It is a
 * fact about the work itself, and it belongs to the work that shows it.
 */
export function getSortedPosts(posts: CollectionEntry<"posts">[]) {
  return sortByPubDateDesc(posts.filter(postFilter));
}

/**
 * Sorts entries by their publication date descending.
 *
 * The `modDatetime` of an entry is deliberately ignored here. A revision
 * date is a fact about the editing of a work, and it belongs to a work
 * that shows it — an article says "updated on ..." next to its date. A
 * listing says "when this appeared", and that is the publication date.
 *
 * Sorting by the revision date would order the lists by something the
 * reader cannot see, and it would break the month groups of the notes
 * wall: a note written in August and edited in October would sort among
 * the October notes, splitting the August group in two and leaving the
 * months in no order at all.
 */
export function sortByPubDateDesc<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      Math.floor(new Date(b.data.pubDatetime).getTime() / 1000) -
      Math.floor(new Date(a.data.pubDatetime).getTime() / 1000)
  );
}

/**
 * Sorts entries by their publication date descending.
 *
 * The name is kept for the callers that read it as "the newest first"
 * order — the home page and the timeline both ask for the newest things
 * first, and this is that order.
 */
export const sortByDateDesc = sortByPubDateDesc;
