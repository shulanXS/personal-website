import type { UIStrings } from "../types";

export default {
  site: {
    title: "Wenjie Che",
    /**
     * The name of the person, written in the language of the interface.
     */
    name: "Wenjie Che",
    author: "Wenjie Che",
    description:
      "Wenjie Che, a master's student working on applied AI. Writing about technology, reading notes and fiction.",
  },
  nav: {
    home: "Home",
    posts: "Blog",
    notes: "Notes",
    writing: "Writing",
    projects: "Projects",
    about: "About",
    search: "Search",
  },
  socials: {
    github: "GitHub",
    wechat: "WeChat",
    mail: "Send an email",
    mailTo: "Send an email to Wenjie Che",
  },
  post: {
    publishedAt: "Published at",
    updatedAt: "Updated",
    sharePostIntro: "Share this post:",
    sharePostOn: "Share this post on {{platform}}",
    sharePostViaEmail: "Share this post via email",
    tagLabel: "Tags",
    backToTop: "Back to top",
    goBack: "Go back",
    editPage: "Edit page",
    previousPost: "Previous Post",
    nextPost: "Next Post",
    copyCode: "Copy",
    copiedCode: "Copied",
    zoomImage: "Zoom image",
    closeImagePreview: "Close image preview",
    imagePreview: "Image preview",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    /**
     * The one-line identity shown above the name in the hero section.
     */
    identity: "Master's student · Applied AI",
    /**
     * The greeting that opens the hero section.
     */
    greeting: "Hi, I'm",
    /**
     * The short positioning sentence under the name.
     */
    intro:
      "I care about how AI lands in real products, and I believe technology only matters once it becomes part of everyday life.",
    /**
     * The second paragraph of the hero — what the site actually holds.
     */
    about:
      "This is my personal corner of the web: quick notes, technical articles, and some literary writing in my spare time.",
    /**
     * The three keywords that echo the content sections of the site.
     */
    keywords: "Applied AI · Tech Notes · Creative Writing",
    /** The label of the RSS feed link in the hero. */
    rss: "Subscribe via RSS",
    featured: "Featured",
    featuredProjects: "Featured Projects",
    recentPosts: "Recent Posts",
    recentNotes: "Recent Notes",
    recentWriting: "Recent Writing",
    allPosts: "All Posts",
    allNotes: "All Notes",
    allWriting: "All Writing",
    allProjects: "All Projects",
  },
  notes: {
    expand: "Expand",
    collapse: "Collapse",
  },
  tags: {
    all: "All",
    empty: "Nothing here under this tag yet.",
  },
  search: {
    tagsTitle: "Browse by tag",
    tagsDesc:
      "Click any tag to search the blog, notes, literary works and projects at once.",
    noTagResults: "Nothing here under this tag yet.",
  },
  writing: {
    all: "All",
    novel: "Novel",
    essay: "Essay",
    short: "Short Story",
    series: "Series",
    standalone: "Standalone Works",
    ongoing: "Ongoing",
    completed: "Completed",
    chapter: "Chapter",
    chapterLabel: "Chapter",
    tableOfContents: "Table of Contents",
    chapterNavigation: "Chapter navigation",
  },
  projects: {
    github: "GitHub",
    demo: "Demo",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
    /** The heading of the navigation column in the footer. */
    navTitle: "Navigation",
    /** The heading of the column that lists the most recent writing. */
    recentTitle: "Recent",
    /** The label of the link that opens the content management backend. */
    manage: "Manage Content",
    /** The accessible title of the CMS link. */
    manageTitle: "Manage the content of this site in Pages CMS",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "All the articles with the tag",

    tagsTitle: "Tags",
    tagsDesc: "All the tags used in posts.",

    postsTitle: "Blog",
    postsDesc: "All the articles I've posted.",

    notesTitle: "Notes",
    notesDesc: "Short thoughts, daily records and quick notes.",
    notesEmpty: "No notes yet.",

    writingTitle: "Writing",
    writingDesc: "Original novels, essays and short stories.",
    writingEmpty: "No writing published yet.",

    projectsTitle: "Projects",
    projectsDesc: "Things I have built, open-sourced or experimented with.",
    projectsEmpty: "No projects yet.",

    searchTitle: "Search",
    searchDesc: "Search any article ...",
  },
  about: {
    title: "About",
    desc: "Who I am, what I do, and why this site exists.",
    identity: "Master's student · Applied AI",
    lead: "Hi, I'm Che Wenjie, a master's student working on applied AI. I care about how technology actually reaches everyday life, and I believe a technology only matters once ordinary people actually use it.",
    sections: [
      {
        title: "What I do",
        body: [
          "My research focuses on wiring large models into real product flows — not stopping at a working demo, but making them stable, explainable and usable in concrete work.",
          "I write technical articles to organise what I have learned and where I got stuck; I also write fiction, which is the other road I keep my language alive on.",
        ],
      },
      {
        title: "This site",
        body: [
          "This is my personal corner of the web. The technical articles are for people who are building things themselves; the notes hold the thoughts that have not grown into articles yet; the writing is the other half of my life outside of work.",
          "I try to make every article worth reading: I would rather write slowly than often.",
        ],
      },
      {
        title: "Right now",
        body: [
          "The books I am reading, the small projects I am making and the tools I keep coming back to all end up in the notes. If any of it interests you, I would be glad to talk about it.",
        ],
      },
    ],
    hereTitle: "What lives here",
    hereItems: [
      {
        label: "Blog",
        desc: "Longer pieces on applied AI, web development and engineering practice.",
        route: "posts",
      },
      {
        label: "Notes",
        desc: "Thoughts, reading notes and daily fragments, written as they come.",
        route: "notes",
      },
      {
        label: "Writing",
        desc: "Novels, essays and short stories.",
        route: "writing",
      },
      {
        label: "Projects",
        desc: "Things I have built, open-sourced or experimented with.",
        route: "projects",
      },
    ],
    contactTitle: "Get in touch",
    contactDesc:
      "If you have thoughts on anything above, or just want to say hello, you can reach me directly.",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    switchLanguage: "Switch language",
    langName: { "zh-CN": "中文", en: "EN" },
    searchPlaceholder: "Search posts...",
    noResults: "No results found",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
    paginationNavigation: "Pagination Navigation",
    breadcrumb: "breadcrumb",
    rssFeed: "RSS Feed",
    backToTop: "Back to top",
    /** The accessible label of the navigation column in the footer. */
    footerNav: "Footer navigation",
  },
  pagefind: {
    placeholder: "Search",
    searchLabel: "Search",
    clearSearch: "Clear",
    searching: "Searching for [SEARCH_TERM]...",
    zeroResults: "No results for [SEARCH_TERM]",
    oneResult: "[COUNT] result",
    manyResults: "[COUNT] results",
    loadMore: "Load more results",
    filtersLabel: "Filters",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page Not Found",
    goHome: "Go back home",
  },
} satisfies UIStrings;
