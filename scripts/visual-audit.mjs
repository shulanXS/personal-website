import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:4321";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["home", "/"],
  ["posts", "/posts/"],
  ["post-detail", "/posts/astro-paper-v5/"],
  ["notes", "/notes/"],
  ["writing", "/writing/"],
  ["writing-detail", "/writing/chapter-one/"],
  ["projects", "/projects/"],
  ["about", "/about/"],
  ["search", "/search/"],
  ["404", "/404/"],
];

const VIEWPORTS = [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
];

const browser = await chromium.launch();
const problems = [];

for (const [vpName, viewport] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();

  /*
   * The path the page is currently on.
   *
   * The 404 page answers with the 404 status, and the browser reports that
   * as a console error. It is the page doing exactly what it should, so it
   * is not counted as a fault of the site.
   */
  let currentPath = "";

  const consoleErrors = [];
  page.on("console", m => {
    if (m.type() !== "error") return;
    if (m.text().includes("Failed to load resource") && currentPath === "/404/")
      return;
    consoleErrors.push(`${m.text()}`);
  });
  page.on("pageerror", e => consoleErrors.push(`PAGEERROR: ${e.message}`));

  for (const [name, path] of PAGES) {
    consoleErrors.length = 0;
    currentPath = path;
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 20000 });
    } catch (e) {
      problems.push(`${vpName}/${name}: NAV FAILED ${e.message}`);
      continue;
    }
    await page.waitForTimeout(400);

    // 1. horizontal overflow
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      const bad = [];
      const vw = de.clientWidth;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > vw + 2 || r.left < -2) {
          const cs = getComputedStyle(el);
          if (cs.position === "fixed") continue;
          bad.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString?.() ?? "").slice(0, 90),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, bad: bad.slice(0, 8) };
    });
    if (overflow.scrollW > overflow.clientW + 2) {
      problems.push(`${vpName}/${name}: H-OVERFLOW scrollW=${overflow.scrollW} clientW=${overflow.clientW}\n      ` +
        overflow.bad.map(b => `<${b.tag} class="${b.cls}"> left=${b.left} right=${b.right}`).join("\n      "));
    }

    // 2. zero-size / invisible text elements
    const invisible = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("[data-i18n]")) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (cs.display === "none" || cs.visibility === "hidden") continue;
        if (el.className?.toString?.().includes("sr-only")) continue;
        if (el.offsetParent === null && cs.position !== "fixed") continue;
        if (r.width === 0 && r.height === 0) {
          out.push(`<${el.tagName.toLowerCase()} class="${el.className?.toString?.().slice(0,80)}"> zero-size`);
        }
      }
      return out;
    });
    invisible.forEach(i => problems.push(`${vpName}/${name}: ${i}`));

    // 3. contrast / font check: any element with tiny font
    const tiny = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("main *, footer *, header *")) {
        if (!el.textContent?.trim()) continue;
        if (el.children.length > 0) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 11) out.push(`<${el.tagName.toLowerCase()}> ${fs}px "${el.textContent.trim().slice(0,30)}"`);
      }
      return [...new Set(out)].slice(0, 5);
    });
    tiny.forEach(t => problems.push(`${vpName}/${name}: TINY FONT ${t}`));

    // 4. console errors
    consoleErrors.forEach(e => problems.push(`${vpName}/${name}: CONSOLE ${e}`));

    await page.screenshot({ path: `${OUT}/${vpName}-${name}.png`, fullPage: false });
  }
  await ctx.close();
}

// ---- Interaction test: language switch + view transitions ----
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push(`PAGEERROR: ${e.message}`));
page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });

await page.goto(BASE + "/", { waitUntil: "networkidle" });
const before = await page.locator("header #menu-items > li > a").first().innerText();
await page.locator("#lang-btn").click();
await page.waitForTimeout(600);
const after = await page.locator("header #menu-items > li > a").first().innerText();
const htmlLang = await page.evaluate(() => document.documentElement.lang);
console.log(`LANG SWITCH: "${before}" -> "${after}"  html.lang=${htmlLang}`);
if (before === after) problems.push(`LANG SWITCH: header text did not change (${before})`);

// theme button
await page.locator("#theme-btn").click();
await page.waitForTimeout(300);
const themeAttr = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
console.log(`THEME TOGGLE -> ${themeAttr}`);

// navigate via client router
await page.locator("header #menu-items > li > a").first().click();
await page.waitForTimeout(1200);
const url = page.url();
console.log(`CLIENT NAV -> ${url}`);
if (!url.includes("posts")) problems.push(`CLIENT NAV: expected /posts, got ${url}`);

// check the script-driven features survived the transition
const hasProgress = await page.evaluate(() => !!document.querySelector("#reading-progress, .reading-progress"));
console.log(`progress bar present after nav: ${hasProgress}`);

errs.forEach(e => problems.push(`interaction: ${e}`));
await ctx.close();

await browser.close();

console.log(`\n===== PROBLEMS (${problems.length}) =====`);
for (const p of problems) console.log(" • " + p);
