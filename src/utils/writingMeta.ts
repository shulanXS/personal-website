import type { CollectionEntry } from "astro:content";
import { stripMarkdown } from "./markdown";

/**
 * A group of works: either a series with its chapters, or a single
 * standalone work.
 */
export type WritingGroup = {
  /**
   * The name of the series, or `null` for a standalone work.
   */
  name: string | null;
  /**
   * The works of the group, ordered by their place in the series.
   */
  works: CollectionEntry<"writing">[];
  /**
   * The state of the series, taken from its first chapter.
   */
  status: "ongoing" | "completed" | undefined;
  /**
   * The kind of the work — a novel, an essay or a short story.
   */
  type: "novel" | "essay" | "short";
  /**
   * The number of characters of the whole group.
   */
  characters: number;
  /**
   * The day the first work of the group appeared.
   */
  startDate: Date;
  /**
   * The day the last work of the group appeared.
   */
  endDate: Date;
  /**
   * The tags the group carries — the union of the tags of its works.
   */
  tags: string[];
  /**
   * The cover of the group, taken from its first work.
   *
   * Only a novel has one: a cover is what a book has, and an essay is a
   * sheet of paper. The cover is attached to the first chapter of the
   * series, so that a new chapter does not have to repeat it.
   */
  cover?: ImageMetadata;
};

/**
 * The writing page in two halves: the series, and the works that stand on
 * their own.
 */
export type WritingIndex = {
  series: WritingGroup[];
  standalone: WritingGroup[];
};

/**
 * The kinds of work, in the order they are offered.
 *
 * The order is fixed rather than derived from the content, so that the
 * filter does not rearrange itself as works are published: a novel is
 * always the first kind, because it is the one that carries a series.
 */
export const WRITING_TYPES = ["novel", "essay", "short"] as const;

/**
 * One level of the filter of the writing page.
 */
export type WritingFacet = {
  /** The value the filter matches on. */
  value: string;
  /** The label of the option. */
  label: string;
  /** The kind of the work, for the level that holds the works. */
  type?: string;
  /** How many works the option stands for. */
  count: number;
};

/**
 * One option of the level that holds the works.
 *
 * The kind is required here rather than optional, because the level narrows
 * with the level above it: an option without a kind could not be dimmed
 * when another kind is chosen.
 */
export type WritingWorkFacet = WritingFacet & { type: string };

/**
 * The levels of the filter of the writing page.
 *
 * The writing collection is filtered by the shape of the collection
 * itself — by the kind of the work, and by the work — rather than by one
 * flat row of tags. The tags that cut across kinds are left to the
 * ordinary tag filter.
 */
export type WritingFacets = {
  /** The kinds of work that occur. */
  types: WritingFacet[];
  /** The series and the stand-alone works. */
  works: WritingWorkFacet[];
  /**
   * The tags that are neither a kind nor the name of a work.
   *
   * A tag that repeats the name of a series ("雪落江川") is left out: the
   * second level of the filter already offers it, and offering it twice
   * would say the same thing in two places.
   */
  tags: { slug: string; name: string; count: number }[];
};

/**
 * Counts the characters of a work.
 *
 * The Markdown syntax is stripped first, so that the punctuation and the
 * markers of the syntax are not counted as words. A Chinese character is
 * one character, so the count is the number of characters rather than the
 * number of "words" — the English word count of a Chinese text is a
 * meaningless number.
 */
export function countCharacters(body: string | undefined): number {
  if (!body) return 0;
  return stripMarkdown(body).replace(/\s+/g, "").length;
}

/**
 * Groups the works of the writing collection.
 *
 * The grouping is derived from the frontmatter rather than from a separate
 * index, so that publishing a chapter is enough to make it appear in its
 * series.
 */
export function groupWriting(
  works: CollectionEntry<"writing">[]
): WritingIndex {
  const bySeries = new Map<string, CollectionEntry<"writing">[]>();

  for (const work of works) {
    const series = work.data.series;
    if (!series) continue;
    const list = bySeries.get(series) ?? [];
    list.push(work);
    bySeries.set(series, list);
  }

  const series: WritingGroup[] = [];

  for (const [name, chapters] of bySeries) {
    /*
     * Within a series the chapters keep the place they occupy in the
     * story, not the day they were written: a chapter that was published
     * late but belongs to the second chapter stays the second chapter.
     */
    const ordered = [...chapters].sort(
      (a, b) => (a.data.chapterNumber ?? 0) - (b.data.chapterNumber ?? 0)
    );

    series.push({
      name,
      works: ordered,
      status: ordered[0]?.data.status,
      type: ordered[0]?.data.type ?? "essay",
      characters: ordered.reduce(
        (sum, work) => sum + countCharacters(work.body),
        0
      ),
      startDate: earliest(ordered),
      endDate: latest(ordered),
      tags: unionTags(ordered),
      cover: ordered[0]?.data.cover as ImageMetadata | undefined,
    });
  }

  const standalone: WritingGroup[] = works
    .filter(work => !work.data.series)
    .map(work => ({
      name: null,
      works: [work],
      status: work.data.status,
      type: work.data.type,
      characters: countCharacters(work.body),
      startDate: work.data.pubDatetime,
      endDate: work.data.pubDatetime,
      tags: unionTags([work]),
    }));

  // Each half is ordered by the day its first entry appeared.
  const byDate = (a: WritingGroup, b: WritingGroup) =>
    a.startDate.getTime() - b.startDate.getTime();

  return {
    series: series.sort(byDate),
    standalone: standalone.sort(byDate),
  };
}

/**
 * Builds the levels of the filter of the writing page.
 *
 * The labels of the kinds of work are written by the caller, because they
 * are the interface language rather than a fact about the work: a novel
 * is "小说" in Chinese and "Novel" in English.
 */
export function buildWritingFacets(
  index: WritingIndex,
  labels: Record<WritingGroup["type"], string>
): WritingFacets {
  const groups = [...index.series, ...index.standalone];

  // The kinds of work, in the fixed order, with the ones that occur.
  const typeCounts = new Map<string, number>();
  const workCounts = new Map<string, number>();

  for (const group of groups) {
    typeCounts.set(
      group.type,
      (typeCounts.get(group.type) ?? 0) + group.works.length
    );
  }

  const types: WritingFacet[] = WRITING_TYPES.filter(type =>
    typeCounts.has(type)
  ).map(type => ({
    value: type,
    label: labels[type],
    count: typeCounts.get(type) ?? 0,
  }));

  // The works: a series by its name, a stand-alone work by its title.
  const works: WritingWorkFacet[] = [];

  for (const group of index.series) {
    const name = group.name;
    if (!name) continue;
    workCounts.set(name, group.works.length);
    works.push({
      value: name,
      label: name,
      type: group.type,
      count: group.works.length,
    });
  }

  for (const group of index.standalone) {
    for (const work of group.works) {
      works.push({
        value: work.data.title,
        label: work.data.title,
        type: group.type,
        count: 1,
      });
    }
  }

  return { types, works, tags: [] };
}

/**
 * The tags a group of works carries.
 */
function unionTags(works: CollectionEntry<"writing">[]): string[] {
  const tags = new Set<string>();
  for (const work of works) {
    for (const tag of work.data.tags ?? []) tags.add(tag);
  }
  return [...tags];
}

/**
 * The earliest day of a group of works.
 */
function earliest(works: CollectionEntry<"writing">[]): Date {
  return works.reduce(
    (min, work) => (work.data.pubDatetime < min ? work.data.pubDatetime : min),
    works[0]!.data.pubDatetime
  );
}

/**
 * The latest day of a group of works.
 */
function latest(works: CollectionEntry<"writing">[]): Date {
  return works.reduce(
    (max, work) => (work.data.pubDatetime > max ? work.data.pubDatetime : max),
    works[0]!.data.pubDatetime
  );
}

/**
 * The prefix a chapter title may carry — "第一章", "第二天：" and so on.
 *
 * The prefix names the place of the chapter, which the listing shows in
 * its own column; repeating it inside the title would say the same thing
 * twice. The prefix is therefore split off and only the rest of the title
 * is shown.
 */
const CHAPTER_PREFIX =
  /^第[一二三四五六七八九十百千零〇0-9]+[天日章卷节部篇回][：:、.．]?\s*/;

/**
 * Splits a chapter title into its prefix and the rest of the title.
 *
 * A title that is nothing but a prefix — "第一章" — has no rest to show,
 * so the whole title is returned as the name and the caller has to look
 * elsewhere for one.
 */
export function splitChapterTitle(title: string): {
  prefix: string;
  title: string;
} {
  const match = CHAPTER_PREFIX.exec(title);
  if (!match) return { prefix: "", title };

  const rest = title.slice(match[0].length).trim();
  if (!rest) return { prefix: "", title };

  return { prefix: match[0].trim(), title: rest };
}

/**
 * The name of a chapter, without the prefix that numbers it.
 *
 * The prefix — "第一天", "第三章" — names the place of the chapter, and
 * the listing shows the place in its own column. Showing it twice would
 * say the same thing in two notations.
 *
 * A chapter whose title is nothing but a prefix ("第一章") has no name of
 * its own, so its summary is asked for one: the summary of such a chapter
 * usually carries the name ("第一章：启航。"), and the name is what is
 * left of it once the prefix is removed.
 */
export function chapterName(title: string, description?: string): string {
  const split = splitChapterTitle(title);
  if (split.title && split.title !== title) return split.title;

  if (description) {
    const fromDescription = splitChapterTitle(description);
    if (fromDescription.title && fromDescription.title !== description) {
      // A name is not a sentence: the full stop at the end of "启航。"
      // belongs to the summary, not to the name.
      return fromDescription.title.replace(/[。．.]$/, "").trim();
    }
  }

  return title;
}

/**
 * The summary of a chapter, without the prefix that numbers it.
 *
 * A chapter of a series usually repeats its own number in the summary —
 * "第一章：启航。" under the title "第一章" — and the listing shows the
 * number in its own column. The summary therefore loses it too, so that
 * the row says the number once and the name once.
 */
export function chapterDescription(
  title: string,
  description?: string
): string | undefined {
  if (!description) return undefined;

  /*
   * The summary is only touched when the title is nothing but a prefix —
   * "第一章" — because then the title carries no name and the summary is
   * where the name lives ("第一章：启航。").
   *
   * A title that has a name of its own ("第七天：锁死的窗") is left alone
   * together with its summary, even when the summary starts with the same
   * words: "第七天的桂花赤豆元宵" is a sentence about the seventh day, not
   * a second naming of the chapter.
   */
  const split = splitChapterTitle(title);
  if (split.title && split.title !== title) return description;

  const fromDescription = CHAPTER_PREFIX.exec(description);
  if (!fromDescription) return description;

  const rest = description.slice(fromDescription[0].length).trim();
  if (!rest) return undefined;

  /*
   * The name of the chapter is what is left of the summary once its
   * prefix is gone. When the summary holds nothing else, the name it
   * carries has already been shown as the title — so the summary is
   * dropped rather than repeated.
   */
  const name = rest.replace(/[。．.]$/, "").trim();
  if (name && chapterName(title, description) === name) return undefined;

  return rest;
}
