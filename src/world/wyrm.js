import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import { definePiece } from './piece';

/* A long creature of light whose body is a year of weekly records.

   One vertebra for every week it is given, newest behind the head, oldest at the
   tail. A vertebra is a cell of light: its girth and the height of the sail on
   its back are that week's total raised to 0.4 (so a quiet week is still a
   place), and seven lights ride over its back, one per day, each as bright as
   that day's level (0 to 4). Nothing here is typed: change the weeks and the
   body changes.

   The form is a dragon's, said in as few lines as it takes: a skin of scales pinched
   at every week like a paper lantern with a spine of light through it; a deep chest
   that narrows to a neck in front and a long tail behind (the anatomy scales each
   week's girth, it never replaces it); a row of swept spikes down the back, one a
   week, as tall as that week; two membrane wings, each an arm to a wrist and four
   finger bones with the skin scalloped between their tips; four legs that end in
   three claws; a short wedge of a head with an open jaw, one eye light and two long
   horns swept back; and a spearhead at the tail. (Leaf fins, a sail and barbels read
   as a fish: three rounds of cold readers said so.)

   The piece knows nothing about where it lives. Each frame the caller gives it
   a pose: for every node, a point in window px (x and y from the middle of the
   window, y down) and a depth z; the piece turns that into the scene's world
   units (one unit is one CSS px on the plane z = 0), builds frames along the
   body and writes every vertex. About 70 nodes, a few thousand floats a frame.

   It gives no light inside the caller's keep-out boxes or outside its band
   (GUARD), whatever the pose says. Below the caller's waterline it takes the
   water palette and the water's fade; above it, the air palette. */

export const GUARD_BOXES = 6;

/* Shared by every material of the piece. Window px, y down. */
const GUARD = /* glsl */ `
uniform vec4 uBox[${GUARD_BOXES}];
uniform vec2 uBand; uniform vec2 uWater; uniform vec2 uGRes;
uniform vec3 uSigmaW, uWaterCol; uniform float uWet;
vec2 winPx(){ return vec2(gl_FragCoord.x, uGRes.y - gl_FragCoord.y) / uGRes.x; }
float guard(vec2 p){
  float g = smoothstep(uBand.x, uBand.x + 40.0, p.y) * (1.0 - smoothstep(uBand.y - 40.0, uBand.y, p.y));
  for (int i = 0; i < ${GUARD_BOXES}; i++) {
    vec2 d = max(uBox[i].xy - p, p - uBox[i].zw);
    g *= smoothstep(0.0, 26.0, max(d.x, d.y));
  }
  return g;
}
// 1 under the waterlines, 0 in air: the surface above (x) and the shore (y).
float under(vec2 p){ return smoothstep(uWater.x - 3.0, uWater.x + 5.0, p.y) * smoothstep(uWater.y - 3.0, uWater.y + 5.0, p.y); }
uniform vec3 uW0, uW1, uW2, uA0, uA1, uA2; uniform float uSolid, uShowW, uAirGain;
vec3 ramp(float lv, float wf){
  vec3 lo = mix(uA0, uW0, wf); vec3 mid = mix(uA1, uW1, wf); vec3 hi = mix(uA2, uW2, wf);
  return lv < 0.5 ? mix(lo, mid, lv * 2.0) : mix(mid, hi, lv * 2.0 - 1.0);
}
vec4 lit(vec3 c, float a, float wf, vec2 p){
  // Seen through water: light dies on the way to the eye and the water's colour comes in.
  vec3 T = exp(-uSigmaW * 0.35 * uWet * wf);
  c = c * T + uWaterCol * (1.0 - T) * 0.6;
  // In the air it has a sky behind it, not dark water: it is drawn fuller, and as
  // paint more than light (uSolid), so a pale sky cannot wash it out.
  a = min(1.0, a * mix(uAirGain, 1.0, wf)) * guard(p) * uShowW;
  return vec4(c * a, a * uSolid * (1.0 - wf));
}
`;

const SKIN_VERT = /* glsl */ `
attribute vec4 aSkin; // u along (in vertebrae), v round (0 to 1), tone, kind (0 body, 1 head, 2 tail)
attribute float aGlow; // this week is lit
varying vec3 vN; varying vec3 vVP; varying vec4 vSkin; varying float vGlow;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vVP = mv.xyz; vSkin = aSkin; vGlow = aGlow;
  gl_Position = projectionMatrix * mv;
}`;
const SKIN_FRAG = /* glsl */ `
uniform float uScales;
varying vec3 vN; varying vec3 vVP; varying vec4 vSkin; varying float vGlow;
${GUARD}
void main(){
  vec2 p = winPx(); float wf = under(p);
  float fres = 1.0 - abs(dot(normalize(vN), normalize(-vVP)));
  float edge = pow(fres, 2.2);
  // A skin of scales: two families of lines wound round the body the opposite ways.
  float u = vSkin.x; float w = vSkin.y * uScales;
  float la = abs(fract(u * 0.5 + w) - 0.5); float lb = abs(fract(u * 0.5 - w) - 0.5);
  float lw = 0.045 + 0.05 * fres;
  float scale = max(smoothstep(lw, lw * 0.25, la), smoothstep(lw, lw * 0.25, lb));
  // The seam where one week ends and the next begins.
  float seam = smoothstep(0.1, 0.02, abs(fract(u) - 0.5));
  float head = step(0.5, vSkin.w) * step(vSkin.w, 1.5);
  float a = 0.035 + 0.5 * edge + scale * (0.1 + 0.26 * (1.0 - fres)) + seam * (0.07 + 0.2 * fres);
  a *= 0.55 + 0.45 * vSkin.z;
  a = a * (1.0 + 0.35 * head) + 0.03 * head + vGlow * (0.5 + 0.5 * scale + 0.5 * edge);
  float lv = clamp(0.2 + 0.45 * vSkin.z + 0.5 * edge + 0.25 * scale + vGlow, 0.0, 1.0);
  gl_FragColor = lit(ramp(lv, wf), min(a, 1.0), wf, p);
}`;

const DOT_VERT = /* glsl */ `
attribute vec3 aDot; // size in px, level 0 to 1, kind (0 day light, 1 eye, 2 body glow)
uniform float uGDpr;
varying vec3 vDot;
void main(){
  vDot = aDot;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aDot.x * uGDpr;
}`;
const DOT_FRAG = /* glsl */ `
varying vec3 vDot;
${GUARD}
void main(){
  vec2 p = winPx(); float wf = under(p);
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a; float lv = vDot.y;
  if (vDot.z > 1.5) { a = 0.13 * pow(max(0.0, 1.0 - r), 2.0); }
  else if (vDot.z > 0.5) { a = smoothstep(0.3, 0.1, r) + 0.7 * smoothstep(0.1, 0.0, abs(r - 0.56)) + 0.3 * pow(max(0.0, 1.0 - r), 2.4); lv = 1.0; }
  else { a = (0.25 + 0.75 * lv) * (smoothstep(0.62, 0.2, r) + 0.3 * pow(max(0.0, 1.0 - r), 2.0)); }
  gl_FragColor = lit(ramp(lv, wf), min(a, 1.0), wf, p);
}`;

const BAND_VERT = /* glsl */ `
attribute vec4 aBand; // u along, v across, kind (0 line, 1 back spikes, 2 unused, 3 leaf: horn or tail barb, 4 wing), tone
varying vec4 vBand;
void main(){
  vBand = aBand;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const BAND_FRAG = /* glsl */ `
uniform float uRibs;
varying vec4 vBand;
${GUARD}
void main(){
  vec2 p = winPx(); float wf = under(p);
  float u = vBand.x; float v = vBand.y; float k = vBand.z; float a; float lv;
  if (k < 0.5) {
    // The spine: a hot core in a soft sleeve.
    float c = abs(v * 2.0 - 1.0);
    a = 0.8 * smoothstep(0.34, 0.08, c) + 0.14 * (1.0 - c);
    lv = 0.55 + 0.45 * smoothstep(0.4, 0.0, c);
  } else if (k < 1.5) {
    // The back: one swept spike a vertebra, not a sail (a continuous fin is a fish's).
    float tooth = 1.0 - 2.0 * abs(fract(u + 0.5) - 0.5);
    float inside = tooth - v;
    float rim = smoothstep(0.2, 0.02, inside);
    a = smoothstep(0.0, 0.06, inside) * (0.2 + 0.6 * rim) * vBand.w;
    lv = 0.35 + 0.55 * rim;
  } else if (k < 2.5) {
    float c = abs(v * 2.0 - 1.0);
    a = (1.0 - u) * (0.7 * smoothstep(0.5, 0.1, c) + 0.1);
    lv = 0.7 - 0.4 * u;
  } else if (k > 3.5) {
    // A wing: finger bones from the wrist (the edges of each panel, v = 0 and 1),
    // a lit scalloped margin, and skin between that carries a little light.
    float dv = min(v, 1.0 - v) * u;
    float bone = smoothstep(0.034, 0.008, dv) * smoothstep(0.0, 0.06, u);
    float margin = smoothstep(0.9, 0.99, u);
    float weave = smoothstep(0.1, 0.0, abs(fract(u * 5.0) - 0.5)) * uRibs;
    a = (0.13 + 0.07 * u + 0.8 * bone + 0.7 * margin + 0.07 * weave) * vBand.w;
    lv = 0.28 + 0.6 * bone + 0.5 * margin;
  } else {
    // A leaf: a midrib, veins that sweep to the tip, a lit margin, almost no blade.
    float av = abs(v);
    float mid = smoothstep(0.07, 0.015, av);
    float vein = 0.0; // horn and barb are plain blades (veins made them leaves)
    float margin = smoothstep(0.82, 0.99, av);
    // The blade itself carries light, so a wing is a surface at any size, not a bundle of lines.
    a = (0.3 + 0.1 * (1.0 - av) + 0.6 * mid + 0.3 * vein * (1.0 - 0.5 * av) + 0.62 * margin) * vBand.w;
    a *= smoothstep(0.0, 0.05, u);
    lv = 0.3 + 0.55 * mid + 0.45 * margin + 0.2 * vein;
  }
  gl_FragColor = lit(ramp(clamp(lv, 0.0, 1.0), wf), min(a, 1.0), wf, p);
}`;

/* Anatomy, in body units (one unit is the gap between two vertebrae). */
const HEAD = [
  [0, 0.95],
  [0.7, 1.3],
  [1.5, 1.18],
  [2.4, 1.35],
  [3.3, 1.8],
  [4.2, 2.35],
  [5.2, 2.5],
  [6.6, 2.0],
  [8.0, 1.7],
]; // distance from the snout tip, radius: a blunt muzzle with a nostril bump, a heavy brow, a neck (a long even taper read as a horse's or a bird's skull)
const SKULL = 6; // the widest head node: the eye and the horns sit here
const NECK = 9.1; // where the newest vertebra sits
const BROW = [0, 1.75, -1.75]; // lantern ribs along the head: over the brow and down each cheek (rad from the back)
const TAIL = 7; // nodes after the oldest vertebra
const DAYS = 7;
const CURVE = 0.4; // one curve for girth, sail and (in the page) the skyline

const v = () => new Vector3();

/** Weeks from a day list ({ date, count, level }), the same columns the commit
    graph draws: { total, levels[7] } per week, oldest first. */
export function weeksFrom(days) {
  if (!days || !days.length) return [];
  const start = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const out = Array.from({ length: Math.ceil((days.length + start) / 7) }, () => ({ total: 0, levels: new Array(DAYS).fill(0) }));
  days.forEach((d, n) => {
    const w = out[Math.floor((n + start) / 7)];
    w.total += d.count;
    w.levels[(n + start) % 7] = d.level;
  });
  return out;
}

export const wyrm = definePiece({
  name: 'wyrm',
  tokens: ['wyrm-sea-lo', 'wyrm-sea', 'wyrm-sea-hi', 'wyrm-air-lo', 'wyrm-air', 'wyrm-air-hi'],
  tiers: { phone: { around: 12, leaf: [8, 3], ribs: 0 }, desktop: { around: 22, leaf: [14, 4], ribs: 1 } },
  /* ctx: { weeks, colors: { water: [lo, mid, hi], air: [lo, mid, hi] } as 0 to 1
     triples, tier: 'phone' | 'desktop', wet: { uSigmaW, uWaterCol, uWet } or none } */
  create({ weeks, colors, tier = 'desktop', wet }) {
    const T = wyrm.tiers[tier] ?? wyrm.tiers.desktop;
    const N = weeks.length;
    const M = HEAD.length + N + TAIL;
    const peak = Math.max(1, ...weeks.map((w) => w.total)) ** CURVE;
    const size = (w) => (w.total ? w.total ** CURVE / peak : 0);
    // Rank within the year, as the graph colours its ridge.
    const sorted = weeks.map((w) => w.total).filter(Boolean).sort((a, b) => a - b);
    const rank = (w) => (w.total ? sorted.indexOf(w.total) / Math.max(1, sorted.length - 1) : 0);

    const chestAt = Math.min(9, N * 0.18); // the vertebra the wings root at
    // Per node: distance from the snout, radius, spike height, tone, week (or -1).
    const dist = new Float32Array(M);
    const rad = new Float32Array(M);
    const sail = new Float32Array(M);
    const tone = new Float32Array(M);
    const kind = new Float32Array(M);
    const week = new Int16Array(M).fill(-1);
    HEAD.forEach(([d, r], k) => {
      dist[k] = d;
      rad[k] = r;
      tone[k] = 0.9;
      kind[k] = 1;
    });
    for (let j = 0; j < N; j++) {
      const k = HEAD.length + j;
      const w = weeks[N - 1 - j];
      const s = size(w);
      dist[k] = NECK + j;
      // Anatomy scales the week's girth: a neck, a deep chest where the wings root,
      // then a tail that thins all the way back.
      const chest = Math.exp(-(((j - chestAt) / (N * 0.12 + 1)) ** 2));
      const taper = Math.max(0, Math.min(1, (j - N * 0.42) / (N * 0.58)));
      const anat = (0.78 + 0.8 * chest) * (1 - 0.5 * taper * taper * (3 - 2 * taper));
      rad[k] = (0.95 + 1.6 * s) * anat;
      sail[k] = (0.7 + 2.3 * s) * Math.min(1, (j + 0.6) / 2.2); // the spikes rise out of the neck
      tone[k] = 0.18 + 0.82 * rank(w);
      week[k] = N - 1 - j;
    }
    const lastR = N ? rad[HEAD.length + N - 1] : 0.4;
    for (let i = 0; i < TAIL; i++) {
      const k = HEAD.length + N + i;
      dist[k] = NECK + N + i;
      rad[k] = Math.min(lastR, 0.95) * (1 - (i + 1) / (TAIL + 0.8));
      sail[k] = 0;
      tone[k] = 0.3;
      kind[k] = 2;
    }
    const length = dist[M - 1];

    /* ---- shared uniforms ---- */
    const dryWet = { uSigmaW: { value: new Vector3(1, 0.4, 0.3) }, uWaterCol: { value: new Vector3() }, uWet: { value: 0 } };
    const C3 = (a) => ({ value: new Vector3(...a) });
    const U = {
      uBox: { value: Array.from({ length: GUARD_BOXES }, () => new Vector4(-9e4, -9e4, -9e4, -9e4)) },
      uBand: { value: new Vector2(-1e5, 1e5) },
      uWater: { value: new Vector2(1e5, 1e5) },
      uGRes: { value: new Vector2(1, 1) }, // device px per CSS px, drawing-buffer height
      uGDpr: { value: 1 },
      uSolid: { value: 0 },
      uShowW: { value: 1 },
      uAirGain: { value: 1 },
      uRibs: { value: T.ribs },
      uW0: C3(colors.water[0]),
      uW1: C3(colors.water[1]),
      uW2: C3(colors.water[2]),
      uA0: C3(colors.air[0]),
      uA1: C3(colors.air[1]),
      uA2: C3(colors.air[2]),
      ...(wet ?? dryWet),
    };
    const mat = (vertexShader, fragmentShader) =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: U,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: CustomBlending,
        blendSrc: OneFactor,
        blendDst: OneMinusSrcAlphaFactor,
        blendSrcAlpha: OneFactor,
        blendDstAlpha: OneMinusSrcAlphaFactor,
      });
    const kept = [];
    const keep = (x) => {
      kept.push(x);
      return x;
    };
    const group = new Group();

    /* ---- the skin: one tube, a ring at every node and a pinched ring between ---- */
    const around = T.around;
    const RINGS = 2 * M - 1;
    const ringV = around + 1;
    const skinPos = new BufferAttribute(new Float32Array(RINGS * ringV * 3), 3);
    skinPos.setUsage(DynamicDrawUsage);
    const skinNor = new BufferAttribute(new Float32Array(RINGS * ringV * 3), 3);
    skinNor.setUsage(DynamicDrawUsage);
    const skinGlow = new BufferAttribute(new Float32Array(RINGS * ringV), 1);
    skinGlow.setUsage(DynamicDrawUsage);
    const skinAttr = new Float32Array(RINGS * ringV * 4);
    const skinIdx = [];
    for (let r = 0; r < RINGS; r++) {
      const k = r >> 1;
      const mid = r & 1;
      for (let i = 0; i <= around; i++) {
        skinAttr.set([r / 2, i / around, mid ? (tone[k] + tone[k + 1]) / 2 : tone[k], kind[k]], (r * ringV + i) * 4);
      }
      if (r < RINGS - 1) {
        for (let i = 0; i < around; i++) {
          const a0 = r * ringV + i;
          const b0 = a0 + ringV;
          skinIdx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1);
        }
      }
    }
    const skinGeo = keep(new BufferGeometry());
    skinGeo.setAttribute('position', skinPos);
    skinGeo.setAttribute('normal', skinNor);
    skinGeo.setAttribute('aSkin', new BufferAttribute(skinAttr, 4));
    skinGeo.setAttribute('aGlow', skinGlow);
    skinGeo.setIndex(skinIdx);
    U.uScales = { value: tier === 'phone' ? 3 : 4 };
    const skin = new Mesh(skinGeo, keep(mat(SKIN_VERT, SKIN_FRAG)));
    skin.frustumCulled = false;
    group.add(skin);
    const glowOf = new Float32Array(M); // how lit each node's week is, eased
    const ringCos = new Float32Array(ringV);
    const ringSin = new Float32Array(ringV);
    for (let i = 0; i <= around; i++) {
      ringCos[i] = Math.cos((i / around) * Math.PI * 2);
      ringSin[i] = Math.sin((i / around) * Math.PI * 2);
    }

    /* ---- dots: seven day lights a vertebra, the eye, a soft glow down the body ---- */
    const glowEvery = 3;
    const nGlow = Math.ceil(M / glowEvery);
    const nDots = N * DAYS + 1 + nGlow;
    const dotPos = new BufferAttribute(new Float32Array(nDots * 3), 3);
    dotPos.setUsage(DynamicDrawUsage);
    const dotAttr = new BufferAttribute(new Float32Array(nDots * 3), 3);
    dotAttr.setUsage(DynamicDrawUsage);
    const dotGeo = keep(new BufferGeometry());
    dotGeo.setAttribute('position', dotPos);
    dotGeo.setAttribute('aDot', dotAttr);
    const dots = new Points(dotGeo, keep(mat(DOT_VERT, DOT_FRAG)));
    dots.frustumCulled = false;
    group.add(dots);

    /* ---- bands: spine, sail, two barbels and the leaves, one dynamic mesh ---- */
    const [LU, LV] = T.leaf; // a leaf is (LU + 1) x (2 LV + 1) vertices
    // root node (as a distance from the snout), length, spread from the back (rad),
    // sweep toward the tail (rad), side, beat phase, how far it beats
    const wingAt = NECK + chestAt;
    const hipAt = NECK + N * 0.4;
    const leaf = (at, len, spread, sweep, side, ph, beat, wide, fold = 0) => ({ at, len, spread, sweep, side, ph, beat, wide, fold });
    const LEAVES = [];
    for (const side of [1, -1]) {
      // A horn behind each eye: long, narrow and swept back, and a short spur under it.
      LEAVES.push(leaf(6.5, 10.5, 0.36, 0.92, side, 0.3, 0.02, 0.1));
      LEAVES.push(leaf(7.1, 4.2, 1.35, 1.15, side, 0.5, 0.03, 0.1));
    }
    // The tail ends in a barb: two blades laid along the tail's line, back to back
    // (each is broad on its outer side), so together they are one spearhead. (Two long leaves at a wide angle were a fish's fluke.)
    LEAVES.push(leaf(length - 0.7, 3.4, 0, 1.45, 1, 2.4, 0.05, 0.26));
    LEAVES.push(leaf(length - 0.7, 3.4, 3.14159, 1.45, 1, 2.4, 0.05, 0.26));
    /* A wing, in its own plane: x toward the tail, y along the span, in wing lengths.
       The arm runs from the shoulder to the wrist; four finger bones fan from the
       wrist; the skin runs tip to tip, then back to the body behind the shoulder. */
    const WING_LEN = 27;
    const WRIST = [-0.17, 0.5];
    const RIM = [
      [0.04, 1.0],
      [0.44, 0.9],
      [0.74, 0.6],
      [0.82, 0.24],
      [0.5, 0.0],
      [0, 0],
    ]; // finger tips 1 to 4, where the skin meets the body, the shoulder
    const PANEL_V = [
      [0, 1],
      [0, 1],
      [0, 1],
      [0, 0.5],
      [0.5, 1],
    ]; // a bone on an edge at v = 0 or 1: fingers, then the arm
    const SCALLOP = [0.17, 0.17, 0.17, 0.1, 0];
    const SEG = tier === 'phone' ? 4 : 7;
    const wingVerts = PANEL_V.length * (SEG + 1) * 2;
    const WINGS = [1, -1];
    /* A leg: hip, knee, ankle, foot, and three claws. Root vertebra (distance from
       the snout) and side. */
    const LEGS = [
      [wingAt + 1.5, 1],
      [wingAt + 1.5, -1],
      [hipAt, 1],
      [hipAt, -1],
    ];
    const legVerts = 4 * 2 + 3 * 2 * 2;
    const leafVerts = (LU + 1) * (2 * LV + 1);
    const JAW = 6;
    const nBand = M * 2 + M * 2 + (JAW + 1) * 2 + BROW.length * HEAD.length * 2 + LEAVES.length * leafVerts + WINGS.length * wingVerts + LEGS.length * legVerts;
    const bandPos = new BufferAttribute(new Float32Array(nBand * 3), 3);
    bandPos.setUsage(DynamicDrawUsage);
    const bandAttr = new Float32Array(nBand * 4);
    const bandIdx = [];
    const strip = (start, count) => {
      for (let i = 0; i < count - 1; i++) {
        const a = start + i * 2;
        bandIdx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
      }
    };
    let o = 0;
    const spine0 = o;
    for (let k = 0; k < M; k++) {
      bandAttr.set([k / (M - 1), 0, 0, 1], (o + k * 2) * 4);
      bandAttr.set([k / (M - 1), 1, 0, 1], (o + k * 2 + 1) * 4);
    }
    strip(o, M);
    o += M * 2;
    const sail0 = o;
    for (let k = 0; k < M; k++) {
      const t = 0.35 + 0.65 * tone[k];
      bandAttr.set([k, 0, 1, t], (o + k * 2) * 4);
      bandAttr.set([k, 1, 1, t], (o + k * 2 + 1) * 4);
    }
    strip(o, M);
    o += M * 2;
    const jaw0 = o;
    for (let i = 0; i <= JAW; i++) {
      bandAttr.set([0.5, 0, 0, 1], (o + i * 2) * 4);
      bandAttr.set([0.5, 1, 0, 1], (o + i * 2 + 1) * 4);
    }
    strip(o, JAW + 1);
    o += (JAW + 1) * 2;
    const brow0 = o;
    for (let l = 0; l < BROW.length; l++) {
      for (let i = 0; i < HEAD.length; i++) {
        bandAttr.set([0.5, 0, 0, 1], (o + i * 2) * 4);
        bandAttr.set([0.5, 1, 0, 1], (o + i * 2 + 1) * 4);
      }
      strip(o, HEAD.length);
      o += HEAD.length * 2;
    }
    const leaf0 = o;
    for (let l = 0; l < LEAVES.length; l++) {
      for (let i = 0; i <= LU; i++) {
        for (let j = -LV; j <= LV; j++) {
          bandAttr.set([i / LU, j / LV, 3, 1], (o + i * (2 * LV + 1) + j + LV) * 4);
        }
      }
      for (let i = 0; i < LU; i++) {
        for (let j = 0; j < 2 * LV; j++) {
          const a = o + i * (2 * LV + 1) + j;
          const b = a + 2 * LV + 1;
          bandIdx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      o += leafVerts;
    }
    const wing0 = o;
    for (let wi = 0; wi < WINGS.length; wi++) {
      for (let pnl = 0; pnl < PANEL_V.length; pnl++) {
        const [v0, v1] = PANEL_V[pnl];
        for (let i = 0; i <= SEG; i++) {
          const vv = v0 + ((v1 - v0) * i) / SEG;
          bandAttr.set([0, vv, 4, 1], (o + i * 2) * 4);
          bandAttr.set([1, vv, 4, 1], (o + i * 2 + 1) * 4);
        }
        strip(o, SEG + 1);
        o += (SEG + 1) * 2;
      }
    }
    const leg0 = o;
    for (let l = 0; l < LEGS.length; l++) {
      for (let i = 0; i < legVerts / 2; i++) {
        bandAttr.set([0.5, 0, 0, 1], (o + i * 2) * 4);
        bandAttr.set([0.5, 1, 0, 1], (o + i * 2 + 1) * 4);
      }
      strip(o, 4);
      for (let cl = 0; cl < 3; cl++) strip(o + 8 + cl * 4, 2);
      o += legVerts;
    }
    const bandGeo = keep(new BufferGeometry());
    bandGeo.setAttribute('position', bandPos);
    bandGeo.setAttribute('aBand', new BufferAttribute(bandAttr, 4));
    bandGeo.setIndex(bandIdx);
    const bands = new Mesh(bandGeo, keep(mat(BAND_VERT, BAND_FRAG)));
    bands.frustumCulled = false;
    group.add(bands);

    /* ---- the frame along the body, written every pose ---- */
    const P = Array.from({ length: M }, v);
    const Tn = Array.from({ length: M }, v);
    const Un = Array.from({ length: M }, v);
    const Sn = Array.from({ length: M }, v);
    const sc = new Float32Array(M);
    const sz = new Float32Array(M).fill(1);
    const win = new Float32Array(M * 2); // where each node is in the window, for bindings and tests
    const tmp = [0, 0, 0, 1];
    const a = v();
    const b = v();
    const c = v();
    const e = v();
    const Z = new Vector3(0, 0, 1);
    const hint = v();
    let lit = -1;
    const state = { headX: 0, headY: 0, midX: 0, midY: 0, shown: false };

    // The node (fractional) at a distance from the snout.
    function nodeAt(d) {
      let k = 0;
      while (k < M - 2 && dist[k + 1] < d) k++;
      return k + Math.max(0, Math.min(1, (d - dist[k]) / (dist[k + 1] - dist[k])));
    }
    function sample(f, into, arr) {
      const k = Math.min(M - 2, Math.floor(f));
      return into.copy(arr[k]).lerp(arr[k + 1], f - k);
    }

    /* pose: {
         t          seconds
         scale      px per body unit
         at(k, d, out)  node k, d units from the snout: out = [x, y, z, size] in window px
         cam        { x, y, z }  the camera in world units (z is the camera distance)
         beat       0 to 1: how hard the fins work (water about 0.35, air 1)
         sleep      0 to 1: folded and breathing slowly
         fold       0 to 1: how far the wings are folded (default: as asleep as it is)
         wings      optional [near, far]: { sweep, len, fan } holds each wing in a set pose
         show       0 to 1
         solid      0 pure light, 1 paints over what is behind it (in the air only)
         air        how much fuller it is drawn in the air (1 as in water)
         dpr, resY  device px per CSS px, drawing-buffer height
         lit        a week index to light, or -1
       } */
    function pose(q) {
      const t = q.t;
      const cam = q.cam;
      U.uShowW.value = q.show ?? 1;
      U.uSolid.value = q.solid ?? 0;
      U.uAirGain.value = q.air ?? 1;
      U.uGRes.value.set(q.dpr ?? 1, q.resY ?? 1);
      U.uGDpr.value = q.dpr ?? 1;
      group.visible = (q.show ?? 1) > 0.003;
      state.shown = group.visible;
      if (!group.visible) return;
      const sleep = q.sleep ?? 0;
      const wingFold = q.fold ?? sleep; // asleep it may still hold a wing half raised
      const beat = (q.beat ?? 0.4) * (1 - sleep);
      const breath = 1 + 0.035 * Math.sin(t * 0.9) * sleep;

      for (let k = 0; k < M; k++) {
        tmp[3] = 1;
        q.at(k, dist[k], tmp);
        const kz = (cam.z - tmp[2]) / cam.z;
        P[k].set(cam.x + tmp[0] * kz, cam.y - tmp[1] * kz, tmp[2]);
        sz[k] = tmp[3];
        sc[k] = q.scale * kz * tmp[3]; // out[3] is an optional size: a body can shrink as it leaves
        win[k * 2] = tmp[0];
        win[k * 2 + 1] = tmp[1];
      }
      for (let k = 0; k < M; k++) {
        Tn[k].copy(P[Math.max(0, k - 1)]).sub(P[Math.min(M - 1, k + 1)]);
        if (Tn[k].lengthSq() < 1e-8) Tn[k].set(1, 0, 0);
        Tn[k].normalize();
      }
      // Parallel transport from the head, so the back never flips along the body.
      hint.set(0, 1, 0.34);
      if (q.up) hint.set(q.up[0], q.up[1], q.up[2]);
      Un[0].copy(hint).addScaledVector(Tn[0], -hint.dot(Tn[0]));
      if (Un[0].lengthSq() < 1e-4) Un[0].set(0, 0, 1).addScaledVector(Tn[0], -Tn[0].z);
      Un[0].normalize();
      for (let k = 1; k < M; k++) {
        Un[k].copy(Un[k - 1]).addScaledVector(Tn[k], -Un[k - 1].dot(Tn[k]));
        // Lean back toward upright, so a loop does not leave the body rolled over.
        Un[k].addScaledVector(a.copy(hint).addScaledVector(Tn[k], -hint.dot(Tn[k])), 0.06).normalize();
      }
      for (let k = 0; k < M; k++) Sn[k].crossVectors(Tn[k], Un[k]).normalize();

      /* skin */
      for (let k = 0; k < M; k++) {
        const on = week[k] >= 0 && week[k] === lit ? 1 : 0;
        glowOf[k] += (on - glowOf[k]) * 0.25;
      }
      {
        const sp = skinPos.array;
        const sn = skinNor.array;
        const sg = skinGlow.array;
        let i3 = 0;
        let i1 = 0;
        for (let r = 0; r < RINGS; r++) {
          const k = r >> 1;
          const mid = r & 1;
          let rr;
          let glow = glowOf[k];
          if (mid) {
            // Between two vertebrae the body draws in: each week is its own lantern cell.
            a.copy(P[k]).add(P[k + 1]).multiplyScalar(0.5);
            b.copy(Un[k]).add(Un[k + 1]).normalize();
            c.copy(Sn[k]).add(Sn[k + 1]).normalize();
            rr = Math.min(rad[k] * sc[k], rad[k + 1] * sc[k + 1]) * (kind[k] === 1 && kind[k + 1] === 1 ? 1 : 0.8);
            glow = 0;
          } else {
            a.copy(P[k]);
            b.copy(Un[k]);
            c.copy(Sn[k]);
            rr = rad[k] * sc[k] * (kind[k] === 0 ? breath : 1);
          }
          for (let i = 0; i < ringV; i++) {
            const nx = b.x * ringCos[i] + c.x * ringSin[i];
            const ny = b.y * ringCos[i] + c.y * ringSin[i];
            const nz = b.z * ringCos[i] + c.z * ringSin[i];
            sp[i3] = a.x + nx * rr;
            sp[i3 + 1] = a.y + ny * rr;
            sp[i3 + 2] = a.z + nz * rr;
            sn[i3] = nx;
            sn[i3 + 1] = ny;
            sn[i3 + 2] = nz;
            sg[i1++] = glow;
            i3 += 3;
          }
        }
        skinPos.needsUpdate = true;
        skinNor.needsUpdate = true;
        skinGlow.needsUpdate = true;
      }

      /* dots */
      let n = 0;
      const px = q.scale;
      for (let k = HEAD.length; k < HEAD.length + N; k++) {
        const w = weeks[week[k]];
        const r = rad[k] * sc[k] * breath * 1.03;
        const glow = glowOf[k];
        for (let i = 0; i < DAYS; i++) {
          // Sunday to Saturday over the back, flank to flank.
          const ang = ((i - 3) / 3) * 1.25;
          a.copy(Un[k]).multiplyScalar(Math.cos(ang) * r).addScaledVector(Sn[k], Math.sin(ang) * r).add(P[k]);
          dotPos.setXYZ(n, a.x, a.y, a.z);
          const lv = w.levels[i] / 4;
          dotAttr.setXYZ(n, Math.max(1.8, px * sz[k] * (0.42 + 0.62 * lv) * (1 + 0.5 * glow)), Math.min(1, lv + glow * 0.5), 0);
          n++;
        }
      }
      // The eye: on the side of the skull that faces the reader. It closes in sleep.
      {
        const k = SKULL;
        const side = Sn[k].z >= 0 ? 1 : -1;
        a.copy(P[k]).addScaledVector(Un[k], rad[k] * sc[k] * 0.36).addScaledVector(Sn[k], side * rad[k] * sc[k] * 0.7).addScaledVector(Tn[k], sc[k] * 0.55);
        dotPos.setXYZ(n, a.x, a.y, a.z);
        const blink = sleep > 0.5 ? 0.3 + 0.08 * Math.sin(t * 0.9) : 1 - 0.9 * Math.pow(Math.max(0, Math.sin(t * 0.37 + 1)), 60);
        dotAttr.setXYZ(n, Math.max(7, px * sz[k] * 4.2 * blink), 1, 1);
        n++;
      }
      for (let k = 1; k < M; k += glowEvery) {
        dotPos.setXYZ(n, P[k].x, P[k].y, P[k].z);
        dotAttr.setXYZ(n, Math.max(8, px * sz[k] * (2.4 + rad[k] * 3.4)), 0.4 + 0.5 * tone[k], 2);
        n++;
      }
      for (; n < nDots; n++) dotAttr.setXYZ(n, 0, 0, 2);
      dotPos.needsUpdate = true;
      dotAttr.needsUpdate = true;

      /* bands */
      const bp = bandPos.array;
      const put = (i, x) => {
        bp[i * 3] = x.x;
        bp[i * 3 + 1] = x.y;
        bp[i * 3 + 2] = x.z;
      };
      // The spine, a hair wide, facing the reader.
      for (let k = 0; k < M; k++) {
        c.crossVectors(Tn[k], Z);
        if (c.lengthSq() < 1e-6) c.copy(Un[k]);
        c.normalize();
        const hw = Math.max(1.1, 0.16 * q.scale) * (sc[k] / q.scale) * (k < 1 || k > M - 2 ? 0.3 : 1);
        put(spine0 + k * 2, a.copy(P[k]).addScaledVector(c, hw));
        put(spine0 + k * 2 + 1, a.copy(P[k]).addScaledVector(c, -hw));
      }
      // The sail: from the top of each hoop, swept toward the tail. Asleep it lies half down.
      const lift = 1 - 0.55 * sleep;
      for (let k = 0; k < M; k++) {
        const r = rad[k] * sc[k];
        a.copy(P[k]).addScaledVector(Un[k], r * 0.96);
        put(sail0 + k * 2, a);
        const hgt = sail[k] * sc[k] * lift * (1 + 0.05 * Math.sin(t * 1.7 - dist[k] * 0.5) * (1 - sleep));
        a.addScaledVector(Un[k], hgt * 0.92).addScaledVector(Tn[k], -hgt * (0.5 + 0.4 * sleep));
        put(sail0 + k * 2 + 1, a);
      }
      // The lower jaw: a line under the snout, hinged at the skull, a little open.
      for (let i = 0; i <= JAW; i++) {
        const u = i / JAW; // 0 at the hinge, 1 at the chin
        const f = nodeAt(dist[SKULL] + 0.5 - u * (dist[SKULL] - 0.4));
        const k = Math.min(M - 2, Math.floor(f));
        const r = rad[k] + (rad[k + 1] - rad[k]) * (f - k);
        sample(f, a, P);
        sample(f, c, Un).normalize();
        const gape = 1.0 + 0.16 * Math.sin(t * 0.8) * (1 - sleep) - 0.7 * sleep;
        a.addScaledVector(c, -(r * (1 - 0.25 * u) + gape * u + 0.12) * sc[k]);
        sample(f, e, Tn);
        e.cross(Z);
        if (e.lengthSq() < 1e-6) e.copy(c);
        e.normalize();
        const hw = Math.max(1.1, 0.2 * q.scale) * (sc[k] / q.scale) * (1 - 0.5 * u);
        put(jaw0 + i * 2, b.copy(a).addScaledVector(e, hw));
        put(jaw0 + i * 2 + 1, b.copy(a).addScaledVector(e, -hw));
      }
      // Lantern ribs along the head, so the skull has a profile: brow, cheek, cheek.
      for (let l = 0; l < BROW.length; l++) {
        for (let k = 0; k < HEAD.length; k++) {
          const r = rad[k] * sc[k] * (l === 0 && k === SKULL ? 1.12 : 1.0);
          a.copy(P[k]).addScaledVector(Un[k], Math.cos(BROW[l]) * r).addScaledVector(Sn[k], Math.sin(BROW[l]) * r);
          c.crossVectors(Tn[k], Z);
          if (c.lengthSq() < 1e-6) c.copy(Un[k]);
          c.normalize();
          const hw = Math.max(1.1, 0.15 * q.scale) * (sc[k] / q.scale);
          const i = brow0 + (l * HEAD.length + k) * 2;
          put(i, b.copy(a).addScaledVector(c, hw));
          put(i + 1, b.copy(a).addScaledVector(c, -hw));
        }
      }
      // The leaves.
      let at = leaf0;
      for (const L of LEAVES) {
        const f = nodeAt(L.at);
        const k = Math.min(M - 1, Math.round(f));
        const s0 = sc[k];
        sample(f, a, P); // root
        const fold = L.fold * wingFold; // the wings fold along the body in sleep
        const flap = Math.sin(t * (1.1 + 1.5 * beat) - L.ph) * (0.1 + 0.62 * beat) * L.beat;
        const spread = L.spread + flap - 0.25 * fold;
        const sweep = L.sweep + 0.5 * fold + 0.12 * flap;
        // The leaf's long axis: up from the back, out to its side, swept toward the tail.
        b.copy(Un[k]).multiplyScalar(Math.cos(spread)).addScaledVector(Sn[k], Math.sin(spread) * L.side);
        b.multiplyScalar(Math.cos(sweep)).addScaledVector(Tn[k], -Math.sin(sweep)).normalize();
        // Across it: along the body, squared up to the long axis.
        c.copy(Tn[k]).addScaledVector(b, -Tn[k].dot(b)).normalize();
        e.crossVectors(b, c); // the leaf's own normal: it cups along this
        a.addScaledVector(b, rad[k] * s0 * 0.7);
        const len = L.len * s0 * (1 - 0.42 * fold); // folded, a wing is drawn in
        for (let i = 0; i <= LU; i++) {
          const u = i / LU;
          const wide = L.wide * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.85) * (1 - 0.3 * u);
          const droop = (0.2 * u * u + 0.1 * flap * u * u) * len;
          for (let j = -LV; j <= LV; j++) {
            const w = j / LV;
            // Narrow in front of the midrib, broad behind it: a wing, not a paddle.
            const off = (w > 0 ? 0.42 : 1) * w * wide * len;
            const cup = -0.16 * w * w * wide * len;
            const x = a.x + b.x * len * u - c.x * off + e.x * cup - Tn[k].x * droop;
            const y = a.y + b.y * len * u - c.y * off + e.y * cup - Tn[k].y * droop;
            const z = a.z + b.z * len * u - c.z * off + e.z * cup - Tn[k].z * droop;
            bp[at * 3] = x;
            bp[at * 3 + 1] = y;
            bp[at * 3 + 2] = z;
            at++;
          }
        }
      }
      // The wings.
      at = wing0;
      for (const side of WINGS) {
        const held = q.wings ? q.wings[side > 0 ? 0 : 1] : null; // a pose may hold each wing its own way
        const f = nodeAt(wingAt);
        const k = Math.min(M - 1, Math.round(f));
        const s0 = sc[k];
        const flap = Math.sin(t * (1.1 + 1.5 * beat)) * (0.12 + 0.6 * beat);
        const spread = 0.62 + flap - 0.1 * wingFold;
        const sweep = held ? held.sweep : 0.12 + 1.05 * wingFold + 0.1 * flap; // folded, it lies back along the body
        // The arm's axis: up from the back, out to its side, swept toward the tail.
        b.copy(Un[k]).multiplyScalar(Math.cos(spread)).addScaledVector(Sn[k], Math.sin(spread) * side);
        b.multiplyScalar(Math.cos(sweep)).addScaledVector(Tn[k], -Math.sin(sweep)).normalize();
        // The hand bends on at the wrist: it leads the stroke down and trails it up.
        const tip = spread + 0.55 * flap + 0.5 * wingFold;
        e.copy(Un[k]).multiplyScalar(Math.cos(tip)).addScaledVector(Sn[k], Math.sin(tip) * side);
        e.multiplyScalar(Math.cos(sweep)).addScaledVector(Tn[k], -Math.sin(sweep)).normalize();
        // The chord: toward the tail, squared up to the arm.
        c.copy(Tn[k]).addScaledVector(b, -Tn[k].dot(b)).normalize().multiplyScalar(-1);
        sample(f, a, P).addScaledVector(b, rad[k] * s0 * 0.75);
        const len = WING_LEN * s0 * (held ? held.len : 1 - 0.5 * wingFold);
        const cx = held ? held.fan : 1 - 0.42 * wingFold; // folded, the fingers close like a fan
        const place = (x, y, into) => {
          const y0 = Math.min(y, WRIST[1]);
          const y1 = Math.max(0, y - WRIST[1]);
          into.copy(a).addScaledVector(b, y0 * len).addScaledVector(e, y1 * len).addScaledVector(c, x * cx * len);
        };
        for (let pnl = 0; pnl < PANEL_V.length; pnl++) {
          const [x0, y0] = RIM[pnl];
          const [x1, y1] = RIM[pnl + 1];
          for (let i = 0; i <= SEG; i++) {
            const u = i / SEG;
            const pull = SCALLOP[pnl] * Math.sin(Math.PI * u);
            const x = x0 + (x1 - x0) * u;
            const y = y0 + (y1 - y0) * u;
            place(WRIST[0], WRIST[1], hint);
            put(at, hint);
            place(x + (WRIST[0] - x) * pull, y + (WRIST[1] - y) * pull, hint);
            put(at + 1, hint);
            at += 2;
          }
        }
      }
      // The legs: tucked back along the belly in flight, folded under it at rest
      // with the claws forward.
      at = leg0;
      for (const [d0, side] of LEGS) {
        const f = nodeAt(d0);
        const k = Math.min(M - 1, Math.round(f));
        const s0 = sc[k];
        const r = rad[k];
        const kick = 0.25 * Math.sin(t * 0.9 + d0) * (1 - sleep);
        // [toward the tail, down] in body units, awake then asleep
        const J = [
          [0.2, r * 0.55, 0.1, r * 0.3],
          [2.0 + kick, r * 0.9 + 1.5, 1.8, r * 0.55],
          [4.3 + kick, r * 0.75 + 1.0, 0.9, r * 0.98],
          [5.6 + kick, r * 0.9 + 2.2, -0.9, r * 1.0],
        ];
        const hwLeg = [0.42, 0.34, 0.24, 0.2];
        let px0 = 0;
        let py0 = 0;
        let px1 = 0;
        let py1 = 0;
        const pt = (bk, dn, into) => into.copy(P[k]).addScaledVector(Tn[k], -bk * s0).addScaledVector(Un[k], -dn * s0).addScaledVector(Sn[k], side * r * 0.62 * s0);
        for (let i = 0; i < 4; i++) {
          const bk = J[i][0] + (J[i][2] - J[i][0]) * sleep;
          const dn = J[i][1] + (J[i][3] - J[i][1]) * sleep;
          pt(bk, dn, a);
          e.crossVectors(Tn[k], Z);
          if (e.lengthSq() < 1e-6) e.copy(Un[k]);
          e.normalize();
          const hw = Math.max(1.2, hwLeg[i] * q.scale) * (s0 / q.scale);
          put(at + i * 2, hint.copy(a).addScaledVector(e, hw));
          put(at + i * 2 + 1, hint.copy(a).addScaledVector(e, -hw));
          px0 = px1;
          py0 = py1;
          px1 = bk;
          py1 = dn;
        }
        // Three claws fan from the foot, along the last bone's line.
        const dl = Math.hypot(px1 - px0, py1 - py0) || 1;
        const ux = (px1 - px0) / dl;
        const uy = (py1 - py0) / dl;
        for (let cl = 0; cl < 3; cl++) {
          const ang = (cl - 1) * 0.5 + 0.25;
          const cxn = ux * Math.cos(ang) - uy * Math.sin(ang);
          const cyn = ux * Math.sin(ang) + uy * Math.cos(ang);
          const base = at + 8 + cl * 4;
          pt(px1, py1, a);
          e.crossVectors(Tn[k], Z).normalize();
          const hw = Math.max(1, 0.2 * q.scale) * (s0 / q.scale);
          put(base, hint.copy(a).addScaledVector(e, hw));
          put(base + 1, hint.copy(a).addScaledVector(e, -hw));
          pt(px1 + cxn * 1.5, py1 + cyn * 1.5, a);
          put(base + 2, hint.copy(a).addScaledVector(e, hw * 0.2));
          put(base + 3, hint.copy(a).addScaledVector(e, -hw * 0.2));
        }
        at += legVerts;
      }
      bandPos.needsUpdate = true;

      state.headX = win[6];
      state.headY = win[7];
      const mid = Math.floor(M / 2);
      state.midX = win[mid * 2];
      state.midY = win[mid * 2 + 1];
    }

    return {
      object: group,
      nodes: M,
      head: HEAD.length,
      length,
      count: () => N,
      weekOf: (k) => week[k],
      radius: (k) => rad[k],
      neck: NECK,
      window: win,
      state,
      uniforms: U,
      layout() {},
      update: pose,
      still: (q) => pose({ ...q, t: 0, beat: 0 }),
      /** Light one week's vertebra (any other index puts it out). */
      setLit(index) {
        lit = Number.isInteger(index) && index >= 0 && index < N ? index : -1;
      },
      /** Up to GUARD_BOXES rectangles [x0, y0, x1, y1] in window px, and a band [top, bottom]. */
      guard(boxes, band) {
        for (let i = 0; i < GUARD_BOXES; i++) {
          const r = boxes[i];
          if (r) U.uBox.value[i].set(r[0], r[1], r[2], r[3]);
          else U.uBox.value[i].set(-9e4, -9e4, -9e4, -9e4);
        }
        U.uBand.value.set(band ? band[0] : -1e5, band ? band[1] : 1e5);
      },
      /** The waterlines in window px (y down): light below both is in water. */
      water(surface, shore) {
        U.uWater.value.set(surface, shore);
      },
      dispose() {
        for (const x of kept) x.dispose();
      },
      binding: {
        id: 'wyrm',
        count: () => N,
        project: () => ({ x: state.midX, y: state.midY, visible: state.shown }),
      },
    };
  },
});
