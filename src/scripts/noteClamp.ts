import { initLightbox } from "@/scripts/lightbox";

/**
 * The clamp of a long note, and the button that lifts it.
 *
 * The behaviour lives in its own module rather than inside a component,
 * because a note is rendered in three places — the notes listing, the
 * activity timeline on the home page and the home page's own section of
 * recent notes — and all of them need the same clamping, the same
 * measurement and the same button.
 */

const CLAMP = "app-note-body-clamped";

/**
 * Whether a note overflows its clamp.
 *
 * The clamp is a fixed height — a number of lines — so whether a note is
 * "too long" depends on how wide the column is. A note of a hundred
 * characters is eight lines tall on a phone and four lines on a desktop.
 * The server cannot know that, so it guesses from the length of the text
 * and the browser corrects the guess by measuring the rendered height.
 */
function overflowsClamp(body: HTMLElement) {
  const wasClamped = body.classList.contains(CLAMP);

  /*
   * The full height is measured with the clamp removed: a clamped note
   * is cut off at exactly the height of the clamp, so its own height
   * says nothing about how long it is.
   */
  body.classList.remove(CLAMP);
  const full = body.scrollHeight;

  /*
   * The limit is read from the clamp itself, so that the two can never
   * drift apart: the CSS owns the number of lines, the script only asks
   * whether the note is taller than it. The clamp of the notes wall is
   * taller than the clamp of a bubble, and the CSS decides which is
   * which — the script never needs to know.
   */
  body.classList.add(CLAMP);
  const limit = parseFloat(getComputedStyle(body).maxHeight) || 0;
  body.classList.toggle(CLAMP, wasClamped);

  /* A tolerance absorbs the sub-pixel rounding of the layout. */
  return full > limit + 2;
}

/**
 * The long notes are clamped to six lines on the listing pages. The button
 * below expands them in place — no navigation, no page reload — and
 * collapses them again on a second click.
 *
 * The listener is delegated from the document so it survives the
 * client-side navigations of the view transitions router.
 */
export function setupNoteExpand() {
  document
    .querySelectorAll<HTMLButtonElement>("[data-note-expand]")
    .forEach(button => {
      if (button.dataset.noteExpandReady === "true") return;
      button.dataset.noteExpandReady = "true";

      const item = button.closest("[data-tagged-item]");
      const body = item?.querySelector<HTMLElement>("[data-note-body]");
      if (!body) return;

      const expandLabel = button.querySelector<HTMLElement>(
        "[data-note-label-expand]"
      );
      const collapseLabel = button.querySelector<HTMLElement>(
        "[data-note-label-collapse]"
      );

      /*
       * The button is shown only when the note really overflows. It stays
       * in the markup either way, so that a resize can bring it back.
       */
      const wrap = button.closest<HTMLElement>("[data-note-expand-wrap]");

      /*
       * Whether the reader has opened the note. Once they have, the
       * measurement no longer touches it — a note must not close itself
       * because the window was resized.
       */
      let opened = body.dataset.noteExpanded === "true";

      /*
       * The measurement runs once the note has been laid out, and again
       * whenever the *width* of the column changes.
       *
       * The width is what decides how many lines the note takes, so it
       * is what the observer watches. The height is deliberately not
       * watched: applying the clamp changes the height of the note, and
       * the observer would then wake the code that changed it, and the
       * two would take turns waking each other up.
       */
      let lastWidth = body.getBoundingClientRect().width;

      let applying = false;
      const apply = () => {
        if (applying) return;
        applying = true;
        try {
          const long = overflowsClamp(body);
          body.classList.toggle(CLAMP, long && !opened);
          if (wrap) wrap.hidden = !long;
          button.setAttribute("aria-expanded", String(opened));
          if (expandLabel) expandLabel.hidden = opened;
          if (collapseLabel) collapseLabel.hidden = !opened;
        } finally {
          applying = false;
        }
      };

      button.addEventListener("click", () => {
        opened = !opened;
        apply();
      });

      /*
       * The measurement runs once the note has been laid out, and again
       * whenever the column changes width.
       */
      requestAnimationFrame(apply);
      if ("ResizeObserver" in window) {
        const observer = new ResizeObserver(() => {
          const width = body.getBoundingClientRect().width;
          if (width === lastWidth) return;
          lastWidth = width;
          if (!opened) apply();
        });
        observer.observe(body);
      }
    });
}

/**
 * The images of a note open in the shared lightbox, so that a picture
 * can be read at full size without leaving the timeline.
 *
 * The lightbox is bound to the list rather than to a single entry, so
 * that every picture of the page can be opened. The binding is marked on
 * the list itself, which keeps it from being attached twice.
 *
 * The two layouts are bound separately rather than through one combined
 * selector: the lightbox attaches to a single container, and a combined
 * selector would only ever reach the first list on the page.
 */
export function setupNoteLightbox() {
  const containers = [
    'ul[data-list-layout="notes"]',
    'ul[data-list-layout="activity"]',
    // The notes listing, whose notes live in the wall rather than in a
    // list of bubbles.
    ".app-notes-wall",
  ];

  for (const selector of containers) {
    initLightbox({ containerSelector: selector });
  }
}

document.addEventListener("astro:page-load", setupNoteExpand);
document.addEventListener("astro:page-load", setupNoteLightbox);
