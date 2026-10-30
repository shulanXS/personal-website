import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(`PAGEERROR ${e.message}`));
page.on("console", m => { if (m.type() === "error") errors.push(`CONSOLE ${m.text()}`); });

function ok(name, cond, extra = "") {
  console.log(`${cond ? "PASS " : "FAIL "} ${name} ${extra}`);
}

// --- 1. Collection filtering on /posts/ ---------------------------------
await page.goto(`${BASE}/posts/`, { waitUntil: "networkidle" });
const totalItems = await page.locator("[data-tagged-item]").count();
await page.click('[data-tag-chip="复盘"]');
await page.waitForTimeout(300);
const visibleAfter = await page.locator("[data-tagged-item]:not([hidden])").count();
ok("集合页点击标签过滤", visibleAfter === 1 && visibleAfter < totalItems,
   `[total=${totalItems} visible=${visibleAfter}]`);
ok("过滤后 URL 同步", page.url().includes("tag=%E5%A4%8D%E7%9B%98"), page.url());
const emptyVisible = await page.locator("[data-tag-empty]:not([hidden])").count();
ok("无结果时空态隐藏", emptyVisible === 0);

// --- 2. Clicking "All" resets ------------------------------------------
// After a filter has been applied, the sibling pages of the listing have
// been merged in, so "All" shows the whole collection — not just the four
// entries of the first page.
await page.click('[data-tag-chip=""]');
await page.waitForTimeout(300);
const afterReset = await page.locator("[data-tagged-item]:not([hidden])").count();
ok("点击全部重置过滤", afterReset >= totalItems, `[visible=${afterReset}]`);
ok("重置后 URL 清除 tag", !page.url().includes("tag="), page.url());

// --- 3. Direct link with ?tag= ------------------------------------------
await page.goto(`${BASE}/posts/?tag=${encodeURIComponent("读后感")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const directVisible = await page.locator("[data-tagged-item]:not([hidden])").count();
ok("带 ?tag= 直达自动应用", directVisible === 1, `[visible=${directVisible}]`);

// --- 4. Search page: grouped cross-section results ----------------------
await page.goto(`${BASE}/search/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.click('[data-tag-chip="复盘"]');
await page.waitForTimeout(400);
const groups = await page.locator("[data-tag-group]").count();
const groupNames = await page.locator("[data-tag-group] h3").allTextContents();
ok("搜索页跨区分组结果", groups >= 3, `[groups=${groups} ${JSON.stringify(groupNames)}]`);

// --- 5. ?tag= on the search page ----------------------------------------
await page.goto(`${BASE}/search/?tag=${encodeURIComponent("astro")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(700);
const searchGroups = await page.locator("[data-tag-group]").count();
const searchNames = await page.locator("[data-tag-group] h3").allTextContents();
ok("搜索页 ?tag= 直达", searchGroups >= 3, `[groups=${searchGroups} ${JSON.stringify(searchNames)}]`);

// --- 6. Tag bar exists on all four collection pages ---------------------
for (const [name, path] of [["posts", "/posts/"], ["notes", "/notes/"], ["writing", "/writing/"], ["projects", "/projects/"]]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const bars = await page.locator("[data-tag-bar]").count();
  const chips = await page.locator("[data-tag-bar] [data-tag-chip]").count();
  ok(`${name} 页顶部标签栏`, bars === 1 && chips > 1, `[bars=${bars} chips=${chips}]`);
}

// --- 7. Tags rendered on the cards themselves --------------------------
for (const [name, path] of [["posts", "/posts/"], ["notes", "/notes/"], ["writing", "/writing/"], ["projects", "/projects/"]]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const cardChips = await page.locator("[data-tagged-item] [data-tag-static]").count();
  ok(`${name} 卡片内嵌标签`, cardChips > 0, `[chips=${cardChips}]`);
}

// --- 8. Tags outside the collection bar are not clickable --------------
// Only the tag bar at the top of a collection page filters the listing.
// Everywhere else a tag is metadata and must not be a control.
for (const [name, path] of [["posts", "/posts/"], ["notes", "/notes/"], ["writing", "/writing/"], ["projects", "/projects/"]]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  const clickable = await page.locator("[data-tagged-item] a[data-tag-chip], [data-tagged-item] button[data-tag-chip]").count();
  ok(`${name} 卡片内标签不可点击`, clickable === 0, `[n=${clickable}]`);
}

await page.goto(`${BASE}/posts/astro-paper-v5/`, { waitUntil: "networkidle" });
const staticChip = await page.locator("[data-tag-static]").count();
const clickableOnDetail = await page.locator("a[data-tag-chip], button[data-tag-chip]").count();
ok("详情页标签为静态文本", staticChip > 0 && clickableOnDetail === 0, `[static=${staticChip} clickable=${clickableOnDetail}]`);

// --- 9. No leftover /about or /tags links ------------------------------
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
const aboutLinks = await page.locator('a[href*="/about"]').count();
const tagPageLinks = await page.locator('a[href="/tags/"], a[href*="/tags/"]').count();
ok("无残留 /about 链接", aboutLinks === 0, `[n=${aboutLinks}]`);
ok("无残留 /tags/ 链接", tagPageLinks === 0, `[n=${tagPageLinks}]`);

// --- 10. Date shows hours and minutes ---------------------------------
await page.goto(`${BASE}/posts/`, { waitUntil: "networkidle" });
const dateText = await page.locator("[data-date]").first().textContent();
ok("时间精确到时分", /\d{4}年\d{1,2}月\d{1,2}日 \d{2}:\d{2}/.test(dateText ?? ""), `"${dateText?.trim()}"`);

// --- 11. Mobile menu animation attribute ------------------------------
await ctx.close();
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
await mp.goto(`${BASE}/`, { waitUntil: "networkidle" });
await mp.click("#menu-btn");
await mp.waitForTimeout(200);
const open = await mp.locator("#menu-items").getAttribute("data-open");
ok("移动端菜单 data-open", open === "true", `[data-open=${open}]`);

console.log("\nERRORS:", errors.length ? errors.join("\n") : "none");
await browser.close();
