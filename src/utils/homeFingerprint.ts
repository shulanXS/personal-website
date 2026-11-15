import type { CollectionEntry } from "astro:content";
import {
  getPublishedNotes,
  getPublishedPosts,
  getPublishedWriting,
} from "./content";
import { getProjects } from "./getProjects";
import config from "@/config";

/**
 * The fingerprint of everything the home page is built from.
 *
 * The home page is a static snapshot: it is rendered when the site is
 * built, and it does not change until the site is built again. A reader
 * who comes back a week later is therefore looking at a page that may be
 * out of date — the author may have published three new notes since.
 *
 * The fingerprint is the answer to "is this page still the latest one?".
 * It is a short string built from the identity of every piece of content
 * the page shows, so that it changes when — and only when — the content
 * of the page changes. The browser compares the fingerprint it was given
 * with the fingerprint the server currently serves; when the two differ,
 * the content on the screen is not what the site holds.
 *
 * What goes into it
 * -----------------
 *
 * Everything the home page actually *shows* of a piece of content:
 *
 *   - its kind and its id, which identify it;
 *   - its publication date, which is written next to it;
 *   - its title, which is written above it;
 *   - its summary, which is written under it;
 *   - for a note, its text — the timeline shows the note itself in full,
 *     so an edit to a note changes what the page says, and the
 *     fingerprint has to change with it.
 *
 * What does *not* go into it: the body of an article or a chapter, which
 * the home page does not show, and the moment the site was built. A
 * rebuild that changed nothing about the content is not a change of the
 * content.
 */
export type HomeFingerprintInput = {
  notes: CollectionEntry<"notes">[];
  posts: CollectionEntry<"posts">[];
  writing: CollectionEntry<"writing">[];
  projects: {
    name: string;
    description?: string;
    pubDatetime?: string;
  }[];
};

/**
 * The parts of an entry that make up its identity.
 *
 * Kept apart from the hashing so that the input is readable: this is
 * what the fingerprint is *made of*, and the hash itself is opaque.
 */
function entryParts(
  kind: string,
  id: string,
  date: Date,
  title: string,
  extra: string
) {
  return `${kind}:${id}:${date.toISOString()}:${title}:${extra}`;
}

/**
 * A short, stable hash of a string.
 *
 * The hash is only ever compared with another hash, so it does not have
 * to be cryptographically strong — it has to be *fast* and *stable*. A
 * simple FNV-1a does both, and it keeps the build free of a dependency
 * on a crypto library for what is, in the end, a cache key.
 */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned, so that the result is always eight hexadecimal characters.
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Builds the fingerprint of the home page's content.
 *
 * The entries are sorted before they are hashed, so that the order in
 * which the collections happen to be read — which is not guaranteed, as
 * they are read concurrently — cannot change the result.
 */
export function computeHomeFingerprint(input: HomeFingerprintInput): string {
  const parts: string[] = [];

  for (const note of input.notes) {
    parts.push(
      entryParts(
        "note",
        note.id,
        note.data.pubDatetime,
        note.data.title ?? "",
        /*
         The note's own text.

         The timeline shows the note in full, so its text is part of what
         the page says. An edit to a note that changes nothing but its
         wording still changes the page, and the fingerprint has to
         change with it — otherwise the reader would keep looking at the
         old wording, convinced that nothing had happened.
         */
        note.data.content ?? ""
      )
    );
  }

  for (const post of input.posts) {
    parts.push(
      entryParts(
        "post",
        post.id,
        post.data.pubDatetime,
        post.data.title,
        // The summary is shown under the title. The body of the article
        // is not shown here, so it is not part of what the page says.
        post.data.description ?? ""
      )
    );
  }

  for (const work of input.writing) {
    parts.push(
      entryParts(
        "writing",
        work.id,
        work.data.pubDatetime,
        work.data.title,
        work.data.description ?? ""
      )
    );
  }

  for (const project of input.projects) {
    parts.push(
      entryParts(
        "project",
        project.name,
        project.pubDatetime ? new Date(project.pubDatetime) : new Date(0),
        project.name,
        project.description ?? ""
      )
    );
  }

  /*
   * The parts are sorted, so that the fingerprint depends on *what* the
   * page shows and not on the order the pieces arrived in.
   */
  parts.sort();
  return hash(parts.join("\n"));
}

/**
 * Reads the published content and computes the fingerprint of the home
 * page from it.
 *
 * The lengths of the sections are folded into the fingerprint as well: a
 * change to them changes what the page shows, and a reader who is looking
 * at a page with three articles when the site now shows four is looking
 * at an out-of-date page.
 */
export async function getHomeFingerprint(): Promise<string> {
  const [notes, posts, writing] = await Promise.all([
    getPublishedNotes(),
    getPublishedPosts(),
    getPublishedWriting(),
  ]);
  const projects = getProjects();

  const lengths = [
    config.home.recentNotes,
    config.home.recentPosts,
    config.home.recentWriting,
    config.home.recentProjects,
    config.home.activityLimit,
  ].join(",");

  const fingerprint = computeHomeFingerprint({
    notes,
    posts,
    writing,
    projects,
  });

  return `${fingerprint}-${hash(lengths)}`;
}
