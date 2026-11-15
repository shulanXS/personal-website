import { getCollection, type CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { getSortedPosts, sortByPubDateDesc } from "./getSortedPosts";

/**
 * Single entry point for reading publishable content.
 *
 * Every page, feed, sitemap and search index must read content through these
 * helpers. Filtering drafts in one place is the only reliable way to guarantee
 * that drafts never leak into public output — filtering ad-hoc inside each
 * page is the most common source of leaks.
 *
 * Every helper sorts by the *publication* date, so that the order of a
 * listing is the order in which the things were written. The revision date
 * of an entry is shown on the page of that entry and nowhere else.
 */

/** Published blog posts, newest first. */
export async function getPublishedPosts(): Promise<CollectionEntry<"posts">[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return getSortedPosts(posts);
}

/**
 * Published notes, sorted by publish date descending.
 *
 * The sort is by the *publication* date rather than by the effective
 * date (the revision, when there is one). A note shows the day a note was
 * written and nothing else — it never says that it was edited later — so
 * ordering the notes by a revision date would order them by something
 * the reader cannot see, and it would break the month groups of the wall:
 * a note written in August and edited in October would sort among the
 * October notes, splitting the August group in two and leaving the
 * months in no order at all.
 */
export async function getPublishedNotes(): Promise<CollectionEntry<"notes">[]> {
  const notes = await getCollection("notes");
  return sortByPubDateDesc(notes.filter(entry => postFilter(entry)));
}

/** Published literary works, sorted by publish date descending. */
export async function getPublishedWriting(): Promise<
  CollectionEntry<"writing">[]
> {
  const writing = await getCollection("writing");
  return sortByPubDateDesc(writing.filter(entry => postFilter(entry)));
}
