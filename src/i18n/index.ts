import type { UIStrings } from "./types";

export { tplStr } from "./format";

const modules = import.meta.glob<{ default: UIStrings }>("./lang/*.ts", {
  eager: true,
});

const translations: Record<string, UIStrings> = {};
for (const [path, mod] of Object.entries(modules)) {
  const locale = path.slice("./lang/".length, -".ts".length);
  translations[locale] = mod.default;
}

/**
 * Returns UI strings for the given interface language.
 *
 * Falls back to English when the locale is unknown.
 */
export function useTranslations(locale: string = "zh-CN"): UIStrings {
  return translations[locale] ?? translations["en"];
}

/**
 * Locales that ship with the site.
 */
export const availableLocales = Object.keys(translations);

/**
 * The locale used when the visitor has no stored preference.
 */
export const defaultLocale = "zh-CN";

/**
 * Runtime dictionary used by the client-side language switcher.
 *
 * Serialized from the very same source files as `useTranslations`, so there is
 * exactly one place where a UI string is defined. The server renders the
 * default locale, and this dictionary lets the browser swap the text without
 * a page reload.
 */
export const runtimeTranslations: Record<string, UIStrings> = translations;

/**
 * The runtime dictionary flattened to `{"locale": {"dotted.key": "value"}}`.
 *
 * Both the inline FOUC-prevention script and the runtime switcher work with
 * dotted keys, so they share this single flattened structure.
 */
export const flatRuntimeTranslations: Record<
  string,
  Record<string, string>
> = Object.fromEntries(
  Object.entries(translations).map(([locale, dict]) => [
    locale,
    flattenDict(dict as unknown),
  ])
);

function flattenDict(source: unknown, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof source === "string") {
    result[prefix] = source;
    return result;
  }
  if (source && typeof source === "object") {
    for (const [key, value] of Object.entries(
      source as Record<string, unknown>
    )) {
      const path = prefix ? `${prefix}.${key}` : key;
      Object.assign(result, flattenDict(value, path));
    }
  }
  return result;
}
