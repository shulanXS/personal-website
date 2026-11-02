/**
 * A focused measurement of the notes wall.
 *
 * The layout audit reports problems in general terms. This script measures
 * the three things that matter about the wall — that the date stays in its
 * own margin, that the prose and the foot of an entry end on the same
 * line, and that the index and the groups agree with each other — and
 * prints the numbers so the geometry can be judged rather than guessed at.
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
    await page.waitForTimeout(350);

    const r = await page.evaluate(() => {
      const round = n => Math.round(n);

      /*
       * The wall exists on the notes listing. The home page has a
       * section of recent notes that uses the same components, but no
       * month groups and no index.
       */
      const wall = document.querySelector(".app-notes-wall");
      const groups = [...document.querySelectorAll(".app-notes-group")];
      const index = document.querySelector(".app-notes-index");

      const box = el => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { l: round(b.left), r: round(b.right), w: round(b.width) };
      };

      const entries = [...document.querySelectorAll(".app-note-entry")].slice(0, 3);

      return {
        hasWall: !!wall,
        wall: box(wall),
        index: index ? { ...box(index), display: getComputedStyle(index).display } : null,
        groups: groups.length,
        indexItems: document.querySelectorAll("[data-notes-index-item]").length,
        entries: entries.map(entry => {
          const when = entry.querySelector(".app-note-entry-when");
          const body = entry.querySelector(".app-note-entry-body");
          const prose = entry.querySelector(".app-note-entry-prose");
          const foot = entry.querySelector(".app-note-entry-foot");

          const wBox = box(when);
          const bBox = box(body);
          const pBox = box(prose);
          const fBox = box(foot);

          /*
           * On a narrow screen the date sits *above* the entry rather
           * than beside it, so the two boxes overlap in the horizontal
           * direction and the gap between them says nothing. The
           * layout is told apart by the columns of the entry itself.
           */
          const stacked = getComputedStyle(entry).gridTemplateColumns
            .split(" ")
            .length < 2;

          return {
            when: wBox,
            body: bBox,
            prose: pBox,
            foot: fBox,
            stacked,
            /*
             * The gap between the margin and the text. It has to be
             * positive: a date that overlaps the writing is the one fault
             * this layout must not have.
             */
            gap: !stacked && wBox && bBox ? round(bBox.l - wBox.r) : null,
            /*
             * The prose and the foot have to end on the same line, so
             * that the note reads as one column rather than as two of
             * different widths.
             */
            measureSkew: pBox && fBox ? round(fBox.r - pBox.r) : null,
            day: entry.querySelector(".app-note-entry-day")?.textContent?.trim(),
            weekday: entry.querySelector(".app-note-entry-weekday")?.textContent?.trim(),
            time: entry.querySelector(".app-note-entry-time")?.textContent?.trim(),
          };
        }),
      };
    });

    if (!r.hasWall && r.entries.length === 0) {
      console.log(`${vp.n}/${name}: no notes`);
      continue;
    }

    console.log(`\n=== ${vp.n}/${name} (${path}) ===`);
    console.log(
      `wall=[${r.wall ? r.wall.l + ".." + r.wall.r : "?"}]` +
        ` index=[${r.index ? r.index.l + ".." + r.index.r : "-"}]${r.index ? " display=" + r.index.display : ""}` +
        ` groups=${r.groups} indexItems=${r.indexItems}`
    );
    for (const [i, e] of r.entries.entries()) {
      console.log(
        `  [${i}] when=[${e.when ? e.when.l + ".." + e.when.r : "?"}]` +
          ` body=[${e.body ? e.body.l + ".." + e.body.r : "?"}]` +
          (e.stacked ? " stacked" : ` gap=${e.gap}`) +
          ` measureSkew=${e.measureSkew}` +
          ` "${e.day} ${e.weekday} ${e.time}"`
      );
    }
  }
  await ctx.close();
}

await browser.close();
