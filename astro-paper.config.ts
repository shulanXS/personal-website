import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/",
    /**
     * The name of the site.
     *
     * This is the *fallback* — the value used for the metadata that is
     * generated at build time (the RSS feed, the Open Graph image) and for
     * the structured data of a page. The name that is actually *shown* on
     * the site comes from the interface dictionary (`site.title`), so that
     * it can be read as "Wenjie Che" in the English interface.
     *
     * Keep the two in sync.
     */
    title: "车文杰",
    /**
     * The one-line description of the site.
     *
     * Like the title, this is the fallback for the build-time metadata.
     * The description shown in the footer comes from the interface
     * dictionary (`site.description`).
     */
    description:
      "车文杰，硕士在读，研究方向为 AI 应用。在这里记录技术学习、阅读笔记与文学创作。",
    author: "车文杰",
    profile: "",
    ogImage: "default-og.jpg",
    /**
     * Astro i18n locale. Drives URL building (`getRelativeLocaleUrl`).
     * Do NOT change this without also updating `astro.config.ts` →
     * `i18n.locales`, otherwise the site throws at runtime.
     */
    lang: "en",
    /**
     * Interface language for UI strings (navigation, buttons, labels).
     * Independent from `lang`: switching it does not change any URL.
     */
    uiLang: "zh-CN",
    /**
     * The timezone every date on the site is rendered in.
     *
     * The content is written for a Chinese audience, so the dates have to
     * match the local clock rather than that of an arbitrary default.
     */
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  home: {
    /**
     * The length of the activity timeline on the home page.
     *
     * The timeline merges every kind of content into one list, so this is
     * the length of the whole list rather than a number of items per kind.
     */
    activityLimit: 12,
    /**
     * The length of each section of the wide layout.
     *
     * The wide layout keeps the four kinds in four sections, so each one
     * has a length of its own.
     */
    recentNotes: 3,
    recentPosts: 3,
    recentWriting: 3,
    recentProjects: 2,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showBackButton: true,
    search: "pagefind",
  },
  /**
   * The content management backend.
   *
   * Pages CMS reads the `.pages.yml` file in the project root and turns the
   * four content collections into editable forms. The site is *not* linked
   * to it: the "管理内容" buttons have been removed from the footer and from
   * the article pages, because a visitor has no business editing the site
   * and the links only ever led to a sign-in screen.
   *
   * The setting is kept so that the backend can be re-enabled from here if
   * the link is ever wanted back.
   */
  cms: {
    url: "https://app.pagescms.org/",
    show: false,
  },
  /**
   * Social profile links shown in the header and the footer.
   *
   * The list is deliberately short. A wall of fifteen icons is not a
   * contact list, it is noise: on a phone it wraps onto three rows and
   * pushes the rest of the page out of the way, and on a wide screen it
   * draws the eye away from the writing. Three links — a way to write,
   * a way to see the code, and a way to talk — say everything a visitor
   * needs to know.
   *
   * The icon is picked from `src/assets/icons/socials/` by `name`; an
   * entry whose icon is missing is silently skipped, so the name has to
   * match the file name exactly.
   *
   * The label of a button is *not* given here: it is part of the
   * interface and lives in the dictionary (`socials.*`), so that it
   * follows the language switch. A `linkTitle` here would be a label
   * frozen in one language forever.
   *
   * An entry with a `copy` value and no `url` becomes a button that
   * copies the value — which is what a WeChat ID needs, since it is a
   * string and not an address.
   */
  socials: [
    // --- Code & development -------------------------------------------
    { name: "github", url: "https://github.com/shulanXS" },

    // --- Chinese platforms --------------------------------------------
    // A WeChat ID cannot be linked to, so the button copies it instead.
    { name: "wechat", copy: "shulan203" },

    // --- Contact -------------------------------------------------------
    { name: "mail", url: "mailto:chewenjiedaily@gmail.com" },
  ],
  /*
   * The share buttons on a post.
   *
   * No `linkTitle` is given: the label of a share button is part of the
   * interface, so it lives in the dictionary (`post.sharePlatforms`) and
   * follows the language switch. A label hardcoded here would stay in the
   * language of the config forever.
   */
  shareLinks: [
    { name: "wechat", url: "https://service.weixin.qq.com/share?url=" },
    { name: "weibo", url: "https://service.weibo.com/share/share.php?url=" },
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});