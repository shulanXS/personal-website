/**
 * Accessible image lightbox.
 *
 * Extracted from the blog post detail page so that notes and writing pages
 * can reuse it. Features:
 * - keyboard navigation (Escape to close, Tab focus trap)
 * - focus restore on close
 * - pinch / double-tap zoom on touch devices
 * - reduced-motion support
 */

import { runtimeTranslations } from "@/i18n";

type LightboxOptions = {
  /** Container to search for images in. Defaults to `#article`. */
  containerId?: string;
};

function getString(key: string, locale: string): string {
  const dict = runtimeTranslations[locale];
  if (!dict) return key;
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict
    );
  return typeof value === "string" ? value : key;
}

function currentLocale(): string {
  return document.documentElement.lang || "zh-CN";
}

export function initLightbox(options: LightboxOptions = {}) {
  const containerId = options.containerId ?? "article";
  const container = document.getElementById(containerId);
  if (!container) return;
  const article: HTMLElement = container;

  const locale = currentLocale();
  const zoomImageLabel = getString("post.zoomImage", locale);
  const closeLabel = getString("post.closeImagePreview", locale);
  const previewLabel = getString("post.imagePreview", locale);
  // Don't attach twice to the same container.
  if (article.dataset.lightboxBound === "true") return;
  article.dataset.lightboxBound = "true";

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let overlay: HTMLElement | null = null;
  let lastFocused: HTMLElement | null = null;

  // Defer attribute mutations so they don't push the LCP timestamp.
  requestAnimationFrame(() => {
    const images = Array.from(article.querySelectorAll("img"));
    for (const image of images) {
      if (image.closest("a")) continue;
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute(
        "aria-label",
        image.alt ? `${zoomImageLabel}: ${image.alt}` : zoomImageLabel
      );
    }
  });

  function open(src: string, alt: string, trigger: HTMLElement | null) {
    if (overlay) return;
    lastFocused = trigger ?? (document.activeElement as HTMLElement | null);

    const overlayEl = document.createElement("div");
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");
    overlayEl.setAttribute(
      "aria-label",
      alt ? `${previewLabel}: ${alt}` : previewLabel
    );
    overlayEl.className =
      "fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 backdrop-blur-sm opacity-0 transition-opacity duration-200 motion-reduce:transition-none";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", closeLabel);
    closeButton.className =
      "absolute end-4 top-4 rounded p-2 text-3xl leading-none text-white";
    closeButton.innerHTML = "&#10005;";
    closeButton.addEventListener("click", close);

    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.className =
      "max-h-[90dvh] max-w-[90vw] cursor-default object-contain";

    overlayEl.append(closeButton, image);
    overlayEl.addEventListener("click", e => {
      if (e.target === overlayEl && currentScale <= 1) close();
    });

    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let initialDist = 0;
    let initialScale = 1;
    let panStartX = 0;
    let panStartY = 0;
    let panStartTranslateX = 0;
    let panStartTranslateY = 0;
    let lastTapTime = 0;

    function applyTransform() {
      image.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
    }

    function resetTransform() {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      image.style.transform = "";
    }

    overlayEl.addEventListener(
      "touchstart",
      e => {
        const t = e.touches;
        if (t.length === 2) {
          initialDist = Math.hypot(
            t[1].clientX - t[0].clientX,
            t[1].clientY - t[0].clientY
          );
          initialScale = currentScale;
        } else if (t.length === 1) {
          const now = Date.now();
          if (now - lastTapTime < 300) {
            e.preventDefault();
            if (currentScale > 1) {
              resetTransform();
            } else {
              currentScale = 2;
              translateX = 0;
              translateY = 0;
              applyTransform();
            }
            lastTapTime = 0;
            panStartX = t[0].clientX;
            panStartY = t[0].clientY;
            panStartTranslateX = translateX;
            panStartTranslateY = translateY;
          } else {
            lastTapTime = now;
            if (currentScale > 1) {
              panStartX = t[0].clientX;
              panStartY = t[0].clientY;
              panStartTranslateX = translateX;
              panStartTranslateY = translateY;
            }
          }
        }
      },
      { passive: false }
    );

    overlayEl.addEventListener(
      "touchmove",
      e => {
        const t = e.touches;
        if (t.length === 2) {
          e.preventDefault();
          const dist = Math.hypot(
            t[1].clientX - t[0].clientX,
            t[1].clientY - t[0].clientY
          );
          currentScale = Math.min(
            4,
            Math.max(1, initialScale * (dist / initialDist))
          );
          applyTransform();
        } else if (t.length === 1) {
          if (currentScale > 1) {
            e.preventDefault();
            translateX =
              panStartTranslateX + (t[0].clientX - panStartX) / currentScale;
            translateY =
              panStartTranslateY + (t[0].clientY - panStartY) / currentScale;
            const maxX = Math.max(
              0,
              (image.clientWidth - overlayEl.clientWidth / currentScale) / 2
            );
            const maxY = Math.max(
              0,
              (image.clientHeight - overlayEl.clientHeight / currentScale) / 2
            );
            translateX = Math.min(maxX, Math.max(-maxX, translateX));
            translateY = Math.min(maxY, Math.max(-maxY, translateY));
            applyTransform();
          } else {
            e.preventDefault();
          }
        }
      },
      { passive: false }
    );

    overlayEl.addEventListener("touchend", e => {
      if (e.touches.length === 0 && currentScale <= 1.05) {
        resetTransform();
      }
    });

    overlayEl.addEventListener("touchcancel", e => {
      if (e.touches.length === 0 && currentScale <= 1.05) {
        resetTransform();
      }
    });

    document.body.appendChild(overlayEl);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    overlay = overlayEl;
    window.__closeLightbox = close;

    requestAnimationFrame(() => overlayEl.classList.add("opacity-100"));
    closeButton.focus();
  }

  function close() {
    if (!overlay) return;
    const el = overlay;
    overlay = null;
    delete window.__closeLightbox;

    document.removeEventListener("keydown", onKeyDown);
    document.body.style.overflow = "";
    lastFocused?.focus();
    lastFocused = null;

    if (prefersReducedMotion()) {
      el.remove();
      return;
    }
    const remove = () => el.remove();
    el.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 250); // fallback in case transitionend never fires
    el.classList.remove("opacity-100");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  // Keep keyboard focus inside the open dialog.
  function trapFocus(e: KeyboardEvent) {
    if (!overlay) return;
    const focusables = overlay.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function triggerFromEvent(e: Event) {
    const image = (e.target as HTMLElement | null)?.closest("img");
    if (!image || !article.contains(image) || image.closest("a")) return null;
    return image;
  }

  function activate(image: HTMLImageElement) {
    open(image.currentSrc || image.src, image.alt, image);
  }

  article.addEventListener("click", e => {
    const image = triggerFromEvent(e);
    if (!image) return;
    e.preventDefault();
    activate(image);
  });

  article.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    const image = triggerFromEvent(e);
    if (!image) return;
    e.preventDefault();
    activate(image);
  });
}

declare global {
  interface Window {
    __closeLightbox?: () => void;
  }
}
