/**
 * Cross-collection tag filtering.
 *
 * Tags are embedded into every listing (blog posts, notes, literary works
 * and projects). Clicking a tag has two possible meanings, depending on
 * where the click happened:
 *
 * - On a listing page the page filters itself: only the entries carrying
 *   the tag stay visible. This is instant and keeps the reader in context.
 * - On the search page the tag drives a site-wide search: every entry of
 *   all four collections carrying the tag is listed, grouped by collection.
 *
 * The script is registered on `document` rather than on the individual
 * elements, so it survives View Transitions navigation without having to be
 * re-bound on every page load.
 */

import { flatRuntimeTranslations, defaultLocale } from "@/i18n";

/** The collections a tag result can belong to, in display order. */
const SOURCE_ORDER = ["posts", "notes", "writing", "projects"] as const;

type Source = (typeof SOURCE_ORDER)[number];

type IndexedItem = {
  title: string;
  url: string;
  date: string;
  description?: string;
  tags: string[];
  tagSlugs: string[];
  source: Source;
};

type TagInfo = {
  slug: string;
  name: string;
  counts: Record<Source, number>;
  total: number;
};

type TagIndex = {
  tags: TagInfo[];
  items: IndexedItem[];
};

/**
 * The translation keys used by the generated markup.
 *
 * The strings are read from the runtime dictionary so that the results
 * follow the interface language, exactly like the rest of the page.
 */
const SOURCE_LABEL_KEYS: Record<Source, string> = {
  posts: "nav.posts",
  notes: "nav.notes",
  writing: "nav.writing",
  projects: "nav.projects",
};

let index: TagIndex | null = null;

/**
 * Reads the tag index that the page embeds as a JSON script block.
 */
function readIndex(): TagIndex | null {
  const element = document.getElementById("tag-index");
  if (!element?.textContent) return null;

  try {
    return JSON.parse(element.textContent) as TagIndex;
  } catch {
    // A malformed index must not break the page — the tag bar simply stops
    // producing grouped results.
    return null;
  }
}

/**
 * Translates a key using the runtime dictionary of the active language.
 *
 * The dictionary is imported rather than read from the DOM, so the generated
 * markup follows the interface language exactly like the rest of the page.
 */
function translate(key: string): string {
  const lang = document.documentElement.lang || defaultLocale;
  const dict =
    flatRuntimeTranslations[lang] ?? flatRuntimeTranslations[defaultLocale];
  return dict?.[key] ?? key;
}

/**
 * The tag slugs an entry carries.
 */
function slugsOf(element: HTMLElement): string[] {
  return (element.dataset.tags ?? "")
    .split(",")
    .map(slug => slug.trim())
    .filter(Boolean);
}

/**
 * Filters the entries of the current listing page.
 *
 * An empty slug resets the filter and shows everything again.
 */
function applyCollectionFilter(slug: string): void {
  const items = document.querySelectorAll<HTMLElement>("[data-tagged-item]");
  let visible = 0;

  for (const item of items) {
    const matches = !slug || slugsOf(item).includes(slug);
    item.hidden = !matches;
    if (matches) visible += 1;
  }

  // The empty-state message is only shown when a filter is active and
  // nothing matched it.
  for (const empty of document.querySelectorAll<HTMLElement>(
    "[data-tag-empty]"
  )) {
    empty.hidden = !(slug && visible === 0);
  }

  syncActiveChips(slug);
}

/**
 * The other pages of the current collection.
 *
 * A paginated listing only renders one page of entries, so a tag whose
 * matches all live on page 3 would show an empty page. To avoid that, the
 * sibling pages are fetched in the background and merged into the listing
 * when a filter is active.
 */
function siblingPageUrls(): string[] {
  const container = document.querySelector<HTMLElement>("[data-list-pages]");
  if (!container) return [];

  const raw = container.dataset.listPages ?? "";
  return raw
    .split(",")
    .map(url => url.trim())
    .filter(Boolean);
}

/**
 * Fetches a sibling page and extracts its tagged entries.
 */
async function fetchTaggedItems(
  url: string
): Promise<{ tags: string; title: string; url: string; date: string }[]> {
  const response = await fetch(url);
  if (!response.ok) return [];

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  return [...doc.querySelectorAll<HTMLElement>("[data-tagged-item]")].map(
    item => ({
      tags: item.dataset.tags ?? "",
      title:
        item.querySelector("h2, h3")?.textContent?.trim() ??
        item.textContent?.trim().slice(0, 40) ??
        "",
      url: item.querySelector("a")?.getAttribute("href") ?? "",
      date: item.querySelector("[data-date]")?.textContent?.trim() ?? "",
    })
  );
}

/**
 * Renders the entries of a sibling page into the current listing.
 */
function appendSiblingItems(
  items: { tags: string; title: string; url: string; date: string }[]
): void {
  const list = document.querySelector<HTMLElement>("ul[data-list-layout]");
  if (!list) return;

  for (const item of items) {
    if (list.querySelector(`a[href="${item.url}"]`)) continue;

    const li = document.createElement("li");
    li.className = "post-card";
    li.setAttribute("data-tagged-item", "");
    li.setAttribute("data-tags", item.tags);

    const link = document.createElement("a");
    link.href = item.url;
    link.className =
      "text-accent inline-block text-lg font-medium decoration-dashed underline-offset-4 hover:underline";
    link.textContent = item.title;
    li.appendChild(link);

    if (item.date) {
      const meta = document.createElement("span");
      meta.className = "text-muted-foreground block text-sm";
      meta.textContent = item.date;
      li.appendChild(meta);
    }

    list.appendChild(li);
    li.setAttribute("data-appended", "true");
  }
}

/**
 * Removes the entries that were merged in from the sibling pages.
 *
 * They are only needed while a filter is active. Once the filter is
 * cleared, the listing goes back to exactly the entries it was built with,
 * so that the pagination at the bottom stays truthful.
 */
function removeAppendedItems(): void {
  for (const item of document.querySelectorAll<HTMLElement>(
    "[data-appended]"
  )) {
    item.remove();
  }
}

/**
 * Loads the sibling pages of a paginated listing and re-applies the filter.
 *
 * The extra entries are appended to the listing and then hidden or shown
 * according to the active tag, so that the reader sees every entry of the
 * collection carrying the tag — not only the ones that happened to be on
 * this page.
 */
let siblingsLoaded = false;

async function loadSiblingsAndFilter(slug: string): Promise<void> {
  if (!slug) {
    // The filter was cleared — the listing returns to its original state.
    removeAppendedItems();
    applyCollectionFilter("");
    return;
  }

  if (siblingsLoaded) {
    applyCollectionFilter(slug);
    return;
  }

  siblingsLoaded = true;

  const urls = siblingPageUrls();
  if (urls.length === 0) {
    applyCollectionFilter(slug);
    return;
  }

  try {
    const pages = await Promise.all(urls.map(fetchTaggedItems));
    for (const items of pages) appendSiblingItems(items);
  } catch {
    // The sibling pages could not be fetched — the current page still
    // filters correctly, which is the important part.
  }

  applyCollectionFilter(slug);
}

/**
 * Marks the chip of the active tag (and the "All" chip) as selected.
 */
function syncActiveChips(slug: string): void {
  for (const chip of document.querySelectorAll<HTMLElement>(
    "[data-tag-chip]"
  )) {
    const isAll = chip.dataset.tagChip === "";
    const isActive = isAll ? !slug : chip.dataset.tagChip === slug;

    chip.classList.toggle("border-accent", isActive && !isAll);
    chip.classList.toggle("bg-accent/10", isActive && !isAll);
    chip.classList.toggle("text-accent", isActive);
    chip.classList.toggle("border-border", !isActive && !isAll);

    if (chip.getAttribute("aria-pressed") !== null) {
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }
}

/**
 * Renders the site-wide results of a tag, grouped by collection.
 */
function renderSearchResults(slug: string): void {
  const container = document.getElementById("tag-results");
  if (!container) return;

  if (!slug) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }

  if (!index) index = readIndex();

  const tag = index?.tags.find(entry => entry.slug === slug);
  const matches = (index?.items ?? []).filter(item =>
    item.tagSlugs.includes(slug)
  );

  container.hidden = false;

  if (!tag || matches.length === 0) {
    container.innerHTML = `<p class="text-muted-foreground" data-tag-no-results>${translate(
      "search.noTagResults"
    )}</p>`;
    return;
  }

  const groups = SOURCE_ORDER.map(source => ({
    source,
    items: matches
      .filter(item => item.source === source)
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  })).filter(group => group.items.length > 0);

  const parts: string[] = [];

  for (const group of groups) {
    parts.push(
      `<section class="tag-result-group" data-tag-group="${group.source}">` +
        `<h3 class="text-lg font-semibold tracking-wide">${translate(
          SOURCE_LABEL_KEYS[group.source]
        )}<span class="text-muted-foreground ml-2 text-sm font-normal">${group.items.length}</span></h3>` +
        `<ul class="border-border mt-3 border-t">` +
        group.items
          .map(item => {
            const title = item.url
              ? `<a href="${item.url}" class="text-accent decoration-dashed underline-offset-4 hover:underline">${escapeHtml(
                  item.title
                )}</a>`
              : `<span class="text-accent">${escapeHtml(item.title)}</span>`;
            const description = item.description
              ? `<p class="text-muted-foreground mt-1 text-sm">${escapeHtml(
                  item.description
                )}</p>`
              : "";
            return `<li class="border-border border-b py-4 last:border-b-0">${title}${description}</li>`;
          })
          .join("") +
        `</ul>` +
        `</section>`
    );
  }

  container.innerHTML = parts.join("");
}

/**
 * Escapes text before it is written into the markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Writes the active tag into the URL so that the state can be shared and
 * survives a reload.
 */
function syncUrl(slug: string): void {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set("tag", slug);
  else url.searchParams.delete("tag");
  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * Applies the tag that the URL asks for.
 */
function applyFromUrl(): void {
  const slug = new URL(window.location.href).searchParams.get("tag") ?? "";
  const scope = document.querySelector<HTMLElement>("[data-tag-scope]");

  if (scope?.dataset.tagScope === "search") {
    renderSearchResults(slug);
    syncActiveChips(slug);
  } else {
    void loadSiblingsAndFilter(slug);
  }
}

/**
 * Handles a click on a tag chip.
 */
function handleChipClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  const chip = target?.closest<HTMLElement>("[data-tag-chip]");
  if (!chip) return;

  // A chip in "link" mode is a real anchor — let the browser follow it.
  if (chip.dataset.tagMode === "link") return;

  event.preventDefault();

  const scope = document.querySelector<HTMLElement>("[data-tag-scope]");
  const isSearch = scope?.dataset.tagScope === "search";

  // Clicking the active tag clears the filter.
  const slug = chip.dataset.tagChip ?? "";
  const current = new URL(window.location.href).searchParams.get("tag") ?? "";
  const next = slug === current ? "" : slug;

  syncUrl(next);

  if (isSearch) {
    renderSearchResults(next);
    syncActiveChips(next);
  } else {
    void loadSiblingsAndFilter(next);
  }
}

// The listener lives on `document`, so it keeps working across View
// Transitions without being re-registered.
document.addEventListener("click", handleChipClick);

document.addEventListener("astro:page-load", applyFromUrl);
document.addEventListener("astro:after-swap", applyFromUrl);

// The grouped results are generated on the client, so they have to be
// rebuilt when the interface language changes.
document.addEventListener("ui:langchange", applyFromUrl);
