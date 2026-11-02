/**
 * Generates the cover of a literary series.
 *
 * A series has no cover of its own — nobody drew one — but a page that
 * shows a novel in a shelf of books has to put *something* in the frame
 * where the cover would be.
 *
 * A cover is a picture, and nothing is written on it.
 *
 * That is the rule this script follows, for every cover it makes. A cover
 * with the name of the work set on it says the same thing the card beside
 * it already says, and it says it in the one place the picture cannot be
 * seen. A cover that carries only a picture leaves the reader to look at
 * the picture, which is the thing worth looking at.
 *
 * There are two kinds of cover, and neither of them has any type on it.
 *
 * One is built on a *photograph* — see `artwork` in the list below. The
 * photograph is the artwork of the work itself, drawn by hand rather than
 * generated, so it is committed under `src/assets/artwork/`. The cover is
 * the photograph whole, scaled to the cover's size, and nothing more.
 *
 * The other is *drawn*: a field of colour derived from the name of the
 * work, with a horizon band and the spine of a bound book. The colour is
 * derived from the name by a hash, so two series never look alike and the
 * same series always looks the same, on every machine and every build.
 *
 * Every cover is three by four — the proportions of a paperback — and the
 * picture on a cover is the whole picture.
 *
 * Run with `npm run covers:build`. The generated files are committed, so
 * a normal build never runs this.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "src", "assets", "covers");

/**
 * The size of the generated cover, in pixels.
 *
 * A cover is three by four — wider than it is tall, in the proportions of
 * a paperback. The photograph the cover is built on has these proportions
 * too, so a cover is the photograph at a different size rather than a
 * piece of the photograph.
 */
const WIDTH = 600;
const HEIGHT = 800;

/**
 * The works that get a cover.
 *
 * A series is what has a cover: a novel is a thing that has one. A
 * standalone essay is a single sheet of paper, and giving it a cover
 * would put a picture of a book next to a list of everything else.
 */
const COVERS = [
  {
    file: "xue-luo-jiang-chuan",
    name: "雪落江川",
    /**
     * A photograph to build the cover on, instead of the drawn field.
     *
     * The novel is about a winter afternoon in a hospital ward, and the
     * artwork is a winter window: a cold pane, a bare branch, the light
     * going. A field of colour with a title on it says "a book"; a
     * photograph says which book.
     */
    artwork: join(ROOT, "src", "assets", "artwork", "fragile-winter-light.png"),
  },
  {
    file: "ye-hang-chuan",
    name: "夜航船",
  },
];

/* ------------------------------------------------------------------ *
 * Colour
 * ------------------------------------------------------------------ */

/**
 * A stable hash of a string.
 *
 * The same string must always produce the same colour, so the hash is
 * written out rather than taken from a helper whose results differ
 * between engines.
 */
function hash(text) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/**
 * The colour of a work, drawn from its name.
 *
 * The hue is spread around the whole circle, so two works whose names
 * start alike still do not look alike. The saturation and the lightness
 * are kept in a narrow band: a cover that is too saturated shouts, and a
 * cover that is too pale disappears into the page.
 */
function palette(name) {
  const seed = hash(name);
  const hue = seed % 360;
  const saturation = 26 + (seed % 15); // 26–40
  const lightness = 26 + ((seed >> 8) % 14); // 26–39

  return {
    deep: `hsl(${hue} ${saturation}% ${lightness}%)`,
    mid: `hsl(${(hue + 14) % 360} ${saturation - 4}% ${lightness + 12}%)`,
    pale: `hsl(${(hue + 30) % 360} ${saturation - 12}% ${lightness + 30}%)`,
    ink: `hsl(${hue} 30% 93%)`,
  };
}

/* ------------------------------------------------------------------ *
 * The cover
 * ------------------------------------------------------------------ */

/**
 * The SVG of a drawn cover.
 *
 * A field of colour with a horizon band and the spine of a bound book.
 * Nothing is written on it.
 *
 * The colour is drawn from the name of the work, so the cover of a series
 * is the same on every machine and every build, and no two series look
 * alike.
 */
function coverSvg(cover, colors) {
  const horizon = HEIGHT * 0.64;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="field" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="${colors.mid}" />
      <stop offset="100%" stop-color="${colors.deep}" />
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.pale}" stop-opacity="0.42" />
      <stop offset="65%" stop-color="${colors.pale}" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${colors.ink}" stop-opacity="0.16" />
      <stop offset="100%" stop-color="${colors.deep}" stop-opacity="0.28" />
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#field)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#haze)" />

  <!--
    The horizon.

    A cold field and a pale band of water below it. The band is a
    gradient rather than a line, because a river seen from a distance is
    not a line.
  -->
  <rect x="0" y="${horizon}" width="${WIDTH}" height="${HEIGHT - horizon}" fill="url(#water)" />
  <rect x="0" y="${horizon}" width="${WIDTH}" height="1" fill="${colors.ink}" opacity="0.4" />

  <!-- The spine: the band down the left edge of a bound book. -->
  <rect x="0" y="0" width="16" height="${HEIGHT}" fill="#000" opacity="0.18" />
</svg>`;
}

/* ------------------------------------------------------------------ *
 * A cover built on a photograph
 * ------------------------------------------------------------------ */

/**
 * Builds a cover on top of a photograph.
 *
 * The photograph is cropped to the proportions of the cover — 2:3 — and
 * that is the whole cover.
 *
 * There is no type over it. The picture is the work's own artwork, drawn
 * by hand rather than generated; setting the title on it would cover the
 * picture with a caption, and the caption is already on the card that
 * shows the cover, next to the name of the work. A picture and a caption
 * do not need to say the same thing twice, especially when the caption
 * is a drawn one and the picture is not.
 *
 * An earlier version did set the name over the picture, in white, with a
 * shadow and a slow gradient to carry it. The gradient was the problem:
 * it darkened the foot of the picture by a third, which made the bottom
 * of the cover a different picture from the top, and the type sat on top
 * of it like a sticker. What the reader wanted was the picture.
 */
async function artworkCoverPng(cover) {
  return artworkPicture(cover);
}
/**
 * The picture of a cover, at the cover's proportions.
 *
 * A picture that already has the cover's proportions is used whole: it is
 * scaled to the cover's size and nothing is cut away. A picture that does
 * not have them is cropped, from the centre, which is a reasonable guess
 * but not always a good one — a cover may declare the crop it wants.
 */
async function artworkPicture(cover) {
  const source = sharp(cover.artwork);

  if (cover.crop) {
    return source
      .extract(cover.crop)
      .resize(WIDTH, HEIGHT, { fit: "cover" })
      .png()
      .toBuffer();
  }

  // "contain" keeps the whole picture: if the picture is of a different
  // shape, the cover is a letterbox of it rather than a window cut into
  // it. Nothing is lost, and nothing is invented.
  return source
    .resize(WIDTH, HEIGHT, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

mkdirSync(OUT_DIR, { recursive: true });

for (const cover of COVERS) {
  const colors = palette(cover.name);

  if (cover.artwork) {
    if (!existsSync(cover.artwork)) {
      console.error(
        `· the artwork of ${cover.name} is missing:\n  ${cover.artwork}`
      );
      process.exit(1);
    }

    const png = await artworkCoverPng(cover);
    writeFileSync(join(OUT_DIR, `${cover.file}.png`), png);

    console.log(
      `· ${cover.name} → src/assets/covers/${cover.file}.png  (artwork)`
    );
    continue;
  }

  const svg = coverSvg(cover, colors);

  // The SVG is kept alongside the picture: it is the source, and it is
  // the version that scales without ever going soft.
  writeFileSync(join(OUT_DIR, `${cover.file}.svg`), svg);

  await sharp(Buffer.from(svg))
    .resize(WIDTH, HEIGHT)
    .png({ compressionLevel: 9 })
    .toFile(join(OUT_DIR, `${cover.file}.png`));

  console.log(`· ${cover.name} → src/assets/covers/${cover.file}.png`);
}
