/**
 * The height of the header bar, published to the page as a custom property.
 *
 * The header is sticky: it stays at the top of the screen while the page
 * scrolls under it. Anything that also sticks — a side index, a floating
 * button — has to sit *below* it rather than on top of it, and anything
 * that is jumped to has to land *below* it rather than under it.
 *
 * The height cannot be written down in the stylesheet, because it is not a
 * fixed number: the bar is two rows tall on a phone (the brand and the
 * controls on one row, the navigation on the next) and one row tall on a
 * wide screen, and the labels wrap onto a third row when the language is
 * the one with the longer words. It is measured instead.
 *
 * The measurement is written onto `<html>` as `--app-header-height`, and
 * the stylesheets read it. A `ResizeObserver` watches the bar, so that a
 * language switch or a rotation updates it.
 */

/**
 * The name of the custom property the height is published under.
 */
const PROPERTY = "--app-header-height";

/**
 * The space left between the header and whatever sits below it.
 *
 * The header is a band of light and the page is a sheet of paper below it;
 * a thing that touches the header looks cut off rather than tucked under.
 */
const GAP = 12;

/**
 * Writes the current height of the header onto the root element.
 */
function publishHeight(): void {
  const header = document.querySelector<HTMLElement>("header");
  if (!header) return;

  const height = Math.round(header.getBoundingClientRect().height);
  if (!height) return;

  const root = document.documentElement;
  const current = root.style.getPropertyValue(PROPERTY);
  if (current === `${height}px`) return;

  root.style.setProperty(PROPERTY, `${height}px`);
}

/**
 * Watches the header and keeps the published height in step with it.
 *
 * The observer is on the *header* rather than on the window, because the
 * header is what changes height: the window changes width, and the header
 * changes height when the width makes its own rows wrap.
 */
export function setupHeaderHeight(): void {
  publishHeight();

  const header = document.querySelector<HTMLElement>("header");
  if (!header) return;

  if (header.dataset.headerHeightBound === "true") return;
  header.dataset.headerHeightBound = "true";

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => publishHeight());
    observer.observe(header);
  }

  /*
   * The bar also changes height when the interface language is switched:
   * the navigation labels are of a different length, and on a narrow
   * screen they may wrap onto a row of their own.
   */
  document.addEventListener("ui:langchange", () => {
    publishHeight();
  });
}

document.addEventListener("astro:page-load", setupHeaderHeight);
document.addEventListener("astro:after-swap", setupHeaderHeight);
