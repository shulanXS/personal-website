import html2canvas from "html2canvas";
import mark from "@/assets/monogram-logo.svg?url";
import readingFont from "@/styles/reading-font.css?inline";
import paperStyle from "@/styles/sharePaper.css?inline";

const width = 720;
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
  return tile.toDataURL();
}

async function articleBody(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("article");
  const page = new DOMParser().parseFromString(
    await response.text(),
    "text/html"
  );
  const body = page.querySelector("#article");
  if (!body) throw new Error("article");
  for (const img of body.querySelectorAll("img[src],video[poster]")) {
    const attr = img.tagName === "VIDEO" ? "poster" : "src";
    img.setAttribute(attr, new URL(img.getAttribute(attr)!, response.url).href);
  }
  return body;
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
  const left = 52;
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
  const href = button.dataset.shareHref;
  const note = button.closest(".app-note-entry, .app-note-inline");
  const body = href
    ? await articleBody(href, signal)
    : note
      ? note.querySelector("[data-note-body]")
      : document.querySelector("#article");
  const gallery = note?.querySelectorAll<HTMLImageElement>("ul img") ?? [];
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText =
    "position:fixed;left:-10000px;top:0;width:720px;height:600px;border:0;pointer-events:none";
  document.body.append(frame);
  try {
    const doc = frame.contentDocument!;
    const style = doc.createElement("style");
    style.textContent = readingFont + paperStyle;
    doc.head.append(style);
    const paper = doc.createElement("main");
    paper.style.backgroundImage = "url(" + paperTexture(doc) + ")";
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
    const content = doc.createElement("section");
    if (body) {
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
    }
    for (const image of gallery) {
      if (!body?.contains(image)) content.append(doc.importNode(image, true));
    }
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
    for (let top = 620; top < height - 150; top += 1050) {
      const stamp = doc.createElement("aside");
      stamp.textContent = signature;
      stamp.style.top = top + "px";
      paper.append(stamp);
    }
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
    await html2canvas(paper, {
      canvas,
      scale,
      width,
      height,
      windowWidth: width,
      backgroundColor: "#fbfaf6",
      logging: false,
    });
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawSignature(ctx, logo, footer.offsetTop + footer.offsetHeight / 2 + 4);
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
