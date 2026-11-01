import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const browser = await chromium.launch();

const VPS = [320, 360, 390, 430, 768, 834, 1024, 1280, 1440, 1920];
const PAGES = [
  ["home", "/"], ["notes", "/notes/"], ["about", "/about/"],
  ["posts", "/posts/"], ["writing", "/writing/"], ["projects", "/projects/"],
  ["search", "/search/"],
];

for (const w of VPS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  const bad = [];

  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const r = await page.evaluate(() => {
      const problems = [];
      const vw = document.documentElement.clientWidth;

      // 1. horizontal overflow
      if (document.documentElement.scrollWidth > vw + 2) {
        problems.push(`overflow ${document.documentElement.scrollWidth}>${vw}`);
      }

      // 2. elements sticking out of the viewport
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.right > vw + 2 || b.left < -2) {
          const cls = el.className?.toString?.().slice(0, 40);
          problems.push(`out-of-viewport ${el.tagName.toLowerCase()}.${cls} [${Math.round(b.left)}..${Math.round(b.right)}]`);
          break;
        }
      }

      // 3. text that overlaps its neighbour (siblings)
      const containers = [...document.querySelectorAll("main section, main article, main ul, header ul, footer div")];
      for (const c of containers) {
        const kids = [...c.children].filter(k => {
          const b = k.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && getComputedStyle(k).position !== "absolute";
        });
        for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 4 && oy > 4) {
            problems.push(`overlap ${kids[i].tagName.toLowerCase()} x ${kids[j].tagName.toLowerCase()} ${Math.round(ox)}x${Math.round(oy)}`);
          }
        }
      }

      // 4. tiny tap targets in the header
      for (const el of document.querySelectorAll("header a, header button")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0) continue;
        if (b.height < 24) {
          problems.push(`small-tap-target header ${el.tagName.toLowerCase()} h=${Math.round(b.height)}`);
        }
      }

      // 5. the note bubble must not overflow its column
      for (const b of document.querySelectorAll(".app-note-bubble")) {
        const bb = b.getBoundingClientRect();
        const col = b.parentElement?.getBoundingClientRect();
        if (col && bb.right > col.right + 2) {
          problems.push(`bubble-overflows ${Math.round(bb.right - col.right)}px`);
        }
      }

      return problems;
    });

    if (r.length) bad.push(`${name}: ${r.join("; ")}`);
  }

  console.log(`\n=== ${w}px ===`);
  if (bad.length === 0) console.log("  OK");
  else bad.forEach(b => console.log("  " + b));
  await ctx.close();
}
await browser.close();
