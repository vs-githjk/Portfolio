/* Small helpers shared by the canvas layers (the depth field and the skyline). */

/** A seeded generator, so a field is laid out the same way on every load. */
export function seeded(start) {
  let s = start;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** An "r, g, b" token (the beam and star tokens) as three numbers. */
export const triple = (css, name) =>
  css
    .getPropertyValue(name)
    .split(',')
    .map((v) => parseInt(v, 10));

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
