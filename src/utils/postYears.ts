import type { CollectionEntry } from "astro:content";
import { yearKey } from "./formatDate";
import config from "@/config";

/**
 * A group of articles that were published in the same year.
 */
export type PostYearGroup = {
  /**
   * The year, e.g. "2026".
   *
   * The key is what the anchor of the group is built from, and what the
   * year heading is written from.
   */
  key: string;
  /** The articles of the year, newest first. */
  posts: CollectionEntry<"posts">[];
};

/**
 * Groups the articles by the year they were published in.
 *
 * The articles are sorted by their *publication* date before they are
 * grouped, and the groups come back in that order too — the first group is
 * the most recent year.
 *
 * The sort is done here rather than relying on the order the caller
 * happens to have: the collection is read back by "last updated", which
 * is the right order for a list of recent activity but the wrong one
 * here. An article that was published in 2022 and touched in 2026 sorts
 * to the top of the list, and grouping by the year it was *published*
 * would then produce a separate group for every article — eight groups
 * for eight articles, where three would do.
 *
 * The year is the one of the *site's* timezone rather than of the
 * reader's: an article published at half past midnight in Shanghai
 * belongs to that year, and a listing that moved it into the previous
 * year because the server was on UTC would file it under a heading it
 * does not belong to.
 */
export function groupPostsByYear(
  posts: CollectionEntry<"posts">[],
  timezone: string = config.site.timezone
): PostYearGroup[] {
  const sorted = [...posts].sort(
    (a, b) => b.data.pubDatetime.getTime() - a.data.pubDatetime.getTime()
  );

  const groups: PostYearGroup[] = [];

  for (const post of sorted) {
    const key = yearKey(post.data.pubDatetime, timezone);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.posts.push(post);
    } else {
      groups.push({ key, posts: [post] });
    }
  }

  return groups;
}
