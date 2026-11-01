import { chromium } from "playwright";

const BASE = "http://localhost:4321";
const browser = await chromium.launch();

for (const w of [320, 360, 390, 430, 768, 1024]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    try { localStorage.setItem("uiLang", "en"); } catch {}
  });

  const bad = [];
  for (const p of ["/", "/notes/", "/about/", "/posts/", "/writing/", "/projects/"]) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const links = [...document.querySelectorAll("#menu-items > li > a")];
      const hidden = links.filter(a => {
        const b = a.getBoundingClientRect();
        return b.width === 0 || b.height === 0 || b.right > vw + 2 || b.left < -2;
      }).map(a => a.textContent?.trim());
      const brand = document.querySelector(".app-header-brand")?.getBoundingClientRect();
      const ctrl = document.querySelector("#nav-controls")?.getBoundingClientRect();
      // The brand must not run into the controls.
      const collide = brand && ctrl && brand.right > ctrl.left + 1;
      return { hidden, collide, brandRight: Math.round(brand?.right ?? 0), ctrlLeft: Math.round(ctrl?.left ?? 0) };
    });
    if (r.hidden.length) bad.push(`${p} hidden=${r.hidden.join(",")}`);
    if (r.collide) bad.push(`${p} brand/controls collide ${r.brandRight}>${r.ctrlLeft}`);
  }
  console.log(`${w}px: ${bad.length ? bad.join(" | ") : "OK"}`);
  await ctx.close();
}
await browser.close();
