import type { UIStrings } from "../types";

export default {
  site: {
    /*
     * The name of the site is the same in every language: it is a name,
     * not a phrase. "Wenjie Che" is how the author is known, and the
     * Chinese interface shows it in Latin letters rather than translating
     * it — a transliterated name reads as an alias, not as a name.
     */
    title: "Wenjie Che",
    /*
     * The name of the person, written in the language of the interface.
     *
     * Unlike the site title — which is a brand and stays in Latin letters
     * everywhere — this one is the human name, so it is written the way
     * the person writes it: 车文杰 in Chinese, Wenjie Che in English.
     */
    name: "车文杰",
    author: "车文杰",
    description:
      "车文杰，硕士在读，研究方向为 AI 应用。在这里记录技术学习、阅读笔记与文学创作。",
  },
  nav: {
    home: "首页",
    posts: "技术文章",
    notes: "碎碎念",
    writing: "文学创作",
    projects: "项目",
    about: "关于我",
    search: "搜索",
  },
  socials: {
    github: "GitHub",
    wechat: "微信",
    mail: "发送邮件",
    mailTo: "发送邮件给车文杰",
    copyToClipboard: "复制到剪贴板",
    copied: "已将微信号复制到剪贴板",
    copyFailed: "复制失败，请手动复制",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享这篇文章：",
    sharePostOn: "分享到 {{0}}",
    sharePostViaEmail: "通过邮件分享",
    sharePlatforms: {
      wechat: "分享到微信",
      weibo: "分享到微博",
      whatsapp: "分享到 WhatsApp",
      facebook: "分享到 Facebook",
      x: "分享到 X",
      telegram: "分享到 Telegram",
      pinterest: "分享到 Pinterest",
    },
    tagLabel: "标签",
    backToTop: "回到顶部",
    goBack: "返回",
    editPage: "编辑此页",
    previousPost: "上一篇",
    nextPost: "下一篇",
    copyCode: "复制",
    copiedCode: "已复制",
    zoomImage: "放大图片",
    closeImagePreview: "关闭图片预览",
    imagePreview: "图片预览",
  },
  pagination: {
    prev: "上一页",
    next: "下一页",
    page: "页",
  },
  posts: {
    /**
     * The number of articles in a year, e.g. "7 篇".
     *
     * It is written on the heading of the year group, and it follows the
     * tag filter: the figure is the number of articles the reader will
     * actually see, not the number the year holds in total.
     */
    yearCount: "{{0}} 篇",
  },
  home: {
    /**
     * The one-line identity shown above the name in the hero section.
     */
    identity: "硕士在读 · AI 应用方向",
    /**
     * The greeting that opens the hero section.
     */
    greeting: "你好，我是",
    /**
     * The short positioning sentence under the name.
     */
    intro: "我关注 AI 如何落到真实场景里，也相信技术的价值在于被日常使用。",
    /**
     * The second paragraph of the hero — what the site actually holds.
     */
    about:
      "这里是我的个人数字空间：随手记下的碎碎念、写下来的技术文章，以及业余时间的一些文学创作。",
    /**
     * The three keywords that echo the content sections of the site.
     */
    keywords: "AI 应用 · 技术笔记 · 文学创作",
    /** The label of the RSS feed link in the hero. */
    rss: "订阅 RSS",
    /** The heading of the activity timeline on the home page. */
    activity: "最近动态",
    /** The sentence under the heading of the activity timeline. */
    activityDesc:
      "这里记录着这个站点发生过的每件事——碎碎念、文章、创作与项目，按时间排列。",
    /** Shown when the timeline has nothing to show. */
    activityEmpty: "还没有发布任何内容。",
    /** The heading of the notes section on the wide layout. */
    recentNotes: "最近动态",
    /** The heading of the projects section on the wide layout. */
    featuredProjects: "最近项目",
    /** The heading of the posts section on the wide layout. */
    recentPosts: "最近文章",
    /** The heading of the writing section on the wide layout. */
    recentWriting: "最近创作",
    allPosts: "全部文章",
    allNotes: "全部动态",
    allWriting: "全部创作",
    allProjects: "全部项目",
  },
  /**
   * The labels of the activity timeline.
   */
  activity: {
    /** A note — a short, personal entry. */
    note: "碎碎念",
    /** A technical article. */
    post: "文章",
    /** A piece of literary work. */
    writing: "创作",
    /** A project. */
    project: "项目",
  },
  notes: {
    expand: "展开",
    collapse: "收起",
    /** The heading of the month index beside the notes. */
    byMonth: "按月份",
    /** The number of notes of a month, e.g. "3 条". */
    monthCount: "{{0}} 条",
    /** The number of notes of a month, in the singular. */
    monthCountOne: "{{0}} 条",
    /** The number of notes of a month in the index — just the figure. */
    monthCountShort: "{{0}}",
  },
  tags: {
    all: "全部",
    empty: "该标签下暂无内容。",
    /**
     * The button that clears the filter when nothing matched.
     *
     * It is the way back: without it, a reader whose filter came out
     * empty is left with a sentence and no way to undo the filter.
     */
    emptyReset: "清除筛选",
    /** The label of the level of the writing filter that holds the tags. */
    title: "按标签",
  },
  search: {
    tagsTitle: "按标签查找",
    tagsDesc:
      "点击任意标签，即可同时检索技术文章、碎碎念、文学创作与项目中的相关内容。",
    noTagResults: "该标签下暂无内容。",
  },
  writing: {
    all: "全部",
    novel: "小说",
    essay: "散文",
    short: "短篇",
    series: "系列作品",
    standalone: "独立作品",
    ongoing: "连载中",
    completed: "已完结",
    tableOfContents: "作品目录",
    chapterNavigation: "章节导航",
    chapter: "第 {{0}} 章",
    /**
     * The number of chapters of a series, e.g. "共 7 章".
     *
     * The word "共" ("in total") is there because the count is the whole
     * of the series and not just the part that is finished: a series
     * that is still being written has chapters too, and how many of them
     * there are says more than whether it is over.
     */
    chapters: "共 {{0}} 章",
    characters: "约 {{0}}字",
    type: "类型",
    chapterCount: "章节",
    length: "字数",
    period: "起止",
    /** The label of the first level of the writing filter. */
    byType: "按类型",
    /** The label of the second level of the writing filter. */
    byWork: "按作品",
    /** The option that clears one level of the writing filter. */
    allWorks: "全部作品",
    /** The floating button that returns from a chapter to the list. */
    backToList: "返回",
  },
  projects: {
    github: "源码",
    demo: "在线演示",
  },
  footer: {
    copyright: "版权所有",
    allRightsReserved: "保留所有权利",
    /** The heading of the navigation column in the footer. */
    navTitle: "导航",
    /** The heading of the column that lists the most recent writing. */
    recentTitle: "最近更新",
    /** The label of the link that opens the content management backend. */
    manage: "管理内容",
    /** The accessible title of the CMS link. */
    manageTitle: "在 Pages CMS 中管理本站内容",
  },
  documentTitle: "{{0}} | {{1}}",
  pages: {
    tagTitle: "标签",
    tagDesc: "该标签下的全部文章",

    tagsTitle: "标签",
    tagsDesc: "文章中使用的全部标签。",

    postsTitle: "技术文章",
    postsDesc: "我写下的全部技术文章。",
    postsEmpty: "还没有发布任何技术文章。",

    notesTitle: "碎碎念",
    notesDesc: "随手记录的想法、日常与片段。",
    notesEmpty: "还没有发布任何动态。",

    writingTitle: "文学创作",
    writingDesc: "原创的小说、散文与短篇故事。",
    writingEmpty: "还没有发布任何作品。",

    projectsTitle: "项目",
    projectsDesc: "我做过的、开源过的或正在折腾的东西。",
    projectsEmpty: "还没有收录任何项目。",

    searchTitle: "搜索",
    searchDesc: "搜索任意文章 ...",
  },
  about: {
    title: "关于我",
    desc: "我是谁，我在做什么，以及这个站点为什么存在。",
    identity: "硕士在读 · AI 应用方向",
    lead: "你好，我是车文杰，一名正在攻读硕士学位的研究生，研究方向是 AI 的实际应用。我关心技术如何真正落到日常的生活里，也相信一项技术的价值，取决于它有没有被普通人用起来。",
    sections: [
      {
        title: "在做什么",
        body: [
          "我的研究聚焦于把大模型能力接入真实的产品流程——不是停留在跑通 Demo，而是让它在具体业务里稳定、可解释、可用。",
          "平时我会写技术文章，把踩过的坑和想通的事情整理出来；也写一些文学创作，那是另一条让我保持语言敏感度的路。",
        ],
      },
      {
        title: "这个站点",
        body: [
          "这是我的个人数字空间。技术文章写给同样在折腾技术的人看，碎碎念记录那些还没长成文章的念头，文学创作则是我工作之外的另一面。",
          "我尽量让每一篇文章都值得读：与其追求更新频率，不如保证写下来的东西真的解决了某个问题。",
        ],
      },
      {
        title: "此刻",
        body: [
          "正在读的书、做的小项目、用的工具，我都会随手记在碎碎念里。如果你对其中某件事感兴趣，欢迎来信聊聊。",
        ],
      },
    ],
    hereTitle: "这里有些什么",
    hereItems: [
      {
        label: "技术文章",
        desc: "关于 AI 应用、Web 开发与工程实践的长文。",
        route: "posts",
      },
      {
        label: "碎碎念",
        desc: "随时记下的想法、阅读笔记与日常片段。",
        route: "notes",
      },
      {
        label: "文学创作",
        desc: "小说、散文与短篇故事。",
        route: "writing",
      },
      {
        label: "项目",
        desc: "做过、开源过或正在折腾的东西。",
        route: "projects",
      },
    ],
    contactTitle: "联系我",
    contactDesc:
      "如果你对上面某段内容有想法，或者只是想打个招呼，都可以直接找我。",
    contactLabels: {
      github: "GitHub",
      wechat: "微信",
      email: "邮箱",
    },
    contactCopyHint: "点击复制",
  },
  a11y: {
    skipToContent: "跳到主要内容",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    toggleTheme: "切换深浅色主题",
    switchLanguage: "切换界面语言",
    langName: { "zh-CN": "中文", en: "EN" },
    searchPlaceholder: "搜索文章...",
    noResults: "没有找到结果",
    goToPreviousPage: "上一页",
    goToNextPage: "下一页",
    breadcrumb: "面包屑导航",
    rssFeed: "RSS 订阅",
    backToTop: "回到顶部",
    /** The accessible label of the navigation column in the footer. */
    footerNav: "页脚导航",
  },
  pagefind: {
    placeholder: "搜索",
    searchLabel: "搜索",
    clearSearch: "清空",
    searching: "正在搜索 [SEARCH_TERM]...",
    zeroResults: "没有找到 [SEARCH_TERM] 的结果",
    oneResult: "[COUNT] 条结果",
    manyResults: "[COUNT] 条结果",
    loadMore: "加载更多结果",
    filtersLabel: "筛选",
  },
  notFound: {
    title: "404 页面不存在",
    message: "没有找到这个页面",
    goHome: "回到首页",
  },
} satisfies UIStrings;
