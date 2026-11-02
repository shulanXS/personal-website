/**
 * The filter of the writing page.
 *
 * The writing collection is filtered in levels rather than by one flat row
 * of tags: a piece of writing is a novel, an essay or a short story, and
 * it either belongs to a series or stands on its own. The levels are the
 * shape of the collection itself.
 *
 * Two of the three levels are handled here — the kind of the work and the
 * work itself. The third level, the free-form tags, is handled by the
 * ordinary tag filter (`scripts/tagFilter.ts`), because a tag means the
 * same thing on this page as it does everywhere else. That filter writes
 * its state into the URL under `?tag=`, and this one writes its state
 * under `?type=` and `?work=`, so the two can be used together.
 *
 * The levels narrow each other: choosing a kind narrows the works below
 * it, and choosing a work narrows the kinds above it to the one it
 * belongs to. The reader is never offered a combination that does not
 * exist.
 */

/**
 * The state of the filter.
 *
 * It is kept in one place, because the levels are not independent: the
 * work level is a function of the type level, and the type level is
 * narrowed by the work level.
 */
type FilterState = {
  type: string;
  work: string;
};

let state: FilterState = { type: "", work: "" };

/**
 * Reads the state out of the URL.
 */
function readState(): FilterState {
  const params = new URL(window.location.href).searchParams;
  return {
    type: params.get("type") ?? "",
    work: params.get("work") ?? "",
  };
}

/**
 * Writes the state into the URL.
 *
 * The state is kept in the address bar so that a filtered page can be
 * shared and so that a reload keeps the filter.
 */
function syncUrl(next: FilterState): void {
  const url = new URL(window.location.href);

  if (next.type) url.searchParams.set("type", next.type);
  else url.searchParams.delete("type");

  if (next.work) url.searchParams.set("work", next.work);
  else url.searchParams.delete("work");

  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * The kind of a row or of a group, as the markup records it.
 */
function typeOf(element: HTMLElement): string {
  return element.dataset.writingType ?? "";
}

/**
 * The work a row or a group belongs to.
 */
function workOf(element: HTMLElement): string {
  return element.dataset.writingWork ?? "";
}

/**
 * The slugs of the tags an entry carries.
 */
function slugsOf(element: HTMLElement): string[] {
  return (element.dataset.tags ?? "")
    .split(",")
    .map(slug => slug.trim())
    .filter(Boolean);
}

/**
 * The tag the URL asks for.
 *
 * The tag filter owns the tag, so it is read from the URL rather than
 * from a state of its own here — the two filters narrow each other and
 * have to agree about what is chosen.
 */
function activeTag(): string {
  return new URL(window.location.href).searchParams.get("tag") ?? "";
}

/**
 * Whether an entry passes the current filter.
 */
function matches(element: HTMLElement): boolean {
  if (state.type && typeOf(element) !== state.type) return false;
  if (state.work && workOf(element) !== state.work) return false;

  const tag = activeTag();
  if (tag && !slugsOf(element).includes(tag)) return false;

  return true;
}

/**
 * Hides the entries that do not pass the filter.
 *
 * The groups are hidden with them: a group whose entries are all hidden
 * would leave a title over a blank space. The card of a series follows
 * its group, for the same reason — a card with no chapters beside it
 * would be a picture of a book with nothing to read.
 */
function applyFilter(): void {
  const rows = [...document.querySelectorAll<HTMLElement>(".app-writing-row")];

  for (const row of rows) {
    row.hidden = !matches(row);
  }

  for (const group of document.querySelectorAll<HTMLElement>(
    "[data-writing-group]"
  )) {
    const groupRows = [
      ...group.querySelectorAll<HTMLElement>(".app-writing-row"),
    ];
    const anyVisible = groupRows.some(row => !row.hidden);

    group.hidden = groupRows.length > 0 && !anyVisible;

    for (const card of group.querySelectorAll<HTMLElement>(
      ".app-writing-card"
    )) {
      card.hidden = !anyVisible;
    }
  }

  syncEmptyState(rows);
  syncOptions();
}

/**
 * The message that says that nothing matched.
 *
 * The tag filter owns this message, but it only knows about the tag: a
 * combination of a kind and a tag can come out empty even when the tag
 * alone matches something. So the message is set here, after both filters
 * have run, from the number of rows that are actually on the page.
 */
function syncEmptyState(rows: HTMLElement[]): void {
  const empty = document.querySelector<HTMLElement>("[data-tag-empty]");
  if (!empty) return;

  const anyVisible = rows.some(row => !row.hidden);
  const filtering = !!(state.type || state.work || activeTag());

  empty.hidden = !(filtering && !anyVisible);
}

/**
 * Marks the option of every level that is currently active.
 *
 * An option of the work level that belongs to another kind is dimmed
 * rather than hidden: the list stays the same length, so the level does
 * not jump about while the reader is choosing.
 */
function syncOptions(): void {
  for (const option of document.querySelectorAll<HTMLElement>(
    "[data-writing-facet]"
  )) {
    const facet = option.dataset.writingFacet;
    const value = option.dataset.writingValue ?? "";

    const isActive =
      facet === "type" ? state.type === value : state.work === value;

    option.classList.toggle("app-writing-filter-option-active", isActive);
    option.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
}

/**
 * The works that belong to the chosen kind.
 *
 * The kind decides which of the works can be chosen, so the options that
 * do not fit are dimmed and cannot be pressed.
 */
function syncWorkLevel(): void {
  for (const option of document.querySelectorAll<HTMLButtonElement>(
    '[data-writing-facet="work"]'
  )) {
    const value = option.dataset.writingValue ?? "";

    // The option that clears the level is always available.
    if (!value) continue;

    const workType = option.dataset.writingWorkType ?? "";
    const fits = !state.type || workType === state.type;
    option.classList.toggle("app-writing-filter-option-dim", !fits);
    option.disabled = !fits;
  }
}

/**
 * Handles a click on one of the options of the filter.
 */
function handleClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  const option = target?.closest<HTMLElement>("[data-writing-facet]");
  if (!option) return;

  const facet = option.dataset.writingFacet;
  const value = option.dataset.writingValue ?? "";

  if (facet === "type") {
    // Choosing the kind that is already chosen clears it.
    state.type = state.type === value ? "" : value;

    /*
     * The chosen kind narrows the works below it. If the chosen work
     * belongs to another kind, it is dropped — the filter would otherwise
     * show nothing at all, with no way to tell why.
     */
    if (state.type && state.work) {
      const workOption = document.querySelector<HTMLElement>(
        `[data-writing-facet="work"][data-writing-value="${CSS.escape(
          state.work
        )}"]`
      );
      if (workOption && workOption.dataset.writingWorkType !== state.type) {
        state.work = "";
      }
    }
  } else if (facet === "work") {
    state.work = state.work === value ? "" : value;
  }

  syncUrl(state);
  syncWorkLevel();
  applyFilter();
}

/**
 * Applies the filter that the URL asks for.
 */
function applyFromUrl(): void {
  state = readState();
  syncWorkLevel();
  applyFilter();
}

/**
 * Handles a click on the button that clears the filter.
 *
 * On this page the filter has three levels, so the button has to clear
 * all of them: leaving the kind or the work chosen would keep the page
 * empty, and the reader would be pressing the button without anything
 * happening.
 *
 * The tag is cleared by the ordinary tag filter, which owns it.
 */
function handleEmptyResetClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (!target?.closest<HTMLElement>("[data-tag-empty-reset]")) return;

  event.preventDefault();

  state = { type: "", work: "" };

  syncUrl(state);
  syncWorkLevel();
  applyFilter();
}

document.addEventListener("click", handleClick);
document.addEventListener("click", handleEmptyResetClick);

document.addEventListener("astro:page-load", applyFromUrl);
document.addEventListener("astro:after-swap", applyFromUrl);

/*
 * The tag filter runs on its own and fires this event when it has
 * finished. The writing filter has to run again afterwards, because the
 * two narrow each other.
 */
document.addEventListener("tags:filtered", () => applyFilter());
