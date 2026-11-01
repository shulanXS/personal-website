/**
 * A focused measurement of the notes timeline.
 *
 * The layout audit reports problems in general terms. This script measures
 * the one thing that matters about the timeline — whether the date, the
 * rule and the entry stay out of each other's way — and prints the numbers
 * so the geometry can be judged rather than guessed at.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:4321";
const PAGES = [
  ["home", "/"],
  ["notes", "/notes/"],
];

const browser = await chromium.launch();

for (const vp of [
  { n: "desktop", width: 1440, height: 900 },
  { n: "tablet", width: 768, height: 1024 },
  { n: "mobile", width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
  });
  const page = await ctx.newPage();

  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);

    const r = await page.evaluate(() => {
      const list = document.querySelector('ul[data-list-layout="notes"]');
      if (!list) return null;

      const listBox = list.getBoundingClientRect();
      const listCS = getComputedStyle(list);

      // The rule drawn by the list's ::before.
      const ruleCS = getComputedStyle(list, "::before");
      const ruleLeft =
        ruleCS.content !== "none" && ruleCS.width !== "auto"
          ? listBox.left + parseFloat(ruleCS.left)
          : null;

      const items = [...list.querySelectorAll(":scope > li")].slice(0, 3);

      return {
        isColumn: listCS.display,
        gap: listCS.rowGap,
        ruleLeft,
        items: items.map(li => {
          const box = li.getBoundingClientRect();
          const date = li.querySelector(".app-timeline-date");
          const article = li.querySelector(":scope > article");
          const dBox = date?.getBoundingClientRect();
          const aBox = article?.getBoundingClientRect();

          // The node dot drawn by the li's ::before.
          const dotCS = getComputedStyle(li, "::before");
          const dot =
            dotCS.content !== "none" && dotCS.width !== "auto"
              ? {
                  left: box.left + parseFloat(dotCS.left),
                  right:
                    box.left +
                    parseFloat(dotCS.left) +
                    parseFloat(dotCS.width),
                  top: box.top + parseFloat(dotCS.top),
                }
              : null;

          // The two lines of the stacked date.
          const times = [...(date?.querySelectorAll("time") ?? [])].map(t => {
            const tb = t.getBoundingClientRect();
            return { text: t.textContent?.trim(), l: tb.left, r: tb.right };
          });

          return {
            date: dBox ? { l: dBox.left, r: dBox.right, w: dBox.width } : null,
            article: aBox
              ? { l: aBox.left, r: aBox.right, w: aBox.width }
              : null,
            dot,
            times,
            // How far the date reaches past the column it should stay in.
            dateOverflows:
              dBox && ruleLeft !== null
                ? Math.round(Math.max(0, dBox.right - ruleLeft))
                : null,
          };
        }),
      };
    });

    if (!r) {
      console.log(`${vp.n}/${name}: no notes timeline`);
      continue;
    }

    console.log(`\n=== ${vp.n}/${name} (${path}) ===`);
    console.log(
      `list display=${r.isColumn} gap=${r.gap} ruleLeft=${r.ruleLeft}`
    );
    for (const [i, it] of r.items.entries()) {
      const times = it.times
        .map(t => `"${t.text}"[${Math.round(t.l)}..${Math.round(t.r)}]`)
        .join(" ");
      console.log(
        `  [${i}] date=[${it.date ? Math.round(it.date.l) + ".." + Math.round(it.date.r) : "?"}]` +
          ` article=[${it.article ? Math.round(it.article.l) + ".." + Math.round(it.article.r) : "?"}]` +
          ` dot=[${it.dot ? Math.round(it.dot.left) + ".." + Math.round(it.dot.right) : "none"}]` +
          ` times=${times}` +
          ` dateOverflowsRule=${it.dateOverflows}`
      );
    }
  }
  await ctx.close();
}

await browser.close();
