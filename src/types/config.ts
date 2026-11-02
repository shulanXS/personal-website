interface SiteConfig {
  /** Deployed URL of the site, e.g. "https://example.com" */
  url: string;
  /** Blog title shown in header and meta tags */
  title: string;
  /** Short description used in SEO meta and RSS feed */
  description: string;
  /** Default post author name */
  author: string;
  /** Author profile URL (used in structured data) */
  profile?: string;
  /** Fallback OG image filename in /public, e.g. "og.jpg" */
  ogImage?: string;
  /** HTML lang attribute, defaults to "en" */
  lang?: string;
  /**
   * Interface language used for UI strings (navigation, buttons, labels).
   * Independent from `lang`: `lang` is the Astro i18n locale used for URL
   * building, `uiLang` is the language of the interface text itself.
   * Defaults to "zh-CN".
   */
  uiLang?: "zh-CN" | "en";
  /** IANA timezone for post dates, e.g. "Asia/Bangkok" */
  timezone?: string;
  /** Text direction */
  dir?: "ltr" | "rtl" | "auto";
  /** Google Search Console verification meta tag value */
  googleVerification?: string;
}

interface PostsConfig {
  /**
   * Posts shown on the index/home page.
   */
  perIndex?: number;
  /**
   * Scheduled posts within this window (ms) of their pubDatetime
   * are shown as published. Defaults to 15 minutes.
   */
  scheduledPostMargin?: number;
}

interface HomeConfig {
  /**
   * How many entries the activity timeline on the home page shows.
   *
   * The timeline merges every kind of content into one list, so this
   * number is the length of that list — not a number of items per kind.
   * Defaults to 12.
   */
  activityLimit?: number;
  /**
   * How many notes the "最近动态" section of the wide layout shows.
   *
   * Defaults to 3.
   */
  recentNotes?: number;
  /**
   * How many articles the "最近文章" section of the wide layout shows.
   *
   * Defaults to 3.
   */
  recentPosts?: number;
  /**
   * How many works the "最近创作" section of the wide layout shows.
   *
   * Defaults to 3.
   */
  recentWriting?: number;
  /**
   * How many projects the "最近项目" section of the wide layout shows.
   *
   * Defaults to 2.
   */
  recentProjects?: number;
}

interface FeaturesConfig {
  /** Enable light/dark mode toggle. Defaults to true. */
  lightAndDarkMode?: boolean;
  /**
   * Generate dynamic OG images per post and provide `/og.png` when the static
   * `public/{site.ogImage}` file is absent. When false, that file is required
   * for the default layout OG image (build fails if missing).
   */
  dynamicOgImage?: boolean;
  /** Show back button on post detail pages. Defaults to true. */
  showBackButton?: boolean;
  /** "Edit page" link shown on post detail pages. */
  editPost?:
    | {
        enabled: true;
        /** Base URL for the edit link, e.g. GitHub edit URL */
        url: string;
      }
    | { enabled: false };
  /**
   * Search provider. "pagefind" ships in the base template.
   * Set to false to disable search entirely.
   */
  search?: "pagefind" | false;
}

interface SocialLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "github" → src/assets/icons/socials/github.svg
   */
  name: string;
  /**
   * The address the button opens.
   *
   * Omit it for a platform that has no web presence — a WeChat ID, a phone
   * number — and use `copy` instead.
   */
  url?: string;
  /**
   * A value copied to the clipboard when the button is clicked.
   *
   * Used for the platforms that cannot be linked to: a WeChat ID, for
   * instance, is not a URL. The button becomes a copy button and confirms
   * the copy with a short toast.
   */
  copy?: string;
  /**
   * Accessible label for the icon link (aria-label, title attribute).
   * Auto-generated if omitted: "{site.title} on GitHub", "Send an email to {site.title}", etc.
   * Override when the default wording doesn't fit.
   */
  linkTitle?: string;
}

interface ShareLink {
  /**
   * Must match an SVG filename in src/assets/icons/socials/.
   * e.g. "facebook" → src/assets/icons/socials/facebook.svg
   */
  name: string;
  /** Base share URL. The post URL will be appended as a query param. */
  url: string;
}

interface AstroPaperConfig {
  site: SiteConfig;
  posts?: PostsConfig;
  home?: HomeConfig;
  features?: FeaturesConfig;
  /**
   * The content management backend.
   *
   * The site is edited in Pages CMS: the link opens the hosted CMS, the
   * visitor signs in with GitHub and edits the collections declared in
   * `.pages.yml`.
   */
  cms?: CmsConfig;
  /** Social profile links shown in header/footer */
  socials?: SocialLink[];
  /** Share links shown on post detail pages */
  shareLinks?: ShareLink[];
}

interface CmsConfig {
  /** Base URL of the CMS, e.g. "https://app.pagescms.org/" */
  url: string;
  /** Show the link in the footer. Defaults to true. */
  show?: boolean;
}

type ResolvedSiteConfig = Required<
  Pick<
    SiteConfig,
    | "url"
    | "title"
    | "description"
    | "author"
    | "lang"
    | "uiLang"
    | "timezone"
    | "dir"
    | "ogImage"
  >
> &
  Pick<SiteConfig, "profile" | "googleVerification">;

export interface ResolvedAstroPaperConfig {
  site: ResolvedSiteConfig;
  posts: Required<PostsConfig>;
  home: Required<HomeConfig>;
  features: Required<FeaturesConfig>;
  cms: Required<CmsConfig>;
  socials: SocialLink[];
  shareLinks: ShareLink[];
}

/**
 * Type helper for astro-paper.config.ts.
 * Provides full IntelliSense without any runtime overhead.
 */
export function defineAstroPaperConfig(
  config: AstroPaperConfig
): AstroPaperConfig {
  return config;
}
