/**
 * The site's URL vocabulary.
 *
 * Every internal link in the site is built here, and nowhere else. The point
 * is not tidiness — it is that a URL has exactly one spelling, and that
 * spelling is decided in one place.
 *
 * The problem this solves
 * ----------------------
 *
 * The site has two URL-producing mechanisms that, by default, disagree:
 *
 *   * `getRelativeLocaleUrl()` appends a trailing slash whenever the build
 *     format is `directory` (Astro's default) — it produces `/notes/`.
 *   * Astro's pagination generator appends a slash *only* when
 *     `trailingSlash === "always"` — with the default `"ignore"` it produces
 *     `/posts`.
 *
 * Two shapes for the same kind of page is the actual defect. It produces
 * duplicate URLs, it makes the sitemap disagree with the links, and it means
 * that a hand-written redirect pointing one shape at the other is guaranteed
 * to loop, because the edge canonicalises the target right back.
 *
 * `astro.config.ts` sets `trailingSlash: "always"` so the two generators
 * agree. This module then makes the agreement *explicit* rather than
 * implicit: a route is declared here once, and every caller uses the same
 * function to build it.
 */
import { getRelativeLocaleUrl } from "astro:i18n";
import config from "@/config";

/**
 * The site's routes, as path segments relative to the site root.
 *
 * These are *segments*, not URLs — no leading slash, no trailing slash. The
 * builders below turn them into URLs. Keeping them in this shape means a
 * route can be renamed in exactly one place, and a typo cannot compile
 * silently into a broken link.
 */
export const ROUTES = {
  /** The home page. */
  home: "",
  /** The technical-articles listing. */
  posts: "posts",
  /** The notes listing (notes have no detail pages of their own). */
  notes: "notes",
  /** The literary-works listing. */
  writing: "writing",
  /** The project grid. */
  projects: "projects",
  /** The about page. */
  about: "about",
  /** The search page. Tags live here as a filter, not as pages. */
  search: "search",
} as const;

export type RouteName = keyof typeof ROUTES;

/**
 * Builds the URL of a route.
 *
 * The trailing slash is always present, which makes it the *canonical* form
 * — the one the site links to, the one the sitemap lists, and the one
 * Cloudflare Pages serves without a redirect.
 *
 * @param locale the Astro i18n locale
 * @param route one of the declared routes
 */
export function routeUrl(locale: string | undefined, route: RouteName): string {
  return canonicalUrl(locale, ROUTES[route]);
}

/**
 * Builds the URL of a route with extra path segments appended.
 *
 * Used for content addresses such as `/posts/my-post/` or
 * `/writing/chapter-one/`.
 *
 * @param locale the Astro i18n locale
 * @param route the route the segments hang off
 * @param segments the additional path segments, in order
 */
export function routeUrlWith(
  locale: string | undefined,
  route: RouteName,
  ...segments: string[]
): string {
  return canonicalUrl(locale, [ROUTES[route], ...segments].join("/"));
}

/**
 * Builds the URL of a path that has no named route — for example an
 * arbitrary segment of a legacy URL that is only being redirected.
 *
 * @param locale the Astro i18n locale
 * @param path the path relative to the site root
 */
export function pathUrl(locale: string | undefined, path: string): string {
  return canonicalUrl(locale, path);
}

/**
 * Builds the URL of the search page, filtered by a tag.
 *
 * The tag is a *query parameter*, not a path segment: the tag pages were
 * removed in favour of a single search page that can filter across all four
 * collections at once. `?tag=` is therefore the only way to address a tag,
 * and every link that carries a tag has to use it.
 *
 * @param locale the Astro i18n locale
 * @param tag the tag slug to filter by; empty means no filter
 */
export function tagSearchUrl(locale: string | undefined, tag: string): string {
  const base = routeUrl(locale, "search");
  return tag ? `${base}?tag=${encodeURIComponent(tag)}` : base;
}

/**
 * Builds the URL of a file that the build emits as-is — a feed, a
 * sitemap, a generated image.
 *
 * Unlike a page, a file has no directory index, so it must *not* get a
 * trailing slash: `/rss.xml` is the file, `/rss.xml/` is not.
 *
 * @param locale the Astro i18n locale
 * @param file the file name, relative to the site root
 */
export function fileUrl(locale: string | undefined, file: string): string {
  const localized = getRelativeLocaleUrl(resolveLocale(locale), file);
  return localized.replace(/\/+$/, "");
}

/**
 * Normalises a URL that was produced by Astro itself — for example the
 * pagination URLs on `page.url.prev` / `page.url.next`.
 *
 * Astro's pagination generator decides on the trailing slash by itself
 * (`getRouteGenerator()` only appends one when `trailingSlash === "always"`),
 * so its URLs are normalised here rather than trusted. Routing every
 * internally generated URL through one function is what guarantees that the
 * site has exactly one URL per page.
 *
 * @param url the URL to normalise
 */
export function canonicalizeUrl(url: string | undefined): string {
  if (!url) return "";
  // Split off the query string and hash — they are not part of the path.
  const [path, rest] = url.split(/(?=[?#])/);
  if (path === "/") return "/" + (rest ?? "");
  return path.replace(/\/+$/, "") + "/" + (rest ?? "");
}

/**
 * Turns a path into the site's one canonical URL form.
 *
 * Astro's `getRelativeLocaleUrl()` already handles the base prefix and the
 * locale prefix; all this adds is the trailing slash, applied
 * unconditionally so that the result never depends on the build format.
 *
 * The home page is the only path without a trailing slash — `/` is already
 * canonical.
 */
function canonicalUrl(locale: string | undefined, path: string): string {
  const localized = getRelativeLocaleUrl(resolveLocale(locale), path);
  if (localized === "/") return "/";
  return localized.replace(/\/+$/, "") + "/";
}

/**
 * Resolves the locale to use for URL building.
 *
 * `Astro.currentLocale` is `undefined` outside of a request context, and
 * the configured site language is the sensible fallback. The locale is
 * resolved here rather than at every call site so that the fallback is
 * applied consistently.
 */
function resolveLocale(locale: string | undefined): string {
  return locale ?? config.site.lang;
}
