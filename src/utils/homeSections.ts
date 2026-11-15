/**
 * The sections of the home page that the runtime refresh can replace.
 *
 * The list is shared by the server and the browser: the server renders one
 * section per entry and marks it with the name from this list, and the
 * browser looks the sections up by the very same names when it swaps the
 * content of the page for a newer one.
 *
 * A section that is not on this list is never replaced — the hero, the
 * navigation and the footer are the frame of the page, and the frame is
 * not what the reader came back for.
 */
export const HOME_SECTIONS = [
  /** The section of the recent notes, in the wide layout. */
  { name: "notes", id: "recent-notes" },
  /** The section of the recent articles, in the wide layout. */
  { name: "posts", id: "recent-posts" },
  /** The section of the recent literary works, in the wide layout. */
  { name: "writing", id: "recent-writing" },
  /** The section of the recent projects, in the wide layout. */
  { name: "projects", id: "recent-projects" },
  /** The timeline of everything that happened, in the narrow layout. */
  { name: "activity", id: "activity" },
] as const;

export type HomeSectionName = (typeof HOME_SECTIONS)[number]["name"];

/**
 * The attribute the section element carries.
 *
 * The browser finds the element to replace by this attribute, so the two
 * sides have to agree on it — which is why it lives here rather than being
 * written out in both places.
 */
export const HOME_SECTION_ATTRIBUTE = "data-home-section";

/**
 * The attribute the *body* of a section carries — the list of entries.
 *
 * Only the body is replaced when the content is refreshed. The heading of
 * a section and its "see everything" link do not change when a new entry
 * is published, so replacing them would be work for nothing — and would
 * cost the reader their place on the page.
 */
export const HOME_SECTION_BODY_ATTRIBUTE = "data-home-section-body";

/**
 * The attribute the page carries the *version* of its content under.
 *
 * The version is a fingerprint of everything the home page is built from.
 * The browser compares the version it was given with the version the
 * server currently serves, and refreshes the content when the two differ.
 */
export const HOME_VERSION_ATTRIBUTE = "data-home-version";

/**
 * The event the page fires when the content of a section has been replaced.
 *
 * The scripts that bind themselves to the entries — the clamp of a note,
 * the lightbox, the language pass, the date pass — have to be told that
 * the markup they were bound to is gone, so that they can bind themselves
 * to the new markup.
 */
export const HOME_CONTENT_UPDATED_EVENT = "home:content-updated";

/**
 * The attribute a section carries while it is showing fresh content.
 *
 * It is set on the sections that were replaced, and it drives a short
 * animation: the content changes under the reader's eyes, and without
 * any sign of it they would be looking at a list that moved for no
 * reason they could see.
 */
export const HOME_SECTION_UPDATED_ATTRIBUTE = "data-home-updated";

/**
 * The file the browser asks to find out whether the content has changed.
 *
 * It is a tiny JSON file that is rewritten on every build, and it is the
 * only thing the browser fetches when nothing has changed.
 */
export const HOME_VERSION_FILE = "home-version.json";
