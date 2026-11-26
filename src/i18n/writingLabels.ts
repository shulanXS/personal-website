import english from "./writing-en.json";

const labels: Record<string, string> = english;

/** Bilingual labels are rendered with the page; filter values stay canonical. */
export function writingLabel(
  source: string | null | undefined,
  attribute?: string,
  prefix = "",
  suffix = ""
) {
  if (!source || !Object.hasOwn(labels, source)) return {};
  return {
    "data-label-zh": prefix + source + suffix,
    "data-label-en": prefix + labels[source] + suffix,
    "data-label-attr": attribute,
  };
}
