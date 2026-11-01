import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const results = [];
const check = (name, pass, detail = "") =>
  results.push({ name, pass, detail });

const browser = await chromium.launch();

async function withPage(ctx, fn) {
  const page = await ctx.newPage();
  // each scenario starts from a clean slate
  await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
  const errs = [];
  page.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
  page.on("console", m => { if (m.type() === "error" && !/404 \(Not Found\)/.test(m.text())) errs.push("CONSOLE: " + m.text()); });
  await fn(page, errs);
  await page.close();
  return errs;
}

// ============ DESKTOP ============
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // 1. language switch persists across client-side navigation
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("#lang-btn").click();
    await page.waitForTimeout(500);
    await page.locator("header #menu-items > li > a").first().click();
    await page.waitForTimeout(1300);
    const lang = await page.evaluate(() => document.documentElement.lang);
    const txt = await page.locator("header #menu-items > li > a").first().innerText();
    check("语言切换在导航后保持", lang === "en" && /Blog/i.test(txt), `lang=${lang} txt=${txt}`);
  });

  // 2. theme persists across navigation
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("#theme-btn").click();
    await page.waitForTimeout(300);
    await page.locator("header #menu-items > li > a").first().click();
    await page.waitForTimeout(1300);
    const dark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    check("主题切换在导航后保持", dark, `dark=${dark}`);
  });

  // 3. theme button aria-label is the translated label, not "dark"/"light"
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.locator("#theme-btn").click();
    await page.waitForTimeout(300);
    const label = await page.locator("#theme-btn").getAttribute("aria-label");
    check("主题按钮 aria-label 为翻译文本", !!label && !/^(dark|light)$/.test(label), `label=${label}`);
  });

  // 4. dates update on language switch and match the server format
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    // Only the full date format carries language-specific text. The compact
    // timeline date is the same numeric form in every language.
    const before = await page.evaluate(() => document.querySelector("time[data-date]")?.textContent?.trim());
    await page.locator("#lang-btn").click();
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => document.querySelector("time[data-date]")?.textContent?.trim());
    check("日期随语言切换更新", before !== after && /,/.test(after ?? ""), `before=${before} after=${after}`);
  });

  // 5. chapter number survives a language switch
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/writing/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.locator("#lang-btn").click();
    await page.waitForTimeout(600);
    const txt = await page.evaluate(() => document.querySelector("[data-i18n='writing.chapterLabel']")?.parentElement?.textContent?.trim());
    check("章节号在语言切换后保留", /\d/.test(txt ?? ""), `text=${txt}`);
  });

  // 6. search widget re-initialises with new translations
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/search/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => document.querySelector(".pagefind-ui__search-input")?.placeholder);
    await page.locator("#lang-btn").click();
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => document.querySelector(".pagefind-ui__search-input")?.placeholder);
    const forms = await page.evaluate(() => document.querySelectorAll("#pagefind-search form").length);
    check("Pagefind 随语言切换重建", before !== after && forms === 1, `before=${before} after=${after} forms=${forms}`);
  });

  // 7. progress bar works after a client-side navigation
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/posts/astro-paper-v5/", { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const a = [...document.querySelectorAll("a")].find(x => x.getAttribute("href")?.includes("/posts/astro-paper-v4/"));
      a?.click();
    });
    await page.waitForTimeout(1400);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(500);
    const w = await page.evaluate(() => document.getElementById("myBar")?.style.width);
    check("进度条在视图切换后仍工作", !!w && w !== "0%", `width=${w}`);
  });

  // 8. heading anchors + copy buttons exist and are not duplicated
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/posts/astro-paper-v5/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    const info = await page.evaluate(() => ({
      headings: document.querySelectorAll("a.heading-link").length,
      dupHeadings: [...document.querySelectorAll("h2,h3")].filter(h => h.querySelectorAll("a.heading-link").length > 1).length,
      copy: document.querySelectorAll("button.copy-code").length,
      dupCopy: [...document.querySelectorAll("pre")].filter(c => c.querySelectorAll("button.copy-code").length > 1).length,
      bars: document.querySelectorAll(".progress-container").length,
    }));
    check("标题锚点/复制按钮无重复", info.dupHeadings === 0 && info.dupCopy === 0 && info.bars === 1,
      JSON.stringify(info));
  });

  // 9. lightbox opens and closes
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/posts/examples/tailwind-typography/", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.locator("article img").first().scrollIntoViewIfNeeded();
    await page.locator("article img").first().click();
    await page.waitForTimeout(500);
    const open = await page.evaluate(() => !!document.querySelector("[role='dialog']"));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const closed = await page.evaluate(() => !document.querySelector("[role='dialog']") && document.body.style.overflow === "");
    check("灯箱打开与关闭正常", open && closed, `open=${open} closed=${closed}`);
  });

  // 10. no console errors across key pages
  {
    const errs = [];
    for (const p of ["/", "/posts/", "/posts/astro-paper-v5/", "/notes/", "/writing/", "/writing/chapter-one/", "/projects/", "/search/"]) {
      const page = await ctx.newPage();
      const e = [];
      page.on("pageerror", err => e.push(`${p} PAGEERROR ${err.message}`));
      page.on("console", m => { if (m.type() === "error") e.push(`${p} CONSOLE ${m.text()}`); });
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      errs.push(...e);
      await page.close();
    }
    check("关键页面无 JS 报错", errs.length === 0, errs.join(" | "));
  }

  // 10b. the cards do not move under the pointer
  await withPage(ctx, async (page) => {
    const moved = [];
    for (const [name, path, sel] of [
      ["首页碎碎念", "/", 'ul[data-list-layout="notes"] > li > article'],
      ["技术文章", "/posts/", 'ul[data-list-layout="vertical"] > li > article'],
      ["文学创作", "/writing/", 'ul[data-list-layout="series"] > li > article'],
      ["项目", "/projects/", ".app-card"],
    ]) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const card = page.locator(sel).first();
      if ((await card.count()) === 0) continue;
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const before = await card.boundingBox();
      await card.hover();
      await page.waitForTimeout(400);
      const after = await card.boundingBox();
      const shadow = await card.evaluate(
        el => getComputedStyle(el).boxShadow
      );
      if (!before || !after) continue;
      if (Math.abs(before.y - after.y) > 0.5) {
        moved.push(`${name} 位移 ${before.y}->${after.y}`);
      }
      if (shadow && !/none/.test(shadow) && /0px 0px 0px/.test(shadow)) {
        moved.push(`${name} 阴影 ${shadow}`);
      }
    }
    check("卡片悬停无位移与抬升阴影", moved.length === 0, moved.join(", "));
  });

  // 10c. the navigation answers the pointer with weight and a wave, not a colour
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const link = page.locator("#menu-items > li > a").first();
    const before = await link.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        weight: cs.fontWeight,
        deco: cs.textDecorationStyle,
        bg: getComputedStyle(el, "::before").backgroundColor,
      };
    });
    await link.hover();
    await page.waitForTimeout(400);
    const after = await link.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        color: cs.color,
        weight: cs.fontWeight,
        deco: cs.textDecorationStyle,
        bg: getComputedStyle(el, "::before").backgroundColor,
      };
    });

    const problems = [];
    if (Number(after.weight) <= Number(before.weight)) {
      problems.push(`weight ${before.weight}->${after.weight} 未加粗`);
    }
    if (after.deco !== "wavy") problems.push(`decoration=${after.deco}`);
    if (before.color !== after.color) problems.push(`color ${before.color}->${after.color}`);
    if (after.bg !== "rgba(0, 0, 0, 0)") problems.push(`hover 底色=${after.bg}`);

    check("导航悬停仅加粗加波浪线", problems.length === 0, problems.join(", "));
  });

  await ctx.close();
}

// ============ MOBILE ============
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });

  // 11. the navigation is always visible and its items do not overlap
  await withPage(ctx, async (page) => {
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const items = await page.evaluate(() => [...document.querySelectorAll("#menu-items > li")].map(li => {
      const b = li.getBoundingClientRect();
      return { x: b.left, y: b.top, w: b.width, h: b.height };
    }));
    let overlap = false;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const a = items[i], b = items[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) overlap = true;
    }
    // Every navigation link has to be on screen without any interaction.
    const links = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      return [...document.querySelectorAll("#menu-items > li > a")].map(a => {
        const b = a.getBoundingClientRect();
        const label = a.textContent?.trim() ?? "";
        return { label, visible: b.width > 0 && b.height > 0 && b.right <= vw + 2 && b.left >= -2 };
      });
    });
    const hidden = links.filter(l => !l.visible).map(l => l.label);
    check("移动端导航完整可见且无重叠", !overlap && hidden.length === 0 && links.length === 5,
      `links=${links.length} overlap=${overlap} hidden=${hidden.join(",")}`);
  });

  // 11b. the navigation is complete on every page, at every narrow width
  await withPage(ctx, async (page) => {
    const bad = [];
    for (const w of [320, 360, 390, 430]) {
      await page.setViewportSize({ width: w, height: 844 });
      for (const p of ["/", "/notes/", "/about/"]) {
        await page.goto(BASE + p, { waitUntil: "networkidle" });
        await page.waitForTimeout(200);
        const r = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          const links = [...document.querySelectorAll("#menu-items > li > a")];
          const hidden = links.filter(a => {
            const b = a.getBoundingClientRect();
            return b.width === 0 || b.height === 0 || b.right > vw + 2 || b.left < -2;
          }).length;
          return { total: links.length, hidden };
        });
        if (r.total !== 5 || r.hidden !== 0) {
          bad.push(`${w}px ${p} total=${r.total} hidden=${r.hidden}`);
        }
      }
    }
    check("窄屏各页面导航按钮完整显示", bad.length === 0, bad.join(", "));
  });

  // 12. no horizontal overflow on any page
  await withPage(ctx, async (page) => {
    const bad = [];
    for (const p of ["/", "/posts/", "/posts/astro-paper-v5/", "/notes/", "/writing/", "/writing/chapter-one/", "/projects/", "/about/", "/search/", "/404/"]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(300);
      const o = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      if (o.s > o.c + 2) bad.push(`${p} ${o.s}>${o.c}`);
    }
    check("移动端无横向溢出", bad.length === 0, bad.join(", "));
  });

  // 13. the chrome is identical on every page, and the bar spans the viewport
  await withPage(ctx, async (page) => {
    const perPage = {};
    for (const p of ["/", "/posts/", "/projects/", "/notes/", "/writing/"]) {
      await page.goto(BASE + p, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      perPage[p] = await page.evaluate(() => {
        const bar = document.querySelector("header");
        const row = document.querySelector("header > div");
        const foot = document.querySelector("footer > div");
        const b = bar?.getBoundingClientRect();
        const r = row?.getBoundingClientRect();
        const cs = row ? getComputedStyle(row) : null;
        const pad = cs ? (parseFloat(cs.paddingLeft) || 0) : 0;
        return {
          barWidth: b ? Math.round(b.width) : 0,
          rowWidth: r ? Math.round(r.width - 2 * pad) : 0,
          rowLeft: r ? Math.round(r.left + pad) : 0,
          footLeft: foot
            ? Math.round(
                foot.getBoundingClientRect().left +
                  (parseFloat(getComputedStyle(foot).paddingLeft) || 0)
              )
            : 0,
          viewport: document.documentElement.clientWidth,
        };
      });
    }

    const problems = [];

    // The bar itself has to span the whole viewport on every page.
    for (const [p, v] of Object.entries(perPage)) {
      if (v.barWidth !== v.viewport) {
        problems.push(`${p} bar=${v.barWidth}!=${v.viewport}`);
      }
    }

    // The navigation row has to be exactly the same width on every page.
    const rowWidths = [...new Set(Object.values(perPage).map(v => v.rowWidth))];
    if (rowWidths.length !== 1) {
      problems.push(`nav row widths differ: ${JSON.stringify(rowWidths)}`);
    }

    // The header and the footer have to begin on the same vertical line.
    for (const [p, v] of Object.entries(perPage)) {
      if (Math.abs(v.rowLeft - v.footLeft) > 1) {
        problems.push(`${p} header=${v.rowLeft} footer=${v.footLeft}`);
      }
    }

    check("导航栏全站一致且满屏", problems.length === 0, problems.join(", "));
  });

  await ctx.close();
}

await browser.close();

const failed = results.filter(r => !r.pass);
console.log("=" .repeat(60));
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? "  [" + r.detail + "]" : ""}`);
console.log("=".repeat(60));
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exitCode = 1;
