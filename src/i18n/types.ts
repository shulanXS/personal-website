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
    /** The label of a button that copies a value (e.g. a WeChat ID). */
    copyToClipboard: string;
    /** The toast shown after a value has been copied. */
    copied: string;
    /** The toast shown when the clipboard could not be written to. */
    copyFailed: string;
  };
  post: {
    publishedAt: string;
    updatedAt: string;
    sharePostIntro: string;
    sharePostOn: string;
    sharePostViaEmail: string;
    /**
     * The label of each sharing button, keyed by platform.
     *
     * One entry per platform rather than one template plus a parameter,
     * because the platform's own name differs between the languages —
     * 微信 in Chinese, WeChat in English — and a parameter would freeze
     * whichever one the page was rendered with.
     */
    sharePlatforms: Record<string, string>;
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
  posts: {
    /**
     * The number of articles in a year, e.g. "7 篇" / "7 posts".
     *
     * It is written on the heading of the year group, and it follows the
     * tag filter: the figure is the number of articles the reader will
     * actually see, not the number the year holds in total.
     */
    yearCount: string;
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
    /** The heading of the activity timeline on the home page. */
    activity: string;
    /** The sentence under the heading of the activity timeline. */
    activityDesc: string;
    /** Shown when the timeline has nothing to show. */
    activityEmpty: string;
    /** The heading of the notes section on the wide layout. */
    recentNotes: string;
    /** The heading of the projects section on the wide layout. */
    featuredProjects: string;
    /** The heading of the posts section on the wide layout. */
    recentPosts: string;
    /** The heading of the writing section on the wide layout. */
    recentWriting: string;
    allPosts: string;
    allNotes: string;
    allWriting: string;
    allProjects: string;
  };
  /**
   * The labels of the activity timeline.
   *
   * The timeline holds every kind of content at once, so each entry needs
   * to say what kind of thing it is.
   */
  activity: {
    /** A note — a short, personal entry. */
    note: string;
    /** A technical article. */
    post: string;
    /** A piece of literary work. */
    writing: string;
    /** A project. */
    project: string;
  };
  notes: {
    /** Label of the button that expands a clamped note in place. */
    expand: string;
    /** Label of the button that collapses an expanded note again. */
    collapse: string;
    /**
     * The heading of the month index beside the notes.
     *
     * The index is a way to find a note by the month it was written in, so
     * the heading says what the column lists.
     */
    byMonth: string;
    /**
     * The number of notes of a month, e.g. "3 条" / "3 notes".
     *
     * The number is supplied by the page as `{{0}}`, so the label follows
     * the interface language. The English form needs a singular of its
     * own — "1 note" and "2 notes" are two different words — so the
     * count is written in one of two keys.
     */
    monthCount: string;
    /**
     * The number of notes of a month, in the singular: "1 条" / "1 note".
     */
    monthCountOne: string;
    /**
     * The number of notes of a month in the month index, where there is
     * no room for the word itself: just the figure.
     */
    monthCountShort: string;
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
    /**
     * The button that clears the filter when nothing matched.
     *
     * It is the way back: without it, a reader whose filter came out
     * empty is left with a sentence and no way to undo the filter.
     */
    emptyReset: string;
    /**
     * The label of the level of the writing filter that holds the tags,
     * e.g. "按标签".
     */
    title: string;
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
    tableOfContents: string;
    chapterNavigation: string;
    /**
     * The label of a chapter's number in a listing, e.g. "第 3 章".
     *
     * The number is supplied by the page as `{{0}}`, so that the same
     * label serves a series of any length.
     */
    chapter: string;
    /**
     * The number of chapters of a series, e.g. "共 7 章".
     *
     * The count is the whole of the series, whether it is finished or
     * not — a series that is still being written has chapters too.
     */
    chapters: string;
    /**
     * The length of a work, e.g. "约 2.6 万字".
     *
     * The count itself is supplied by the page as `{{0}}`, already
     * formatted for the active language.
     */
    characters: string;
    /**
     * The label of the kind of a work, e.g. "类型".
     */
    type: string;
    /**
     * The label of the number of chapters, e.g. "章节".
     */
    chapterCount: string;
    /**
     * The label of the length of a work, e.g. "字数".
     */
    length: string;
    /**
     * The label of the period a work spans, e.g. "起止".
     */
    period: string;
    /**
     * The label of the first level of the writing filter, e.g. "按类型".
     */
    byType: string;
    /**
     * The label of the second level of the writing filter, e.g. "按作品".
     */
    byWork: string;
    /**
     * The option that clears one level of the writing filter, e.g. "全部作品".
     */
    allWorks: string;
    /**
     * The label of the floating button that returns from a chapter to the
     * list of works, e.g. "返回".
     */
    backToList: string;
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
  /**
   * The title of the browser tab.
   *
   * `{{0}}` is the name of the page and `{{1}}` the name of the site. The
   * separator lives in the dictionary so that a language may order the
   * two differently.
   */
  documentTitle: string;
  pages: {
    tagTitle: string;
    tagDesc: string;

    tagsTitle: string;
    tagsDesc: string;

    postsTitle: string;
    postsDesc: string;
    postsEmpty: string;

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
    /**
     * The labels of the visible contact details.
     *
     * The icons alone do not tell a visitor *what* to write to: a WeChat ID
     * and an address have to be readable, not just clickable.
     */
    contactLabels: {
      github: string;
      wechat: string;
      email: string;
    };
    /** The hint next to a value that can be copied. */
    contactCopyHint: string;
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
