import html2canvas from "html2canvas";
import mark from "@/assets/monogram-logo.svg?url";
import readingFont from "@/styles/reading-font.css?inline";
import paperStyle from "@/styles/sharePaper.css?inline";
import "@/styles/shareDialog.css";
import { useTranslations } from "@/i18n";

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

async function renderImage(button: HTMLButtonElement, signal: AbortSignal) {
  const note = button.closest("article");
  const body = note
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
    const name = doc.createElement("strong");
    name.textContent = signature;
    const url = doc.createElement("span");
    url.textContent = domain;
    footer.append(logo, name, url);
    paper.append(content, footer);
    // Resolve each asset before capture so a missing image cannot silently disappear.
    try {
      await Promise.all(
        Array.from(paper.querySelectorAll("img"), async img => {
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

export function openShareImage(button: HTMLButtonElement) {
  if (document.querySelector("dialog.share-image")) return;
  const t = useTranslations(document.documentElement.lang).share;
  const dialog = document.createElement("dialog");
  dialog.className = "share-image";
  dialog.setAttribute("aria-label", t.open);
  const close = document.createElement("button");
  close.textContent = t.close;
  close.onclick = () => dialog.close();
  const heading = document.createElement("strong");
  heading.textContent = t.open;
  const header = document.createElement("header");
  header.append(heading, close);
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  const preview = document.createElement("img");
  preview.alt = t.open;
  preview.hidden = true;
  const download = document.createElement("a");
  download.textContent = t.save;
  download.download =
    (
      button.dataset.shareTitle || button.dataset.shareDate!.slice(0, 10)
    ).replace(/[<>:"/\\|?*]/g, "-") + ".png";
  download.hidden = true;
  const retry = document.createElement("button");
  retry.textContent = t.retry;
  const controller = new AbortController();
  let url: string | undefined;
  async function generate() {
    retry.hidden = true;
    status.textContent = t.busy;
    try {
      const blob = await renderImage(button, controller.signal);
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob);
      download.href = preview.src = url;
      preview.hidden = download.hidden = false;
      status.textContent = t.tip;
    } catch (error) {
      if (controller.signal.aborted) return;
      status.textContent =
        error instanceof Error && error.message === "image"
          ? t.imageError
          : t.renderError;
      retry.hidden = false;
    }
  }
  retry.onclick = generate;
  dialog.append(header, status, download, retry, preview);
  document.body.append(dialog);
  function cleanup() {
    controller.abort();
    if (url) URL.revokeObjectURL(url);
    dialog.remove();
    document.removeEventListener("astro:before-swap", cleanup);
  }
  dialog.addEventListener("close", cleanup, { once: true });
  document.addEventListener("astro:before-swap", cleanup);
  dialog.showModal();
  void generate();
}
