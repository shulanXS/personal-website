/**
 * Prepares an image for upload to Pages CMS.
 *
 * The CMS uploads a file as one JSON request whose body holds the image
 * base64-encoded. Base64 adds a third to the size, and the hosted CMS runs
 * behind a request-size limit of about 4.3 MB — so a raw photo has to be
 * under roughly 3.2 MB to get through. A phone photo is usually well over
 * that, which is why an upload fails with a size error and nothing is
 * written to the repository.
 *
 * This script brings a picture under the limit and puts it in a format the
 * CMS accepts, so the upload is a plain file copy afterwards:
 *
 *   node scripts/prepare-image.mjs <input> [output]
 *
 * With one argument the result is written next to the input. With two, the
 * second names the output file.
 *
 * What it does:
 *
 *   * HEIC and AVIF (the formats iPhones and some cameras produce) are
 *     converted to JPEG, because the CMS only accepts a fixed list of
 *     extensions. HEIC is read through ffmpeg, which understands the HEVC
 *     stream inside it.
 *   * The picture is scaled down so its longest side is at most 2000 px.
 *     The images on this site are shown at most 1200 px wide, so a larger
 *     picture is wasted bytes.
 *   * JPEG is written at quality 82. The existing uploads in `public/uploads`
 *     are between 19 KB and 136 KB at that quality, which is small enough
 *     to upload and sharp enough to look good.
 *   * PNG is kept as PNG when it has an alpha channel, and flattened onto
 *     white otherwise — a photograph does not need to carry transparency.
 *
 * Run `npm run image:prepare -- <input>`.
 */
import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

/**
 * The longest side, in pixels, of the prepared picture.
 *
 * The site shows a note's images in a column no wider than the content
 * area, and the existing uploads are 1200 px wide. Two thousand leaves
 * room for a retina display without carrying the weight of a full camera
 * original.
 */
const MAX_EDGE = 2000;

/** The JPEG quality used for the output. */
const QUALITY = 82;

/**
 * The extensions the CMS's media configuration accepts.
 *
 * `.pages.yml` lists these as the allowed extensions of the `images` media
 * source. A file outside the list is rejected by the CMS before it is
 * even sent, so it is worth converting rather than uploading and seeing
 * what happens.
 */
const ACCEPTED = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

/**
 * The formats that have to be converted before they can be read.
 *
 * AVIF is not here: sharp reads it directly, and the CMS accepts it.
 */
const NEEDS_CONVERSION = new Set([".heic", ".heif"]);

/**
 * Reads a HEIC file into a PNG buffer.
 *
 * sharp cannot open a HEIC file: the copy of libheif that is linked into
 * it does not understand the HEVC still-picture profile an iPhone writes.
 * ffmpeg does understand it, so the conversion is done there and the result
 * is handed back to sharp as a PNG.
 */
const readHeic = async (input) => {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    ["-y", "-hide_banner", "-loglevel", "error", "-i", input, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "pipe:1"],
    { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
  );
  return sharp(stdout);
};

/**
 * Opens an image, converting it first when the format cannot be read
 * directly.
 */
const open = async (input) => {
  const ext = extname(input).toLowerCase();
  if (NEEDS_CONVERSION.has(ext)) return readHeic(input);
  return sharp(input);
};

const [, , rawInput, rawOutput] = process.argv;

if (!rawInput) {
  console.error("usage: node scripts/prepare-image.mjs <input> [output]");
  process.exit(1);
}

const input = resolve(rawInput);
if (!existsSync(input)) {
  console.error(`not found: ${input}`);
  process.exit(1);
}

const inputExt = extname(input).toLowerCase();

/**
 * Works out where the result is written.
 *
 * The default is a sibling of the input with the chosen extension. When
 * that would land on the input itself — a JPEG that stays a JPEG, asked to
 * be written in place — a `-prepared` suffix is added, so the original is
 * never overwritten by a file that is still being read.
 */
const resolveOutput = (chosenExt) => {
  if (rawOutput) return resolve(rawOutput);
  const stem = join(dirname(input), basename(input, inputExt));
  const candidate = `${stem}${chosenExt}`;
  if (candidate === input) return `${stem}-prepared${chosenExt}`;
  return candidate;
};

/**
 * Decides the format of the result.
 *
 * A PNG keeps its format only when it carries transparency — a logo or a
 * diagram, where flattening it onto white would change the picture. A PNG
 * that is really a photograph is written as a JPEG, which is much smaller.
 */
const decideFormat = async (image) => {
  const metadata = await image.metadata();
  if (metadata.format === "png" && metadata.hasAlpha) {
    return { ext: ".png", format: "png" };
  }
  if (metadata.format === "gif") {
    // A GIF is animated or it is not; re-encoding it as a JPEG would drop
    // the animation, so it is left alone.
    return { ext: ".gif", format: "gif" };
  }
  return { ext: ".jpg", format: "jpeg" };
};

const image = await open(input);
const { ext, format } = await decideFormat(image);

if (!ACCEPTED.has(ext)) {
  console.error(`cannot prepare ${input}: ${ext} is not a format the CMS accepts`);
  process.exit(1);
}

const output = resolveOutput(ext);

const pipeline = image.resize({
  width: MAX_EDGE,
  height: MAX_EDGE,
  fit: "inside",
  withoutEnlargement: true,
});

if (format === "jpeg") {
  pipeline.flatten({ background: "#ffffff" }).jpeg({ quality: QUALITY, mozjpeg: true });
} else if (format === "png") {
  pipeline.png({ compressionLevel: 9 });
}

await pipeline.toFile(output);

const before = statSync(input).size;
const after = statSync(output).size;
const metadata = await sharp(output).metadata();

console.log(
  `${rawInput} -> ${output}\n` +
    `  ${metadata.width}x${metadata.height} ${metadata.format}, ` +
    `${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB`,
);
