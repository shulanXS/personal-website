export interface UIStrings {
  nav: {
    home: string;
    posts: string;
    notes: string;
    writing: string;
    projects: string;
    search: string;
  };
  post: {
    publishedAt: string;
    updatedAt: string;
    sharePostIntro: string;
    sharePostOn: string;
    sharePostViaEmail: string;
    tagLabel: string;
    backToTop: string;
    goBack: string;
    editPage: string;
    previousPost: string;
    nextPost: string;
    copyCode: string;
    copiedCode: string;
    zoomImage: string;
    closeImagePreview: string;
    imagePreview: string;
  };
  pagination: {
    prev: string;
    next: string;
    page: string;
  };
  home: {
    /**
     * The one-line identity shown above the name in the hero section.
     */
    identity: string;
    /** The greeting that opens the hero section. */
    greeting: string;
    /** The short positioning sentence under the name. */
    intro: string;
    /** The second paragraph of the hero — what the site actually holds. */
    about: string;
    /** The keywords that echo the content sections of the site. */
    keywords: string;
    /** The label of the RSS feed link in the hero. */
    rss: string;
    featured: string;
    featuredProjects: string;
    recentPosts: string;
    recentNotes: string;
    recentWriting: string;
    allPosts: string;
    allNotes: string;
    allWriting: string;
    allProjects: string;
  };
  notes: {
    /** Label of the button that expands a clamped note in place. */
    expand: string;
    /** Label of the button that collapses an expanded note again. */
    collapse: string;
  };
  /**
   * The tag system.
   *
   * Tags are embedded into every collection, so these strings are used by
   * the tag bars of the listing pages and by the tag cloud on the search
   * page.
   */
  tags: {
    /** Label of the chip that clears an active filter. */
    all: string;
    /** Shown when a tag filter matches nothing. */
    empty: string;
  };
  /**
   * The tag search on the search page.
   */
  search: {
    /** Heading of the tag cloud section. */
    tagsTitle: string;
    /** Explanation of what clicking a tag does. */
    tagsDesc: string;
    /** Shown when a tag has no matching entries. */
    noTagResults: string;
  };
  writing: {
    all: string;
    novel: string;
    essay: string;
    short: string;
    series: string;
    standalone: string;
    ongoing: string;
    completed: string;
    chapter: string;
    chapterLabel: string;
    tableOfContents: string;
    chapterNavigation: string;
  };
  projects: {
    github: string;
    demo: string;
  };
  footer: {
    copyright: string;
    allRightsReserved: string;
    /** The label of the link that opens the content management backend. */
    manage: string;
    /** The accessible title of the CMS link. */
    manageTitle: string;
  };
  pages: {
    tagTitle: string;
    tagDesc: string;

    tagsTitle: string;
    tagsDesc: string;

    postsTitle: string;
    postsDesc: string;

    notesTitle: string;
    notesDesc: string;
    notesEmpty: string;

    writingTitle: string;
    writingDesc: string;
    writingEmpty: string;

    projectsTitle: string;
    projectsDesc: string;
    projectsEmpty: string;

    searchTitle: string;
    searchDesc: string;
  };
  a11y: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    toggleTheme: string;
    switchLanguage: string;
    /** Names of the available interface languages, keyed by locale. */
    langName: Record<string, string>;
    searchPlaceholder: string;
    noResults: string;
    goToPreviousPage: string;
    goToNextPage: string;
    paginationNavigation: string;
    breadcrumb: string;
    rssFeed: string;
    backToTop: string;
  };
  /**
   * Pagefind's own search UI strings.
   *
   * `@pagefind/default-ui` ships its own English copy and is not part of the
   * `src/i18n` pipeline, so it needs a separate set of keys.
   */
  pagefind: {
    placeholder: string;
    searchLabel: string;
    clearSearch: string;
    searching: string;
    zeroResults: string;
    oneResult: string;
    manyResults: string;
    loadMore: string;
    filtersLabel: string;
  };
  notFound: {
    title: string;
    message: string;
    goHome: string;
  };
}
