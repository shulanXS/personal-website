import type { CollectionEntry } from "astro:content";
import { monthKey } from "./formatDate";
import config from "@/config";

/**
 * A group of notes that were written in the same month.
 */
export type NoteMonthGroup = {
  /**
   * The key of the month, e.g. "2026-10".
   *
   * The key is what the anchor of the group is built from, and what the
   * month index links to.
   */
  key: string;
  /** The notes of the month, newest first. */
  notes: CollectionEntry<"notes">[];
};

/**
 * Groups the notes by the month they were written in.
 *
 * The notes are expected to be sorted newest first, and the groups come
 * back in that order too — the first group is the most recent month.
 *
 * The month is the one of the *site's* timezone rather than of the
 * reader's: a note written at half past midnight in Shanghai belongs to
 * that day, and a listing that moved it into the previous month because
 * the server was on UTC would put it under a heading it does not belong
 * to.
 */
export function groupNotesByMonth(
  notes: CollectionEntry<"notes">[],
  timezone: string = config.site.timezone
): NoteMonthGroup[] {
  const groups: NoteMonthGroup[] = [];

  for (const note of notes) {
    const key = monthKey(note.data.pubDatetime, timezone);
    const last = groups[groups.length - 1];

    if (last && last.key === key) {
      last.notes.push(note);
    } else {
      groups.push({ key, notes: [note] });
    }
  }

  return groups;
}
