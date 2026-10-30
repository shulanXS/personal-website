import type { UIStrings } from "../types";

export default {
  nav: {
    home: "首页",
    posts: "技术文章",
    notes: "碎碎念",
    writing: "文学创作",
    projects: "项目",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享这篇文章：",
    sharePostOn: "分享到 {{platform}}",
    sharePostViaEmail: "通过邮件分享",
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
    featured: "精选文章",
    featuredProjects: "精选项目",
    recentPosts: "最近文章",
    recentNotes: "最近动态",
    recentWriting: "最近创作",
    allPosts: "全部文章",
    allNotes: "全部动态",
    allWriting: "全部创作",
    allProjects: "全部项目",
  },
  notes: {
    expand: "展开",
    collapse: "收起",
  },
  tags: {
    all: "全部",
    empty: "该标签下暂无内容。",
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
    chapter: "第",
    chapterLabel: "第",
    tableOfContents: "作品目录",
    chapterNavigation: "章节导航",
  },
  projects: {
    github: "源码",
    demo: "在线演示",
  },
  footer: {
    copyright: "版权所有",
    allRightsReserved: "保留所有权利。",
    /** The label of the link that opens the content management backend. */
    manage: "管理内容",
    /** The accessible title of the CMS link. */
    manageTitle: "在 Pages CMS 中管理本站内容",
  },
  pages: {
    tagTitle: "标签",
    tagDesc: "该标签下的全部文章",

    tagsTitle: "标签",
    tagsDesc: "文章中使用的全部标签。",

    postsTitle: "技术文章",
    postsDesc: "我写下的全部技术文章。",

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
    paginationNavigation: "分页导航",
    breadcrumb: "面包屑导航",
    rssFeed: "RSS 订阅",
    backToTop: "回到顶部",
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
