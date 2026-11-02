/**
 * Builds the serif webfont used by the literary pages.
 *
 * The reading pages are set in a Chinese serif. No platform ships a good
 * one — macOS has Songti, Windows has SimSun, Linux usually has nothing —
 * so the face has to be a webfont. The complete Noto Serif SC is around
 * 25 MB, which is not something a reader should download to read a
 * chapter, so the font is subset down to the characters it can be asked
 * to draw.
 *
 * The subset is split in two tiers:
 *
 *   - the *core* tier holds every character the site renders today. It
 *     is what a reading page loads.
 *   - the *extended* tier holds the rest of the common Chinese
 *     repertoire (GB2312). It sits behind the core tier in the font
 *     stack, so the browser only fetches it when a page actually
 *     renders a character the core tier does not have — which for the
 *     current content never happens, but which means a chapter written
 *     tomorrow still gets a proper serif instead of a system fallback.
 *
 * Run with `npm run font:reading`. The generated files are committed, so
 * a normal build never needs the network.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const CACHE = join(ROOT, ".cache", "fonts");
const OUT_DIR = join(ROOT, "src", "assets", "fonts");

/**
 * The upstream variable font.
 *
 * A variable font is used rather than the static weights because the
 * literary pages need a regular weight for the body and a semibold for
 * the titles, and one variable file covers both for less than the two
 * static files would cost.
 */
const SOURCE_URL =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf";
const SOURCE_FILE = join(CACHE, "NotoSerifSC[wght].ttf");

const CORE_TEXT_FILE = join(CACHE, "core.txt");
const EXTENDED_TEXT_FILE = join(CACHE, "extended.txt");

const OUT_FILES = {
  core: join(OUT_DIR, "noto-serif-sc-core.woff2"),
  extended: join(OUT_DIR, "noto-serif-sc-extended.woff2"),
};

const OUT_CSS = join(ROOT, "src", "styles", "reading-font.css");

/* ------------------------------------------------------------------ *
 * Collecting the characters
 * ------------------------------------------------------------------ */

function statSyncSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

/** Every file whose contents can end up on a rendered page. */
function collectSourceFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSyncSafe(path)?.isDirectory()) {
      collectSourceFiles(path, out);
      continue;
    }
    if (/\.(md|mdx|astro|ts|tsx|json|css|html)$/.test(entry)) out.push(path);
  }
  return out;
}

/**
 * The characters the site renders.
 *
 * The interface dictionaries are included, because a single unaccounted
 * character is enough to make one word on the page fall back to a system
 * font — and the page then shows two typefaces at once.
 */
function siteCharacters() {
  const chars = new Set();

  for (const file of collectSourceFiles(join(ROOT, "src"))) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const char of text) chars.add(char);
  }

  // The ASCII range: Latin text, digits and the punctuation of the
  // interface. It is small and it is always needed.
  for (let code = 0x20; code < 0x7f; code++) chars.add(String.fromCharCode(code));

  // The CJK punctuation blocks, which the source files may not cover.
  for (const range of [
    [0x2013, 0x2014],
    [0x2018, 0x201f],
    [0x2026, 0x2026],
    [0x3000, 0x303f],
    [0xff00, 0xffef],
  ]) {
    for (let code = range[0]; code <= range[1]; code++) {
      chars.add(String.fromCharCode(code));
    }
  }

  return chars;
}

/**
 * The common Chinese repertoire.
 *
 * GB2312 is used as the yardstick: its level 1 holds the 3755 most
 * frequent simplified characters, and its level 2 the next 3008. Together
 * they are every character a Chinese text is likely to reach for.
 *
 * The decoding is done by Python, because Node has no `gb2312` decoder.
 */
function commonCharacters() {
  const script = `
import sys

chars = []
for hi in range(0xB0, 0xF8):
    for lo in range(0xA1, 0xFF):
        try:
            char = bytes([hi, lo]).decode("gb2312")
        except UnicodeDecodeError:
            continue
        if len(char) == 1:
            chars.append(char)

sys.stdout.write("".join(sorted(set(chars))))
`;
  const scriptPath = join(CACHE, "_gb2312.py");
  writeFileSync(scriptPath, script);

  return execFileSync("python3", [scriptPath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8,
  });
}

/* ------------------------------------------------------------------ *
 * Building the font
 * ------------------------------------------------------------------ */

function downloadSource() {
  if (existsSync(SOURCE_FILE)) return;
  mkdirSync(CACHE, { recursive: true });
  console.log("· downloading the upstream variable font…");
  execFileSync("curl", ["-sSL", "--max-time", "180", "-o", SOURCE_FILE, SOURCE_URL], {
    stdio: "inherit",
  });
}

/**
 * Subsets the source font to the given characters.
 *
 * The weight axis is pinned to 400–700: the literary pages use a regular
 * weight for the body and a semibold for the titles, and a wider axis
 * would only make the file larger. The font is instanced first and
 * subsetted second, because the instancing is what removes the part of
 * the axis that is not needed.
 */
function buildTier(textFile, outFile) {
  const script = `
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset
import sys

source, text_file, out_file = sys.argv[1], sys.argv[2], sys.argv[3]

font = TTFont(source)
instancer.instantiateVariableFont(
    font, {"wght": (400, 700)}, inplace=True, updateFontNames=False
)
font.save("/tmp/_reading_font_instanced.ttf")

subset.main([
    "/tmp/_reading_font_instanced.ttf",
    "--text-file=" + text_file,
    "--output-file=" + out_file,
    "--flavor=woff2",
    "--layout-features=*",
    "--no-hinting",
    "--desubroutinize",
    "--name-IDs=1,2,3,4,6",
])
`;
  const scriptPath = join(CACHE, "_subset.py");
  writeFileSync(scriptPath, script);
  execFileSync("python3", [scriptPath, SOURCE_FILE, textFile, outFile], {
    stdio: "inherit",
  });
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const site = siteCharacters();
const common = commonCharacters();

const core = new Set(site);
const extended = new Set([...common].filter(char => !core.has(char)));

writeFileSync(CORE_TEXT_FILE, [...core].sort().join(""));
writeFileSync(EXTENDED_TEXT_FILE, [...extended].sort().join(""));
console.log(`· core tier: ${core.size} characters`);
console.log(`· extended tier: ${extended.size} characters`);

downloadSource();
buildTier(CORE_TEXT_FILE, OUT_FILES.core);
buildTier(EXTENDED_TEXT_FILE, OUT_FILES.extended);

/*
 * The stylesheet.
 *
 * The two tiers are two *separate families*, not two sources of one.
 * That is what makes the lazy loading work: the core tier has no
 * `unicode-range`, so it is offered for every character, and the
 * extended tier — which sits second in the font stack — is consulted
 * only for the characters the core tier does not draw. The browser
 * therefore never fetches the extended file for the content that the
 * core tier already covers.
 */
const css = `/*
 * The reading face — a Chinese serif, subsetted to this site.
 *
 * Generated by \`scripts/build-reading-font.mjs\`. Do not edit by hand.
 *
 * The full typeface is around 25 MB, which is not something a reader
 * should download to read a chapter. These two files hold only the
 * characters the site renders and the common Chinese repertoire, and
 * they are used *only* by the reading pages — a visitor who never
 * opens a chapter never fetches them.
 *
 * The extended tier sits behind the core tier in the font stack, so it
 * is downloaded only when a page renders a character the core tier does
 * not have.
 */
@font-face {
  font-family: "Noto Serif SC Reading";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("../assets/fonts/noto-serif-sc-core.woff2") format("woff2");
}

@font-face {
  font-family: "Noto Serif SC Reading Extended";
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
  src: url("../assets/fonts/noto-serif-sc-extended.woff2") format("woff2");
}
`;
writeFileSync(OUT_CSS, css);

console.log("· done");
