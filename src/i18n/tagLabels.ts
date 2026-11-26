import translations from "./tag-labels.json";

const labels: Record<string, string[]> = translations;

export function tagLabel(name: string, attribute?: string, prefix = "") {
  const pair = labels[name];
  if (!pair) return {};
  return {
    "data-label-zh": prefix + pair[0],
    "data-label-en": prefix + pair[1],
    "data-label-attr": attribute,
  };
}
