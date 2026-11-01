/**
 * Copy-to-clipboard behaviour.
 *
 * Some contact details cannot be linked to — a WeChat ID is a string, not a
 * URL. Those are rendered as buttons carrying the value in `data-copy-value`;
 * clicking one copies the value and confirms it with a short toast.
 *
 * The module is shared, so the same behaviour works for the social buttons
 * and for the readable contact list on the about page.
 */
import { runtimeTranslations } from "@/i18n";

/**
 * Reads a UI string in the *current* interface language.
 *
 * The string is read at the moment of the click rather than when the page
 * was rendered, so the confirmation follows the active language even when it
 * was switched after the page had loaded.
 */
function string(key: string, fallback: string): string {
  const locale = document.documentElement.lang || "zh-CN";
  const dict = runtimeTranslations[locale] as unknown as
    | Record<string, unknown>
    | undefined;
  const value = key
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      dict
    );
  return typeof value === "string" ? value : fallback;
}

let toastTimer: number | undefined;

/**
 * Shows the toast.
 *
 * The element is created on demand, so it only exists on the pages where
 * something is actually copied.
 */
function showToast(message: string) {
  let toast = document.getElementById("app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.setAttribute("data-visible", "true");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast?.setAttribute("data-visible", "false");
  }, 2000);
}

async function copyValue(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(string("socials.copied", "Copied to clipboard"));
  } catch {
    showToast(
      string("socials.copyFailed", "Copy failed — please copy it manually")
    );
  }
}

/**
 * Attaches the click handler to every copy button that does not have one
 * yet. Safe to call repeatedly — e.g. after a View Transition swap.
 */
export function setupCopyButtons(): void {
  for (const button of document.querySelectorAll<HTMLElement>(
    "[data-copy-value]"
  )) {
    if (button.dataset.copyBound === "true") continue;
    button.dataset.copyBound = "true";
    button.addEventListener("click", () => {
      const value = button.dataset.copyValue;
      if (value) copyValue(value);
    });
  }
}

setupCopyButtons();
document.addEventListener("astro:after-swap", setupCopyButtons);
