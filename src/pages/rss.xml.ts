import rss from "@astrojs/rss";
import { getPublishedPosts } from "@/utils/content";
import { getPostUrl } from "@/utils/getPostPaths";
import { useTranslations } from "@/i18n";
import config from "@/config";

export async function GET() {
  const sortedPosts = await getPublishedPosts();
  const t = useTranslations(config.site.uiLang);

  return rss({
    title: t.site.title,
    description: t.site.description,
    site: config.site.url,
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: getPostUrl(id, filePath, config.site.lang),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
