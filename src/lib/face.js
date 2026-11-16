/* Where the welcome hologram stands, for anything that needs to meet it (the
   hologram itself, the panels beside it on a phone). The projection lives in the
   box marked data-holo-anchor in Welcome.jsx: the figure's picture, as large as
   the box allows at the picture's own aspect, with the cone and the emitter plate
   under it, the whole thing centred in the box.

   face.aspect is the picture's width over its height. It is 1 until the picture
   has loaded (Hologram.jsx sets it and measures again), so a tall figure and a
   wide one both get their place.

   measureFace() reads the box, keeps the result here and writes it on <html>
   (and clears both when there is no projection: <html data-holo="off">):

     --face-rect-x, --face-rect-y, --face-rect-w, --face-rect-h   the picture's box, document pixels */
export const FACE_MAX = 620; // the picture is never wider or taller than this, CSS pixels
export const CONE = 0.23; // from the picture's foot down to the plate, in units of its shorter side
export const PLATE = 0.3; // the plate's half width, in the same units
const FOOT = 0.06; // room under the plate's centre for its near rim

export const face = {
  aspect: 1,
  rect: null, // the picture: { x, y, w, h } in document pixels
  emit: null, // the plate: { x, y, w } its centre and half width, document pixels
};

const NAMES = ['--face-rect-x', '--face-rect-y', '--face-rect-w', '--face-rect-h'];

export function measureFace(anchor = document.querySelector('[data-holo-anchor]')) {
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect();
  const ratio = face.aspect > 0 ? face.aspect : 1;
  const short = Math.min(ratio, 1); // the shorter side, in picture heights
  const h = Math.min(r.height / (1 + (CONE + FOOT) * short), r.width / ratio, FACE_MAX, FACE_MAX / ratio);
  const w = h * ratio;
  const style = document.documentElement.style;
  if (h < 1) {
    // No projection (the welcome closes up when the hologram is off): say so, not a stale box.
    face.rect = null;
    face.emit = null;
    for (const name of NAMES) style.removeProperty(name);
    return face;
  }
  const base = h * short;
  const x = r.left + window.scrollX + (r.width - w) / 2;
  const y = r.top + window.scrollY + (r.height - h - (CONE + FOOT) * base) / 2;
  face.rect = { x, y, w, h };
  face.emit = { x: x + w / 2, y: y + h + CONE * base, w: PLATE * base };
  [x, y, w, h].forEach((v, k) => style.setProperty(NAMES[k], `${v.toFixed(1)}px`));
  return face;
}
