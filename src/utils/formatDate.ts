import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/zh-cn";
import "dayjs/locale/en";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Maps an interface language onto the dayjs locale that formats its dates.
 *
 * Only the locales the site actually ships are loaded, so the bundle stays
 * small. Anything unknown falls back to English.
 */
const DAYJS_LOCALES: Record<string, string> = {
  "zh-CN": "zh-cn",
  en: "en",
};

/**
 * The date layout each language conventionally uses.
 *
 * Every layout carries the time down to the minute, because a post's exact
 * publish time is meaningful information on a personal site.
 */
const DATE_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY年M月D日 HH:mm",
  en: "D MMM, YYYY, HH:mm",
};

/**
 * The compact date layout.
 *
 * The layout is numeric so it stays short, and it carries the time down to
 * the minute — on a personal site the hour something was written is part of
 * the meaning, not decoration.
 */
const COMPACT_DATE_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY.MM.DD HH:mm",
  en: "YYYY.MM.DD HH:mm",
};

/*
 * The two halves of the compact layout, split apart.
 *
 * The notes timeline puts its date in a narrow column next to the vertical
 * rule. The full compact layout is fifteen characters wide, and the column
 * is not — the overflow crossed the rule and ran into the entry beside it.
 * The timeline therefore stacks the day above the moment of the day, which
 * makes the column exactly as wide as the day itself.
 */
const STACKED_DATE_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY.MM.DD",
  en: "YYYY.MM.DD",
};

const STACKED_TIME_FORMATS: Record<string, string> = {
  "zh-CN": "HH:mm",
  en: "HH:mm",
};

/**
 * The date and the time of a note, split into the two lines of the
 * timeline column.
 */
export interface StackedDate {
  /** The day, e.g. "2026.10.28". */
  date: string;
  /** The moment of the day, e.g. "17:30". */
  time: string;
}

/**
 * Formats a date for the given interface language.
 *
 * Each locale has its own conventional date layout, so the format string is
 * chosen per language rather than relying on the locale's month names alone:
 * - Chinese: "2026年6月3日 14:05"
 * - English:  "3 Jun, 2026, 14:05"
 */
export function formatDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const format = DATE_FORMATS[uiLang] ?? DATE_FORMATS.en;
  return dayjs(date).tz(timezone).locale(locale).format(format);
}

/**
 * Formats a date in the compact layout of the notes timeline.
 *
 * Same timezone handling as `formatDate`, but in the short numeric layout
 * so the result fits into a narrow column.
 */
export function formatCompactDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const format = COMPACT_DATE_FORMATS[uiLang] ?? COMPACT_DATE_FORMATS.en;
  return dayjs(date).tz(timezone).locale(locale).format(format);
}

/**
 * Formats a date as the two stacked lines of the notes timeline.
 *
 * The day sits on the first line and the moment of the day on the second.
 * The two are returned separately rather than as one string, because the
 * markup has to put them into two different elements — the client-side
 * language switch rewrites them independently as well.
 */
export function formatStackedDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): StackedDate {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const d = dayjs(date).tz(timezone).locale(locale);
  return {
    date: d.format(STACKED_DATE_FORMATS[uiLang] ?? STACKED_DATE_FORMATS.en),
    time: d.format(STACKED_TIME_FORMATS[uiLang] ?? STACKED_TIME_FORMATS.en),
  };
}
