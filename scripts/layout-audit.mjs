import { chromium } from "playwright";

const BASE = "http://localhost:4321";
/**
 * The pages that are audited.
 *
 * The standalone tag pages and the "about" page no longer exist — the tags
 * live on the search page now, and the about page was removed entirely.
 */
const PAGES = [
  ["home", "/"], ["posts", "/posts/"], ["post-detail", "/posts/astro-paper-v5/"],
  ["notes", "/notes/"],
  ["writing", "/writing/"], ["writing-detail", "/writing/chapter-one/"],
  ["projects", "/projects/"],
  ["search", "/search/"], ["404", "/404/"],
];

const browser = await chromium.launch();
const out = [];

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function lum([r, g, b]) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1,l2), lo = Math.min(l1,l2); return (hi + 0.05) / (lo + 0.05); }
function parseRGB(s) { const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; }

for (const vp of [{ n: "desktop", width: 1440, height: 900 }, { n: "mobile", width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);

    const r = await page.evaluate(() => {
      const res = { widths: [], contrast: [], overlaps: [], nav: null, offscreen: [] };
      /*
       * The container widths are compared by their *content* box.
       *
       * `main` carries the horizontal padding of the layout
       * (`app-layout` → `px-4`), while the header and footer put the padding
       * on their outer container and let the inner element span the full
       * width. Comparing the border boxes would therefore report a 32px
       * difference on every page even though the visible content lines up
       * exactly.
       */
      for (const sel of ["header > div", "main", "footer > div", "nav[aria-label]"]) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const pl = parseFloat(cs.paddingLeft) || 0;
        const pr = parseFloat(cs.paddingRight) || 0;
        res.widths.push({
          sel,
          l: Math.round(b.left + pl),
          r: Math.round(b.right - pr),
          w: Math.round(b.width - pl - pr),
          h: Math.round(b.height),
        });
      }

      const bgOf = el => {
        let e = el;
        while (e) {
          const c = getComputedStyle(e).backgroundColor;
          if (c && !/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/.test(c)) return c;
          e = e.parentElement;
        }
        return "rgb(255,255,255)";
      };
      const seen = new Set();
      for (const el of document.querySelectorAll("main *, header *, footer *")) {
        if (el.children.length) continue;
        const txt = el.textContent?.trim();
        if (!txt) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        if (el.className?.toString?.().includes("sr-only")) continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (cs.opacity !== "1" && parseFloat(cs.opacity) < 0.3) continue;
        const fg = cs.color, bg = bgOf(el);
        const key = fg + "|" + bg + "|" + cs.fontSize;
        if (seen.has(key)) continue;
        seen.add(key);
        res.contrast.push({ tag: el.tagName.toLowerCase(), cls: el.className?.toString?.().slice(0, 60), fg, bg, fs: cs.fontSize, fw: cs.fontWeight, txt: txt.slice(0, 28) });
      }

      const containers = [...document.querySelectorAll("main section, main article, main ul, header ul")];
      for (const c of containers) {
        const kids = [...c.children].filter(k => {
          const b = k.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && getComputedStyle(k).position !== "absolute" && getComputedStyle(k).position !== "fixed";
        });
        for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
          const a = kids[i].getBoundingClientRect(), b = kids[j].getBoundingClientRect();
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 4 && oy > 4) {
            res.overlaps.push({
              a: `${kids[i].tagName.toLowerCase()}.${kids[i].className?.toString?.().slice(0,40)}`,
              b: `${kids[j].tagName.toLowerCase()}.${kids[j].className?.toString?.().slice(0,40)}`,
              ox: Math.round(ox), oy: Math.round(oy),
            });
          }
        }
      }

      const nav = document.querySelector("#menu-items");
      if (nav) {
        const items = [...nav.querySelectorAll("li")].map(li => {
          const b = li.getBoundingClientRect();
          const a = li.querySelector("a");
          return { txt: a?.textContent?.trim().slice(0, 12), w: Math.round(b.width), x: Math.round(b.left), y: Math.round(b.top), active: !!a?.classList.contains("active-nav") };
        });
        res.nav = { items, hidden: getComputedStyle(nav).display === "none" };
      }

      for (const el of document.querySelectorAll("main *")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0) continue;
        const parent = el.parentElement;
        if (!parent) continue;
        const pb = parent.getBoundingClientRect();
        if (pb.width > 0 && (b.right > pb.right + 2) && getComputedStyle(parent).overflowX === "hidden") {
          res.offscreen.push(`${el.tagName.toLowerCase()}.${el.className?.toString?.().slice(0,50)} overflows parent`);
        }
      }
      return res;
    });

    const ws = r.widths;
    if (ws.length >= 2) {
      const uniq = [...new Set(ws.map(w => w.w))];
      if (uniq.length > 1) out.push(`${vp.n}/${name}: CONTAINER WIDTH MISMATCH ${JSON.stringify(ws)}`);
    }
    for (const c of r.contrast) {
      const fg = parseRGB(c.fg), bg = parseRGB(c.bg);
      if (!fg || !bg) continue;
      const cr = contrast(fg, bg);
      const size = parseFloat(c.fs);
      const large = size >= 24 || (size >= 18.66 && parseInt(c.fw) >= 700);
      const min = large ? 3 : 4.5;
      if (cr < min) out.push(`${vp.n}/${name}: LOW CONTRAST ${cr.toFixed(2)}<${min} ${c.tag}.${c.cls} fs=${c.fs} "${c.txt}" fg=${c.fg} bg=${c.bg}`);
    }
    for (const o of r.overlaps) out.push(`${vp.n}/${name}: OVERLAP ${o.a} x ${o.b} (${o.ox}x${o.oy}px)`);
    for (const o of r.offscreen) out.push(`${vp.n}/${name}: CLIPPED ${o}`);
  }
  await ctx.close();
}
await browser.close();

const uniq = [...new Set(out)];
console.log(`PROBLEMS (${uniq.length}):`);
for (const p of uniq) console.log(" - " + p);
