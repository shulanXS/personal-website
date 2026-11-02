/**
 * String helpers for the interface dictionary.
 */

/**
 * Replaces `{{key}}` placeholders in a UI string.
 *
 * Translators can reorder placeholders freely within the sentence.
 */
export function tplStr(
  template: string,
  vars: Record<string, string | number>
): string {
  return interpolate(template, key => {
    const value = vars[key];
    return value !== undefined && value !== null ? String(value) : undefined;
  });
}

/**
 * Replaces `{{key}}` placeholders, resolving each key through `resolve`.
 *
 * `resolve` returns `undefined` for a key it does not know, and the
 * placeholder is then left empty — a template that names a missing entry
 * shows a gap rather than a literal `{{missing}}`.
 */
export function interpolate(
  template: string,
  resolve: (key: string) => string | undefined
): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_, key: string) => {
    const value = resolve(key);
    return value !== undefined && value !== null ? value : "";
  });
}

/**
 * Fills a template from the flattened dictionary and from a list of values.
 *
 * Two kinds of placeholder are recognised:
 *
 * - `{{nav.posts}}` — a *dotted* path names another entry of the
 *   dictionary. A composed string is therefore assembled from the words of
 *   the active language rather than from a snapshot taken when the page was
 *   rendered.
 * - `{{0}}`, `{{1}}` — a *numeric* placeholder is a value the caller
 *   supplies, listed in order. A supplied value that names an entry of
 *   the dictionary — `pages.postsTitle` — is looked up in it, so that a
 *   composed string is never frozen in the language of the build.
 *
 * The same function is used by the server (to render the page) and by the
 * runtime switcher (to re-render it in another language), so the two can
 * never disagree about how a composed string is built.
 *
 * @param template the template string, e.g. `"{{nav.posts}} (page {{0}})"`
 * @param dict the flattened dictionary of the active language
 * @param args the values for the numeric placeholders, in order
 */
export function formatTemplate(
  template: string,
  dict: Record<string, string>,
  args: string[] = []
): string {
  return interpolate(template, name => {
    if (name.includes(".")) return dict[name];

    const index = Number(name);
    if (!Number.isInteger(index)) return undefined;

    const arg = args[index];
    if (arg === undefined) return undefined;

    // An argument that names an entry of the dictionary is resolved in it,
    // so that the composed string follows the active language.
    return arg.includes(".") ? (dict[arg] ?? arg) : arg;
  });
}
