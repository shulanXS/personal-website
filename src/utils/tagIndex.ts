import {
  getPublishedNotes,
  getPublishedPosts,
  getPublishedWriting,
} from "./content";
import { getProjects, getProjectDate } from "./getProjects";
import { getNotesUrl, getPostUrl, getWritingUrl } from "./getPostPaths";
import { noteFallbackTitle, stripMarkdown } from "./markdown";
import { slugifyStr } from "./slugify";
import config from "@/config";

/**
 * The four content types that can carry tags.
 *
 * The list is intentionally closed: a new collection has to be added here
 * explicitly, so that it cannot silently drop out of the tag system.
 */
export const TAG_SOURCES = ["posts", "notes", "writing", "projects"] as const;

export type TagSource = (typeof TAG_SOURCES)[number];

/** How many entries of each kind carry a tag. */
export type TagCounts = Record<TagSource, number>;

/** A single tag, aggregated across all four sources. */
export type TagInfo = {
  /** URL-safe identifier. Unique across the whole site. */
  slug: string;
  /** The label as the author wrote it. */
  name: string;
  /** How many entries of each kind carry this tag. */
  counts: TagCounts;
  /** Total number of entries carrying this tag. */
  total: number;
};

/** A single entry in the tag index. */
export type TaggedItem = {
  title: string;
  /** Empty for projects, which have no detail page of their own. */
  url: string;
  /** ISO timestamp of the publish date. Empty for projects. */
  date: string;
  description?: string;
  /** The tag labels as the author wrote them. */
  tags: string[];
  /** The tag slugs attached to this entry. */
  tagSlugs: string[];
  /** The content type this entry belongs to. */
  source: TagSource;
};

/**
 * The full index of tagged content, ready to be serialised into the page.
 */
export type TagIndex = {
  tags: TagInfo[];
  items: TaggedItem[];
};

function emptyCounts(): TagCounts {
  return { posts: 0, notes: 0, writing: 0, projects: 0 };
}

/**
 * Normalises a tag label into its slug.
 *
 * The slug identifies a tag across the whole site, so that "Astro", "astro"
 * and "ASTRO" all collapse into one tag. Chinese labels keep their
 * characters (`lodash.kebabcase` is used for them), which makes
 * `/search?tag=读后感` a perfectly valid — and readable — URL.
 */
export function tagSlug(label: string): string {
  return slugifyStr(label);
}

/**
 * The preferred display spelling of a single tag label.
 *
 * The rule is deterministic so that a label always renders the same way,
 * whether it is shown on a card or in the tag bar:
 *
 * - A label that already carries an upper-case letter is left alone
 *   (`TypeScript` stays `TypeScript`).
 * - An all-lowercase label gets its first letter capitalised (`astro`
 *   becomes `Astro`), because the lowercase spelling is usually just a
 *   hurried typing of the same tag.
 * - Labels without letters (Chinese tags such as `读后感`) are left alone.
 */
export function tagDisplayName(label: string): string {
  if (!label) return label;
  if (label !== label.toLowerCase()) return label;
  if (!/[a-z]/.test(label)) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Aggregates the tags of every content type into a single list.
 *
 * The display name is derived from the labels of all entries that share a
 * slug. When the spellings disagree, the one carrying capitals wins
 * (`TypeScript` over `typescript`).
 */
export function aggregateTags(sources: Record<TagSource, string[]>): TagInfo[] {
  const bySlug = new Map<string, TagInfo>();

  for (const source of TAG_SOURCES) {
    for (const label of sources[source]) {
      const slug = tagSlug(label);
      if (!slug) continue;

      let entry = bySlug.get(slug);
      if (!entry) {
        entry = {
          slug,
          name: tagDisplayName(label),
          counts: emptyCounts(),
          total: 0,
        };
        bySlug.set(slug, entry);
      } else if (isPrettierLabel(tagDisplayName(label), entry.name)) {
        entry.name = tagDisplayName(label);
      }

      entry.counts[source] += 1;
      entry.total += 1;
    }
  }

  return [...bySlug.values()].sort((a, b) => {
    // Tags with more entries come first; the label breaks the tie so that
    // the order is stable between builds.
    if (b.total !== a.total) return b.total - a.total;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

/**
 * Decides whether `candidate` should replace `current` as the display name.
 *
 * A label that contains an upper-case letter is preferred, because it shows
 * the author capitalised the tag deliberately. Between two labels of the same
 * quality, the shorter one wins — it is usually the cleaner spelling.
 */
function isPrettierLabel(candidate: string, current: string): boolean {
  const candidateHasCaps = candidate !== candidate.toLowerCase();
  const currentHasCaps = current !== current.toLowerCase();

  if (candidateHasCaps !== currentHasCaps) return candidateHasCaps;
  return candidate.length < current.length;
}

/**
 * Builds the complete tag index for the site.
 *
 * Drafts are filtered out through the `getPublished*` helpers, so an
 * unpublished entry can never surface through a tag.
 */
export async function getTagIndex(
  locale: string = config.site.lang
): Promise<TagIndex> {
  const [posts, notes, writing] = await Promise.all([
    getPublishedPosts(),
    getPublishedNotes(),
    getPublishedWriting(),
  ]);
  const projects = getProjects();

  const items: TaggedItem[] = [];
  const sources: Record<TagSource, string[]> = {
    posts: [],
    notes: [],
    writing: [],
    projects: [],
  };

  for (const entry of posts) {
    const tags = entry.data.tags ?? [];
    items.push({
      title: entry.data.title,
      url: getPostUrl(entry.id, entry.filePath, locale),
      date: (entry.data.modDatetime ?? entry.data.pubDatetime).toISOString(),
      description: entry.data.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      source: "posts",
    });
    sources.posts.push(...tags);
  }

  for (const entry of notes) {
    const tags = entry.data.tags ?? [];
    /*
     * The title and the summary of a note are plain text: a note is
     * written in Markdown, and the Markdown syntax has no place in a search
     * result.
     */
    items.push({
      title: entry.data.title ?? noteFallbackTitle(entry.data.content),
      url: getNotesUrl(locale),
      date: (entry.data.modDatetime ?? entry.data.pubDatetime).toISOString(),
      description: stripMarkdown(entry.data.content).slice(0, 160),
      tags,
      tagSlugs: tags.map(tagSlug),
      source: "notes",
    });
    sources.notes.push(...tags);
  }

  for (const entry of writing) {
    const tags = entry.data.tags ?? [];
    items.push({
      title: entry.data.title,
      url: getWritingUrl(entry.data.slug, locale),
      date: (entry.data.modDatetime ?? entry.data.pubDatetime).toISOString(),
      description: entry.data.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      source: "writing",
    });
    sources.writing.push(...tags);
  }

  for (const project of projects) {
    const tags = project.tags ?? [];
    items.push({
      title: project.name,
      // Projects have no detail page of their own — the project grid is the
      // only place they live.
      url: "",
      date: getProjectDate(project).toISOString(),
      description: project.description,
      tags,
      tagSlugs: tags.map(tagSlug),
      source: "projects",
    });
    sources.projects.push(...tags);
  }

  return { tags: aggregateTags(sources), items };
}
