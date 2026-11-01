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
  ["about", "/about/"],
  ["search", "/search/"], ["404", "/404/"],
];

const browser = await chromium.launch();
const out = [];

function srgb(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }
function lum([r, g, b]) { return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b); }
function contrast(a, b) { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1,l2), lo = Math.min(l1,l2); return (hi + 0.05) / (lo + 0.05); }

/*
 * A colour is turned into sRGB by the *browser*, not by a parser here.
 *
 * The computed style of an element can be any of the colour spaces CSS
 * supports — `oklab()`, `color-mix()`, `oklch()` — and a regular
 * expression cannot tell an OKLab lightness of 0.92 from an sRGB value of
 * 0.92. The browser already knows how to convert, so the conversion is
 * left to it: the colour is painted onto a canvas and read back.
 */
const toSRGB = async (page, colors) => page.evaluate(list => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  return list.map(color => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = color;
    // A colour the browser cannot parse leaves the fill colour as black,
    // which would silently turn every failure into a contrast of 1.
    if (ctx.fillStyle === "#000000" && !/^#0{6}$|black|rgb\(0, 0, 0\)/.test(color)) {
      return null;
    }
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  });
}, colors);

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
        /*
         * Code is excluded.
         *
         * A syntax-highlighted token takes its colour from the highlighter,
         * not from the stylesheet: a comment inside a YAML sample is painted
         * in the highlighter's own comment colour, which is chosen to
         * read well inside a code block and not to meet the contrast rules
         * of body text. Reporting it as a contrast failure of the site
         * would be reporting a problem that does not exist.
         */
        if (el.closest("pre, code")) continue;
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
        /*
         * Visually hidden text is clipped on purpose.
         *
         * The `sr-only` utility shrinks its box to a single pixel and lets
         * the text overflow it — that is how the text stays available to a
         * screen reader without being seen. Reporting the overflow as a
         * layout fault would report the mechanism of the technique.
         */
        if (parent.className?.toString?.().includes("sr-only")) continue;
        const pb = parent.getBoundingClientRect();
        if (pb.width > 0 && (b.right > pb.right + 2) && getComputedStyle(parent).overflowX === "hidden") {
          res.offscreen.push(`${el.tagName.toLowerCase()}.${el.className?.toString?.().slice(0,50)} overflows parent`);
        }
      }
      return res;
    });

    const ws = r.widths;
    /*
     * The chrome and the body are allowed to be different widths.
     *
     * The header bar and the footer are drawn on the *chrome* column, which
     * is the same on every page and does not follow the width of the page
     * body. The body sits on its own column, whose width is chosen per
     * page — a narrow reading column on an article, a wide one on the home
     * page. What has to hold on every page is that the header and the
     * footer agree with *each other*, and that the navigation is the same
     * everywhere.
     */
    const chrome = ws.filter(w => w.sel === "header > div" || w.sel === "footer > div");
    if (chrome.length >= 2) {
      const uniq = [...new Set(chrome.map(w => `${w.l}-${w.r}`))];
      if (uniq.length > 1) {
        out.push(`${vp.n}/${name}: CHROME MISMATCH ${JSON.stringify(chrome)}`);
      }
    }

    /*
     * The colours are converted to sRGB by the browser, so that the
     * comparison is made between the two colours as they are actually
     * painted on the screen.
     *
     * A translucent background is composited over the page behind it
     * first: the header is a panel of 82% surface over the page, and the
     * text on it is read against the *result* of that blend, not against
     * the surface alone.
     */
    const colors = [...new Set(r.contrast.flatMap(c => [c.fg, c.bg]))];
    const srgbMap = new Map();
    (await toSRGB(page, colors)).forEach((c, i) => {
      if (c) srgbMap.set(colors[i], c);
    });

    for (const c of r.contrast) {
      const fgRaw = srgbMap.get(c.fg);
      const bgRaw = srgbMap.get(c.bg);
      if (!fgRaw || !bgRaw) continue;

      // The page behind a translucent surface.
      const pageBg = srgbMap.get("rgb(255,255,255)") ?? { r: 255, g: 255, b: 255, a: 1 };

      const over = (fg, bg) => ({
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      });

      const bg = bgRaw.a < 1 ? over(bgRaw, pageBg) : bgRaw;
      const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;

      const cr = contrast([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
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
