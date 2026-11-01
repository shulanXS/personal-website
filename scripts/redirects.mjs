/**
 * Redirects: generation and verification.
 *
 * Two modes:
 *
 *   `--write`  renders `src/data/redirects.ts` into `public/_redirects`.
 *               Run before `astro build`.
 *
 *   `--audit`  simulates Cloudflare Pages' routing engine against the built
 *               site in `dist/` and fails if any internal link loops,
 *               404s, or takes a redirect chain longer than one hop.
 *               Run after `astro build`.
 *
 * The audit exists because a `_redirects` file is inert locally: `astro dev`
 * never reads it, so a rule that loops forever only reveals itself after a
 * deployment. Simulating the edge's behaviour against the real build output
 * catches it before that.
 *
 * The simulation mirrors Cloudflare's documented behaviour:
 *
 *   * `_redirects` rules are evaluated first, first match wins.
 *   * A source pattern is anchored; `:name` compiles to `[^/]+` (at least one
 *     character) and `*` compiles to `.*` (possibly empty).
 *   * With `html_handling: auto-trailing-slash`, a directory index is served
 *     at `/dir/` and `/dir` is 308-redirected to it; a flat `.html` file is
 *     served at `/file` and `/file/` is 307-redirected to it.
 *   * Each redirect is a separate request, so the rules are re-evaluated on
 *     every hop.
 */
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { REDIRECTS, renderRedirectsFile } from "../src/data/redirects.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// ---------------------------------------------------------------------------
// Rule parsing
// ---------------------------------------------------------------------------

/**
 * Compiles a `_redirects` source pattern into a regular expression.
 *
 * `:name` matches exactly one path segment; `*` matches anything, including
 * nothing at all. The distinction is what separates a working rule from a
 * looping one, so it is reproduced faithfully.
 */
function compilePattern(source) {
  // Split on the parameter syntax first, so that the segment separators
  // around `:name` are not escaped into a literal.
  const parts = source.split(/(:[A-Za-z_][A-Za-z0-9_]*)/);
  let pattern = "";
  for (const part of parts) {
    if (part.startsWith(":") && /^:[A-Za-z_][A-Za-z0-9_]*$/.test(part)) {
      pattern += "([^/]+)";
    } else {
      pattern += part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  // A `*` is a splat and may be empty.
  pattern = pattern.replace(/\\\*/g, "(.*)");
  return new RegExp(`^${pattern}$`);
}

function parseRedirects(text) {
  const rules = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [source, destination, code] = line.split(/\s+/);
    if (!source || !destination) continue;
    rules.push({
      source,
      destination,
      status: Number(code) || 301,
      re: compilePattern(source),
    });
  }
  return rules;
}

/** Expands `:name` and `:splat` in a destination using the matched source. */
function expandDestination(rule, matchedPath) {
  const groups = rule.re.exec(matchedPath);
  if (!groups) return rule.destination;

  let result = rule.destination;

  // Named parameters, in the order they appear in the source pattern.
  const names = [
    ...rule.source.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g),
  ].map(m => m[1]);
  names.forEach((name, index) => {
    const value = groups[index + 1] ?? "";
    result = result.replaceAll(`:${name}`, value);
  });

  // The splat, if the pattern has one.
  if (rule.source.includes("*")) {
    const splat = groups[groups.length - 1] ?? "";
    result = result.replaceAll(":splat", splat);
  }

  return result;
}

/**
 * Instantiates a rule's source pattern into the concrete URLs it can match.
 *
 * The point is to cover the cases that break in practice:
 *
 *   * a splat with an empty match — `/notes/*` matches `/notes/` as well as
 *     `/notes/anything`, and it is precisely the empty match that collides
 *     with the page itself;
 *   * a splat with a non-empty match;
 *   * a placeholder with a single-character and a multi-character value.
 *
 * A rule whose *source* can match a path that the edge also serves is the
 * signature of a loop, so the empty case must be probed.
 */
function instantiateSources(source) {
  const results = new Set();

  // The literal parts of the pattern, with the wildcards removed.
  const literal = source
    .replace(/\*/, "")
    .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "")
    .replace(/\/{2,}/g, "/");
  results.add(literal);

  // Every wildcard replaced by a representative value.
  results.add(
    source
      .replace(/\*/g, "x")
      .replace(/:[A-Za-z_][A-Za-z0-9_]*/g, "x")
      .replace(/\/{2,}/g, "/")
  );

  // A pattern that ends in a splat, with the splat matched by nothing —
  // this is the case that collides with the page itself.
  if (source.endsWith("*")) {
    results.add(source.slice(0, -1).replace(/\/{2,}/g, "/"));
    results.add(source.slice(0, -1) + "x");
  }

  return [...results].filter(u => u !== "" && !u.includes("//"));
}

// ---------------------------------------------------------------------------
// Asset resolution (html_handling: auto-trailing-slash)
// ---------------------------------------------------------------------------

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function serveAsset(path) {
  // The query string and the hash are not part of the path.
  const bare = path.split(/[?#]/)[0];

  // A plain static asset is served as-is.
  if (isFile(join(dist, bare))) return { status: 200 };

  if (bare.endsWith("/")) {
    // A directory index.
    if (isFile(join(dist, bare, "index.html"))) return { status: 200 };
    // A flat file with a trailing slash is redirected back.
    const flat = bare.slice(0, -1) + ".html";
    if (isFile(join(dist, flat))) return { status: 307, location: flat };
    return { status: 404 };
  }

  // A directory index without the trailing slash is redirected to it.
  if (isFile(join(dist, bare, "index.html"))) {
    return { status: 308, location: bare + "/" };
  }
  // A flat HTML file is served as-is.
  if (isFile(join(dist, bare + ".html"))) return { status: 200 };

  return { status: 404 };
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

const MAX_HOPS = 12;

/**
 * Follows a path through the redirect rules and the asset rules, one HTTP
 * request per hop, exactly as a browser would.
 */
function resolve(start, rules) {
  const chain = [start];
  let path = start;
  // The hops that the *site's own* redirect rules produced, as opposed to
  // the edge's canonicalisation of a path spelling.
  let ruleHops = 0;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    // 1. The redirect rules — first match wins.
    let matched = false;
    for (const rule of rules) {
      if (!rule.re.test(path)) continue;
      const target = expandDestination(rule, path);
      chain.push(`${rule.status} → ${target}`);
      path = target;
      ruleHops++;
      matched = true;
      break;
    }
    if (matched) continue;

    // 2. The asset rules.
    const asset = serveAsset(path);
    if (asset.status >= 300 && asset.status < 400) {
      chain.push(`${asset.status} → ${asset.location}`);
      path = asset.location;
      continue;
    }
    chain.push(String(asset.status));
    return { status: asset.status, chain, loop: false, ruleHops };
  }

  return { status: null, chain, loop: true, ruleHops };
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

const mode = process.argv.includes("--write")
  ? "write"
  : process.argv.includes("--audit")
    ? "audit"
    : null;

if (mode === "write") {
  const contents = renderRedirectsFile(REDIRECTS);
  const targets = [join(root, "public", "_redirects")];

  /*
   * The built copy is refreshed too, when it exists.
   *
   * `astro build` copies `public/` into `dist/`, so the two normally agree.
   * But the audit reads the *built* file — that is the one that is actually
   * deployed — and a stale `dist/_redirects` would make the audit verify
   * rules that are not the ones the source declares. Writing both keeps the
   * audit honest even when it is run without a full rebuild.
   */
  const built = join(dist, "_redirects");
  if (existsSync(join(dist, "_redirects")) || existsSync(dist)) {
    targets.push(built);
  }

  let written = 0;
  for (const target of targets) {
    const previous = existsSync(target) ? readFileSync(target, "utf-8") : "";
    if (previous === contents) continue;
    writeFileSync(target, contents);
    written++;
  }

  console.log(
    written === 0
      ? `_redirects is up to date (${REDIRECTS.length} rules)`
      : `wrote ${written} _redirects file(s) (${REDIRECTS.length} rules)`
  );
  process.exit(0);
}

if (mode === "audit") {
  const redirectFile = join(dist, "_redirects");
  if (!existsSync(redirectFile)) {
    console.error(`✗ ${redirectFile} is missing — was the build run?`);
    process.exit(1);
  }
  const rules = parseRedirects(readFileSync(redirectFile, "utf-8"));

  /*
   * A duplicate source is always a mistake: the second rule can never fire,
   * because the first match wins. It usually means a rule was added twice
   * during an edit, and the second one is silently dead.
   */
  const seenSources = new Map();
  const duplicates = [];
  for (const rule of rules) {
    if (seenSources.has(rule.source)) {
      duplicates.push(rule.source);
    } else {
      seenSources.set(rule.source, rule);
    }
  }

  // Collect every internal URL the built site links to.
  const htmlFiles = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (entry.endsWith(".html")) htmlFiles.push(p);
    }
  })(dist);

  const targets = new Map();
  for (const file of htmlFiles) {
    const doc = readFileSync(file, "utf-8");
    for (const m of doc.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
      const url = m[1];
      if (!targets.has(url)) targets.set(url, new Set());
      targets.get(url).add(file.slice(dist.length + 1));
    }
  }

  const problems = [];

  for (const source of duplicates) {
    problems.push({
      url: source,
      kind: "duplicate",
      result: { chain: [source, "(duplicate rule — the first match wins)"] },
      sources: new Set(),
    });
  }

  /*
   * The set of URLs to test.
   *
   * Testing only the URLs the site links to is not enough: a redirect rule
   * can be reached from the outside world without any internal link
   * pointing at it — an old URL in a bookmark, a search result, a link
   * from another site. Such a rule that loops would never be caught by an
   * audit that only walks the internal links.
   *
   * So the audit probes two groups of URLs:
   *
   *   1. every internal URL the built site links to;
   *   2. every URL each redirect rule can *produce* — the rule's own
   *      source pattern instantiated with representative values, plus the
   *      destination the rule sends to.
   *
   * The second group is what catches a rule that fights with the edge's own
   * canonicalisation.
   */
  const probes = new Map();

  for (const [url, sources] of targets) {
    probes.set(url, { sources });
  }

  for (const rule of rules) {
    // Instantiate the source pattern with representative segment values.
    for (const sample of instantiateSources(rule.source)) {
      if (!probes.has(sample)) probes.set(sample, { sources: new Set() });
    }
    // And the destination it points at, instantiated the same way so that
    // no unresolved `:name` is left in the probe set.
    for (const sample of instantiateSources(rule.source)) {
      const destination = expandDestination(rule, sample);
      if (!probes.has(destination)) {
        probes.set(destination, { sources: new Set() });
      }
    }
  }

  for (const [url, meta] of probes) {
    const result = resolve(url, rules);
    if (result.loop) {
      problems.push({ url, kind: "loop", result, sources: meta.sources });
    } else if (result.status !== 200) {
      problems.push({ url, kind: "broken", result, sources: meta.sources });
    } else if (result.ruleHops > 1) {
      /*
       * More than one of the site's *own* redirects is a slow link: every
       * hop is a round trip, and search engines treat the hop count as a
       * signal. The edge's own canonicalisation (the 308 that turns
       * `/posts` into `/posts/`) does not count — it is the edge's normal
       * behaviour and happens at most once.
       */
      problems.push({ url, kind: "chain", result, sources: meta.sources });
    }
  }

  console.log(
    `checked ${probes.size} URLs (${targets.size} linked, ${rules.length} redirect rules) across ${htmlFiles.length} pages\n`
  );

  if (problems.length === 0) {
    console.log("✓ every URL resolves in at most one redirect, and no rule loops");
    process.exit(0);
  }

  for (const p of problems) {
    const label =
      p.kind === "loop"
        ? "INFINITE LOOP"
        : p.kind === "broken"
          ? `HTTP ${p.result.status}`
          : p.kind === "duplicate"
            ? "duplicate rule"
            : `${p.result.chain.length - 1} redirects`;
    console.log(`✗ ${p.url}  (${label})`);
    console.log(`    ${p.result.chain.join("  ")}`);
    if (p.sources && p.sources.size > 0) {
      console.log(`    linked from: ${[...p.sources].slice(0, 4).join(", ")}`);
    } else {
      console.log(`    (not linked from anywhere — reachable only from outside)`);
    }
    console.log();
  }
  console.log(
    `${problems.length} problem(s) found. A redirect that loops points one spelling of a path at the other — Cloudflare canonicalises the target right back.`
  );
  process.exit(1);
}

console.error("usage: node scripts/redirects.mjs [--write|--audit]");
process.exit(2);
