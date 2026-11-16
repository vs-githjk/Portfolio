/* Where the welcome portrait is, for anything that needs to meet it (the entry
   beats, the hologram itself). The portrait is a round window centred in the
   box marked data-holo-anchor in Welcome.jsx; its size depends only on that box,
   so this works before the points have loaded and when there is no WebGL.

   measureFace() reads the box, keeps the result here and writes it on <html>
   (and clears both when there is no portrait: <html data-holo="off">):

     --face-rect-x, --face-rect-y, --face-rect-w, --face-rect-h   the portrait's box, document pixels
     --face-seed-x, --face-seed-y   the seed point its light leaves toward: the
                                    middle of the window across, 58% down the box

   The other half of the contract is read, not written, here: Hologram.jsx reads
   --face-out (0 to 1) from <html>'s inline style each frame; when it is set, it
   drives how far the portrait's light has left for the seed. */
export const FACE_MAX = 640; // the window is never wider than this, CSS pixels
export const SEED_DOWN = 0.58;

export const face = {
  rect: null, // { x, y, w, h } in document pixels
  seed: null, // { x, y } in document pixels
};

export function measureFace(anchor = document.querySelector('[data-holo-anchor]')) {
  if (!anchor) return null;
  const r = anchor.getBoundingClientRect();
  const side = Math.min(r.width, r.height, FACE_MAX);
  const style = document.documentElement.style;
  if (side < 1) {
    // No portrait (the welcome closes up when the hologram is off): say so, not a stale box.
    face.rect = null;
    face.seed = null;
    for (const name of ['--face-rect-x', '--face-rect-y', '--face-rect-w', '--face-rect-h', '--face-seed-x', '--face-seed-y']) style.removeProperty(name);
    return face;
  }
  const x = r.left + window.scrollX + (r.width - side) / 2;
  const y = r.top + window.scrollY + (r.height - side) / 2;
  face.rect = { x, y, w: side, h: side };
  face.seed = { x: window.scrollX + window.innerWidth / 2, y: y + side * SEED_DOWN };
  style.setProperty('--face-rect-x', `${x.toFixed(1)}px`);
  style.setProperty('--face-rect-y', `${y.toFixed(1)}px`);
  style.setProperty('--face-rect-w', `${side.toFixed(1)}px`);
  style.setProperty('--face-rect-h', `${side.toFixed(1)}px`);
  style.setProperty('--face-seed-x', `${face.seed.x.toFixed(1)}px`);
  style.setProperty('--face-seed-y', `${face.seed.y.toFixed(1)}px`);
  return face;
}
