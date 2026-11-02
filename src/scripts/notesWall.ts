/**
 * The month index beside the notes wall.
 *
 * The index lists the months the notes span, each with the number of
 * notes it holds. Three things have to stay true while the reader
 * filters the listing by a tag:
 *
 *   - the counts follow the filter, so that the number beside a month is
 *     the number of notes the reader will actually see;
 *   - a month whose notes have all been filtered away disappears, so
 *     that the index never points at a section that is not there;
 *   - the month the reader is looking at is the one marked as current.
 *
 * The work is done here rather than in the tag filter itself, because
 * the filter is shared by all four collection listings and only the
 * notes listing has a month index.
 */

import { flatRuntimeTranslations, defaultLocale } from "@/i18n";

/**
 * The notes of a group, as the filter sees them.
 */
function notesOf(group: HTMLElement): HTMLElement[] {
  return [...group.querySelectorAll<HTMLElement>("[data-tagged-item]")];
}

/**
 * Reads a translation of the active language.
 *
 * The dictionary is imported rather than read from the DOM, so that the
 * counts follow the interface language exactly like the rest of the page.
 */
function translate(key: string): string {
  const lang = document.documentElement.lang || defaultLocale;
  const dict =
    flatRuntimeTranslations[lang] ?? flatRuntimeTranslations[defaultLocale];
  return dict?.[key] ?? key;
}

/**
 * The key of the template of a count.
 *
 * The count is not marked with `data-i18n`, because the generic language
 * pass would rewrite it with the plural form — and "1 notes" is wrong.
 * The count is therefore owned by this script, which knows whether the
 * figure is one or more.
 */
function countKey(element: HTMLElement): string | undefined {
  return element.dataset.notesCountKey;
}

/**
 * Writes a count into an element, in the language of the interface.
 *
 * The template is resolved from the dictionary rather than written out,
 * so that "3 条" becomes "3 notes" without the script knowing anything
 * about the two languages.
 *
 * The singular form has a key of its own, because English needs it:
 * "1 note" and "2 notes" are two different words, and a single
 * dictionary entry cannot hold both. A key without a singular of its
 * own — the bare figure of the index — keeps the same form either way.
 */
function writeCount(element: HTMLElement, count: number): void {
  const key = countKey(element);
  if (!key) {
    element.textContent = String(count);
    return;
  }

  const singular = translate(`${key}One`);
  const template =
    count === 1 && singular !== `${key}One` ? singular : translate(key);

  element.textContent = template.replace(/\{\{0\}\}/g, String(count));
}

/**
 * Recomputes the counts and hides the months that have become empty.
 */
function refreshMonthIndex(): void {
  const groups = [
    ...document.querySelectorAll<HTMLElement>("[data-notes-group]"),
  ];

  for (const group of groups) {
    const key = group.dataset.notesGroup;
    const notes = notesOf(group);
    const visible = notes.filter(note => !note.hidden);

    /*
     * The group is hidden when every one of its notes has been filtered
     * away. A group that is empty to begin with is left alone: the page
     * never renders an empty group in the first place.
     */
    const empty = notes.length > 0 && visible.length === 0;
    group.hidden = empty;

    const item = document.querySelector<HTMLElement>(
      `[data-notes-index-item][data-notes-month="${key}"]`
    );
    if (!item) continue;

    item.hidden = empty;

    if (empty) continue;

    const count = visible.length;

    for (const element of item.querySelectorAll<HTMLElement>(
      "[data-notes-count]"
    )) {
      writeCount(element, count);
    }

    /*
     * The heading of the group carries the same count, so that the two
     * never disagree: the index says "3" and the heading says "3 条".
     */
    for (const element of group.querySelectorAll<HTMLElement>(
      "[data-notes-count]"
    )) {
      writeCount(element, count);
    }
  }

  /*
   * The first group the reader sees is marked.
   *
   * The heading of the first group carries a little air above it, so that
   * the page does not begin with a title pressed against the top of the
   * content. Which group that is depends on the filter: a tag may have
   * hidden the first month of the page, and then the second month takes
   * its place. The mark therefore follows what is visible, rather than
   * what comes first in the document.
   */
  for (const group of groups) {
    group.removeAttribute("data-notes-first");
  }

  for (const group of groups) {
    if (group.hidden) continue;
    group.setAttribute("data-notes-first", "");
    break;
  }

  /*
   * The index itself is hidden when every month has been filtered away.
   *
   * An index with nothing in it is not an index: what is left is the
   * bare word "按月份" hanging in the margin over an empty page, which
   * reads as a heading that has lost its list. The empty-state message
   * below the wall says what happened instead.
   */
  const index = document.querySelector<HTMLElement>(".app-notes-index");
  if (index) {
    const anyVisible = groups.some(group => !group.hidden);
    index.hidden = !anyVisible;
  }

  /*
   * The month the reader is in is recomputed as well: a filter may have
   * removed the month the page was scrolled to, and the index would then
   * point at a section that is no longer there.
   */
  updateCurrentMonth();
}

/**
 * Marks the month the reader is looking at.
 *
 * The month a reader is in is the last one whose heading has passed the
 * line a little below the top of the window — the line the reader's eye
 * actually rests on, rather than the very top of the screen, which the
 * header bar covers.
 *
 * The line follows the height of the header: the bar is one row tall on a
 * wide screen and two on a narrow one, and the eye rests a little below
 * whichever it is.
 */
function updateCurrentMonth(): void {
  const groups = [
    ...document.querySelectorAll<HTMLElement>("[data-notes-group]"),
  ].filter(group => !group.hidden);

  if (groups.length === 0) return;

  const headerHeight = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--app-header-height"
    ) || "0"
  );
  const line = (Number.isFinite(headerHeight) ? headerHeight : 80) + 60;

  let current = groups[0];

  for (const group of groups) {
    const heading = group.querySelector<HTMLElement>(".app-notes-month");
    if (!heading) continue;
    if (heading.getBoundingClientRect().top <= line) current = group;
    else break;
  }

  const key = current.dataset.notesGroup;

  for (const link of document.querySelectorAll<HTMLElement>(
    "[data-notes-index-link]"
  )) {
    const item = link.closest<HTMLElement>("[data-notes-index-item]");
    const isCurrent = item?.dataset.notesMonth === key;
    if (isCurrent) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  }
}

/**
 * Watches the scroll position.
 *
 * The listener is passive, because scrolling must never be delayed by
 * the index.
 */
function setupScrollSpy(): void {
  if (window.matchMedia("(max-width: 63.999rem)").matches) return;

  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateCurrentMonth();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

document.addEventListener("tags:filtered", refreshMonthIndex);
document.addEventListener("astro:page-load", () => {
  refreshMonthIndex();
  setupScrollSpy();
});

/*
 * The counts are written in the language of the interface, so they have to
 * be rebuilt when the language changes.
 */
document.addEventListener("ui:langchange", refreshMonthIndex);
