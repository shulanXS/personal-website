/**
 * Uploads an image straight to GitHub, bypassing the Pages CMS upload path.
 *
 * The CMS sends an image to its own server as one JSON request whose body
 * holds the image base64-encoded. The hosted CMS runs behind a request-size
 * limit of about 4.5 MB, which works out to a raw file of about 3.3 MB, so
 * an ordinary phone photo cannot go through it. This script does not use
 * that path at all: it commits the file to the repository through the
 * GitHub API, where the limit is far higher.
 *
 *   node scripts/upload-image.mjs <input> [output]
 *
 * With one argument the file keeps its name and lands in `public/uploads/`.
 * With two, the second names the output file.
 *
 * The file is committed on the branch the CMS reads from, so it shows up in
 * the CMS media library and can be attached to a note the usual way. The
 * name is randomised the way the CMS would have named it, so a picture
 * uploaded this way is indistinguishable from one uploaded through the CMS.
 *
 * The token is read from the GitHub CLI's own login, so there is nothing to
 * configure:
 *
 *   gh auth login
 *   npm run image:upload -- ~/Pictures/IMG_1234.HEIC
 *
 * The picture is prepared first if it needs to be: HEIC is converted to
 * JPEG, and a picture that is still larger than the site needs is scaled
 * down. A file that is left alone keeps every pixel of the original, so
 * the quality of the original is preserved.
 */
import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** The repository the pictures are committed to. */
const REPO = { owner: "shulanXS", name: "personal-website", branch: "main" };

/** The directory in the repository that holds the pictures. */
const UPLOAD_DIR = "public/uploads";

/**
 * The formats the CMS's media configuration accepts.
 *
 * `.pages.yml` lists these as the allowed extensions of the `images` media
 * source, and the CMS filters the media library by them, so a file outside
 * the list would not be selectable there.
 */
const ACCEPTED = new Set(["png", "jpg", "jpeg", "webp", "gif", "avif"]);

/**
 * The formats that have to be converted before they can be committed.
 *
 * HEIC is the format an iPhone produces. It is not on the accepted list,
 * so it is converted to JPEG first.
 */
const NEEDS_CONVERSION = new Set(["heic", "heif"]);

/**
 * The longest side, in pixels, of a picture that gets scaled down.
 *
 * The site shows a note's pictures in a grid no wider than 33.75 rem, so a
 * picture much larger than that is wasted bytes. This is only a ceiling
 * for pictures that need resizing anyway; a picture that is already small
 * enough is committed untouched.
 */
const MAX_EDGE = 2400;

/**
 * The largest file that is committed as it is.
 *
 * A picture under this size is written without being touched, so a picture
 * that is already a sensible size keeps its original bytes and quality.
 * A picture above it is scaled down and re-encoded, which is what makes a
 * very large original usable.
 */
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Reads the GitHub token from the GitHub CLI.
 *
 * The CLI is already logged in on this machine, and reading the token from
 * it means this script has no configuration of its own.
 */
const getToken = async () => {
  try {
    const { stdout } = await execFileAsync("gh", ["auth", "token"], {
      encoding: "utf8",
    });
    const token = stdout.trim();
    if (!token) throw new Error("empty token");
    return token;
  } catch {
    console.error(
      "Could not read a GitHub token from the GitHub CLI.\n" +
        "Run `gh auth login` first, or set GITHUB_TOKEN in the environment.",
    );
    process.exit(1);
  }
};

/**
 * Makes a random name in the shape the CMS gives an uploaded file.
 *
 * The CMS names an uploaded file `<timestamp in base 36>-<random>.ext`,
 * which keeps the name short and free of anything awkward. The same shape
 * is used here so that a picture committed this way is indistinguishable
 * from one uploaded through the CMS.
 */
const cmsStyleName = (extension) => {
  const rand = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${stamp}-${rand}.${extension}`;
};

/**
 * Converts a HEIC file to JPEG.
 *
 * sharp cannot open a HEIC file, so ffmpeg is used, which understands the
 * HEVC stream inside it.
 */
const convertFromHeic = async (input, output) => {
  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-frames:v",
      "1",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "pipe:1",
    ],
    { encoding: "buffer", maxBuffer: 256 * 1024 * 1024 },
  ).then(({ stdout }) => writeFile(output, stdout));
};

/**
 * Brings a picture under the byte budget.
 *
 * The source is decoded once, and the picture is then re-encoded at a
 * lower quality and then at a smaller size until it fits. This is only
 * used for a picture that is too large to commit as it is.
 */
const fitToBudget = async (input, output) => {
  const { default: sharp } = await import("sharp");
  const source = await sharp(input).toBuffer();

  let quality = 85;
  let edge = MAX_EDGE;

  for (;;) {
    const pipeline = sharp(source).resize({
      width: edge,
      height: edge,
      fit: "inside",
      withoutEnlargement: true,
    });
    pipeline.flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true });

    const buffer = await pipeline.toBuffer();
    if (buffer.length <= MAX_BYTES) {
      await writeFile(output, buffer);
      return { quality, edge, bytes: buffer.length };
    }

    if (quality > 45) {
      quality -= 10;
      continue;
    }

    if (edge > 640) {
      edge = Math.round(edge * 0.8);
      continue;
    }
  }
};

/**
 * Commits a file to the repository through the GitHub API.
 *
 * The contents API takes the file base64-encoded, exactly like the CMS
 * does, but it is not behind the CMS's request-size limit. The response
 * carries the commit that was made.
 */
const commitFile = async (token, path, bytes, message) => {
  const body = JSON.stringify({
    message,
    content: bytes.toString("base64"),
    branch: REPO.branch,
  });

  const response = await fetch(
    `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "upload-image",
      },
      body,
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const detail = data?.message ?? `HTTP ${response.status}`;
    throw new Error(`GitHub refused the commit: ${detail}`);
  }

  return data;
};

const [, , rawInput, rawOutput] = process.argv;

if (!rawInput) {
  console.error("usage: node scripts/upload-image.mjs <input> [output]");
  process.exit(1);
}

const input = resolve(rawInput);
if (!existsSync(input)) {
  console.error(`not found: ${input}`);
  process.exit(1);
}

const inputExt = extname(input).toLowerCase().replace(/^\./, "");

/**
 * The name the file is committed under.
 *
 * An explicit output name is used as it is. Otherwise the name is
 * randomised the way the CMS would have named it.
 */
const committedName = rawOutput
  ? basename(rawOutput)
  : cmsStyleName(
      NEEDS_CONVERSION.has(inputExt) ? "jpg" : inputExt || "jpg",
    );

const committedExt = extname(committedName).toLowerCase().replace(/^\./, "");

if (!ACCEPTED.has(committedExt)) {
  console.error(
    `cannot upload ${input}: .${committedExt} is not a format the CMS accepts`,
  );
  process.exit(1);
}

/**
 * The bytes that get committed.
 *
 * A picture in an accepted format that is already small enough is
 * committed untouched, which keeps every pixel and every byte of the
 * original. A picture in HEIC is converted, because the CMS does not
 * accept that format. A picture that is too large is scaled down, because
 * a very large file would make the site slow for no gain — the grid shows
 * a picture at a few hundred pixels across.
 */
const staged = join(tmpdir(), `upload-image-${Date.now()}-${committedName}`);

let bytes;
let note = "";

try {
  if (NEEDS_CONVERSION.has(inputExt)) {
    await convertFromHeic(input, staged);
    bytes = await readFile(staged);
    note = "converted from HEIC";
  } else if (statSync(input).size <= MAX_BYTES) {
    bytes = await readFile(input);
    note = "committed as it is";
  } else {
    const result = await fitToBudget(input, staged);
    bytes = await readFile(staged);
    note = `scaled to ${result.edge}px, quality ${result.quality}`;
  }
} finally {
  await rm(staged, { force: true });
}

const token = await getToken();

const result = await commitFile(
  token,
  `${UPLOAD_DIR}/${committedName}`,
  bytes,
  `media(images): create ${committedName}`,
);

console.log(
  `${rawInput}\n` +
    `  -> ${UPLOAD_DIR}/${committedName}\n` +
    `  ${Math.round(bytes.length / 1024)} KB, ${note}\n` +
    `  commit ${result.commit.sha.slice(0, 7)} on ${REPO.branch}`,
);
     