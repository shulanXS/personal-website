/** Touch feedback without intercepting the card's native navigation. */
let pressedRow: HTMLElement | null = null;

function clearPress(): void {
  pressedRow?.removeAttribute("data-activity-pressed");
  pressedRow = null;
}

document.addEventListener(
  "pointerdown",
  event => {
    clearPress();
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !window.matchMedia("(width < 64rem)").matches
    )
      return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const row = target.closest<HTMLElement>("#activity li[data-activity-kind]");
    if (!row) return;
    pressedRow = row;
    row.setAttribute("data-activity-pressed", "");
  },
  { passive: true }
);

for (const event of ["pointerup", "pointercancel", "astro:before-swap"]) {
  document.addEventListener(event, clearPress, { passive: true });
}
window.addEventListener("blur", clearPress);
