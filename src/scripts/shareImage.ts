import { useTranslations } from "@/i18n";
import html2canvas from "html2canvas";
import mark from "@/assets/monogram-logo.svg?url";
import readingFont from "@/styles/reading-font.css?inline";
import paperStyle from "@/styles/sharePaper.css?inline";

const width = 540;
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
  ctx.font = "bold 34px Georgia, serif";
  ctx.fillStyle = "rgba(72, 67, 50, 0.13)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let row = 0, y = 100; y < footerTop - 50; row++, y += 146) {
    const x = width * (row % 2 === 0 ? 0.3 : 0.7);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 7);
    ctx.fillText("WENJIE CHE", 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// Centre the actual ink of the two scripts on the same axis as the monogram.
function drawSignature(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  dividerTop: number
) {
  // The mark has transparent space inside its SVG. Position its visible ring
  // against the divider, independently of the footer's box height.
  const y = dividerTop + 15;
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
    const rating = button.parentElement?.querySelector("[data-rating-symbol]");
    if (rating) {
      const score = doc.importNode(rating, true);
      const value = score.querySelector(".app-rating-value");
      const labels = useTranslations(document.documentElement.lang).share;
      const caption = doc.createElement("small");
      const symbol = rating.getAttribute("data-rating-symbol");
      caption.textContent =
        symbol === "heart"
          ? labels.affinity
          : symbol === "gamepad"
            ? labels.gameplay
            : labels.rating;
      score.prepend(caption);
      if (value) {
        const maximum = doc.createElement("small");
        maximum.textContent = " / 5";
        value.append(maximum);
      }
      for (const icon of score.querySelectorAll("svg")) {
        const color = icon.closest(".app-rating-star-fill")
          ? "#a66528"
          : "#d1c6af";
        icon.setAttribute("color", color);
      }
      paper.append(score);
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
    const footer = doc.createElement("footer");
    const logo = doc.createElement("img");
    logo.src = mark;
    paper.append(content, footer);
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
    const height = Math.ceil(paper.getBoundingClientRect().height);
    const scale = Math.min(
      2,
      16000 / height,
      Math.sqrt(12000000 / (width * height))
    );
    signal.throwIfAborted();
    // Draw in the document that owns the loaded reading fonts.
    const canvas = doc.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    // Paint every output pixel, including the rounded last row of a long export.
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.scale(scale, scale);
    ctx.fillStyle = ctx.createPattern(paperTexture(doc), "repeat")!;
    ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
    ctx.restore();
    await html2canvas(paper, {
      canvas,
      scale,
      width,
      height,
      windowWidth: width,
      backgroundColor: null,
      logging: false,
    });
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawContentWatermarks(ctx, footer.offsetTop);
    drawSignature(ctx, logo, footer.offsetTop);
    try {
      return await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error("png"))),
          "image/png"
        )
      );
    } finally {
      canvas.width = canvas.height = 0;
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
