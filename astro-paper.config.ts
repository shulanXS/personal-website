import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://astro-paper.pages.dev/",
    title: "车文杰",
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
    editPost: {
      enabled: true,
      url: "https://app.pagescms.org/",
    },
    search: "pagefind",
  },
  /**
   * The content management backend.
   *
   * Pages CMS reads the `.pages.yml` file in the project root and turns the
   * four content collections into editable forms. The footer links to it,
   * so publishing a new post does not need a local editor.
   */
  cms: {
    url: "https://app.pagescms.org/",
    show: true,
  },
  /**
   * Social profile links shown in the header and the footer.
   *
   * Every URL below is a PLACEHOLDER — replace it with the real account
   * before publishing. The icon is picked from `src/assets/icons/socials/`
   * by `name`; an entry whose icon is missing is silently skipped, so the
   * name has to match the file name exactly.
   *
   * `linkTitle` is the accessible label of the icon link. Without it the
   * title falls back to an English placeholder ("车文杰 on Github"), which
   * does not fit a Chinese interface.
   *
   * The list is deliberately short — a wall of icons is noise. Add a
   * platform here only if it is actually used.
   */
  socials: [
    // --- Code & development -------------------------------------------
    { name: "github", url: "https://github.com/", linkTitle: "GitHub" },
    { name: "gitee", url: "https://gitee.com/", linkTitle: "Gitee" },

    // --- Chinese platforms --------------------------------------------
    { name: "wechat", url: "https://weixin.qq.com/", linkTitle: "微信" },
    { name: "weibo", url: "https://weibo.com/", linkTitle: "微博" },
    { name: "zhihu", url: "https://www.zhihu.com/", linkTitle: "知乎" },
    { name: "bilibili", url: "https://space.bilibili.com/", linkTitle: "哔哩哔哩" },
    { name: "xiaohongshu", url: "https://www.xiaohongshu.com/", linkTitle: "小红书" },
    { name: "douban", url: "https://www.douban.com/", linkTitle: "豆瓣" },

    // --- International platforms ---------------------------------------
    { name: "x", url: "https://x.com/", linkTitle: "X" },
    { name: "mastodon", url: "https://joinmastodon.org/", linkTitle: "Mastodon" },
    { name: "threads", url: "https://www.threads.net/", linkTitle: "Threads" },
    { name: "linkedin", url: "https://www.linkedin.com/", linkTitle: "LinkedIn" },
    { name: "youtube", url: "https://www.youtube.com/", linkTitle: "YouTube" },
    { name: "instagram", url: "https://www.instagram.com/", linkTitle: "Instagram" },
    { name: "reddit", url: "https://www.reddit.com/", linkTitle: "Reddit" },

    // --- Contact -------------------------------------------------------
    { name: "mail", url: "mailto:yourmail@gmail.com", linkTitle: "发送邮件" },
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