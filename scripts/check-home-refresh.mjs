/**
 * A check of the runtime refresh of the home page.
 *
 * It opens the page, waits for the watcher to settle, and then pretends
 * that the site was rebuilt: the version file is made to answer with a
 * different fingerprint, and the served home page is given a marker that
 * the page can be caught by. The page is watched to see whether it puts
 * the new content on the screen by itself.
 *
 * The check is run twice — once on a wide screen and once on a narrow
 * one — because the two layouts of the home page are different pages.
 */

import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:4321";
const DIST = new URL("../dist/", import.meta.url).pathname;

/** The version file, as it is served. */
const VERSION_FILE = `${DIST}home-version.json`;

/** The home page, as it is served. */
const INDEX_FILE = `${DIST}index.html`;

/**
 * The text that is put into the first entry of the recent notes, so that
 * the change on the screen can be seen.
 */
const MARKER = "【运行时刷新标记】";

const originalVersion = readFileSync(VERSION_FILE, "utf8");
const originalIndex = readFileSync(INDEX_FILE, "utf8");

/**
 * Rewrites the served files as if the site had been rebuilt with a new
 * note.
 *
 * The version file answers with a fingerprint that differs from the one
 * the page was rendered with, and the home page carries a note whose
 * text is the marker — so the page can be caught showing the new
 * content.
 */
function writeChangedSite() {
  const body = JSON.parse(originalVersion);
  writeFileSync(
    VERSION_FILE,
    JSON.stringify({ ...body, fingerprint: "changed-fingerprint" })
  );

  /*
   The marker is put into the *first* note of the recent-notes section.
   The section is found by its own attribute, so that the test cannot be
   fooled by a marker somewhere else on the page.
   */
  const html = originalIndex.replace(
    /(<section[^>]*id="recent-notes"[\s\S]*?data-home-section-body[^>]*>)/,
    `$1<span id="refresh-probe">${MARKER}</span>`
  );
  writeFileSync(INDEX_FILE, html);
}

/** Puts the served files back the way they were. */
function restore() {
  writeFileSync(VERSION_FILE, originalVersion);
  writeFileSync(INDEX_FILE, originalIndex);
}

/**
 * Runs the check on one viewport.
 */
async function check(browser, label, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: "networkidle" });

  const before = await page.evaluate(() => ({
    version: document.querySelector("#main-content")?.dataset.homeVersion,
    sections: document.querySelectorAll("[data-home-section]").length,
    hasProbe: !!document.getElementById("refresh-probe"),
    notes: document.querySelectorAll("#recent-notes li").length,
  }));

  /*
   The site is rebuilt while the reader is looking at the page.
   */
  writeChangedSite();

  /*
   The watcher waits before it asks the first time, so the wait here is
   longer than that delay.
   */
  await page.waitForTimeout(20_000);

  const after = await page.evaluate(() => ({
    version: document.querySelector("#main-content")?.dataset.homeVersion,
    hasProbe: !!document.getElementById("refresh-probe"),
    notes: document.querySelectorAll("#recent-notes li").length,
  }));

  await page.screenshot({ path: `/tmp/home-${label}.png`, fullPage: false });

  restore();
  await context.close();

  return { label, before, after, errors };
}

const browser = await chromium.launch();

try {
  const desktop = await check(browser, "desktop", {
    width: 1440,
    height: 900,
  });
  const mobile = await check(browser, "mobile", {
    width: 390,
    height: 844,
  });

  console.log(JSON.stringify({ desktop, mobile }, null, 2));
} finally {
  restore();
  await browser.close();
}
