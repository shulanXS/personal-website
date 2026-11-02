/**
 * The numbers that describe a work, on the writing page.
 *
 * The character count of a work is written for the interface language:
 * Chinese groups a count by ten thousands ("2.6 万"), English separates it
 * by thousands ("26,000"). The server renders it in the language the page
 * was built in, so it has to be rebuilt when the visitor switches the
 * language.
 *
 * The raw value travels along in the attribute, so no extra data has to be
 * sent to the browser.
 */

/**
 * The layout of the character count.
 *
 * The unit belongs to the count itself rather than to the markup around
 * it, because the two languages write it differently: Chinese groups a
 * count by ten thousands ("2.6 万字"), English separates it by thousands
 * ("26,000 characters").
 */
function formatCharacterCount(count: number, uiLang: string): string {
  if (uiLang === "zh-CN") {
    if (count >= 10000) {
      const tens = count / 10000;
      // One decimal place is enough to be useful and not enough to be noisy.
      return `${Math.round(tens * 10) / 10} 万字`;
    }
    return `${count} 字`;
  }
  return `${count.toLocaleString("en-US")} characters`;
}

/*
 * The group of a work disappears when the tag filter has hidden every
 * work in it.
 *
 * A group is a heading with a list under it. When the filter leaves the
 * list empty, the heading is left describing nothing — a title over a
 * blank space — so the whole group is hidden instead.
 */
function hideEmptyGroups(): void {
  for (const group of document.querySelectorAll<HTMLElement>(
    "[data-writing-group]"
  )) {
    const rows = group.querySelectorAll<HTMLElement>(".app-writing-row");
    const anyVisible = [...rows].some(row => !row.hidden);
    group.hidden = rows.length > 0 && !anyVisible;
  }
}

/**
 * Hides the groups whose entries have all been filtered away.
 *
 * Exported so that the page can call it when the tag filter has run.
 */
export function hideEmptyWritingGroups(): void {
  hideEmptyGroups();
}

/**
 * Rebuilds the character counts of the writing page.
 */
export function refreshWritingMeta(): void {
  const uiLang = document.documentElement.lang || "zh-CN";

  // The count in the heading of a series, which says "about" as well.
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-writing-characters-about]"
  )) {
    const raw = Number(el.dataset.writingCharactersAbout);
    if (!Number.isFinite(raw)) continue;

    const count = formatCharacterCount(raw, uiLang);
    // The Chinese layout puts "约" in front of the count; the English one
    // does not, so the word is part of what is written rather than of the
    // markup.
    const text = uiLang === "zh-CN" ? `约 ${count}` : `about ${count}`;
    if (text !== el.textContent?.trim()) el.textContent = text;
  }

  hideEmptyGroups();
}
