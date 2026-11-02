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
 * The day-only layout.
 *
 * A listing shows *when* a work appeared, not *at what moment* — the hour
 * a chapter was written is only interesting to someone who has already
 * opened it. The full timestamp is kept for the pages that belong to a
 * single work, where the exact moment is the point.
 */
const DAY_DATE_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY年M月D日",
  en: "D MMM, YYYY",
};

/*
 * The whole-date layout, used where there is no group heading to carry the
 * year and the month.
 *
 * The date is written as one thing rather than as a year-month code and a
 * day beside it: "2026.10" next to "20号" reads as a code next to a
 * figure, while "2026年10月20日" reads as a date.
 */
const FULL_DATE_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY年M月D日",
  en: "D MMM, YYYY",
};

/*
 * The month-and-day layout.
 *
 * The articles listing is grouped by year, and the year is written once —
 * as the heading of the group. Writing it again on every entry would
 * repeat the same fact eleven times, and the repetition is what pushes the
 * date column wide.
 *
 * What is left on an entry is the part that actually varies: the month and
 * the day. The Chinese layout writes them out in full ("5月17日"), because
 * a bare "5.17" is a code rather than a date; the English one names the
 * month ("May 17"), which is how English writes a date anyway.
 */
const MONTH_DAY_DATE_FORMATS: Record<string, string> = {
  "zh-CN": "M月D日",
  en: "MMM D",
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
 * Formats a date in the day-only layout of a listing.
 *
 * Same timezone handling as `formatDate`, but without the moment of the
 * day: a table of contents says "2026年10月26日", not
 * "2026年10月26日 08:00".
 */
export function formatDayDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const format = DAY_DATE_FORMATS[uiLang] ?? DAY_DATE_FORMATS.en;
  return dayjs(date).tz(timezone).locale(locale).format(format);
}

/**
 * Formats a date in the month-and-day layout of the articles listing.
 *
 * The year is not written here: it is the heading of the year group the
 * entry belongs to, and writing it again on every entry would repeat the
 * same fact over and over.
 */
export function formatMonthDayDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const format = MONTH_DAY_DATE_FORMATS[uiLang] ?? MONTH_DAY_DATE_FORMATS.en;
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

/**
 * The three pieces of a date that the notes wall needs.
 *
 * The notes listing writes a date across three different places, and
 * each of them asks for a different piece:
 *
 *   - the *day number* in the margin of an entry ("19");
 *   - the *weekday* under it ("周一"), which is the one part of a date
 *     that has to be computed rather than read;
 *   - the *month* in the heading of a month group ("2026 年 10 月").
 *
 * They are returned together rather than as three separate calls because
 * they are always wanted together, and because the timezone has to be
 * resolved once for all of them: a day that is the 19th in Shanghai is
 * the 18th in UTC, and a listing whose day and weekday disagree with
 * each other is worse than one that is merely a day out.
 */
export interface WallDate {
  /** The day of the month, e.g. "19". */
  day: string;
  /**
   * The counter that goes with the day, e.g. "号".
   *
   * It is empty in English, where a day standing on its own is written as
   * a bare number.
   */
  counter: string;
  /** The moment of the day, e.g. "16:40". */
  time: string;
}

/**
 * The parts of a note's date that the wall layout writes down.
 */
export function formatWallDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): WallDate {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const d = dayjs(date).tz(timezone).locale(locale);
  return {
    day: d.format("D"),
    /*
     * In Chinese a day standing on its own in the margin of an entry
     * carries its counter — "19号" — because that is how a day is written
     * when the month and the year are not around it. In English the day
     * stands on its own as a bare number.
     */
    counter: uiLang === "zh-CN" ? "号" : "",
    time: d.format(STACKED_TIME_FORMATS[uiLang] ?? STACKED_TIME_FORMATS.en),
  };
}

/**
 * The heading of a month group, e.g. "2026 年 10 月" / "October 2026".
 *
 * The month and the year are written once per group rather than once per
 * entry: on a listing of notes they are the least informative part of
 * the date, and repeating them on every line is what made the old
 * timeline column narrow.
 */
const MONTH_HEADING_FORMATS: Record<string, string> = {
  "zh-CN": "YYYY 年 M 月",
  en: "MMMM YYYY",
};

export function formatMonthHeading(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const d = dayjs(date).tz(timezone).locale(locale);
  return d.format(MONTH_HEADING_FORMATS[uiLang] ?? MONTH_HEADING_FORMATS.en);
}

/**
 * The compact form of a month, used by the month index.
 *
 * The index is a narrow column, and the full heading of a month
 * ("2026 年 10 月") does not fit in it without breaking across two
 * lines. The compact form is numeric, so that it is short and identical
 * in every language.
 */
export function formatMonthLabel(
  date: string | Date,
  timezone?: string
): string {
  const d = dayjs(date).tz(timezone);
  return `${d.format("YYYY")}.${d.format("MM")}`;
}

/**
 * A whole date, written the way a date is written.
 *
 * The home page has no month group to carry the year and the month, so
 * the date has to say them itself — and it has to say them as *one*
 * date. A date split into a numeric year-month and a day with a
 * counter ("2026.10" and "20号") reads as a code next to a figure;
 * written out ("2026年10月20日") it reads as a date.
 */
export function formatFullDate(
  date: string | Date,
  uiLang: string,
  timezone?: string
): string {
  const locale = DAYJS_LOCALES[uiLang] ?? "en";
  const format = FULL_DATE_FORMATS[uiLang] ?? FULL_DATE_FORMATS.en;
  return dayjs(date).tz(timezone).locale(locale).format(format);
}

/**
 * The key a month group is filed under.
 *
 * The key is a plain `YYYY-MM`, in the site's timezone rather than in
 * UTC: the same note has to land in the same group whatever the reader's
 * own timezone is, and a group that moved when a visitor changed their
 * clock would be a different page every time.
 */
export function monthKey(date: string | Date, timezone?: string): string {
  const d = dayjs(date).tz(timezone);
  return `${d.format("YYYY")}-${d.format("MM")}`;
}

/**
 * The year a post is filed under.
 *
 * Like the month key, it is resolved in the site's timezone rather than in
 * UTC: a post published on New Year's Eve in Shanghai belongs to that
 * year, whatever the reader's own clock says.
 */
export function yearKey(date: string | Date, timezone?: string): string {
  return dayjs(date).tz(timezone).format("YYYY");
}
