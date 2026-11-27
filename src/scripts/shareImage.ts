import { useTranslations } from "@/i18n";
import html2canvas from "html2canvas";
import mark from "@/assets/monogram-logo.svg?url";
import readingFont from "@/styles/reading-font.css?inline";
import paperStyle from "@/styles/sharePaper.css?inline";

const width = 540;
const footerGap = 16;
const domain = "www.chewenjie.com";
const signature = "车文杰";

async function embedImage(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("image");
  const blob = await response.blob();
  if (blob.type.includes("svg")) {
    const svg = new DOMParser().parseFromString(
      await blob.text(),
      "image/svg+xml"
    ).documentElement;
    const box = svg
      .getAttribute("viewBox")
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
    if (box?.length === 4 && box[2] > 0 && box[3] > 0) {
      svg.setAttribute("width", String(box[2]));
      svg.setAttribute("height", String(box[3]));
    }
    const image = new Image();
    image.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(new XMLSerializer().serializeToString(svg));
    await image.decode();
    const raster = document.createElement("canvas");
    raster.width = Math.min(width * 2, image.naturalWidth * 2);
    raster.height = Math.max(
      1,
      Math.round((raster.width * image.naturalHeight) / image.naturalWidth)
    );
    raster
      .getContext("2d")!
      .drawImage(image, 0, 0, raster.width, raster.height);
    return raster.toDataURL("image/png");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

// A small seamless grain tile keeps long exports inexpensive on phones.
function paperTexture(doc: Document) {
  const tile = doc.createElement("canvas");
  tile.width = tile.height = 96;
  const ctx = tile.getContext("2d")!;
  const pixels = ctx.createImageData(tile.width, tile.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = Math.round((Math.random() - 0.5) * 13);
    pixels.data.set([245 + grain, 238 + grain, 221 + grain, 255], i);
  }
  ctx.putImageData(pixels, 0, 0);
  return tile;
}

function drawContentWatermarks(
  ctx: CanvasRenderingContext2D,
  footerTop: number
) {
  ctx.save();
  ctx.font = "bold 39px Georgia, serif";
  ctx.fillStyle = "rgba(72, 67, 50, 0.105)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let row = 0, y = 100; y < footerTop - 50; row++, y += 180) {
    const x = width * (row % 2 === 0 ? 0.3 : 0.7);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 7);
    ctx.fillText("WENJIE CHE", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// Use the painted bounds of the glyphs and the icon path for one optical centre.
function drawRating(
  ctx: CanvasRenderingContext2D,
  rating: HTMLElement,
  x: number,
  y: number
) {
  // The star's bounding-box path inherits fill="none" from its SVG.
  const path = Array.from(
    rating.querySelectorAll<SVGPathElement>("svg path")
  ).find(candidate => getComputedStyle(candidate).fill !== "none");
  const shape = path?.getAttribute("d");
  const value = rating.querySelector(".app-rating-value")?.textContent?.trim();
  if (!path || !shape || !value) return;
  const labels = useTranslations(document.documentElement.lang).share;
  const symbol = rating.dataset.ratingSymbol;
  const label =
    symbol === "heart"
      ? labels.affinity
      : symbol === "gamepad"
        ? labels.gameplay
        : labels.rating;
  ctx.save();
  ctx.textBaseline = "alphabetic";
  const text = (str: string, font: string, color: string) => {
    ctx.font = font;
    ctx.fillStyle = color;
    const metrics = ctx.measureText(str);
    ctx.fillText(
      str,
      x,
      y +
        (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
    );
    x += metrics.width;
  };
  const family =
    '"Noto Serif SC Reading", "Noto Serif SC Reading Extended", serif';
  text(label, "400 16px " + family, "#70685c");
  x += 10;
  const box = path.getBBox();
  const outline = new Path2D(shape);
  const fillRule =
    path.getAttribute("fill-rule") === "evenodd" ? "evenodd" : "nonzero";
  for (let index = 0; index < 5; index++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(17 / 24, 17 / 24);
    ctx.translate(0, -box.y - box.height / 2);
    ctx.fillStyle = "#d1c6af";
    ctx.fill(outline, fillRule);
    const fraction = Math.min(1, Math.max(0, Number(value) - index));
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width * fraction, box.height);
    ctx.clip();
    ctx.fillStyle = "#a66528";
    ctx.fill(outline, fillRule);
    ctx.restore();
    x += 20;
  }
  x += 7;
  ctx.font = "700 17px " + family;
  ctx.fillStyle = "#37392e";
  const score = ctx.measureText(value);
  const baseline =
    y + (score.actualBoundingBoxAscent - score.actualBoundingBoxDescent) / 2;
  ctx.fillText(value, x, baseline);
  ctx.font = "400 17px " + family;
  ctx.fillText(" / 5", x + score.width, baseline);
  ctx.restore();
}

// Centre the actual ink of the two scripts on the same axis as the monogram.
function drawSignature(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  y: number
) {
  ctx.fillStyle = "#37392e";
  ctx.font = '600 22px "Noto Serif SC Reading", serif';
  const name = ctx.measureText(signature);
  const nameFont = ctx.font;
  ctx.font = "19px Georgia, serif";
  const site = ctx.measureText(domain);
  const left = 34;
  ctx.drawImage(logo, left, y - 18, 36, 36);
  ctx.textBaseline = "alphabetic";
  ctx.fillText(
    domain,
    width - left - site.width,
    y + (site.actualBoundingBoxAscent - site.actualBoundingBoxDescent) / 2
  );
  ctx.font = nameFont;
  ctx.fillText(
    signature,
    left + 45,
    y + (name.actualBoundingBoxAscent - name.actualBoundingBoxDescent) / 2
  );
}

// Read the transparent content from the bottom up, before adding any paper or
// watermarks. A browser's line wrapping can differ from the measured layout.
function paintedHeight(ctx: CanvasRenderingContext2D) {
  const { width, height } = ctx.canvas;
  for (let end = height; end > 0;) {
    const start = Math.max(0, end - 128);
    const { data } = ctx.getImageData(0, start, width, end - start);
    for (let alpha = data.length - 1; alpha >= 3; alpha -= 4) {
      if (data[alpha] >= 128)
        return start + Math.floor(alpha / (width * 4)) + 1;
    }
    end = start;
  }
  throw new Error("empty export");
}

function finishPaper(
  content: HTMLCanvasElement,
  logo: HTMLImageElement,
  scale: number
) {
  const bodyHeight = paintedHeight(content.getContext("2d")!);
  const gap = Math.round(footerGap * scale);
  const rule = Math.max(1, Math.round(scale));
  const markHeight = Math.round(28 * scale);
  const naturalHeight = bodyHeight + gap * 3 + rule + markHeight;
  const output = content.ownerDocument.createElement("canvas");
  output.width = content.width;
  output.height = Math.max(naturalHeight, Math.ceil((output.width * 4) / 3));
  const top = output.height - naturalHeight;
  const ctx = output.getContext("2d")!;
  ctx.drawImage(
    content,
    0,
    0,
    content.width,
    bodyHeight,
    0,
    top,
    content.width,
    bodyHeight
  );
  content.width = content.height = 0;
  ctx.scale(scale, scale);
  const divider = top + bodyHeight + gap;
  drawContentWatermarks(ctx, divider / scale);
  ctx.fillStyle = "#b6ae98";
  ctx.fillRect(34, divider / scale, width - 68, rule / scale);
  drawSignature(ctx, logo, (divider + rule + gap + markHeight / 2) / scale);
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = ctx.createPattern(
    paperTexture(output.ownerDocument),
    "repeat"
  )!;
  ctx.fillRect(0, 0, output.width / scale, output.height / scale);
  return output;
}

async function renderImage(button: HTMLButtonElement, signal: AbortSignal) {
  signal.throwIfAborted();
  const body = document.querySelector("#article");
  if (!body) throw new Error("article");
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:600px;border:0;pointer-events:none`;
  document.body.append(frame);
  try {
    const doc = frame.contentDocument!;
    const style = doc.createElement("style");
    style.textContent = readingFont + paperStyle;
    doc.head.append(style);
    const paper = doc.createElement("main");
    const date = doc.createElement("time");
    date.textContent = new Intl.DateTimeFormat(document.documentElement.lang, {
      dateStyle: "long",
      timeZone: button.dataset.shareZone,
    }).format(new Date(button.dataset.shareDate!));
    paper.append(date);
    if (button.dataset.shareTitle) {
      const title = doc.createElement("h1");
      title.textContent = button.dataset.shareTitle;
      paper.append(title);
    }
    const rating = button.parentElement?.querySelector<HTMLElement>(
      "[data-rating-symbol]"
    );
    const scoreRow = doc.createElement("div");
    if (rating) {
      scoreRow.className = "export-rating";
      paper.append(scoreRow);
    }
    const content = doc.createElement("section");
    for (const node of body.childNodes)
      content.append(doc.importNode(node, true));
    for (const control of content.querySelectorAll(
      "script,style,button,label,select,noscript,.heading-link,[hidden],[data-controls]"
    ))
      control.remove();
    for (const video of content.querySelectorAll("video")) {
      const poster = video.getAttribute("poster");
      if (poster) {
        const img = doc.createElement("img");
        img.src = poster;
        img.alt = video.getAttribute("aria-label") || "";
        video.replaceWith(img);
      } else {
        video.replaceWith(
          doc.createTextNode(
            video.textContent || video.getAttribute("aria-label") || ""
          )
        );
      }
    }
    for (const detail of content.querySelectorAll("details"))
      detail.open = true;
    for (const element of content.querySelectorAll("[style]"))
      element.removeAttribute("style");
    const logo = doc.createElement("img");
    logo.src = mark;
    paper.append(content);
    // Resolve each asset before capture so a missing image cannot silently disappear.
    try {
      await Promise.all(
        [logo, ...paper.querySelectorAll("img")].map(async img => {
          const src = new URL(img.getAttribute("src")!, document.baseURI).href;
          img
            .closest("picture")
            ?.querySelectorAll("source")
            .forEach(source => source.remove());
          img.removeAttribute("srcset");
          img.removeAttribute("loading");
          img.src = await embedImage(src, signal);
          await img.decode();
        })
      );
    } catch {
      throw new Error("image");
    }
    signal.throwIfAborted();
    doc.body.append(paper);
    paper.getBoundingClientRect();
    await doc.fonts.load('600 22px "Noto Serif SC Reading"', signature);
    await doc.fonts.ready;
    signal.throwIfAborted();
    const canvas = doc.createElement("canvas");
    let scale = 1;
    let ratingX = 0;
    let ratingY = 0;
    await html2canvas(paper, {
      canvas,
      get scale() {
        return scale;
      },
      width,
      windowWidth: width,
      backgroundColor: null,
      logging: false,
      onclone(_doc, clone) {
        const height = Math.ceil(clone.getBoundingClientRect().height);
        const exportHeight = Math.max(
          (width * 4) / 3,
          height + 3 * footerGap + 32
        );
        scale = Math.min(
          2,
          16000 / exportHeight,
          Math.sqrt(12000000 / (width * exportHeight))
        );
        canvas.width = Math.ceil(width * scale);
        canvas.height = Math.ceil(height * scale);
        const row = clone.querySelector<HTMLElement>(".export-rating");
        if (row) {
          ratingX = row.offsetLeft;
          ratingY = row.offsetTop + row.offsetHeight / 2;
        }
      },
    });
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (rating) drawRating(ctx, rating, ratingX, ratingY);
    const output = finishPaper(canvas, logo, scale);
    try {
      return await new Promise<Blob>((resolve, reject) =>
        output.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error("png"))),
          "image/png"
        )
      );
    } finally {
      output.width = output.height = 0;
    }
  } finally {
    frame.remove();
  }
}

export async function saveShareImage(
  button: HTMLButtonElement,
  signal: AbortSignal
) {
  const blob = await renderImage(button, signal);
  signal.throwIfAborted();
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  document.body.append(frame);
  const receiver = frame.contentDocument!;
  const download = receiver.createElement("a");
  download.href = url;
  download.download =
    (
      button.dataset.shareTitle || button.dataset.shareDate!.slice(0, 10)
    ).replace(/[<>:"/\\|?*]/g, "-") + ".png";
  download.hidden = true;
  download.setAttribute("data-astro-reload", "");
  receiver.body.append(download);
  try {
    download.click();
  } finally {
    download.remove();
    window.setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 30000);
  }
}
