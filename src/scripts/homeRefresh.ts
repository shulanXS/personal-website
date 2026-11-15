/**
 * The runtime refresh of the home page.
 *
 * The home page is a static snapshot: it is rendered when the site is
 * built, and it does not change until the site is built again. A reader
 * who opens the site from a browser that already has it cached — or who
 * simply leaves the tab open while the author publishes something — is
 * looking at a page that may no longer be the latest one.
 *
 * This module closes that gap. It asks the server a tiny question
 * ("is the content of the home page still the same as it was when this
 * page was rendered?") and, when the answer is no, it fetches the
 * current home page and puts its content on the screen — without a
 * reload, without a jump, and without disturbing the reader's place on
 * the page.
 *
 * How it works
 * ------------
 *
 *   * The page carries a *fingerprint* of its content, written into the
 *     markup by the build. The fingerprint changes when — and only when —
 *     the content of the page changes.
 *   * The server serves that fingerprint as a tiny JSON file. Asking for
 *     it costs one small request, and it is the *only* request made when
 *     nothing has changed.
 *   * When the two fingerprints differ, the browser fetches the home
 *     page itself and lifts the sections out of it.
 *
 * Why the page is fetched rather than a feed of the sections
 * ----------------------------------------------------------
 *
 * A separate feed would have to render the sections a second time, in a
 * second place, and the two renderings could drift apart: a section that
 * looks right on the page and wrong in the feed is a page that changes
 * shape the moment it is refreshed. Fetching the page itself cannot
 * drift — it *is* the page, so what the reader ends up looking at is
 * exactly what a visitor who opened the site at that moment would see.
 */

import {
  HOME_CONTENT_UPDATED_EVENT,
  HOME_SECTION_ATTRIBUTE,
  HOME_SECTION_BODY_ATTRIBUTE,
  HOME_SECTION_UPDATED_ATTRIBUTE,
  HOME_VERSION_FILE,
} from "@/utils/homeSections";

/**
 * The path of the file that carries the current fingerprint.
 *
 * It is written next to the page itself, so it is addressed relative to
 * the site root rather than relative to the page — the home page is the
 * only page that uses it, but the site may live under a subdirectory.
 */
function versionUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return `${base}${HOME_VERSION_FILE}`;
}

/**
 * The path of the home page itself.
 */
function homeUrl(): string {
  return import.meta.env.BASE_URL.replace(/\/?$/, "/") || "/";
}

/**
 * How long the browser waits before it asks whether there is anything new.
 *
 * The wait is long enough that the question is not asked on every visit
 * of every page — a reader who comes back five times in a minute should
 * not cause five requests — and short enough that a reader who leaves
 * the tab open sees the new content while they are still there.
 */
const CHECK_INTERVAL = 60 * 1000;

/**
 * The delay before the first check.
 *
 * The check is not made the moment the page loads: the reader has just
 * arrived, and the page they are looking at was, by definition, current
 * a moment ago. The first check waits for the reader to settle in.
 */
const FIRST_CHECK_DELAY = 15 * 1000;

/**
 * How long a request may take before it is given up on.
 */
const REQUEST_TIMEOUT = 15 * 1000;

/**
 * Reads the fingerprint of the version the page was rendered with.
 */
function renderedFingerprint(): string | null {
  const main = document.querySelector<HTMLElement>("#main-content");
  return main?.dataset.homeVersion ?? null;
}

/**
 * Reads the fingerprint the server currently serves.
 */
async function currentFingerprint(signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(versionUrl(), {
      // The answer is a cache key, not a document: it must never be
      // served from the browser's cache.
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const body = (await response.json()) as { fingerprint?: string };
    return typeof body.fingerprint === "string" ? body.fingerprint : null;
  } catch {
    // The check is an improvement, not a requirement: a failed request
    // (offline, a blocked request, a server that does not answer) must
    // never disturb the page.
    return null;
  }
}

/**
 * Fetches the current home page.
 */
async function fetchHome(signal: AbortSignal): Promise<Document | null> {
  try {
    const response = await fetch(homeUrl(), {
      cache: "no-store",
      signal,
      headers: { Accept: "text/html" },
    });
    if (!response.ok) return null;

    return new DOMParser().parseFromString(await response.text(), "text/html");
  } catch {
    return null;
  }
}

/**
 * Replaces the bodies of the sections with the ones that were fetched.
 *
 * A section that is not on the page is skipped, and a section whose body
 * is missing from the fetched page is left alone — a partial answer is
 * better than a page that has lost half of its content.
 *
 * Returns the number of sections that were replaced.
 */
function applySections(incoming: Document): number {
  let replaced = 0;

  for (const section of incoming.querySelectorAll<HTMLElement>(
    `[${HOME_SECTION_ATTRIBUTE}]`
  )) {
    const name = section.getAttribute(HOME_SECTION_ATTRIBUTE);
    if (!name) continue;

    const current = document.querySelector<HTMLElement>(
      `[${HOME_SECTION_ATTRIBUTE}="${CSS.escape(name)}"]`
    );
    if (!current) continue;

    const newBody = section.querySelector<HTMLElement>(
      `[${HOME_SECTION_BODY_ATTRIBUTE}]`
    );
    const oldBody = current.querySelector<HTMLElement>(
      `[${HOME_SECTION_BODY_ATTRIBUTE}]`
    );
    if (!newBody || !oldBody) continue;

    /*
     The body is replaced rather than merged into: the fetched page holds
     the *whole* body, and a merge would leave the entries that are no
     longer in it behind — an article that was deleted would keep sitting
     in the list.
     */
    oldBody.replaceChildren(...Array.from(newBody.childNodes));
    replaced += 1;

    /*
     The section is marked, so that the change can be seen. The mark is
     removed again after the animation has run: a section that keeps the
     mark would look as though it were still changing every minute.
     */
    current.setAttribute(HOME_SECTION_UPDATED_ATTRIBUTE, "");
    setTimeout(() => {
      current.removeAttribute(HOME_SECTION_UPDATED_ATTRIBUTE);
    }, 1200);
  }

  return replaced;
}

/**
 * Tells the rest of the page that the markup has been replaced.
 *
 * The scripts that bind themselves to the entries — the clamp of a note,
 * the lightbox, the language pass, the date pass — were bound to markup
 * that is now gone. They have to bind themselves to the new markup, and
 * the only way for them to know that they should is this event.
 */
function announceUpdate(): void {
  document.dispatchEvent(
    new CustomEvent(HOME_CONTENT_UPDATED_EVENT, { detail: { source: "home" } })
  );
}

/**
 * Runs the whole check: ask the server whether anything changed, and
 * put the new content on the screen if it did.
 *
 * Returns whether the page was updated.
 */
async function refresh(): Promise<boolean> {
  const rendered = renderedFingerprint();
  if (!rendered) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const current = await currentFingerprint(controller.signal);
    if (!current || current === rendered) return false;

    const page = await fetchHome(controller.signal);
    if (!page) return false;

    const replaced = applySections(page);
    if (replaced === 0) return false;

    /*
     The fingerprint on the page is brought up to date, so that the next
     * check does not fetch the page again for a change that has already
     * been applied.
     */
    const main = document.querySelector<HTMLElement>("#main-content");
    if (main) main.dataset.homeVersion = current;

    announceUpdate();
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Starts the watcher.
 *
 * The watcher is started once per page load. It survives the View
 * Transitions navigation of the site: the listener lives on `document`,
 * and the home page announces itself through the markup rather than
 * through the module.
 */
function setup(): void {
  if (document.body.dataset.homeRefresh === "on") return;
  document.body.dataset.homeRefresh = "on";

  setTimeout(() => {
    void refresh();
  }, FIRST_CHECK_DELAY);

  setInterval(() => {
    /*
     The check is skipped while the tab is hidden: a reader who is not
     looking at the page does not need it to be up to date, and the
     browser throttles the timers of a hidden tab anyway.
     */
    if (document.hidden) return;
    void refresh();
  }, CHECK_INTERVAL);

  /*
   The page is checked again as soon as the reader comes back to it —
   * a tab that was in the background for an hour should not show an
   * hour-old page.
   */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    void refresh();
  });
}

document.addEventListener("astro:page-load", setup);
