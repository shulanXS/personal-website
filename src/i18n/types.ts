export interface UIStrings {
  /**
   * The identity of the site.
   *
   * The name, the author and the one-line description are part of the
   * interface, not part of the configuration: they are shown in the header,
   * in the footer, in the metadata of every page and in the social buttons.
   * Switching the interface language therefore has to switch them too —
   * with one deliberate exception: the name itself is never translated.
   * "Wenjie Che" stays "Wenjie Che" in both interfaces, because a name is
   * not a phrase: rendering it as "车文杰" in the Chinese interface would
   * read as an alias rather than as the person it refers to.
   */
  site: {
    /** The name of the site — also the name of its author. */
    title: string;
    /**
     * The name of the person, written in the language of the interface.
     *
     * The site title is a brand and never changes; this one follows the
     * interface language, so the Chinese interface shows 车文杰 and the
     * English one shows Wenjie Che.
     */
    name: string;
    /** The name of the author, as it appears in the copyright line. */
    author: string;
    /** The one-line description of the site. */
    description: string;
  };
  nav: {
    home: string;
    posts: string;
    notes: string;
    writing: string;
    projects: string;
    about: string;
    search: string;
  };
  /**
   * The accessible labels of the social buttons.
   *
   * The labels are part of the interface: a Chinese interface says
   * "发送邮件" where the English one says "Send an email".
   */
  socials: {
    github: string;
    wechat: string;
    mail: string;
    /** The label of the mail button, with the name of the site in it. */
    mailTo: string;
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
    /** The heading of the navigation column in the footer. */
    navTitle: string;
    /** The heading of the column that lists the most recent writing. */
    recentTitle: string;
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
  /**
   * The "About me" page.
   *
   * The page is a small biography in fixed sections: a heading, a lead
   * paragraph, and then a list of titled sections. The structure is fixed
   * here rather than in the page, so that the two languages always have
   * the same sections in the same order.
   */
  about: {
    /** The title of the page. */
    title: string;
    /** The one-line description under the title. */
    desc: string;
    /** The short identity line next to the avatar. */
    identity: string;
    /** The lead paragraph. */
    lead: string;
    /** The titled sections, in the order they are shown. */
    sections: {
      /** The heading of a section. */
      title: string;
      /** The paragraphs of a section. */
      body: string[];
    }[];
    /** The heading above the list of things the site holds. */
    hereTitle: string;
    /** The items of the list of things the site holds. */
    hereItems: {
      /**
       * The name of one thing the site holds.
       */
      label: string;
      /** What that thing is. */
      desc: string;
      /**
       * The route the item links to.
       *
       * The route is part of the dictionary rather than being paired with
       * the items by position: a positional pairing breaks silently the
       * moment one translation adds, removes or reorders an item.
       */
      route: "posts" | "notes" | "writing" | "projects";
    }[];
    /** The heading above the contact links. */
    contactTitle: string;
    /** The sentence above the contact links. */
    contactDesc: string;
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
    /** The accessible label of the navigation column in the footer. */
    footerNav: string;
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
