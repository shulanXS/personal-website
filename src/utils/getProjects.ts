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
};

/**
 * Projects live in a plain JSON file so that Pages CMS can edit them with a
 * simple form. Returns them sorted by explicit order, then alphabetically.
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

/** Projects marked as featured, used on the home page. */
export function getFeaturedProjects(): Project[] {
  return getProjects().filter(project => project.featured);
}
