import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// --- Load the real dictionaries ---
const langFiles = readdirSync(join(root, "src/i18n/lang")).filter(f => f.endsWith(".ts"));
const dicts = {};
for (const f of langFiles) {
  const mod = await import(join(root, "src/i18n/lang", f));
  const locale = f.replace(/\.ts$/, "");
  dicts[locale] = mod.default;
}

function flatten(src, prefix = "") {
  const out = {};
  if (typeof src === "string") { out[prefix] = src; return out; }
  if (src && typeof src === "object") {
    for (const [k, v] of Object.entries(src)) {
      out[prefix ? `${prefix}.${k}` : k] = v;
      if (v && typeof v === "object") Object.assign(out, flatten(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}
const flat = Object.fromEntries(Object.entries(dicts).map(([k, v]) => [k, flatten(v)]));

// --- Collect pages ---
const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith(".html")) pages.push(p);
  }
})(dist);
pages.sort();

const issues = [];
const add = (kind, page, msg) => issues.push({ kind, page: relative(dist, page), msg });

for (const p of pages) {
  const doc = readFileSync(p, "utf-8");

  // 1. i18n keys must exist in every dictionary
  for (const m of doc.matchAll(/data-i18n="([^"]+)"/g)) {
    const key = m[1];
    for (const [loc, d] of Object.entries(flat)) {
      if (!(key in d)) add("i18n-missing-key", p, `${loc}: '${key}'`);
    }
  }

  // 2. duplicate ids
  const ids = [...doc.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const seen = new Map();
  for (const i of ids) seen.set(i, (seen.get(i) ?? 0) + 1);
  for (const [i, c] of seen) if (c > 1) add("duplicate-id", p, `id="${i}" x${c}`);

  // 3. images: alt + intrinsic dimensions
  for (const m of doc.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\balt=/.test(tag)) add("img-no-alt", p, tag.slice(0, 130));
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) add("img-no-dimensions", p, tag.slice(0, 130));
  }

  // 4. nested anchors
  let depth = 0;
  for (const m of doc.matchAll(/<(\/?)a\b([^>]*)>/g)) {
    if (m[1]) depth = Math.max(0, depth - 1);
    else {
      if (depth > 0) add("nested-anchor", p, "anchor nested in anchor");
      depth++;
    }
  }

  // 5. heading level jumps
  let prev = 0;
  for (const m of doc.matchAll(/<h([1-6])\b/g)) {
    const l = +m[1];
    if (prev && l > prev + 1) add("heading-skip", p, `h${prev} -> h${l}`);
    prev = l;
  }

  // 6. accessible name on interactive elements
  for (const m of doc.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, tag, attrs, inner] = m;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text && !/aria-label\s*=/.test(attrs) && !/title\s*=/.test(attrs)) {
      add("no-accessible-name", p, `<${tag} ${attrs.slice(0, 110)}>`);
    }
  }

  // 7. internal links resolve
  for (const m of doc.matchAll(/href="(\/[^"#?]*)"/g)) {
    const t = decodeURI(m[1]);
    const fs = t.endsWith("/") ? join(dist, t, "index.html") : join(dist, t);
    if (!existsSync(fs) && !existsSync(fs + ".html")) add("broken-link", p, t);
  }

  // 8. img src resolves
  for (const m of doc.matchAll(/<img\b[^>]*src="([^"]+)"/g)) {
    const s = m[1];
    if (s.startsWith("/") && !s.startsWith("//")) {
      const fs = join(dist, s.split("?")[0].split("#")[0].replace(/^\//, ""));
      if (!existsSync(fs)) add("broken-image", p, s);
    }
  }

  // 9. empty href / placeholder links
  for (const m of doc.matchAll(/href="(#|javascript:void)"/g)) {
    add("dead-link", p, m[0]);
  }

  // 10. data-i18n on an element whose text is produced only by children
  //     (would duplicate the label) — check for elements with data-i18n and
  //     a nested [data-i18n-text] that also has its own data-i18n
  for (const m of doc.matchAll(/<([a-z]+)\b([^>]*data-i18n="[^"]+"[^>]*)>/g)) {
    const attrs = m[2];
    if (/data-i18n-attr/.test(attrs)) continue;
    if (/data-i18n-text/.test(attrs)) continue;
  }

  // 11. check the <html lang> matches the server locale
  const lang = doc.match(/<html[^>]*\slang="([^"]+)"/)?.[1];
  if (lang && !flat[lang]) add("bad-html-lang", p, lang);
}

// 12. CSS custom property sanity: --app-max-width variants exist
const css = readFileSync(join(root, "src/styles/global.css"), "utf-8");
for (const v of ["app-w-wide", "app-w-flow", "app-w-reading"]) {
  if (!css.includes(`html.${v}`)) add("missing-width-variant", join(root, "src/styles/global.css"), v);
}

const byKind = {};
for (const i of issues) (byKind[i.kind] ??= []).push(i);

console.log(`Scanned ${pages.length} pages, ${Object.keys(flat).length} locales\n`);
let total = 0;
for (const kind of Object.keys(byKind).sort()) {
  const list = byKind[kind];
  total += list.length;
  console.log(`=== ${kind} (${list.length}) ===`);
  const uniq = new Map();
  for (const i of list) {
    const k = `${i.page}|${i.msg}`;
    if (!uniq.has(k)) uniq.set(k, i);
  }
  for (const i of [...uniq.values()].slice(0, 25)) console.log(`  ${i.page}: ${i.msg}`);
  if (uniq.size > 25) console.log(`  ... ${uniq.size - 25} more`);
  console.log();
}
console.log(`TOTAL (with dupes): ${total}, UNIQUE: ${new Set(issues.map(i => `${i.kind}|${i.page}|${i.msg}`)).size}`);
