/**
 * The order of the works that stand on their own.
 *
 * The works of a series have an order of their own — the order they are
 * read in — and that order is not a choice. The stand-alone works have
 * no such order, so the reader is offered one: the newest first, which
 * is the order the page is written in, or by the score, for a reader who
 * wants the best of them first.
 *
 * The order is kept in the URL under `?sort=`, so that a page that has
 * been ordered can be shared and survives a reload.
 *
 * The works are moved in the DOM rather than re-rendered: the page is
 * written by the server, and re-ordering the rows the server produced
 * keeps the markup of each row exactly as it was written — including the
 * text that the language switcher rewrites.
 */

/**
 * The orders the works can be put in.
 */
type SortOrder = "newest" | "highest" | "lowest";

const SORT_ORDERS: SortOrder[] = ["newest", "highest", "lowest"];

let order: SortOrder = "newest";

/**
 * Reads the order out of the URL.
 *
 * An order that is not one of the known ones is ignored: a URL that has
 * been edited by hand should not be able to put the page into a state
 * it cannot get out of.
 */
function readOrder(): SortOrder {
  const value = new URL(window.location.href).searchParams.get("sort");
  return SORT_ORDERS.includes(value as SortOrder)
    ? (value as SortOrder)
    : "newest";
}

/**
 * Writes the order into the URL.
 */
function syncUrl(next: SortOrder): void {
  const url = new URL(window.location.href);

  if (next === "newest") url.searchParams.delete("sort");
  else url.searchParams.set("sort", next);

  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * The score of a work, if it has one.
 */
function ratingOf(element: HTMLElement): number | undefined {
  const raw = element.dataset.writingRating;
  if (raw === undefined || raw === "") return undefined;
  const value = Number.parseFloat(raw);
  return Number.isNaN(value) ? undefined : value;
}

/**
 * The order the rows are in when nothing is chosen.
 *
 * It is the order the server wrote them in, which is the newest first.
 * The rows are marked with their place so that the order survives the
 * rows being moved around: without it, a work that has no score would
 * have nowhere to go back to.
 */
function markOriginalOrder(rows: HTMLElement[]): void {
  for (const [index, row] of rows.entries()) {
    if (!row.dataset.writingOrder) row.dataset.writingOrder = String(index);
  }
}

/**
 * The place a row had when the page was written.
 */
function originalIndex(row: HTMLElement): number {
  const raw = row.dataset.writingOrder;
  const value = raw === undefined ? 0 : Number.parseInt(raw, 10);
  return Number.isNaN(value) ? 0 : value;
}

/**
 * The two orders that put the works by their score.
 *
 * A work with no score has nothing to be compared with, so it goes to
 * the end of the list rather than to the top or the bottom of it: it is
 * neither the best nor the worst, it is simply not ranked.
 *
 * The tie-break is the original order, so that two works with the same
 * score keep the order the page was written in.
 */
function byRating(rows: HTMLElement[], descending: boolean): HTMLElement[] {
  return [...rows].sort((a, b) => {
    const ratingA = ratingOf(a);
    const ratingB = ratingOf(b);

    if (ratingA === undefined && ratingB === undefined) {
      return originalIndex(a) - originalIndex(b);
    }

    // A work with no score is not ranked: it goes after the ranked ones.
    if (ratingA === undefined) return 1;
    if (ratingB === undefined) return -1;

    if (ratingB !== ratingA) {
      return descending ? ratingB - ratingA : ratingA - ratingB;
    }

    return originalIndex(a) - originalIndex(b);
  });
}

/**
 * Puts the works in the chosen order.
 */
function applySort(): void {
  const list = document.querySelector<HTMLElement>("[data-writing-sort-list]");
  if (!list) return;

  const rows = [...list.querySelectorAll<HTMLElement>(".app-writing-row")];
  markOriginalOrder(rows);

  const activeOrder =
    new URL(window.location.href).searchParams.get("type") === "review"
      ? order
      : "newest";

  let sorted: HTMLElement[];
  if (activeOrder === "highest") sorted = byRating(rows, true);
  else if (activeOrder === "lowest") sorted = byRating(rows, false);
  else sorted = [...rows].sort((a, b) => originalIndex(a) - originalIndex(b));

  for (const row of sorted) list.appendChild(row);
}

/**
 * Marks the order that is currently chosen.
 */
function syncSortOptions(): void {
  for (const option of document.querySelectorAll<HTMLElement>(
    "[data-writing-sort-value]"
  )) {
    const value = option.dataset.writingSortValue ?? "";
    const isActive = value === order;
    option.classList.toggle("app-writing-sort-option-active", isActive);
    option.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

/**
 * Handles a click on one of the orders.
 */
function handleSortClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  const option = target?.closest<HTMLElement>("[data-writing-sort-value]");
  if (!option) return;

  const value = option.dataset.writingSortValue ?? "";
  if (!SORT_ORDERS.includes(value as SortOrder)) return;

  order = value as SortOrder;

  syncUrl(order);
  syncSortOptions();
  applySort();
}

/**
 * Applies the order that the URL asks for.
 */
function applySortFromUrl(): void {
  order = readOrder();
  syncSortOptions();
  applySort();
}

/**
 * Sets the order of the works up.
 */
export function setupWritingSort(): void {
  document.addEventListener("click", handleSortClick);
  document.addEventListener("writing:filtered", applySort);
  document.addEventListener("astro:page-load", applySortFromUrl);
  document.addEventListener("astro:after-swap", applySortFromUrl);
}
