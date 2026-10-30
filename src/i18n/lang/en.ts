import type { UIStrings } from "../types";

export default {
  nav: {
    home: "Home",
    posts: "Blog",
    notes: "Notes",
    writing: "Writing",
    projects: "Projects",
    search: "Search",
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
