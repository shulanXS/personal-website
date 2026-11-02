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

/**
 * The day-only layout, used by the listings.
 *
 * A listing says *when* a work appeared, not *at what moment* — the exact
 * time belongs to the page of the work itself.
 */
const DAY_DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  "zh-CN": {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  },
  en: {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
};

/**
 * The month-and-day layout, used by the articles listing.
 *
 * The listing is grouped by year and the year is the heading of the group,
 * so the entries carry only the part that varies. The Chinese layout writes
 * the month and the day out in full ("5月17日"), matching the server; the
 * English one names the month ("May 17").
 */
const MONTH_DAY_DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  "zh-CN": {
    month: "numeric",
    day: "numeric",
  },
  en: {
    month: "short",
    day: "numeric",
  },
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(
  uiLang: string,
  timeZone?: string,
  options?: Intl.DateTimeFormatOptions,
  layout = "full"
): Intl.DateTimeFormat {
  const cacheKey = `${uiLang}|${timeZone ?? ""}|${layout}`;
  let formatter = formatterCache.get(cacheKey);
  if (!formatter) {
    // `zh-CN` is a valid BCP-47 tag, `en` resolves to the default English
    // locale. Unknown languages fall back to English.
    const locale = uiLang in DATE_FORMATS ? uiLang : "en";
    formatter = new Intl.DateTimeFormat(locale, {
      ...(options ?? DATE_FORMATS[uiLang] ?? DATE_FORMATS.en),
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
 * Formats a timestamp in the day-only layout of a listing.
 *
 * The Chinese layout puts the year first ("2026年10月26日"), the English
 * one puts the day first ("26 Oct, 2026").
 */
export function formatDayDateForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = getFormatter(
    uiLang,
    timeZone,
    DAY_DATE_FORMATS[uiLang] ?? DAY_DATE_FORMATS.en,
    "day"
  ).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  const day = lookup("day");
  const month = lookup("month");
  const year = lookup("year");

  if (uiLang === "zh-CN") {
    return `${year}年${month}月${day}日`;
  }
  return `${day} ${month}, ${year}`;
}

/**
 * Formats a timestamp in the month-and-day layout of the articles listing.
 *
 * The listing groups its entries by year, and the year is the heading of
 * the group — so an entry carries only the month and the day. The Chinese
 * layout writes them out in full ("5月17日"), the English one names the
 * month ("May 17").
 */
export function formatMonthDayDateForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = getFormatter(
    uiLang,
    timeZone,
    MONTH_DAY_DATE_FORMATS[uiLang] ?? MONTH_DAY_DATE_FORMATS.en,
    "monthDay"
  ).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  const month = lookup("month");
  const day = lookup("day");

  if (uiLang === "zh-CN") return `${month}月${day}日`;
  return `${month} ${day}`;
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

  // The listings show the day only — the moment of the day belongs to the
  // page of the work itself.
  for (const el of document.querySelectorAll<HTMLElement>("[data-date-day]")) {
    const iso = el.dataset.dateDay;
    if (!iso) continue;
    const formatted = formatDayDateForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  /*
  The articles listing groups its entries by year and writes the year as
  the heading of the group, so an entry carries only the month and the day.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-month-day]"
  )) {
    const iso = el.dataset.dateMonthDay;
    if (!iso) continue;
    const formatted = formatMonthDayDateForLang(iso, uiLang, timeZone);
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

  /*
  The notes wall writes the day in the margin of an entry and the counter
  that goes with it. The two are separate elements, so each is rewritten
  on its own.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-day-only]"
  )) {
    const iso = el.dataset.dateDayOnly;
    if (!iso) continue;
    const formatted = formatDayNumberForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-day-counter]"
  )) {
    const iso = el.dataset.dateDayCounter;
    if (!iso) continue;
    const formatted = formatDayCounterForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  /*
  The home page writes the whole date in one piece, because there is no
  month group there to carry the year and the month — so the date has to
  say them itself, and say them as one date.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-full]"
  )) {
    const iso = el.dataset.dateFull;
    if (!iso) continue;
    const formatted = formatDayDateForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-weekday]"
  )) {
    const iso = el.dataset.dateWeekday;
    if (!iso) continue;
    const formatted = formatWeekdayForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  /*
  The heading of a month group. The group itself is identified by its
  month, not by a date, so the heading carries the first moment of the
  month and is re-rendered from it.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-month-heading]"
  )) {
    const iso = el.dataset.dateMonthHeading;
    if (!iso) continue;
    const formatted = formatMonthHeadingForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }

  /*
  The month index uses the compact form of the month, which is numeric
  and therefore the same in every language. The home page writes the
  year and the month of a note with its day, in the same compact form.
  */
  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-date-month-label]"
  )) {
    const iso = el.dataset.dateMonthLabel;
    if (!iso) continue;
    const formatted = formatMonthLabelForLang(iso, uiLang, timeZone);
    if (formatted !== el.textContent?.trim()) el.textContent = formatted;
  }
}

/**
 * The day of the month, e.g. "19".
 */
export function formatDayNumberForLang(
  iso: string,
  _uiLang: string,
  timeZone?: string
): string {
  const parts = getStackedParts(iso, timeZone);
  if (!parts) return iso;
  return String(Number(parts.day));
}

/**
 * The counter that goes with the day, e.g. "号".
 *
 * In Chinese a day standing on its own in the margin of an entry carries
 * its counter — "19号" — because that is how a day is written when the
 * month and the year are not around it. In English the day stands on its
 * own as a bare number, and there is no counter to write.
 */
export function formatDayCounterForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  if (uiLang !== "zh-CN") return "";
  const parts = getStackedParts(iso, timeZone);
  if (!parts) return "";
  return "号";
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

/**
 * The weekday layouts of the notes wall.
 *
 * The Chinese one uses the short weekday ("周一") rather than the full one
 * ("星期一"): the margin of an entry is narrow, and the full form would
 * push the column wider than the day number it sits under.
 */
const WALL_WEEKDAY_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  "zh-CN": { weekday: "short" },
  en: { weekday: "short" },
};

/**
 * The weekday of a timestamp, e.g. "周一" / "Mon".
 */
export function formatWeekdayForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const options = WALL_WEEKDAY_OPTIONS[uiLang] ?? WALL_WEEKDAY_OPTIONS.en;
  return new Intl.DateTimeFormat(
    uiLang in WALL_WEEKDAY_OPTIONS ? uiLang : "en",
    {
      ...options,
      ...(timeZone ? { timeZone } : {}),
    }
  ).format(date);
}

/**
 * The heading of a month group, e.g. "2026 年 10 月" / "October 2026".
 */
export function formatMonthHeadingForLang(
  iso: string,
  uiLang: string,
  timeZone?: string
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const parts = new Intl.DateTimeFormat(uiLang === "zh-CN" ? "zh-CN" : "en", {
    year: "numeric",
    month: "long",
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? "";

  const year = lookup("year");
  const month = lookup("month");

  if (uiLang === "zh-CN") return `${year} 年 ${month} 月`;
  return `${month} ${year}`;
}

/**
 * The compact form of a month, used by the month index.
 *
 * The index is a narrow column, and the full heading of a month does not
 * fit in it without breaking across two lines. The compact form is
 * numeric, so that it is short and identical in every language — which
 * also means it does not have to be rewritten when the language changes.
 */
export function formatMonthLabelForLang(
  iso: string,
  _uiLang: string,
  timeZone?: string
): string {
  const parts = getStackedParts(iso, timeZone);
  if (!parts) return iso;
  return `${parts.year}.${parts.month}`;
}
