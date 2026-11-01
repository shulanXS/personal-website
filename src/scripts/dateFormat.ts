/**
 * Client-side date formatting that follows the interface language.
 *
 * The server renders the dates in the default interface language. When the
 * visitor switches the language, the dates have to be re-rendered as well,
 * otherwise a Chinese date would remain on an English page.
 *
 * The raw timestamp is carried along in the `data-date` attribute, so no
 * extra data has to be sent to the browser.
 */

/**
 * The date layout each language conventionally uses.
 *
 * The time is rendered down to the minute, matching the server-side format.
 */
const DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  "zh-CN": {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  },
  en: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  },
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(uiLang: string, timeZone?: string): Intl.DateTimeFormat {
  const cacheKey = `${uiLang}|${timeZone ?? ""}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    // `zh-CN` is a valid BCP-47 tag, `en` resolves to the default English
    // locale. Unknown languages fall back to English.
    const locale = uiLang in DATE_FORMATS ? uiLang : "en";
    formatter = new Intl.DateTimeFormat(locale, {
      ...(DATE_FORMATS[uiLang] ?? DATE_FORMATS.en),
      // The dates have to be rendered in the site's timezone, not in the
      // visitor's — otherwise the day can differ from the server-rendered one.
      ...(timeZone ? { timeZone } : {}),
    });
    formatterCache.set(cacheKey, formatter);
  }
  return formatter;
}

/**
 * Formats a timestamp for the given interface language.
 *
 * The Chinese layout puts the year first ("2026年6月3日 14:05"), the English
 * one puts the day first ("Jun 3, 2026, 14:05").
 */
export function formatDateForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = getFormatter(uiLang, timeZone).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  const day = lookup("day");
  const month = lookup("month");
  const year = lookup("year");
  const hour = lookup("hour");
  const minute = lookup("minute");

  // Some locales emit a literal separator between the date and the time.
  // Stripping it keeps the two layouts byte-identical to the server output.
  const time = `${hour}:${minute}`;

  if (uiLang === "zh-CN") {
    return `${year}年${month}月${day}日 ${time}`;
  }
  return `${day} ${month}, ${year}, ${time}`;
}

/**
 * The timezone the site renders its dates in.
 *
 * It is written onto `<html data-timezone>` by the layout, so the client can
 * format dates exactly like the server does.
 */
function getSiteTimezone(): string | undefined {
  return document.documentElement.dataset.timezone || undefined;
}

/**
 * Re-renders every element carrying a `data-date` attribute.
 *
 * Elements that do not carry the attribute are left untouched.
 */
export function refreshDates(uiLang: string): void {
  const timeZone = getSiteTimezone();

  for (const el of document.querySelectorAll<HTMLElement>("[data-date]")) {
    const iso = el.dataset.date;
    if (!iso) continue;
    const formatted = formatDateForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  // The timeline carries the date in a narrow column, so it uses the compact
  // layout and is marked separately.
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-compact]"
  )) {
    const iso = el.dataset.dateCompact;
    if (!iso) continue;
    const formatted = formatCompactDateForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  /*
  The notes timeline stacks the day and the moment of the day into two
  separate elements, because its date column is narrower than a full
  timestamp. Each element is rewritten on its own.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-stacked]"
  )) {
    const iso = el.dataset.dateStacked;
    if (!iso) continue;
    const formatted = formatStackedDateForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-stacked-time]"
  )) {
    const iso = el.dataset.dateStackedTime;
    if (!iso) continue;
    const formatted = formatStackedTimeForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }
}

/**
 * Formats a timestamp in the compact layout of the notes timeline.
 *
 * The numeric form is the same in every language, so no locale-specific
 * parts have to be assembled here. The time is carried down to the minute,
 * matching the server-rendered layout.
 */
export function formatCompactDateForLang(
  iso: string,
  _uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  return `${lookup("year")}.${lookup("month")}.${lookup("day")} ${lookup("hour")}:${lookup("minute")}`;
}

/**
 * Formats the day of a timestamp in the stacked layout of the notes timeline.
 *
 * The numeric form is the same in every language, so no locale-specific
 * parts have to be assembled here.
 */
export function formatStackedDateForLang(
  iso: string,
  _uiLang: string,
  timeZone?: string
): string {
  const parts = getStackedParts(iso, timeZone);
  if (!parts) return iso;
  return `${parts.year}.${parts.month}.${parts.day}`;
}

/**
 * Formats the moment of the day in the stacked layout of the notes timeline.
 */
export function formatStackedTimeForLang(
  iso: string,
  _uiLang: string,
  timeZone?: string
): string {
  const parts = getStackedParts(iso, timeZone);
  if (!parts) return iso;
  return `${parts.hour}:${parts.minute}`;
}

/**
 * Splits a timestamp into the parts the stacked layout needs.
 */
function getStackedParts(
  iso: string,
  timeZone?: string
): Record<string, string> | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour: lookup("hour"),
    minute: lookup("minute"),
  };
}
