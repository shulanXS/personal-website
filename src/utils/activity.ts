import type { CollectionEntry } from "astro:content";
import {
  getPublishedNotes,
  getPublishedPosts,
  getPublishedWriting,
} from "./content";
import { getProjects, getProjectDate, type Project } from "./getProjects";
import { getNotesUrl, getPostUrl, getWritingUrl } from "./getPostPaths";
import { noteFallbackTitle, stripMarkdown } from "./markdown";
import { tagSlug } from "./tagIndex";
import { routeUrl } from "./routes";
import config from "@/config";

/**
 * The four kinds of thing that can happen on this site.
 *
 * The list is closed on purpose: a new collection has to be added here
 * explicitly, so that it cannot silently drop out of the timeline.
 */
export type ActivityKind = "note" | "post" | "writing" | "project";

/**
 * One entry of the timeline.
 *
 * Every entry carries the same handful of things — a title, a moment in
 * time, a link, a set of tags — so that the timeline can be sorted and
 * rendered without the renderer having to know which kind it is looking
 * at. The kind-specific payload hangs off a narrow property, so a renderer
 * that only understands one kind cannot reach for the payload of another.
 */
export type ActivityEntry = {
  /** Which kind of content this is. */
  kind: ActivityKind;
  /** The title as it is shown in the timeline. */
  title: string;
  /** The moment the thing happened. */
  date: Date;
  /** Where the entry leads. */
  url: string;
  /** A one-line summary, when the content has one. */
  description?: string;
  /** The tag labels as the author wrote them. */
  tags: string[];
  /** The tag slugs attached to this entry. */
  tagSlugs: string[];
  /** The note itself. Only set on a `note` entry. */
  note?: CollectionEntry<"notes">;
  /** The article itself. Only set on a `post` entry. */
  post?: CollectionEntry<"posts">;
  /** The literary work itself. Only set on a `writing` entry. */
  writing?: CollectionEntry<"writing">;
  /** The project itself. Only set on a `project` entry. */
  project?: Project;
};

/**
 * The moment a content entry last changed.
 *
 * The same rule the listings use: an article that was revised is dated by
 * its revision, not by its first publication. The timeline shows when
 * things happened, so a revised article happens again on the day it was
 * revised.
 */
function effectiveDate(data: {
  pubDatetime: Date;
  modDatetime?: Date | null;
}): Date {
  return data.modDatetime ?? data.pubDatetime;
}

/**
 * Collects every published thing that happened, newest first.
 *
 * The four collections are read through the `getPublished*` helpers, so a
 * draft never reaches the timeline.
 */
export async function getActivityEntries(
  locale: string = config.site.lang
): Promise<ActivityEntry[]> {
  const [notes, posts, writing] = await Promise.all([
    getPublishedNotes(),
    getPublishedPosts(),
    getPublishedWriting(),
  ]);
  const projects = getProjects();

  const entries: ActivityEntry[] = [];

  for (const note of notes) {
    const tags = note.data.tags ?? [];
    entries.push({
      kind: "note",
      // A note may have no title: the opening words of the note stand in
      // for it, exactly as they do in the notes listing.
      title: note.data.title ?? noteFallbackTitle(note.data.content),
      date: effectiveDate(note.data),
      // Notes have no page of their own — they live on the listing.
      url: getNotesUrl(locale),
      description: stripMarkdown(note.data.content).slice(0, 160),
      tags,
      tagSlugs: tags.map(tagSlug),
      note,
    });
  }

  for (const post of posts) {
    const tags = post.data.tags ?? [];
    entries.push({
      kind: "post",
      title: post.data.title,
      date: effectiveDate(post.data),
      url: getPostUrl(post.id, post.filePath, locale),
      description: post.data.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      post,
    });
  }

  for (const work of writing) {
    const tags = work.data.tags ?? [];
    entries.push({
      kind: "writing",
      title: work.data.title,
      date: effectiveDate(work.data),
      url: getWritingUrl(work.data.slug, locale),
      description: work.data.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      writing: work,
    });
  }

  for (const project of projects) {
    const tags = project.tags ?? [];
    entries.push({
      kind: "project",
      title: project.name,
      date: getProjectDate(project),
      // A project has no page of its own: it either opens its repository
      // or leads to the project grid.
      url: project.github ?? routeUrl(locale, "projects"),
      description: project.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      project,
    });
  }

  /*
   * The newest first.
   *
   * Entries that share a moment are ordered by their kind, so that the
   * order does not shift from one build to the next — the collections are
   * read concurrently and their relative order is not guaranteed.
   */
  const kindOrder: Record<ActivityKind, number> = {
    note: 0,
    post: 1,
    writing: 2,
    project: 3,
  };

  return entries.sort((a, b) => {
    const diff = b.date.getTime() - a.date.getTime();
    if (diff !== 0) return diff;
    return kindOrder[a.kind] - kindOrder[b.kind];
  });
}

/**
 * The most recent entries of the timeline.
 */
export async function getRecentActivity(
  locale: string = config.site.lang,
  limit: number = config.home.activityLimit
): Promise<ActivityEntry[]> {
  const entries = await getActivityEntries(locale);
  return entries.slice(0, limit);
}
