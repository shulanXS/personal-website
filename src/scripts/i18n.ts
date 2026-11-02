import { flatRuntimeTranslations, defaultLocale } from "@/i18n";
import { formatTemplate } from "@/i18n/format";
import { refreshDates } from "@/scripts/dateFormat";

const STORAGE_KEY = "uiLang";

const flatDictionaries = flatRuntimeTranslations;

/**
 * Reads the stored interface language, falling back to the default locale.
 *
 * `localStorage` is the source of truth: the visitor's explicit choice has to
 * survive every client-side navigation. The inline script in `Layout.astro`
 * exposes the value it resolved before the first paint as `window.__uiLang`,
 * which is only a fallback for the very first visit (when no choice has been
 * stored yet).
 */
export function getStoredLang(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in flatDictionaries) return stored;
  } catch {
    // localStorage may be unavailable (private mode, disabled cookies).
  }

  const injected = (window as unknown as { __uiLang?: string }).__uiLang;
  if (injected && injected in flatDictionaries) return injected;

  return defaultLocale;
}

/**
 * Applies the given locale to every element carrying a `data-i18n` marker.
 *
 * Elements are marked in one of two ways:
 * - `data-i18n="key"` — the *text content* of the element is replaced.
 * - `data-i18n="key" data-i18n-attr="aria-label"` — the named attribute is
 *   replaced instead, leaving the element's children alone. Multiple
 *   attributes can be listed separated by commas, e.g.
 *   `data-i18n-attr="title,aria-label"`.
 *
 * When replacing text content we only touch the element's own text nodes so
 * that icons and other nested elements inside the marker survive the swap.
 */
export function applyLang(locale: string): void {
  const dict = flatDictionaries[locale];
  if (!dict) return;

  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = element.dataset.i18n;
    if (!key) continue;
    const value = resolveValue(dict, key, element);
    if (value === undefined) continue;

    const attrs = element.dataset.i18nAttr;
    if (attrs) {
      applyAttrs(element, attrs, value);
    } else {
      setTextContent(element, value);
    }
  }

  document.documentElement.lang = locale;
}

/**
 * Resolves a dictionary entry, filling in the placeholders of a template.
 *
 * The placeholders are filled by `formatTemplate`, which knows the two
 * conventions: a dotted path names another entry of the dictionary, a
 * numeric one is a value the element supplies in `data-i18n-args`.
 */
function resolveValue(
  dict: Record<string, string>,
  key: string,
  element?: HTMLElement
): string | undefined {
  const template = dict[key];
  if (template === undefined) return undefined;

  const args = element?.dataset.i18nArgs;
  const values = args ? args.split(",").map(v => v.trim()) : [];

  return formatTemplate(template, dict, values);
}

/**
 * Writes the translated value into every attribute listed in `data-i18n-attr`.
 *
 * The list is comma separated, so a single marker can keep both the `title`
 * tooltip and the `aria-label` in sync with the active language.
 */
function applyAttrs(element: HTMLElement, attrs: string, value: string): void {
  for (const attr of attrs
    .split(",")
    .map(a => a.trim())
    .filter(Boolean)) {
    element.setAttribute(attr, value);
  }
}

/**
 * Replaces the text of an element without discarding its child elements.
 *
 * `textContent` would also remove icons that are nested inside the marked
 * element (e.g. the arrow next to the "Back to top" label), so the existing
 * text nodes are rewritten instead.
 *
 * Resolution order:
 * 1. A descendant marked with `data-i18n-text` — the explicit label element.
 * 2. The element's own text nodes — the label is written directly into the
 *    element.
 * 3. Otherwise a new text node is appended, so that nested elements
 *    (icons) survive.
 */
function setTextContent(element: HTMLElement, value: string): void {
  const explicitLabel = element.querySelector<HTMLElement>("[data-i18n-text]");
  if (explicitLabel) {
    explicitLabel.textContent = value;
    return;
  }

  const textNodes = Array.from(element.childNodes).filter(
    node => node.nodeType === Node.TEXT_NODE
  ) as Text[];

  if (textNodes.length === 0) {
    // The label is produced entirely by child elements. Append a text node
    // instead of replacing the content, so the children are kept.
    element.appendChild(document.createTextNode(value));
    return;
  }

  // The first text node carries the label, the rest are whitespace.
  textNodes[0].nodeValue = value;
  for (const node of textNodes.slice(1)) {
    node.nodeValue = "";
  }
}

/**
 * Switches the interface language and persists the choice.
 */
export function setLang(locale: string): void {
  if (!(locale in flatDictionaries)) return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures — the language still switches for this page view.
  }

  // Keep the in-memory value in sync with the stored preference. Without
  // this, the inline head script of the *next* page would resolve the
  // language from a stale `window.__uiLang` value.
  (window as unknown as { __uiLang?: string }).__uiLang = locale;

  applyLang(locale);
  syncToggleState(locale);
  refreshDates(locale);

  // Let components that render their own copy (e.g. the Pagefind widget)
  // know that the interface language changed.
  document.dispatchEvent(
    new CustomEvent("ui:langchange", { detail: { lang: locale } })
  );
}

/**
 * The language a toggle button switches *to*.
 *
 * The button always switches to the *other* available language, so its
 * target has to be recomputed whenever the active language changes — a
 * server-rendered target would stay frozen and make it impossible to switch
 * back.
 */
function getToggleTarget(current: string): string {
  const locales = Object.keys(flatDictionaries);
  if (locales.length < 2) return current;
  const index = locales.indexOf(current);
  return index === -1 ? locales[0] : locales[(index + 1) % locales.length];
}

function syncToggleState(locale: string): void {
  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-lang-target]"
  )) {
    const target = getToggleTarget(locale);

    button.dataset.langTarget = target;

    // The button shows the language it switches *to*. When the active
    // language changes, the label has to be updated to the other language.
    const label = flatDictionaries[locale]?.["a11y.langName." + target];
    if (label) {
      const labelNode = button.querySelector<HTMLElement>(
        "[data-lang-label-text]"
      );
      if (labelNode) labelNode.textContent = label;
      else button.textContent = label;
    }
  }
}

/**
 * Wires up the language toggle buttons.
 */
export function setupI18n(): void {
  const lang = getStoredLang();
  applyLang(lang);
  syncToggleState(lang);
  refreshDates(lang);

  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-lang-target]"
  )) {
    if (button.dataset.langBound === "true") continue;
    button.dataset.langBound = "true";
    button.addEventListener("click", () => {
      const target = button.dataset.langTarget;
      if (target) setLang(target);
    });
  }
}

// Apply on first load — the module is imported by the layout's body script,
// which runs before the first paint of the interactive page.
setupI18n();

// Re-apply after View Transitions navigation.
document.addEventListener("astro:after-swap", setupI18n);

// Apply the stored language to the incoming document *before* it is swapped
// in. Without this the new page is painted with the server-rendered language
// and only afterwards swapped to the stored one, which shows up as a flash.
document.addEventListener("astro:before-swap", event => {
  const newDocument = (event as { newDocument?: Document }).newDocument;
  if (!newDocument) return;

  const lang = getStoredLang();
  newDocument.documentElement.setAttribute("lang", lang);

  const dict = flatDictionaries[lang];
  if (!dict) return;

  for (const element of newDocument.querySelectorAll<HTMLElement>(
    "[data-i18n]"
  )) {
    const key = element.dataset.i18n;
    if (!key) continue;
    const value = resolveValue(dict, key, element);
    if (value === undefined) continue;

    const attrs = element.dataset.i18nAttr;
    if (attrs) {
      applyAttrs(element, attrs, value);
    } else {
      setTextContent(element, value);
    }
  }
});
