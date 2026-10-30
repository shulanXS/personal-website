import { getCollection, type CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { getSortedPosts, sortByDateDesc } from "./getSortedPosts";

/**
 * Single entry point for reading publishable content.
 *
 * Every page, feed, sitemap and search index must read content through these
 * helpers. Filtering drafts in one place is the only reliable way to guarantee
 * that drafts never leak into public output — filtering ad-hoc inside each
 * page is the most common source of leaks.
 */

/** Published blog posts, sorted newest first. */
export async function getPublishedPosts(): Promise<CollectionEntry<"posts">[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return getSortedPosts(posts);
}

/** Published notes, sorted by publish date descending. */
export async function getPublishedNotes(): Promise<CollectionEntry<"notes">[]> {
  const notes = await getCollection("notes");
  return sortByDateDesc(notes.filter(entry => postFilter(entry)));
}

/** Published literary works, sorted by publish date descending. */
export async function getPublishedWriting(): Promise<
  CollectionEntry<"writing">[]
> {
  const writing = await getCollection("writing");
  return sortByDateDesc(writing.filter(entry => postFilter(entry)));
}
