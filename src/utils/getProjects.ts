import projectsData from "@/data/projects.json";

export type Project = {
  name: string;
  description?: string;
  techStack?: string[];
  /**
   * Free-form labels attached to the project.
   *
   * They take part in the same cross-collection tag system as the blog
   * posts, the notes and the literary works, so that clicking a tag shows
   * every kind of content carrying it.
   */
  tags?: string[];
  github?: string;
  demo?: string;
  screenshot?: string;
  featured?: boolean;
  order?: number;
  /**
   * When the project was started.
   *
   * Stored as an ISO string rather than a `Date`, because the file is
   * edited by the CMS as plain JSON: a `Date` would have to be written
   * back as a string anyway.
   */
  pubDatetime?: string;
};

/**
 * Projects live in a plain JSON file so that Pages CMS can edit them with
 * a simple form. Returns them sorted by explicit order, then alphabetically.
 */
export function getProjects(): Project[] {
  const projects = (projectsData.projects ?? []) as Project[];
  return [...projects].sort((a, b) => {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

/**
 * The projects, newest first.
 *
 * The project grid shows them in the order the author arranged them with
 * the `order` field, but a section that is headed "最近项目" has to live
 * up to its name: it shows the projects that were started most recently.
 *
 * The tie-break is the same one the timeline uses, so that two projects
 * started on the same day keep a stable order from one build to the next.
 */
export function getProjectsByDate(): Project[] {
  return [...getProjects()].sort((a, b) => {
    const diff = getProjectDate(b).getTime() - getProjectDate(a).getTime();
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

/**
 * The moment a project was started, as a `Date`.
 *
 * A project without a date is dated to the epoch rather than to "now": the
 * timeline has to be a stable order, and a project that floated to the top
 * of it on every build would make the page unreadable. Such a project
 * simply falls to the bottom of the timeline.
 */
export function getProjectDate(project: Project): Date {
  if (!project.pubDatetime) return new Date(0);
  const date = new Date(project.pubDatetime);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}
