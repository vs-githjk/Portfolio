/* The welcome hologram: his face as a relief of light, drawn with plain WebGL
   (no library, so the chunk stays a few kilobytes).

   The points come from public/holo/face-a.bin and face-b.bin
   (scripts/bake-hologram.py): for each one a position, a real depth, a surface
   normal, a flattened tone, the spacing to its neighbours and a kind. Nothing of
   the photograph's own light is used: the face is lit here, by one key light
   from the upper left (wrapped, so shadow keeps some light), a rim where the
   surface turns away, and nothing else. The points are soft overlapping splats
   sized by their spacing, so skin is one lit surface and the dense places (eyes,
   brows, lips) stay sharp on top of it. A lens focused on the eyes softens what
   is nearer or farther.

   Every point has three homes, and the vertex shader moves it between them:

     intro  0 to 1   the face is sculpted toward the viewer: the nearest points
                     (nose, brow, cheeks) arrive first, the ears, hair and
                     shoulders last
     morph  0 to 1   the face peels into a small planet of light from the
                     outside in: hair and shoulders go first, the eyes last
     flow   0 to 1   the planet pours onto the orbit ring of builds below it:
                     each point lands on the edge of a card and frames it,
                     then the light fades and the cards are what is left

   The planet has no ring of its own (the one ringed planet on the page is the
   giant in the sea). It is lit by the same key light as the face: a day side, a
   soft terminator, a bright limb, a small hot core. When it speaks it swells
   with the words and a ripple runs over it.

   Glow: on a desktop the bright parts (rim, highlights, the core) are drawn a
   second time into a third-size buffer that is blurred and added back. A phone
   skips that pass: the overlapping splats are soft enough on their own.

   Colours are (r, g, b) triples read from the tokens by the caller. */

const VERT = /* glsl */ `
precision highp float;
attribute vec3 aFace;   // x, y in units of the picture's height (y up, the head's centre at 0), z toward the viewer
attribute vec2 aNorm;   // the surface normal's x and y
attribute vec4 aData;   // tone, spacing to the neighbours (picture heights), two random numbers
attribute vec4 aBall;   // a direction on the unit sphere, and how far out along it (1 on the shell, less in the core)
attribute vec4 aMore;   // peel order (0 leaves first, 1 last), ring slot angle, place across the card, kind + place down the card
uniform vec2 uRes;      // target size in device pixels
uniform vec2 uCenter;   // where the head's centre sits, device pixels from the top left
uniform float uSize;    // the picture's height in device pixels
uniform float uBall;    // the planet's radius in device pixels
uniform vec4 uRingA;    // ring centre x, y (device pixels), radius across, radius deep
uniform vec4 uRingB;    // sin and cos of the tilt, perspective, how far the ring has turned
uniform vec4 uRingC;    // card width and height, front lift, side shrink
uniform vec3 uRingD;    // degrees a side card turns and leans, how many cards the ring holds
uniform float uRingOn;  // 1 the orbit ring, 0 two level rows (a phone)
uniform vec2 uClear;    // how far the hero copy reaches left and right of the centre, device pixels
uniform vec4 uCopy;     // the hero copy's box in the window: left, top, right, bottom, device pixels
uniform float uCopyK;   // device pixels to a CSS pixel in this pass
uniform float uTime, uIntro, uMorph, uFlow, uTurn, uNod, uVoice, uSpeak, uStill;
uniform float uBallGap; // spacing of the points on the planet, in radii
uniform float uFocus;   // depth of the eyes: the plane the lens is focused on
uniform float uPass;    // 0 the picture, 1 the glow
varying float vGlow;
varying float vTone;
varying float vHot;

const vec3 KEY = vec3(-0.545, 0.39, 0.742); // upper left, toward the viewer
const float SPREAD = 4.4; // a splat's width in spacings: wide enough that neighbours add up to one surface

vec3 turn(vec3 p, float a, float b) {
  float c = cos(a), s = sin(a);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  c = cos(b); s = sin(b);
  return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s);
}

float ease(float x) { return x * x * (3.0 - 2.0 * x); }

void main() {
  float tone = aData.x, gap = aData.y, r1 = aData.z, r2 = aData.w;
  float kind = floor(aMore.w);
  float t = uTime;
  float live = 1.0 - uStill;
  float isHair = step(1.5, kind) * step(kind, 2.5);
  float isBody = step(2.5, kind) * step(kind, 3.5);
  float isCatch = step(3.5, kind);

  // ---- the face --------------------------------------------------------------
  vec3 f = aFace;
  // He breathes: the whole figure swells a quarter of a percent about the chest.
  f.xy = vec2(f.x, f.y + 0.45) * (1.0 + 0.0025 * sin(t * 1.25) * live) - vec2(0.0, 0.45);
  // A word being spoken: the jaw eases down a hair's width, and only the jaw.
  float jaw = (1.0 - smoothstep(-0.2, -0.12, f.y)) * smoothstep(-0.32, -0.24, f.y) * (1.0 - smoothstep(0.06, 0.2, abs(f.x)));
  f.y -= jaw * uVoice * 0.004;
  // The head turns on the neck: the whole head down to the chin turns as one,
  // the neck follows part of the way, the shoulders stay where they are. The
  // axis runs behind the face, where the spine is, not through it.
  float above = smoothstep(-0.37, -0.255, f.y);
  vec3 h = f + vec3(0.0, 0.0, 0.13);
  h = turn(h, uTurn * above, uNod * above);
  f = h - vec3(0.0, 0.0, 0.13);
  vec3 n = vec3(aNorm, sqrt(max(0.0, 1.0 - dot(aNorm, aNorm))));
  n = turn(n, uTurn * above, uNod * above);
  // One key light, wrapped so the shadow side keeps a little; a rim where the
  // surface turns away from the viewer.
  float key = clamp((dot(n, KEY) + 0.3) / 1.3, 0.0, 1.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.4);
  // A soft sheen where the surface mirrors the key toward the viewer: the
  // highlights are this light's, on the lit side, not the photograph's.
  float sheen = pow(max(0.0, dot(n, normalize(KEY + vec3(0.0, 0.0, 1.0)))), 14.0) * (1.0 - isHair) * (1.0 - isBody);
  // A fill from the front that falls off with depth: what stands nearest (the
  // nose, the brow, the lips) catches most of it. In the photograph the nose
  // tip is as bright as the cheeks; under the key alone it is a quarter darker.
  float fill = smoothstep(0.0, 0.06, aFace.z) * (1.0 - isHair) * (1.0 - isBody);
  float lit = tone * (0.42 + 0.58 * key + 0.14 * sheen + 0.25 * fill) + rim * mix(0.05, 0.2, isHair) * (1.0 - 0.5 * isBody);
  lit = mix(lit, 0.8, isCatch);
  // One faint band of light climbs the figure every eleven seconds.
  float band = exp(-pow((aFace.y - (fract(t / 11.0) * 1.7 - 0.75)) * 4.5, 2.0)) * live;
  lit *= 1.0 + 0.22 * band;

  // Sculpted toward the viewer: the nearest points come home first. Until its
  // turn a point waits far behind its place, unlit.
  float nearness = clamp((aFace.z + 0.13) / 0.2, 0.0, 1.0) * (1.0 - 0.6 * isBody);
  float line = uIntro * 1.5 - 0.25;
  float drawn = 1.0 - smoothstep(line - 0.25, line, 1.0 - nearness + r1 * 0.1);
  float home = ease(drawn);
  float front = exp(-pow((1.0 - nearness + r1 * 0.1 - line) * 9.0, 2.0)) * step(uIntro, 0.999);
  f = mix(vec3(f.xy * (1.12 + 0.2 * r2), f.z - 0.5 - 0.3 * r1), f, home);
  float faceGlow = lit * home * home + front * 0.25 * home;
  float faceHot = isCatch * 0.7 * home + smoothstep(0.7, 1.0, lit) * 0.3 * home + front * 0.35;
  // The lens: sharp at the eyes, softer in front of and behind them.
  float soft = 1.0 + 5.0 * abs(f.z - uFocus) + 0.9 * isBody;
  float faceSize = gap * uSize * SPREAD * soft;
  // The wider the splats, the more of them overlap: each carries less, so the
  // surface is as bright as the tone says, whatever SPREAD is.
  faceGlow *= 9.0 / (SPREAD * SPREAD);
  faceGlow /= soft * soft;
  // Only the rim and the catchlights glow: a glow on lit skin doubles the
  // brightest places and flattens the rest.
  float faceBloom = (rim * 0.7 + isCatch) * home;

  // ---- the planet -------------------------------------------------------------
  float shell = step(0.99, aBall.w);
  vec3 s = aBall.xyz;
  float spin = t * 0.16 * live;
  s = vec3(s.x * cos(spin) + s.z * sin(spin), s.y, s.z * cos(spin) - s.x * sin(spin));
  float lat = s.y;
  s = turn(s, 0.0, 0.32);
  s = vec3(s.x * 0.966 + s.y * 0.259, s.y * 0.966 - s.x * 0.259, s.z);
  // Speaking: it swells with the words and a ripple runs from pole to pole.
  float ripple = sin(lat * 7.0 - t * 6.5) * uSpeak;
  float rad = aBall.w * (1.0 + 0.045 * uSpeak * sin(t * 9.5) * shell + 0.028 * ripple * shell);
  rad *= mix(1.0 + 0.1 * sin(t * 2.6 + r1 * 6.3) * live + 0.3 * uSpeak, 1.0, shell);
  vec3 b = s * rad;
  float day = clamp((dot(s, KEY) + 0.22) / 1.22, 0.0, 1.0);
  float limb = pow(1.0 - abs(s.z), 2.2);
  float weather = 0.86 + 0.14 * sin(lat * 9.0 + 0.8 + 1.3 * sin(lat * 23.0));
  float facing = smoothstep(-0.35, 0.25, s.z);
  float ballGlow = mix(0.035, (0.03 + 0.42 * day * day * weather + 0.3 * limb * (0.25 + 0.75 * day) + 0.12 * ripple * day) * mix(0.06, 1.0, facing), shell);
  float ballHot = mix(0.2, 0.25 * limb * day, shell);
  float ballSize = uBall * uBallGap * mix(3.6, 3.0, shell);
  float ballBloom = mix(0.3, (0.6 * limb + 0.15) * day, shell);

  // ---- between them: the peel ---------------------------------------------------
  float m = clamp(uMorph * 2.3 - aMore.x * 1.3, 0.0, 1.0);
  m = ease(m);
  vec3 p = mix(f * uSize, b * uBall, m);
  // On the way the points sweep round the centre, a slow vortex, not a jitter.
  float sweep = sin(m * 3.14159) * (0.7 + 0.5 * r1);
  p.xy = vec2(p.x * cos(sweep) - p.y * sin(sweep), p.x * sin(sweep) + p.y * cos(sweep));
  p.z += sin(m * 3.14159) * uSize * 0.08 * (r2 - 0.5);

  float depth = 1.0 / (1.0 - p.z / (uSize * 3.2));
  vec2 px = uCenter + vec2(p.x, -p.y) * depth;
  float size = mix(faceSize, ballSize, m) * depth;
  float glow = mix(faceGlow, ballGlow, m);
  float hot = mix(faceHot, ballHot, m);
  float bloom = mix(faceBloom, ballBloom, m);

  // ---- the hand-off: the planet pours onto the ring of builds -------------------
  float fl = ease(clamp(uFlow * 1.35 - 0.35 * r2, 0.0, 1.0));
  // Every point lands on one of the five cards at the front of the ring. The
  // cards at the back sit behind his name (Orbit.jsx hides them there): light
  // sent to them flew straight over the name and landed on it. So the point's
  // slot is folded onto the front five, wherever the ring has turned to.
  float step12 = 6.28318 / uRingD.z;
  float frontmost = mod(uRingB.w + 0.5 * step12, step12) - 0.5 * step12;
  float w = uRingOn > 0.5 ? frontmost + (mod(floor(aMore.y / step12 + 0.5), 5.0) - 2.0) * step12 : aMore.y;
  float sw = sin(w), cw = cos(w);
  float across = aMore.z, down = fract(aMore.w) - 0.5;
  vec2 land;
  float plate;
  float plateSize;
  if (uRingOn > 0.5) {
    float lead = pow(max(0.0, (cw - 0.7) / 0.3), 2.0);
    vec3 rp = vec3(uRingA.z * sw, uRingA.w * cw * uRingB.x, uRingA.w * uRingB.y * (cw - 1.0) + uRingC.z * lead);
    float shrink = 1.0 - uRingC.w * sw * sw;
    // The cards are solid and stand in front of this canvas, so light that
    // landed on a card would be hidden by it. It lands round the card instead:
    // on the edge of the thumbnail (the top of the card, five eighths as tall
    // as it is wide) and a little outside it, so each build is framed in light.
    vec2 box = vec2(0.5 * uRingC.x, 0.3125 * uRingC.x);
    float along = (across + 0.5) * 4.0 * (box.x + box.y);
    vec2 edge = along < 2.0 * box.x ? vec2(along - box.x, -box.y)
      : along < 2.0 * box.x + 2.0 * box.y ? vec2(box.x, along - 2.0 * box.x - box.y)
      : along < 4.0 * box.x + 2.0 * box.y ? vec2(3.0 * box.x + 2.0 * box.y - along, box.y)
      : vec2(-box.x, 4.0 * box.x + 3.0 * box.y - along);
    // The frame spreads a little way outward at the sides and below, never
    // above: the front card's top edge sits against the buttons under his name.
    float grow = 1.0 + 0.09 * (down + 0.5);
    edge = vec2(edge.x * grow, edge.y > 0.0 ? edge.y * grow : edge.y);
    vec2 on = (edge + vec2(0.0, -0.5 * uRingC.y + box.y)) * shrink;
    // The card's own turn, as Orbit.jsx poses it: it leans, then turns toward
    // the centre, so its outer edge swings nearer the camera. With these two
    // the corners land within a pixel of the real card (measured at 1600, 1440
    // and 1199); without them the side cards were up to 17 pixels out.
    float lean = radians(uRingD.y * sw), yaw = radians(-uRingD.x * sw);
    on = vec2(on.x * cos(lean) - on.y * sin(lean), on.x * sin(lean) + on.y * cos(lean));
    float ps = uRingB.z / (uRingB.z - rp.z + on.x * sin(yaw));
    land = uRingA.xy + (rp.xy + vec2(on.x * cos(yaw), on.y)) * ps;
    // Cards at the back of the ring are dark and small: so is their light.
    plate = mix(0.42, 0.6, smoothstep(0.4, 1.0, cw));
    plateSize = uRingC.x * 0.03 * ps * shrink;
  } else {
    // A phone: two level rows, where the thumbnails drift.
    float row = step(3.14159, mod(aMore.y, 6.28318)) - 0.5;
    land = uRingA.xy + vec2(across * uRingA.z * 2.3, row * uRingA.w * 0.52 + down * uRingA.w * 0.34);
    plate = 0.4;
    plateSize = uRingA.w * 0.03;
  }
  // On a phone the copy fills the window, so nothing may cross it: the light
  // goes out at the planet and comes up again on the rows.
  float hidden = (1.0 - uRingOn) * smoothstep(0.0, 0.22, fl) * (1.0 - smoothstep(0.78, 1.0, fl));
  // The core does not travel: it flares and is gone.
  float goes = shell;
  // The light must never cross his name. It goes up and out sideways from the
  // planet to the edge of the window, falls there, outside the copy, and comes
  // in underneath to its card: a cubic through those two corners. The name is
  // rising toward the planet all the while, so the pour is quick (every point
  // is past the corner before the name's top gets there) and the planet lifts
  // out of its way (Hologram.jsx).
  float reach = land.x - uCenter.x;
  float dirn = abs(reach) > uRes.x * 0.04 ? sign(reach) : sign(across);
  // How far out is far enough: the cubic's widest point is three quarters of
  // the way to its corners, and that must clear the copy on this side (the
  // copy reaches farther right of the centre than left) with room to spare.
  float clear = dirn < 0.0 ? uClear.x : uClear.y;
  float sideX = uCenter.x + dirn * max(abs(reach) * 1.2, (clear + 0.05 * uRes.x) / 0.75 + 0.04 * uRes.x * r1);
  vec2 c1 = vec2(sideX, px.y - 0.1 * uRes.y);
  // The second corner is well below the card: the light dips under it and wells
  // up into it, so the last leg does not cut across the lines under his name.
  vec2 c2 = vec2(sideX, land.y + 0.25 * uRes.y);
  float g = fl * goes;
  float gi = 1.0 - g;
  px = gi * gi * gi * px + 3.0 * gi * gi * g * c1 + 3.0 * gi * g * g * c2 + g * g * g * land;
  size = mix(size, plateSize, fl * goes);
  // In the air a point burns bright; landed, it settles into the plate.
  float air = sin(fl * 3.14159);
  glow = mix(glow, plate, fl) * goes + glow * (1.0 - goes) * (1.0 - smoothstep(0.0, 0.5, uFlow));
  glow += air * 0.18 * goes;
  glow *= 1.0 - hidden * goes;
  hot = mix(hot, 0.1, fl) + air * 0.12;
  bloom = mix(bloom, 0.5, fl);

  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);

  gl_PointSize = max(1.0, size * mix(1.0, 2.4, uPass));
  // A guarantee, not a tuned path: while the light is pouring, a point whose
  // splat would touch the hero copy (his name and the lines and buttons under
  // it, where they really are in the window this frame) gives no light at all.
  // The glow pass keeps a wider berth, because its blur spreads.
  vec2 away = max(uCopy.xy - px, px - uCopy.zw);
  float berth = max(away.x, away.y) - 0.5 * gl_PointSize - mix(2.0, 30.0, uPass) * uCopyK;
  float clearOf = mix(1.0, smoothstep(0.0, 8.0 * uCopyK, berth), step(0.001, uFlow) * step(uCopy.x + 1.0, uCopy.z));
  // A small splat deposits its fair share of light on average, whatever its
  // size (checked by simulation down to one pixel). Only one that would be
  // narrower than a pixel is drawn a pixel wide, so it gives up the difference.
  float share = min(1.0, size * size);
  vGlow = glow * mix(1.0, bloom, uPass) * share * clearOf;
  vHot = hot;
  vTone = glow;
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uDeep, uPale, uHot;
uniform float uGain;
varying float vGlow;
varying float vTone;
varying float vHot;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  // A Gaussian splat: neighbours overlap and add up to one even surface.
  float a = exp(-dot(d, d) * 18.0) * vGlow * uGain * 0.75;
  // The colour pales gently with the light, so brightness follows the lighting
  // and is not doubled by the ramp.
  vec3 col = mix(uDeep, uPale, clamp(vTone * 0.9, 0.0, 1.0));
  col = mix(col, uHot, clamp(vHot, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a * 0.55);
}
`;

/* The glow: a full-target triangle pair, a nine-tap blur and a plain copy. */
const QUAD_VERT = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;
const BLUR_FRAG = /* glsl */ `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uStep;
uniform float uGain;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(uTex, vUv) * 0.227;
  c += (texture2D(uTex, vUv + uStep * 1.385) + texture2D(uTex, vUv - uStep * 1.385)) * 0.316;
  c += (texture2D(uTex, vUv + uStep * 3.231) + texture2D(uTex, vUv - uStep * 3.231)) * 0.07;
  gl_FragColor = c * uGain;
}
`;

const TAU = Math.PI * 2;
const STRIDE = 8; // bytes a point
const HEADER = 16;
const Z_RANGE = 0.3; // picture heights covered by 127 depth steps (bake-hologram.py)
const RELIEF = 1; // how much of the baked depth is used
// The head's centre is the pivot: 0.51 across and 0.327 down the picture.
const PIVOT = [0.51, 0.327];

/* Read the baked files into typed arrays. `buffers` is the base tier and,
   on a desktop, the fill-in after it. `slots` is how many cards the orbit ring
   holds: each point is given one to land on. */
export function parseFace(buffers, slots = 12) {
  const heads = buffers.map((buffer) => {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (magic !== 'HOL2') throw new Error('hologram: not a face file');
    const count = view.getUint32(4, true);
    if (buffer.byteLength < HEADER + count * STRIDE) throw new Error('hologram: face file is cut short');
    return { view, count };
  });
  const n = heads.reduce((sum, h) => sum + h.count, 0);
  const first = heads[0].view;
  const aspect = first.getUint16(8, true) / 1000;
  const eye = [(first.getUint16(10, true) / 65535 - PIVOT[0]) * aspect, PIVOT[1] - first.getUint16(12, true) / 65535];
  const focus = ((first.getUint8(14) - 128) / 127) * Z_RANGE * RELIEF;

  const face = new Float32Array(n * 3);
  const norm = new Float32Array(n * 2);
  const data = new Float32Array(n * 4);
  const ball = new Float32Array(n * 4);
  const more = new Float32Array(n * 4);
  // A tiny seeded generator: the same cloud on every load.
  let s = 20261115;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let i = 0;
  let shell = 0;
  // The base tier's spacings were measured on its own. With the fill-in between
  // them its points stand closer: the fill-in file carries those spacings at its end.
  const fill = heads[1];
  const closer = fill && fill.view.byteLength >= HEADER + fill.count * STRIDE + heads[0].count ? HEADER + fill.count * STRIDE : -1;
  for (const [tier, { view, count }] of heads.entries()) {
    for (let k = 0, o = HEADER; k < count; k += 1, o += STRIDE, i += 1) {
      const xy = (view.getUint8(o) << 16) | (view.getUint8(o + 1) << 8) | view.getUint8(o + 2);
      const x = ((xy >>> 12) / 4095 - PIVOT[0]) * aspect;
      const y = PIVOT[1] - (xy & 4095) / 4095;
      const meta = view.getUint8(o + 7);
      const kind = meta >> 5;
      face[i * 3] = x;
      face[i * 3 + 1] = y;
      face[i * 3 + 2] = ((view.getUint8(o + 3) - 128) / 127) * Z_RANGE * RELIEF;
      norm[i * 2] = view.getInt8(o + 4) / 127;
      norm[i * 2 + 1] = view.getInt8(o + 5) / 127;
      data[i * 4] = view.getUint8(o + 6) / 255;
      data[i * 4 + 1] = (tier === 0 && closer >= 0 ? fill.view.getUint8(closer + k) & 31 : meta & 31) / 3 / 1200;
      data[i * 4 + 2] = rnd();
      data[i * 4 + 3] = rnd();
      // The planet: most points on its shell, one in seven in the core.
      const up = rnd() * 2 - 1;
      const round = rnd() * TAU;
      const q = Math.sqrt(1 - up * up);
      const core = rnd() < 0.08;
      if (!core) shell += 1;
      ball[i * 4] = q * Math.cos(round);
      ball[i * 4 + 1] = up;
      ball[i * 4 + 2] = q * Math.sin(round);
      ball[i * 4 + 3] = core ? 0.03 + 0.13 * Math.cbrt(rnd()) : 1;
      // The peel: the farther from the eyes, the sooner a point leaves. The eyes
      // themselves are the last lights to fold in.
      const far = Math.min(1, Math.hypot((x - eye[0]) / 0.3, (y - eye[1]) / 0.42));
      const inEye = Math.abs(y - eye[1]) < 0.035 && Math.abs(x - eye[0]) < 0.13 && Math.abs(x - eye[0]) > 0.03;
      more[i * 4] = kind === 4 ? 1 : inEye && kind === 1 ? 0.9 + 0.08 * rnd() : (1 - far) * 0.8 + 0.06 * rnd();
      // Its card on the ring, and its place on that card's thumbnail.
      more[i * 4 + 1] = (Math.floor(rnd() * slots) / slots) * TAU;
      more[i * 4 + 2] = rnd() - 0.5;
      more[i * 4 + 3] = kind + 0.02 + 0.96 * rnd();
    }
  }
  return { n, base: heads[0].count, face, norm, data, ball, more, focus, ballGap: Math.sqrt((4 * Math.PI) / Math.max(1, shell)) };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'hologram: shader');
  return shader;
}

function link(gl, vert, frag) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'hologram: link');
  return program;
}

/* Build the scene on a canvas. Throws if WebGL is not there. `colors` holds
   three [r, g, b] arrays in 0 to 1: deep, pale and hot. `bloom` is the strength
   of the glow (0 turns the second pass off). */
export function createHologram(canvas, cloud, colors, bloom = 1) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('hologram: no WebGL');

  const program = link(gl, VERT, FRAG);
  const blur = link(gl, QUAD_VERT, BLUR_FRAG);
  const buffers = [];
  const attrs = [];
  const attribute = (name, array, size) => {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    attrs.push({ at: gl.getAttribLocation(program, name), buffer, size });
  };
  attribute('aFace', cloud.face, 3);
  attribute('aNorm', cloud.norm, 2);
  attribute('aData', cloud.data, 4);
  attribute('aBall', cloud.ball, 4);
  attribute('aMore', cloud.more, 4);
  const quad = gl.createBuffer();
  buffers.push(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const quadAt = gl.getAttribLocation(blur, 'aPos');

  const u = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uBall', 'uRingA', 'uRingB', 'uRingC', 'uRingD', 'uRingOn', 'uClear', 'uCopy', 'uCopyK', 'uTime', 'uIntro', 'uMorph', 'uFlow', 'uTurn', 'uNod', 'uVoice', 'uSpeak', 'uStill', 'uBallGap', 'uFocus', 'uPass', 'uDeep', 'uPale', 'uHot', 'uGain']) {
    u[name] = gl.getUniformLocation(program, name);
  }
  const ub = { uTex: gl.getUniformLocation(blur, 'uTex'), uStep: gl.getUniformLocation(blur, 'uStep'), uGain: gl.getUniformLocation(blur, 'uGain') };
  gl.useProgram(program);
  gl.uniform3fv(u.uDeep, colors.deep);
  gl.uniform3fv(u.uPale, colors.pale);
  gl.uniform3fv(u.uHot, colors.hot);
  gl.uniform1f(u.uBallGap, cloud.ballGap);
  gl.uniform1f(u.uFocus, cloud.focus);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  // Two third-size targets for the glow: the points go into one, the blur
  // ping-pongs between them.
  const SHRINK = 3;
  const targets = [0, 1].map(() => ({ fbo: gl.createFramebuffer(), tex: gl.createTexture(), w: 1, h: 1 }));
  function sizeTargets() {
    for (const tg of targets) {
      tg.w = Math.max(2, Math.round(canvas.width / SHRINK));
      tg.h = Math.max(2, Math.round(canvas.height / SHRINK));
      gl.bindTexture(gl.TEXTURE_2D, tg.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tg.w, tg.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tg.fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tg.tex, 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  let dpr = 1;
  function resize(width, height, ratio) {
    dpr = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    if (bloom > 0) sizeTargets();
  }

  function points(s, scale, pass) {
    const k = dpr * scale;
    const r = s.ring;
    gl.useProgram(program);
    for (const a of attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.enableVertexAttribArray(a.at);
      gl.vertexAttribPointer(a.at, a.size, gl.FLOAT, false, 0, 0);
    }
    gl.uniform2f(u.uRes, canvas.width * scale, canvas.height * scale);
    gl.uniform2f(u.uCenter, s.cx * k, s.cy * k);
    gl.uniform1f(u.uSize, s.size * k);
    gl.uniform1f(u.uBall, s.ball * k);
    gl.uniform4f(u.uRingA, r.x * k, r.y * k, r.rx * k, r.rz * k);
    gl.uniform4f(u.uRingB, r.sinT, r.cosT, r.persp * k, r.theta);
    gl.uniform4f(u.uRingC, r.cardW * k, r.cardH * k, r.front * k, r.side);
    gl.uniform3f(u.uRingD, r.yaw || 0, r.lean || 0, r.n || 12);
    gl.uniform2f(u.uClear, (r.clearL || 0) * k, (r.clearR || 0) * k);
    gl.uniform4f(u.uCopy, (r.copyL || 0) * k, (r.copyT || 0) * k, (r.copyR || 0) * k, (r.copyB || 0) * k);
    gl.uniform1f(u.uCopyK, k);
    gl.uniform1f(u.uRingOn, r.on ? 1 : 0);
    gl.uniform1f(u.uPass, pass);
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uIntro, s.intro);
    gl.uniform1f(u.uMorph, s.morph);
    gl.uniform1f(u.uFlow, s.flow);
    gl.uniform1f(u.uTurn, s.turn);
    gl.uniform1f(u.uNod, s.nod);
    gl.uniform1f(u.uVoice, s.voice);
    gl.uniform1f(u.uSpeak, s.speak ?? 0);
    gl.uniform1f(u.uStill, s.still ? 1 : 0);
    gl.uniform1f(u.uGain, s.gain);
    gl.drawArrays(gl.POINTS, 0, cloud.n);
  }

  function pass(from, to, sx, sy, gain) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, to ? to.fbo : null);
    gl.viewport(0, 0, to ? to.w : canvas.width, to ? to.h : canvas.height);
    if (to) {
      gl.disable(gl.BLEND);
    } else {
      gl.enable(gl.BLEND);
    }
    gl.useProgram(blur);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(quadAt);
    gl.vertexAttribPointer(quadAt, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.tex);
    gl.uniform1i(ub.uTex, 0);
    gl.uniform2f(ub.uStep, sx / from.w, sy / from.h);
    gl.uniform1f(ub.uGain, gain);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.BLEND);
  }

  /* One frame. Lengths are CSS pixels; `s` is the state:
     { time, intro, morph, flow, turn, nod, voice, speak, still, gain, glow, cx, cy, size, ball,
       ring: { on, x, y, rx, rz, sinT, cosT, persp, theta, cardW, cardH, front, side, yaw, lean, n, clearL, clearR, copyL, copyT, copyR, copyB } } */
  function render(s) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (s.gain <= 0.002) return;
    if (bloom > 0) {
      const [a, b] = targets;
      gl.bindFramebuffer(gl.FRAMEBUFFER, a.fbo);
      gl.viewport(0, 0, a.w, a.h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      points(s, 1 / SHRINK, 1);
      pass(a, b, 1.2, 0, 1);
      pass(b, a, 0, 1.2, 1);
      pass(a, b, 2.4, 0, 1);
      pass(b, a, 0, 2.4, 1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      pass(a, null, 0, 0, bloom * 0.62 * (s.glow ?? 1));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    points(s, 1, 0);
  }

  function dispose() {
    buffers.forEach((b) => gl.deleteBuffer(b));
    targets.forEach((tg) => {
      gl.deleteFramebuffer(tg.fbo);
      gl.deleteTexture(tg.tex);
    });
    gl.deleteProgram(program);
    gl.deleteProgram(blur);
  }

  return { resize, render, dispose };
}
