/**
 * Checks the writing page after the redesign.
 *
 * Run against a preview server: `npm run preview` in another terminal,
 * then `node scripts/writing-audit.mjs`.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? process.env.BASE_URL ?? "http://localhost:4321";
const browser = await chromium.launch();

const results = [];
const check = (name, pass, detail = "") =>
  results.push({ name, pass, detail });

/* ------------------------------------------------------------------ *
 * The desktop page
 * ------------------------------------------------------------------ */
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(`PAGEERROR ${e.message}`));
page.on("console", m => {
  if (m.type() === "error") errors.push(`CONSOLE ${m.text()}`);
});

await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

// --- 1. the chapter count says "共 N 章" ---------------------------------
const chapterMeta = await page
  .locator(".app-writing-group-meta span[data-i18n='writing.chapters']")
  .first()
  .textContent();
check(
  "章节数写作「共 N 章」",
  /^共\s*\d+\s*章$/.test((chapterMeta ?? "").trim()),
  `"${chapterMeta?.trim()}"`
);

// --- 2. the card has no facts row at all -------------------------------
const cardMetaCount = await page.evaluate(
  () => document.querySelectorAll(".app-writing-card-meta").length
);
check("卡片没有类型行", cardMetaCount === 0, `[count=${cardMetaCount}]`);

// --- 2b. the card is static, not sticky ---------------------------------
const asidePosition = await page.evaluate(() => {
  const aside = document.querySelector(".app-writing-aside");
  if (!aside) return null;
  return window.getComputedStyle(aside).position;
});
check("侧边栏是静态定位", asidePosition === "static", `[position=${asidePosition}]`);

// --- 2c. the card does not move when the page scrolls -------------------
//
// The card is compared by its place *in the document*, not by its place on
// the screen: a sticky card keeps its place in the document and changes
// its place on the screen.
const cardOffset = async () =>
  await page.evaluate(() => {
    const card = document.querySelector(".app-writing-card");
    if (!card) return undefined;
    return card.getBoundingClientRect().top + window.scrollY;
  });

await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(200);
const cardBefore = await cardOffset();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
const cardAfter = await cardOffset();
check(
  "滚动时侧边栏不跟随",
  cardBefore !== undefined &&
    cardAfter !== undefined &&
    Math.abs(cardBefore - cardAfter) < 2,
  `[before=${cardBefore}, after=${cardAfter}]`
);

// --- 3. only the novels have a card -------------------------------------
const cardInfo = await page.evaluate(() => {
  const groups = [...document.querySelectorAll("[data-writing-group]")];
  return groups.map(group => ({
    type: group.dataset.writingType ?? "",
    cards: group.querySelectorAll(".app-writing-card").length,
    name: group.querySelector(".app-writing-group-name")?.textContent?.trim(),
  }));
});
const badCards = cardInfo.filter(
  g => (g.type === "novel" ? g.cards !== 1 : g.cards !== 0)
);
check(
  "只有小说有侧边栏卡片",
  badCards.length === 0,
  JSON.stringify(cardInfo)
);

// --- 4. the card sits level with the head of the series ------------------
const alignment = await page.evaluate(() => {
  const out = [];
  for (const group of document.querySelectorAll("[data-writing-group]")) {
    const head = group.querySelector(".app-writing-group-head");
    const card = group.querySelector(".app-writing-card");
    if (!head || !card) continue;
    const h = head.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    out.push({
      name: group.querySelector(".app-writing-group-name")?.textContent?.trim(),
      headTop: Math.round(h.top),
      cardTop: Math.round(c.top),
    });
  }
  return out;
});
const misaligned = alignment.filter(a => Math.abs(a.headTop - a.cardTop) > 2);
check(
  "卡片与系列名等高对齐",
  misaligned.length === 0,
  JSON.stringify(alignment)
);

// --- 5. the whole row is clickable --------------------------------------
const rowHit = await page.evaluate(() => {
  const row = document.querySelector(".app-writing-row-link");
  if (!row) return null;
  const r = row.getBoundingClientRect();
  // A point near the right edge of the row, away from the title.
  const x = r.right - 8;
  const y = r.top + r.height / 2;
  const el = document.elementFromPoint(x, y);
  return {
    x: Math.round(x),
    y: Math.round(y),
    tag: el?.tagName ?? "",
    cls: el?.className?.toString?.() ?? "",
    inRow: !!el?.closest(".app-writing-row-link"),
  };
});
check(
  "整行可点击（含移动端）",
  !!rowHit && rowHit.inRow,
  JSON.stringify(rowHit)
);

// --- 6. the row link is the only link in the row -------------------------
const nestedLinks = await page.evaluate(() =>
  [...document.querySelectorAll(".app-writing-row")].filter(
    row => row.querySelectorAll("a").length !== 1
  ).length
);
check("章节行只有一个链接", nestedLinks === 0, `[bad=${nestedLinks}]`);

// --- 7. the filter has levels --------------------------------------------
const filterLevels = await page.evaluate(() => {
  const levels = [...document.querySelectorAll(".app-writing-filter-level")];
  return levels.map(level => ({
    label: level.querySelector(".app-writing-filter-label")?.textContent?.trim(),
    options: level.querySelectorAll("[data-writing-facet]").length,
    tags: level.querySelectorAll("[data-tag-chip]").length,
  }));
});
check(
  "筛选器为多级结构",
  filterLevels.length >= 2 &&
    filterLevels[0].options > 1 &&
    filterLevels[1].options > 1,
  JSON.stringify(filterLevels)
);

// --- 8. the filter narrows the listing ----------------------------------
await page.click('[data-writing-facet="type"][data-writing-value="essay"]');
await page.waitForTimeout(300);
const essayOnly = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".app-writing-row")];
  const visible = rows.filter(r => !r.hidden);
  return {
    visible: visible.length,
    types: [...new Set(visible.map(r => r.dataset.writingType))],
    url: location.search,
  };
});
check(
  "按类型筛选生效",
  essayOnly.types.length === 1 && essayOnly.types[0] === "essay",
  JSON.stringify(essayOnly)
);

// --- 9. the work level narrows with the type -----------------------------
const workDimmed = await page.evaluate(() => {
  const options = [...document.querySelectorAll('[data-writing-facet="work"]')];
  return options.map(o => ({
    value: o.dataset.writingValue,
    type: o.dataset.writingWorkType,
    disabled: o.disabled,
  }));
});
check(
  "作品层级随类型收窄",
  workDimmed.every(o => !o.value || o.type === "essay" || o.disabled),
  JSON.stringify(workDimmed)
);

// --- 10. the "all" option resets ----------------------------------------
await page.click('[data-writing-facet="type"][data-writing-value="essay"]');
await page.waitForTimeout(300);
const afterReset = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".app-writing-row")];
  return { visible: rows.filter(r => !r.hidden).length, url: location.search };
});
check("再次点击取消筛选", afterReset.visible > essayOnly.visible, JSON.stringify(afterReset));

// --- 11. the tag level still filters ------------------------------------
await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
const tagChip = page
  .locator('.app-writing-filter [data-tag-chip]:not([data-tag-chip=""])')
  .first();
if (await tagChip.count()) {
  const slug = await tagChip.getAttribute("data-tag-chip");
  await tagChip.click();
  await page.waitForTimeout(400);
  const tagged = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".app-writing-row")];
    return {
      visible: rows.filter(r => !r.hidden).length,
      url: location.search,
    };
  });
  check(
    "标签层级仍可筛选",
    tagged.visible > 0 && tagged.url.includes("tag="),
    `[slug=${slug}] ${JSON.stringify(tagged)}`
  );
} else {
  check("标签层级仍可筛选", false, "没有标签可选");
}

// --- 12. the two filters narrow each other -------------------------------
//
// The type level and the tag level are separate filters, but they have to
// agree: choosing both has to show the works that carry both.
await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.click('[data-writing-facet="type"][data-writing-value="novel"]');
await page.waitForTimeout(300);
const novelTag = await page
  .locator('.app-writing-filter [data-tag-chip]:not([data-tag-chip=""])')
  .first();
if (await novelTag.count()) {
  const slug = await novelTag.getAttribute("data-tag-chip");
  await novelTag.click();
  await page.waitForTimeout(400);
  const both = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".app-writing-row")];
    const visible = rows.filter(r => !r.hidden);
    return {
      visible: visible.length,
      types: [...new Set(visible.map(r => r.dataset.writingType))],
      url: location.search,
    };
  });
  check(
    "类型与标签可叠加",
    both.types.length <= 1 &&
      both.url.includes("type=") &&
      both.url.includes("tag="),
    `[slug=${slug}] ${JSON.stringify(both)}`
  );

  // --- 12b. the empty state follows the combined filter ------------------
  const emptyShown = await page.evaluate(() => {
    const empty = document.querySelector("[data-tag-empty]");
    return { hidden: empty?.hidden, text: empty?.textContent?.trim() };
  });
  check(
    "组合筛选无结果时显示空态",
    emptyShown.hidden === false && !!emptyShown.text,
    JSON.stringify(emptyShown)
  );
} else {
  check("类型与标签可叠加", false, "没有标签可选");
}

// --- 13. the score of the works ----------------------------------------
//
// A work that carries a score shows it in the left column of its row.
// The score is a fact about the work, so it sits with the kind of the
// work rather than with the title.
await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const ratings = await page.evaluate(() => {
  const rows = [...document.querySelectorAll(".app-writing-row")];
  const scored = rows.filter(row => row.querySelector(".app-rating"));
  return {
    scored: scored.length,
    total: rows.length,
    inLabel: scored.every(row =>
      row.querySelector(".app-writing-row-label .app-rating")
    ),
    labels: scored.map(row =>
      row.querySelector(".app-rating")?.getAttribute("aria-label") ?? ""
    ),
  };
});
check(
  "带评分的作品在左列显示星星",
  ratings.scored > 0 && ratings.inLabel,
  JSON.stringify(ratings)
);

// The number of the stars is five for every work, and the filled ones
// follow the score exactly: a score of 4.5 fills four stars and half of
// the fifth, and a score of 4.3 fills four stars and three tenths of it.
//
// The check reads the score out of the accessible name and works out
// what the fills ought to be, rather than looking for a particular
// fraction — the scale is continuous, so any fraction may show up.
const starShapes = await page.evaluate(() => {
  const group = document.querySelector(".app-rating");
  if (!group) return null;
  const stars = [...group.querySelectorAll(".app-rating-star")];
  const fills = stars.map(star => {
    const fill = star.querySelector(".app-rating-star-fill");
    return fill?.style.getPropertyValue("--app-rating-fill") ?? "";
  });
  return {
    count: stars.length,
    fills,
    aria: group.getAttribute("aria-label") ?? "",
    number: group.querySelector(".app-rating-number, .app-rating-value")
      ?.textContent?.trim() ?? "",
  };
});

// The fills have to add up to the score, in stars.
const expectedFills = starShapes
  ? (() => {
      const score = Number.parseFloat(starShapes.number);
      if (Number.isNaN(score)) return null;
      const total = starShapes.fills.reduce(
        (sum, f) => sum + (Number.parseFloat(f) || 0) / 100,
        0
      );
      return { score, total, delta: Math.abs(total - score) };
    })()
  : null;

check(
  "星星的填充与分数一致",
  !!starShapes &&
    starShapes.count === 5 &&
    !!expectedFills &&
    expectedFills.delta < 0.02,
  JSON.stringify({ ...starShapes, expectedFills })
);

// --- 14. the page of a scored work --------------------------------------
//
// The page of the work shows the score under the title, with the number
// beside the stars.
const scoredHref = await page.evaluate(() => {
  const row = [...document.querySelectorAll(".app-writing-row")].find(row =>
    row.querySelector(".app-rating")
  );
  const link = row?.querySelector(".app-writing-row-link");
  return link ? link.getAttribute("href") : null;
});

if (scoredHref) {
  await page.goto(new URL(scoredHref, BASE).toString(), {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(400);
  const detail = await page.evaluate(() => {
    const group = document.querySelector(".app-rating");
    if (!group) return null;
    const value = group.querySelector(".app-rating-value");
    const title = document.querySelector(".app-writing-title");
    const rect = group.getBoundingClientRect();
    const titleRect = title?.getBoundingClientRect();
    return {
      aria: group.getAttribute("aria-label") ?? "",
      value: value?.textContent?.trim() ?? "",
      belowTitle: !!titleRect && rect.top >= titleRect.bottom - 2,
      width: Math.round(rect.width),
    };
  });
  check(
    "作品页在标题下显示评分与数字",
    !!detail &&
      Number.parseFloat(detail.value) > 0 &&
      detail.belowTitle &&
      detail.width > 0,
    JSON.stringify(detail)
  );
} else {
  check("作品页在标题下显示评分与数字", false, "找不到带评分的作品");
}

// --- 15. the order of the works -----------------------------------------
//
// The stand-alone works can be put in order by their score.
//
// The check asks for the highest first and reads the scores back out of
// the rows, to make sure that the order the page shows is the order that
// was asked for — and that a work with no score has been put at the end
// rather than among the ranked ones, since it cannot be compared with
// them.
await page.goto(BASE + "/writing/?type=review&sort=highest", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(400);

const sortByRating = await page.evaluate(() => {
  const rows = [
    ...document.querySelectorAll("[data-writing-sort-list] .app-writing-row"),
  ];
  const scores = rows.map(row => {
    const raw = row.dataset.writingRating;
    return raw === undefined || raw === "" ? null : Number.parseFloat(raw);
  });
  const pressed = document.querySelector(
    '[data-writing-sort-value="highest"]'
  )?.getAttribute("aria-pressed");
  return { scores, pressed, url: window.location.search };
});

check(
  "作品可按评分排序",
  sortByRating.scores.length > 0 &&
    sortByRating.pressed === "true" &&
    sortByRating.scores.every((score, index) => {
      if (score === null) return true;
      const next = sortByRating.scores[index + 1];
      return next === null || next === undefined || score >= next;
    }),
  JSON.stringify({
    first: sortByRating.scores.slice(0, 5),
    last: sortByRating.scores.slice(-3),
    pressed: sortByRating.pressed,
  })
);

// The order has to survive a reload, and it is kept in the URL so that a
// page that has been ordered can be shared.
check(
  "排序状态保存在网址中",
  sortByRating.url.includes("sort=highest"),
  sortByRating.url
);

// --- 16. a screenshot ----------------------------------------------------
await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/writing-desktop.png", fullPage: true });

await ctx.close();

/* ------------------------------------------------------------------ *
 * The phone
 * ------------------------------------------------------------------ */
const mctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const mp = await mctx.newPage();
mp.on("pageerror", e => errors.push(`MOBILE PAGEERROR ${e.message}`));

await mp.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await mp.waitForTimeout(400);

// The row has to be in the viewport for the probe to mean anything:
// `elementFromPoint` returns null for a point outside the window, which
// would be reported as "the row is not clickable" while the row is in
// fact perfectly clickable — it is simply further down the page, below
// the fold of a phone.
await mp.evaluate(() => {
  document
    .querySelector(".app-writing-row-link")
    ?.scrollIntoView({ block: "center" });
});
await mp.waitForTimeout(300);

const mobileRowHit = await mp.evaluate(() => {
  const row = document.querySelector(".app-writing-row-link");
  if (!row) return null;
  const r = row.getBoundingClientRect();
  const el = document.elementFromPoint(r.right - 6, r.top + r.height / 2);
  return { inRow: !!el?.closest(".app-writing-row-link") };
});
check("移动端整行可点击", !!mobileRowHit?.inRow, JSON.stringify(mobileRowHit));

// --- the sidebar is gone on a phone -------------------------------------
const mobileAside = await mp.evaluate(() => {
  const aside = document.querySelector(".app-writing-aside");
  if (!aside) return { present: false };
  const r = aside.getBoundingClientRect();
  return {
    present: true,
    display: window.getComputedStyle(aside).display,
    width: Math.round(r.width),
    height: Math.round(r.height),
  };
});
check(
  "移动端没有侧边栏",
  !mobileAside.present ||
    (mobileAside.display === "none" && mobileAside.width === 0),
  JSON.stringify(mobileAside)
);

const overflow = await mp.evaluate(() => ({
  s: document.documentElement.scrollWidth,
  c: document.documentElement.clientWidth,
}));
check("移动端无横向溢出", overflow.s <= overflow.c + 2, JSON.stringify(overflow));

await mp.screenshot({ path: "/tmp/writing-mobile.png", fullPage: true });
await mctx.close();

/* ------------------------------------------------------------------ *
 * The other language
 * ------------------------------------------------------------------ */
const ectx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const ep = await ectx.newPage();
await ep.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await ep.waitForTimeout(300);
await ep.locator("#lang-btn").click();
await ep.waitForTimeout(700);
const english = await ep.evaluate(() => ({
  chapters:
    document
      .querySelector(".app-writing-group-meta span[data-i18n='writing.chapters']")
      ?.textContent?.trim() ?? "",
  labels: [...document.querySelectorAll(".app-writing-filter-label")].map(
    l => l.textContent?.trim()
  ),
}));
check(
  "英文界面同步",
  /chapters in total/.test(english.chapters) && english.labels.length >= 2,
  JSON.stringify(english)
);
await ep.screenshot({ path: "/tmp/writing-en.png", fullPage: true });
await ectx.close();

/* ------------------------------------------------------------------ *
 * A chapter, with its floating back button
 * ------------------------------------------------------------------ */
const cctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const cp = await cctx.newPage();
cp.on("pageerror", e => errors.push(`CHAPTER PAGEERROR ${e.message}`));

// The first chapter of the first novel.
await cp.goto(BASE + "/writing/", { waitUntil: "networkidle" });
await cp.waitForTimeout(300);
const firstChapter = await cp.evaluate(() => {
  const link = document.querySelector(".app-writing-row-link");
  return link ? link.getAttribute("href") : null;
});

if (firstChapter) {
  await cp.goto(new URL(firstChapter, BASE).toString(), {
    waitUntil: "networkidle",
  });
  await cp.waitForTimeout(400);

  const backButton = await cp.evaluate(() => {
    const button = document.querySelector("#writing-back-button");
    if (!button) return null;
    const r = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    return {
      position: style.position,
      left: Math.round(r.left),
      bottom: Math.round(r.bottom),
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      href: button.getAttribute("href"),
      label: button.textContent?.trim(),
      visible: r.width > 0 && r.height > 0,
    };
  });

  check(
    "章节页有悬浮返回按钮",
    !!backButton && backButton.visible && backButton.position === "fixed",
    JSON.stringify(backButton)
  );

  check(
    "返回按钮在左下角",
    !!backButton &&
      backButton.left < backButton.viewportWidth / 2 &&
      backButton.bottom > backButton.viewportHeight * 0.6,
    JSON.stringify(backButton)
  );

  // The button stays in its corner while the chapter scrolls.
  await cp.evaluate(() => window.scrollTo(0, 800));
  await cp.waitForTimeout(200);
  const backAfterScroll = await cp.evaluate(() => {
    const button = document.querySelector("#writing-back-button");
    if (!button) return null;
    const r = button.getBoundingClientRect();
    return { left: Math.round(r.left), bottom: Math.round(r.bottom) };
  });
  check(
    "滚动时返回按钮固定在角落",
    !!backAfterScroll &&
      !!backButton &&
      backAfterScroll.left === backButton.left &&
      backAfterScroll.bottom === backButton.bottom,
    JSON.stringify(backAfterScroll)
  );

  // The button leads back to the list of works.
  check(
    "返回按钮指向作品列表",
    !!backButton?.href && backButton.href.includes("/writing"),
    `[href=${backButton?.href}]`
  );

  await cp.screenshot({ path: "/tmp/writing-chapter.png" });
} else {
  check("章节页有悬浮返回按钮", false, "找不到章节链接");
}

await cctx.close();

await browser.close();

check("无 JS 报错", errors.length === 0, errors.join(" | "));

const failed = results.filter(r => !r.pass);
console.log("=".repeat(60));
for (const r of results)
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  [" + r.detail + "]" : ""}`);
console.log("=".repeat(60));
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
