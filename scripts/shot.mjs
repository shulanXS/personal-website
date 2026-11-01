import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:4321";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const PAGES = process.argv[2]
  ? [[process.argv[2], process.argv[2]]]
  : [
      ["home", "/"],
      ["notes", "/notes/"],
      ["posts", "/posts/"],
    ];
const VP = process.argv[3] === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VP });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });

for (const [name, path] of PAGES) {
  await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}-${VP.width}.png`, fullPage: true });
  const ow = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
  console.log(name, "overflow:", ow.s - ow.c);
}
errs.forEach(e => console.log("ERR", e));
await browser.close();
