import type { APIRoute } from "astro";
import { getHomeFingerprint } from "@/utils/homeFingerprint";

/**
 * The version of the home page's content.
 *
 * The home page is a static snapshot, so a reader who comes back later
 * may be looking at a page that is out of date. This endpoint is what
 * the browser asks to find out: it is a tiny file that changes whenever
 * the content of the home page changes, and comparing it with the version
 * the page was rendered with is how the reader learns that something is
 * new.
 *
 * The file is served with a short cache lifetime. A longer one would
 * defeat the purpose — the browser would be told about the new version
 * only after it had already decided not to ask.
 */
export const GET: APIRoute = async () => {
  const fingerprint = await getHomeFingerprint();

  return new Response(
    JSON.stringify({
      /** The fingerprint of the content the home page is built from. */
      fingerprint,
      /** The moment the site was built, as an ISO timestamp. */
      buildTime: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // The answer changes only when the content changes, and the point
        // of asking is to find out as soon as possible whether it did.
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    }
  );
};
