/**
 * Post detail page behaviour: reading progress bar, heading anchor links and
 * copy buttons for code blocks.
 *
 * Kept as a module (rather than an inline script) so that the UI strings can
 * come from the translation dictionary and stay switchable at runtime.
 */
import { runtimeTranslations } from "@/i18n";

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
  return (
    document.documentElement.lang ||
    (document.documentElement.getAttribute("lang") ?? "zh-CN")
  );
}

function createProgressBar() {
  // Reuse the existing bar when the page is re-initialised (e.g. after a
  // View Transition), otherwise a new one is appended on every navigation.
  const existing = document.getElementById("myBar");
  if (existing) return existing as HTMLElement;

  const progressContainer = document.createElement("div");
  progressContainer.className =
    "progress-container fixed top-0 z-10 h-1 w-full bg-background";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar h-1 w-0 bg-accent";
  progressBar.id = "myBar";

  // The bar has to be inside the container, otherwise only an empty strip
  // would be rendered and the progress would never be visible.
  progressContainer.appendChild(progressBar);

  document.body.appendChild(progressContainer);
  return progressBar;
}

function updateScrollProgress(progressBar: HTMLElement) {
  const update = () => {
    const scrollTop =
      document.body.scrollTop || document.documentElement.scrollTop;
    const scrollHeight =
      document.body.scrollHeight || document.documentElement.scrollHeight;
    const height = scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (scrollTop / height) * 100 : 0;
    progressBar.style.width = `${scrolled}%`;
  };
  update();
  document.addEventListener("scroll", update, { passive: true });
}

function addHeadingLinks() {
  const headings = Array.from(document.querySelectorAll("h2, h3, h4, h5, h6"));
  for (const heading of headings) {
    // Skip headings that already carry an anchor (re-initialisation).
    if (heading.querySelector("a.heading-link")) continue;

    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = `#${heading.id}`;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}

function attachCopyButtons() {
  const locale = currentLocale();
  const copyButtonLabel = getString("post.copyCode", locale);
  const copiedLabel = getString("post.copiedCode", locale);

  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    // Skip code blocks that already have a copy button (re-initialisation).
    if (codeBlock.querySelector("button.copy-code")) continue;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";

    const topClass = hasFileNameOffset ? "top-(--file-name-offset)" : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
    copyButton.innerHTML = copyButtonLabel;
    copyButton.setAttribute("aria-label", copyButtonLabel);
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", async () => {
      await copyCode(codeBlock, copyButton);
    });
  }

  async function copyCode(block: HTMLElement, button: HTMLElement) {
    const code = block.querySelector("code");
    const text = code?.innerText;

    await navigator.clipboard.writeText(text ?? "");

    button.innerText = copiedLabel;
    button.setAttribute("aria-label", copiedLabel);

    setTimeout(() => {
      button.innerText = copyButtonLabel;
      button.setAttribute("aria-label", copyButtonLabel);
    }, 700);
  }
}

/**
 * Sets up the post detail page behaviour.
 *
 * Safe to call repeatedly: the progress bar is reused instead of being
 * appended again, and the heading anchors and copy buttons are only attached
 * to elements that do not have them yet.
 */
export function initPostPage() {
  const progressBar = createProgressBar();
  updateScrollProgress(progressBar);
  addHeadingLinks();
  attachCopyButtons();

  if (!window.__lightboxSwapBound) {
    window.__lightboxSwapBound = true;
    document.addEventListener("astro:before-swap", () =>
      window.__closeLightbox?.()
    );
  }

  if (!window.__postPageScrollBound) {
    window.__postPageScrollBound = true;
    document.addEventListener("astro:after-swap", () =>
      window.scrollTo({ left: 0, top: 0, behavior: "instant" })
    );
  }
}

declare global {
  interface Window {
    __lightboxSwapBound?: boolean;
    __postPageScrollBound?: boolean;
  }
}
