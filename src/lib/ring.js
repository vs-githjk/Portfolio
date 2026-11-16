/* The orbit ring's geometry, as Orbit.jsx last measured and posed it. The
   welcome hologram reads it so the ball's light can flow onto the ring of
   builds (Hologram.jsx). Lengths are CSS pixels; `on` is false while the ring
   is not the layout (a phone or a short window, where Drift.jsx stands in). */
export const ring = {
  on: false,
  el: null, // the scene: the ring centre is its middle across and `oy` down
  n: 12,
  oy: 0,
  rx: 0,
  rz: 0,
  sinT: 0,
  cosT: 1,
  persp: 1500,
  cardW: 248,
  cardH: 240,
  front: 0,
  side: 0, // how much a card at the side of the ring shrinks
  yaw: 0, // degrees a card at the side turns toward the centre
  lean: 0, // and leans
  theta: 0, // how far the ring has turned
};
