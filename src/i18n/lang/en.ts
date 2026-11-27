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
      "Wenjie Che holds a master’s degree in Computer Science. Explore his applied AI projects, technical articles, fiction, and writing on film and games.",
  },
  share: {
    rating: "Rating",
    affinity: "Character affinity",
    gameplay: "Gameplay",
    open: "Save as image",
    saved: "Image saved",
    imageError: "Could not load an illustration. Check your connection and try again.",
    renderError: "Could not render the full image on this device. Close other tabs and try again.",
  },
  nav: {
    home: "Home",
    posts: "Blog",
    notes: "Notes",
    writing: "Personal Writing",
    projects: "Projects",
    about: "About",
    search: "Search",
  },
  socials: {
    github: "GitHub",
    wechat: "WeChat",
    mail: "Send an email",
    mailTo: "Send an email to Wenjie Che",
    copyToClipboard: "Copy to clipboard",
    copied: "Copied to clipboard",
    copyFailed: "Copy failed — please copy it manually",
  },
  post: {
    publishedAt: "Published at",
    updatedAt: "Updated",
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
  posts: {
    /**
     * The number of articles in a year, e.g. "7 posts".
     *
     * It is written on the heading of the year group, and it follows the
     * tag filter: the figure is the number of articles the reader will
     * actually see, not the number the year holds in total.
     */
    yearCount: "{{0}} posts",
  },
  home: {
    /**
     * The one-line identity shown above the name in the hero section.
     */
    identity: "Master’s degree in Computer Science · Applied AI",
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
     *
     * It says that the site is alive: the reader should know that
     * coming back is worth it, because something new will be here.
     */
    about:
      "This is my personal corner of the web: quick notes, technical articles, and some creative writing in my spare time. I keep it seriously — every now and then something new shows up here.",
    /**
     * The three keywords that echo the content sections of the site.
     */
    keywords: "Applied AI · Tech Notes · Creative Writing",
    /** The label of the RSS feed link in the hero. */
    rss: "Subscribe via RSS",
    /** The heading of the activity timeline on the home page. */
    activity: "Recent Activity",
    /** The sentence under the heading of the activity timeline. */
    activityDesc:
      "Everything that has happened on this site — notes, articles, writing and projects — in the order it happened.",
    /** Shown when the timeline has nothing to show. */
    activityEmpty: "Nothing has been published yet.",
    /** The heading of the notes section on the wide layout. */
    recentNotes: "Recent Notes",
    /** The heading of the projects section on the wide layout. */
    featuredProjects: "Recent Projects",
    /** The heading of the posts section on the wide layout. */
    recentPosts: "Recent Posts",
    /** The heading of the writing section on the wide layout. */
    recentWriting: "Recent Writing",
    allPosts: "All Posts",
    allNotes: "All Notes",
    allWriting: "All Writing",
    allProjects: "All Projects",
  },
  /**
   * The labels of the activity timeline.
   */
  activity: {
    /** A note — a short, personal entry. */
    note: "Note",
    /** A technical article. */
    post: "Post",
    /** A piece of literary work. */
    writing: "Personal Writing",
    /** A project. */
    project: "Project",
  },
  notes: {
    expand: "Expand",
    collapse: "Collapse",
    /** The heading of the month index beside the notes. */
    byMonth: "By month",
    /** The number of notes of a month, e.g. "3 notes". */
    monthCount: "{{0}} notes",
    /** The number of notes of a month, in the singular. */
    monthCountOne: "{{0}} note",
    /** The number of notes of a month in the index — just the figure. */
    monthCountShort: "{{0}}",
  },
  tags: {
    all: "All",
    empty: "Nothing here under this tag yet.",
    /**
     * The button that clears the filter when nothing matched.
     *
     * It is the way back: without it, a reader whose filter came out
     * empty is left with a sentence and no way to undo the filter.
     */
    emptyReset: "Clear the filter",
    /** The label of the level of the writing filter that holds the tags. */
    title: "By tag",
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
    review: "Review",
    game: "Game Reviews",
    gameRatingAccessible: "Gameplay experience {{0}} / 5",
    character: "Character Analysis",
    playReview: "Game Review",
    short: "Short Story",
    series: "Series",
    standalone: "Standalone Works",
    ongoing: "Ongoing",
    completed: "Completed",
    tableOfContents: "Table of Contents",
    chapterNavigation: "Chapter navigation",
    chapter: "Chapter {{0}}",
    /**
     * The number of chapters of a series, e.g. "7 chapters in total".
     *
     * The phrase says "in total" because the count is the whole of the
     * series and not just the part that is finished: a series that is
     * still being written has chapters too, and how many of them there
     * are says more than whether it is over.
     */
    chapters: "{{0}} chapters in total",
    characters: "about {{0}} characters",
    type: "Type",
    chapterCount: "Chapters",
    length: "Length",
    period: "Period",
    /** The label of the first level of the writing filter. */
    byType: "By type",
    /** The label of the second level of the writing filter. */
    byWork: "By work",
    /** The option that clears one level of the writing filter. */
    allWorks: "All works",
    /**
     * The button that opens the rest of the works of the writing filter.
     *
     * The list of works is long — every stand-alone piece carries its
     * whole title — so the second level shows the series first and keeps
     * the rest behind a button that says how many are waiting.
     */
    moreWorks: "More works ({{0}})",
    /**
     * The label of the level of the filter that says how the works are
     * put in order.
     */
    bySort: "Sort by",
    /**
     * The order that puts the newest work first.
     *
     * It is the order the page is written in, so choosing it is the
     * same as choosing not to sort at all.
     */
    sortNewest: "Newest",
    /**
     * The order that puts the best-scored work first.
     */
    sortHighest: "Highest rated",
    /**
     * The order that puts the worst-scored work first.
     */
    sortLowest: "Lowest rated",
    /** The floating button that returns from a chapter to the list. */
    backToList: "Back",
    /**
     * The score itself, with nothing around it, e.g. "4.3".
     *
     * The score is supplied by the page as `{{0}}`, so that the same label
     * serves a score of any value.
     */
    ratingNumber: "{{0}}",
    /**
     * The accessible name of the group of stars, e.g. "Rating 4.5 / 5".
     *
     * The stars are a picture, so without a name a reader who cannot see
     * them would be told nothing at all. The name repeats the number, so
     * that the score is said as well as drawn.
     */
    ratingAccessible: "Rating {{0}} / 5",
    characterAffinityAccessible: "Character affection {{0}} / 5",
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
  documentTitle: "{{0}} | {{1}}",
  pages: {
    tagTitle: "Tag",
    tagDesc: "All the articles with the tag",

    tagsTitle: "Tags",
    tagsDesc: "All the tags used in posts.",

    postsTitle: "Blog",
    postsDesc: "All the articles I've posted.",
    postsEmpty: "No articles yet.",

    notesTitle: "Notes",
    notesDesc: "Short thoughts, daily records and quick notes.",
    notesEmpty: "No notes yet.",

    writingTitle: "Personal Writing",
    writingDesc:
      "Stories and reflections on what I read, watch, and play. Original novels tell longer stories; short stories capture brief flights of imagination; essays explore everyday thoughts; reviews reflect on works as a whole; character analyses take a closer look at people in film, television, fiction, and games.",
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
    identity: "Master’s degree in Computer Science · Applied AI",
    lead: "Hi, I’m Wenjie Che. I build AI applications and write fiction. I write about engineering in English. When a scene stays with me after a film, or I find myself returning to a game, I usually write about it in Chinese.",
    sections: [
      {
        title: "What I build",
        body: [
          "My projects include retrieval-augmented generation (RAG) systems and an interview assistant. Retrieval raises a question I keep coming back to. Once a system has found several relevant sources, how does it know it has enough evidence to answer?",
          "I explore questions like this in my technical articles, from deciding when a search can stop to replaying tool calls and checking whether the evidence supports an answer.",
        ],
      },
      {
        title: "Fiction, film, and games",
        body: [
          "My novel Snow Falls on the River begins in a hospital ward in southern China. Its seven chapters follow an intern and a patient of the same age through the days after they meet.",
          "My reviews often begin with a small gesture. In The Dark Knight, a passenger on a ferry raises a detonator, then lowers his hand. I also write about characters I understand differently the second time around, and games whose familiar paths I still want to walk.",
        ],
      },
    ],
    hereTitle: "What lives here",
    hereItems: [
      {
        label: "Blog",
        desc: "Technical articles in English on retrieval, tool use, and evaluating AI systems.",
        route: "posts",
      },
      {
        label: "Notes",
        desc: "Short notes from everyday life.",
        route: "notes",
      },
      {
        label: "Personal Writing",
        desc: "Snow Falls on the River, essays, film and game reviews, and character studies.",
        route: "writing",
      },
      {
        label: "Projects",
        desc: "Retrieval systems, interview tools, and other software projects.",
        route: "projects",
      },
    ],
    contactTitle: "Get in touch",
    contactDesc:
      "If you have thoughts on anything above, or just want to say hello, you can reach me directly.",
    contactLabels: {
      github: "GitHub",
      wechat: "WeChat",
      email: "Email",
    },
    contactCopyHint: "Click to copy",
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
