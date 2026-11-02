/**
 * The year groups of the articles listing.
 *
 * The listing is grouped by year: a heading that carries the year and the
 * number of articles in it, and the articles themselves below it. Two
 * things have to stay true while the reader filters the listing by a tag:
 *
 *   - a year whose articles have all been filtered away disappears, so
 *     that the page never carries a heading over a blank space;
 *   - the count on the heading follows the filter, so that the number is
 *     the number of articles the reader will actually see.
 *
 * The work is done here rather than in the tag filter itself, because the
 * filter is shared by all four collection listings and only the articles
 * listing is grouped by year. The notes listing has the same problem and
 * solves it the same way — see `notesWall.ts`.
 */

import { flatRuntimeTranslations, defaultLocale } from "@/i18n";

/**
 * The articles of a group, as the filter sees them.
 */
function postsOf(group: HTMLElement): HTMLElement[] {
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
 * Writes a count into an element, in the language of the interface.
 *
 * The element carries the template of the count in `data-i18n` and the
 * figure in `data-i18n-args`. The template is resolved here rather than
 * written out, so that "3 篇" becomes "3 posts" without the script
 * knowing anything about the two languages.
 */
function writeCount(element: HTMLElement, count: number): void {
  const key = element.dataset.i18n;
  if (!key) {
    element.textContent = String(count);
    return;
  }

  const template = translate(key);
  element.textContent = template.replace(/\{\{0\}\}/g, String(count));
}

/**
 * Recomputes the counts and hides the years that have become empty.
 */
function refreshYearGroups(): void {
  const groups = [
    ...document.querySelectorAll<HTMLElement>("[data-posts-group]"),
  ];

  for (const group of groups) {
    const posts = postsOf(group);
    const visible = posts.filter(post => !post.hidden);

    /*
     * The group is hidden when every one of its articles has been filtered
     * away. A group that is empty to begin with is left alone: the page
     * never renders an empty group in the first place.
     */
    const empty = posts.length > 0 && visible.length === 0;
    group.hidden = empty;

    if (empty) continue;

    for (const element of group.querySelectorAll<HTMLElement>(
      "[data-posts-count]"
    )) {
      writeCount(element, visible.length);
    }
  }
}

document.addEventListener("tags:filtered", refreshYearGroups);
document.addEventListener("astro:page-load", refreshYearGroups);
