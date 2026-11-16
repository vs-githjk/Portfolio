/* Where the welcome hologram stands, for anything that needs to meet it (the
   hologram itself, the panels beside it on a phone). The projection lives in the
   box marked data-holo-anchor in Welcome.jsx: a square picture with the cone and
   the emitter plate under it, the whole thing centred in the box. Its size
   depends only on that box, so this works before the photograph has loaded.

   measureFace() reads the box, keeps the result here and writes it on <html>
   (and clears both when there is no projection: <html data-holo="off">):

     --face-rect-x, --face-rect-y, --face-rect-w, --face-rect-h   the picture's box, document pixels */
export const FACE_MAX = 560; // the picture is never wider than this, CSS pixels
export const CONE = 0.23; // from the picture's foot down to the plate, in picture heights
export const PLATE = 0.3; // the plate's half width, in picture widths
const FOOT = 0.06; // room under the plate's centre for its near rim

export const face = {
  rect: null, // the picture: { x, y, w, h } in document pixels
  emit: null, // the plate: { x, y, w } its centre and half width, document pixels
};

const NAMES = ['--face-rect-x', '--face-rect-y', '--face-rect-w', '--face-rect-h'];

export function measureFace(anchor = document.querySelector('[data-holo-anchor]')) {
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect();
  const side = Math.min(r.width, r.height / (1 + CONE + FOOT), FACE_MAX);
  const style = document.documentElement.style;
  if (side < 1) {
    // No projection (the welcome closes up when the hologram is off): say so, not a stale box.
    face.rect = null;
    face.emit = null;
    for (const name of NAMES) style.removeProperty(name);
    return face;
  }
  const x = r.left + window.scrollX + (r.width - side) / 2;
  const y = r.top + window.scrollY + (r.height - side * (1 + CONE + FOOT)) / 2;
  face.rect = { x, y, w: side, h: side };
  face.emit = { x: x + side / 2, y: y + side * (1 + CONE), w: side * PLATE };
  [x, y, side, side].forEach((v, k) => style.setProperty(NAMES[k], `${v.toFixed(1)}px`));
  return face;
}
