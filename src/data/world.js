/* The world's own words and wiring for this site (lane A): place names, the
   labels of the shell's controls, the load lines, the receipt sentences, and how
   this world places its two waterlines. Counts are never typed here: every
   number in a sentence is computed from content.js or the GitHub snapshot. */

/* The two waterlines, as the scene draws them (lib/worldScene.js): the surface is
   a place in the page, 36% down its vista; the shore's line comes down the window
   while the camera rises through it. px from the window top, or null. */
const smooth = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

export const waterlines = {
  line: (a, y) => (a.surface ? a.surface.top + a.surface.h * 0.36 - y : null),
  shore: (a, y, h) => {
    if (!a.shore) return null;
    const rise = smooth((y - (a.shore.top - h * 0.3)) / (h * 0.55));
    return rise <= 0 || rise >= 1 ? null : h * (-0.08 + 1.22 * rise);
  },
};

/* The first screen's two links and the short hint between them. */
export const entry = {
  enter: 'Enter',
  hint: 'or scroll',
  skip: 'Skip intro',
};

export const places = [];
export const loadLines = [];
export function receipts() {
  return '';
}
