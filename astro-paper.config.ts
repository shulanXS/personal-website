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
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
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
   * Every URL below is a PLACEHOLDER — replace it with the real account
   * before publishing. The icon is picked from `src/assets/icons/socials/`
   * by `name`; an entry whose icon is missing is silently skipped, so the
   * name has to match the file name exactly.
   *
   * `linkTitle` is the accessible label of the icon link. Without it the
   * title falls back to an English placeholder ("车文杰 on Github"), which
   * does not fit a Chinese interface.
   */
  socials: [
    // --- Code & development -------------------------------------------
    { name: "github", url: "https://github.com/shulanXS", linkTitle: "GitHub" },

    // --- Chinese platforms --------------------------------------------
    // A WeChat ID cannot be linked to, so the button copies it instead.
    { name: "wechat", copy: "shulan203", linkTitle: "微信" },

    // --- Contact -------------------------------------------------------
    { name: "mail", url: "mailto:chewenjiedaily@gmail.com", linkTitle: "发送邮件" },
  ],
  shareLinks: [
    { name: "wechat", url: "https://service.weixin.qq.com/share?url=", linkTitle: "分享到微信" },
    { name: "weibo", url: "https://service.weibo.com/share/share.php?url=", linkTitle: "分享到微博" },
    { name: "whatsapp", url: "https://wa.me/?text=", linkTitle: "分享到 WhatsApp" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=", linkTitle: "分享到 Facebook" },
    { name: "x",        url: "https://x.com/intent/post?url=", linkTitle: "分享到 X" },
    { name: "telegram", url: "https://t.me/share/url?url=", linkTitle: "分享到 Telegram" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=", linkTitle: "分享到 Pinterest" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=", linkTitle: "通过邮件分享" },
  ],
});