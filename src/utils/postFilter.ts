import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * Collections that support draft + scheduled publishing.
 */
export type PublishableCollection = "posts" | "notes" | "writing";

/**
 * The minimal shape a publishable entry must have.
 */
type PublishableData = {
  pubDatetime: Date;
  draft?: boolean | undefined;
  modDatetime?: Date | null | undefined;
};

type PublishableEntry = {
  data: PublishableData;
};

/**
 * Determines whether an entry is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - In production, excludes scheduled entries until `pubDatetime` minus the
 *   configured margin
 * - In dev, always shows non-draft entries to make authoring easier
 *
 * Typed structurally so that a single rule can be shared by every collection
 * without widening the entry type. Each collection gets its own copy of this
 * logic otherwise, and the copies drift apart.
 */
export function postFilter(entry: PublishableEntry): boolean {
  const isPublishTimePassed =
    Date.now() >
    new Date(entry.data.pubDatetime).getTime() -
      config.posts.scheduledPostMargin;
  return !entry.data.draft && (import.meta.env.DEV || isPublishTimePassed);
}

/** Convenience alias for entries of any publishable collection. */
export type AnyPublishableEntry = CollectionEntry<PublishableCollection>;
