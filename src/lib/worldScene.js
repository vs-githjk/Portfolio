import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  HalfFloatType,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Quaternion,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { seeded, triple } from './field';
import { BACK_FRAG, BACK_VERT, COMP_FRAG, COMP_VERT } from './worldBackdrop';
import { createLand, LAND_FOV } from './worldLand';
import { anchorRect } from '../world/anchors';
import { readTokens } from '../world/piece';
import { weeksFrom, wyrm } from '../world/wyrm';
import { createWyrmStations } from '../world/wyrmStations';
import { constellation } from '../world/constellation';
import { flagWorlds } from '../world/flagWorlds';
import { moons as moonsPiece } from '../world/moons';

/* The three worlds: the three.js scene behind every section below the hero.

   The page is one descent, and one light follows it. The hero ends on the surface
   of a sea, seen in section; scrolling is a dive through it. The water takes the
   red out of everything first (Beer-Lambert), light fans down from a sun above
   the surface, and in it hang a ringed gas giant with caustics on its lit side, a
   creature of light (the wyrm: a year of commits) and a school of fish. Near the end of Builds warm light comes
   down, the camera rises through a second waterline, and it is golden hour on a
   desert: real ground (lib/worldLand.js) with the crew's lamp-lit base camp on a
   dune. The sun sets behind the crew's panel; night falls over the commit buttes
   under the Milky Way; a moon stands by Value as a reading lamp; and the page
   ends in orbit, at dawn on the limb of the world.

   One scalar, J, says where the reader is in that journey:
     0 the surface   1 the giant   2 the breach   3 golden hour
     3.5 sunset      4 night (the galaxy)   4.6 the contact section   5 dawn
   The sun's height, the land camera's pitch, height and travel, the fog, the
   stars and the lamp are all read from J, so sky, sea, land and night agree.

   Three draws make a frame, all in one canvas:
     1 BACK   the soft part of the water and the sky, into a small target
     2 scene  a full-window composite of that target (lib/worldBackdrop.js) under
              every object of the sea and the sky
     3 land   after a depth clear, the desert with its own camera, so the sun,
              the moon and the galaxy set behind it
   A pass whose part of the journey is not on screen is skipped.

   In the main scene one unit is one CSS pixel on the plane z = 0, and the camera
   sits at y = -(scroll + half a screen), so that plane moves exactly with the
   page. Anything deeper moves slower (parallax = camZ / (camZ - z)), anything
   nearer moves faster. The set pieces are placed from the DOM: each `.vista`
   spacer in the page names the piece that is centred on it when it is centred on
   screen. Fields without a home (snow, medusae) wrap around the camera. */

const FOV = 36;
const TAU = Math.PI * 2;

const NOISE = /* glsl */ `
float hash(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
`;

/* Everything in the sea is seen through water: light dies on the way to the eye,
   red first, and what is lost is replaced by the water's own colour. `d` is in
   units the caller chooses; uWet is 0 above the surface and ashore. */
const WATER = /* glsl */ `
uniform vec3 uSigmaW, uWaterCol; uniform float uWet;
vec3 sea(vec3 col, float d){ vec3 T = exp(-uSigmaW * d * uWet); return col * T + uWaterCol * (1.0 - T); }
float seaA(float d){ return dot(exp(-uSigmaW * d * uWet), vec3(0.3333)); }
`;
const CAUSTIC = /* glsl */ `
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 3.0;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}
`;

/* ---- A world: banded gas giant or cratered moon, lit from one side ---------- */
const PLANET_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vP = position;
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const PLANET_FRAG = /* glsl */ `
uniform vec3 uLight, uNight, uDay, uBand, uRim, uRay, uLightO, uRingN;
uniform float uBands, uSeed, uTime, uLit, uRimPow, uRimGain, uNear, uSpan;
varying vec3 vN; varying vec3 vP; varying vec3 vV;
${NOISE}${WATER}${CAUSTIC}
void main(){
  vec3 n = normalize(vN);
  float warp = fbm(vP * 2.2 + uSeed + vec3(uTime * 0.012, 0.0, 0.0));
  float t;
  if (uBands > 0.5) {
    float bands = sin((vP.y + warp * 0.24) * uBands);
    float detail = fbm(vP * vec3(3.0, 16.0, 3.0) + uSeed);
    t = smoothstep(-0.5, 0.7, bands * 0.62 + detail - 0.5);
  } else {
    t = smoothstep(0.32, 0.7, fbm(vP * 3.6 + uSeed));
  }
  vec3 albedo = mix(uDay, uBand, t);
  float ndl = dot(n, uLight);
  float day = smoothstep(-0.12, 0.8, ndl);
  float fres = pow(1.0 - max(dot(n, normalize(vV)), 0.0), uRimPow);
  if (uBands > 0.5 && uRingN.y > 0.0) {
    // The ring's shadow on the planet: follow the light from this point to the
    // ring's plane and see whether the ring is there.
    float dn = dot(uLightO, uRingN);
    float tq = -dot(vP, uRingN) / (abs(dn) < 0.001 ? 0.001 : dn);
    if (tq > 0.0) {
      float rq = length(vP + uLightO * tq);
      float band = smoothstep(1.42, 1.5, rq) * smoothstep(2.36, 2.2, rq) * (1.0 - 0.7 * (1.0 - smoothstep(0.02, 0.06, abs((rq - 1.42) / 0.94 - 0.58))));
      day *= 1.0 - 0.62 * band;
    }
  }
  vec3 col = uNight + albedo * (0.035 + day * uLit);
  col += uRim * fres * uRimGain * (0.06 + 0.94 * smoothstep(-0.3, 0.5, ndl)) * (1.0 - 0.6 * uWet);
  if (uWet > 0.01) {
    // In the sea: the surface's light net plays over its lit side, and its far
    // side sinks into the water's colour, so the limb melts instead of cutting.
    col += uRay * caustic(vP.xz * 0.9 + vP.y * 0.4, uTime * 0.3) * day * 0.5 * uWet;
    col = sea(col, 0.4 + 1.5 * clamp((vV.z - uNear) / uSpan, 0.0, 1.0));
  }
  gl_FragColor = vec4(col, 1.0);
}`;
/* The air around it: a slightly larger shell seen from inside, brightest at the
   limb and gone at its own edge, only on the lit side. */
const HALO_FRAG = /* glsl */ `
uniform vec3 uLight, uRim; uniform float uEdge, uGain;
varying vec3 vN; varying vec3 vV;
${WATER}void main(){
  vec3 n = normalize(vN);
  float i = clamp(-dot(n, normalize(vV)) / uEdge, 0.0, 1.0);
  float lit = smoothstep(-0.5, 0.5, dot(normalize(n.xy + 0.0001), normalize(uLight.xy + 0.0001)));
  gl_FragColor = vec4(sea(uRim, 1.2), i * i * i * (0.05 + 0.95 * lit) * uGain * mix(1.0, 0.55, uWet));
}`;
const RING_VERT = /* glsl */ `
varying vec2 vXY; varying vec3 vVP, vC; varying float vR;
void main(){
  vXY = position.xy;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vVP = mv.xyz;
  vC = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vR = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  gl_Position = projectionMatrix * mv;
}`;
const RING_FRAG = /* glsl */ `
uniform vec3 uRim, uA, uLight; uniform float uIn, uOut;
varying vec2 vXY; varying vec3 vVP, vC; varying float vR;
${NOISE}${WATER}
void main(){
  float r = length(vXY);
  float t = (r - uIn) / (uOut - uIn);
  float bands = 0.25 + 0.75 * fbm(vec3(t * 16.0, 3.3, 1.7));
  float gap = smoothstep(0.02, 0.06, abs(t - 0.58));
  float edge = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.8, t);
  float side = 0.45 + 0.55 * smoothstep(-0.9, 0.9, vXY.x / r);
  // The planet's shadow falls across the ring, away from the light.
  vec3 oc = vVP - vC;
  float bq = dot(oc, uLight);
  float hq = bq * bq - dot(oc, oc) + vR * vR;
  float lit = 1.0 - 0.9 * smoothstep(-0.03 * vR * vR, 0.08 * vR * vR, hq) * step(bq, 0.0);
  gl_FragColor = vec4(sea(mix(uA, uRim, bands), 1.0), bands * gap * edge * side * 0.62 * seaA(0.5) * lit);
}`;

/* ---- Marine snow that is also the stars ------------------------------------- */
const SNOW_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uCamY, uCamZ, uH, uW, uTime, uDpr, uTop, uExit, uStreak;
uniform vec3 uLamp; // the pointer in window px, and how much it is on
varying float vA; varying float vMix; varying float vStreak;
void main(){
  float k = (uCamZ - position.z) / uCamZ;
  float L = uH * k * 1.3;
  float y = position.y * L + uTime * aSeed.y;
  y = uCamY + mod(y - uCamY + L * 0.5, L) - L * 0.5;
  float x = position.x * uW * k * 1.15 + sin(uTime * 0.11 + aSeed.z * 6.283) * 16.0 * k;
  gl_Position = projectionMatrix * viewMatrix * vec4(x, y, position.z, 1.0);
  float tw = 0.62 + 0.38 * sin(uTime * (0.5 + aSeed.z) + aSeed.z * 40.0);
  // A hop between places: the snow runs along the way of travel for half a second.
  vStreak = abs(uStreak);
  gl_PointSize = max(1.2, aSeed.x * uDpr / k) * (1.0 + 7.0 * vStreak);
  // Marine snow lives in the water: nothing above either waterline.
  float sy = (1.0 - gl_Position.y / gl_Position.w) * 0.5 * uH;
  float wet = smoothstep(uTop + 6.0, uTop + 70.0, sy) * smoothstep(uExit + 6.0, uExit + 70.0, sy);
  vA = tw * wet * clamp(1.5 - k * 0.24, 0.3, 1.0) * clamp(3.4 / aSeed.x, 0.1, 1.0);
  // The pointer is a lamp: what drifts near it catches the light.
  vec2 at = vec2((gl_Position.x / gl_Position.w * 0.5 + 0.5) * uW, sy);
  float near = exp(-dot(at - uLamp.xy, at - uLamp.xy) / 26000.0) * uLamp.z;
  vA *= 1.0 + 2.2 * near;
  gl_PointSize *= 1.0 + 0.5 * near;
  vMix = aSeed.z;
}`;
const SNOW_FRAG = /* glsl */ `
uniform vec3 uA, uB, uTint;
varying float vA; varying float vMix; varying float vStreak;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  q.x *= 1.0 + 7.0 * vStreak;
  float a = smoothstep(0.5, 0.0, length(q)) * (1.0 - 0.45 * vStreak);
  gl_FragColor = vec4(mix(uA, uB, vMix) * uTint, a * a * vA);
}`;

/* The text column is the calm zone: inside it (in device pixels from the middle
   of the screen) the drifting things give only a share of their light. */
const CALM = /* glsl */ `uniform float uMid, uCol, uCalm, uShow;
float calm(){ return uShow * mix(uCalm, 1.0, smoothstep(uCol - 24.0, uCol + 56.0, abs(gl_FragCoord.x - uMid))); }
`;

/* ---- Medusae: a pulsing bell, trailing tentacles, short inner arms ---------- */
const JELLY_VERT = /* glsl */ `
attribute float aPart, aT, aPh;
uniform float uTime, uPhase;
varying float vPart, vT; varying vec3 vN, vV, vO;
void main(){
  vec3 p = position;
  float beat = uTime * 1.15 + uPhase;
  float pulse = sin(beat);
  if (aPart < 0.5) {
    float rim = 1.0 - smoothstep(-0.13, 0.75, p.y);
    p.xz *= 1.0 + rim * 0.17 * sin(beat - rim * 1.6);
    p.y += 0.05 * pulse * (1.0 - rim);
  } else {
    float amp = (aPart < 1.5 ? 0.2 : 0.1) * aT;
    float ph = beat * 0.9 - aT * 5.0 + aPh;
    p.x += sin(ph) * amp;
    p.z += cos(ph * 0.8 + aPh) * amp;
    p.y += aT * 0.14 * pulse;
    p.xz *= 1.0 + 0.14 * sin(beat - 1.6) * (1.0 - aT);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vPart = aPart; vT = aT; vO = position;
  vN = normalize(normalMatrix * normal);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const JELLY_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uGlow;
varying float vPart, vT; varying vec3 vN, vV, vO;
${CALM}void main(){
  float a; vec3 c = uColor;
  if (vPart < 0.5) {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.5);
    float rim = 1.0 - smoothstep(-0.13, 0.75, vO.y);
    float veins = pow(0.5 + 0.5 * sin(atan(vO.z, vO.x) * 8.0), 6.0) * rim;
    float crown = smoothstep(0.3, 0.75, vO.y);
    a = 0.1 + 0.62 * f + 0.24 * veins + 0.18 * crown;
    c = mix(uColor, vec3(1.0), f * 0.45 + crown * 0.3);
  } else if (vPart < 1.5) {
    a = pow(1.0 - vT, 1.3) * 0.6;
  } else {
    a = (1.0 - vT) * 0.32;
    c = mix(uColor, vec3(1.0), 0.2);
  }
  gl_FragColor = vec4(c, a * uGlow * calm());
}`;

/* ---- The galaxy: a shoal of stars on two arms -------------------------------- */
const GALAXY_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime, uDpr, uScale, uSpin, uBoost;
varying float vA; varying float vMix;
void main(){
  float r = position.x;
  float ang = position.z + (uTime * 0.05 + uSpin) / (0.22 + r);
  vec3 p = vec3(cos(ang) * r, position.y, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.2, aSeed.x * uDpr * uScale);
  vA = aSeed.y * uBoost * (0.7 + 0.3 * sin(uTime * (0.4 + aSeed.z) + aSeed.z * 30.0));
  vMix = clamp(r * 1.25, 0.0, 1.0);
}`;
const GALAXY_FRAG = /* glsl */ `
uniform vec3 uCore, uA, uB;
varying float vA; varying float vMix; varying float vStreak;
void main(){
  vec2 q = gl_PointCoord - 0.5;
  q.x *= 1.0 + 7.0 * vStreak;
  float a = smoothstep(0.5, 0.0, length(q)) * (1.0 - 0.45 * vStreak);
  vec3 c = mix(uCore, mix(uA, uB, step(0.5, fract(vMix * 7.0))), smoothstep(0.1, 0.6, vMix));
  gl_FragColor = vec4(c, a * a * vA);
}`;
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAlpha;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(max(0.0, 1.0 - d), 2.6);
  gl_FragColor = vec4(uColor, a * uAlpha);
}`;
/* A comet: a bright head on +x, a tail that narrows and fades behind it. */
const COMET_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uAlpha;
varying vec2 vUv;
void main(){
  float x = vUv.x;
  float wide = mix(0.04, 0.5, x * x);
  float across = smoothstep(wide, 0.0, abs(vUv.y - 0.5));
  float along = pow(x, 2.4) * smoothstep(1.0, 0.985, x);
  float head = smoothstep(0.03, 0.0, distance(vUv * vec2(18.0, 1.0), vec2(17.6, 0.5)));
  gl_FragColor = vec4(mix(uColor, vec3(1.0), along * 0.6 + head), (across * along + head) * uAlpha);
}`;

/* ---- A school of fish: every fish is one instance on a shared loop. Each is a
   side-on body (a spindle, a narrow wrist, a forked tail, a dorsal fin), dark on
   the back and pale on the belly, with a flank that flashes as it turns. -------- */
const SCHOOL_VERT = /* glsl */ `
attribute vec3 aSeed; attribute vec2 aBody;
uniform float uTime, uScatter, uSize;
uniform vec3 uHome; uniform vec2 uLoop;
varying vec2 vB; varying float vFlash;
void main(){
  float ph = uTime * 0.16 - aSeed.x * 1.3;
  vec2 c = vec2(cos(ph) * uLoop.x, sin(ph) * uLoop.y);
  vec2 tg = normalize(vec2(-sin(ph) * uLoop.x, cos(ph) * uLoop.y));
  vec2 off = (aSeed.yz - 0.5) * uSize * vec2(30.0, 13.0);
  // A scroll startles them: each one darts away from the middle, then they regroup.
  off += normalize(aSeed.yz - 0.5 + 0.001) * uScatter * uSize * 14.0 * (0.4 + aSeed.x);
  float size = uSize * (0.72 + 0.62 * aSeed.z);
  vec2 l = position.xy;
  float beat = sin(uTime * (6.0 + 4.0 * aSeed.y) * (1.0 + uScatter) + aSeed.x * 40.0 - aBody.x * 2.6);
  l.y += beat * 0.2 * smoothstep(0.3, 1.0, aBody.x);
  float up = tg.x < 0.0 ? -1.0 : 1.0; // the back stays up whichever way it heads
  vec2 q = c + off + (l.x * tg + l.y * up * vec2(-tg.y, tg.x)) * size;
  gl_Position = projectionMatrix * viewMatrix * vec4(uHome.xy + q, uHome.z + (aSeed.y - 0.5) * 260.0, 1.0);
  vB = aBody;
  vFlash = pow(0.5 + 0.5 * sin(ph * 3.0 + aSeed.z * 9.0 + uTime * 0.7), 6.0);
}`;
const SCHOOL_FRAG = /* glsl */ `
uniform vec3 uBackC, uBelly, uShine; uniform float uShow;
varying vec2 vB; varying float vFlash;
${WATER}void main(){
  float v = vB.y;
  vec3 c = mix(uBelly, uBackC, smoothstep(-0.55, 0.6, v));
  c += uShine * exp(-pow((v - 0.02) / 0.3, 2.0)) * (0.16 + 0.84 * vFlash) * (1.0 - smoothstep(0.7, 0.85, vB.x));
  float eye = smoothstep(0.075, 0.035, length(vec2((vB.x - 0.1) * 0.9, (v - 0.25) * 0.26)));
  c = mix(c, uBackC * 0.3, eye);
  float fin = smoothstep(0.74, 0.86, vB.x) + step(1.05, abs(v));
  gl_FragColor = vec4(sea(c, 0.35), mix(0.96, 0.62, clamp(fin, 0.0, 1.0)) * uShow);
}`;

const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending };

function jellyGeometry(rnd) {
  const prof = [];
  for (let i = 0; i <= 16; i++) {
    const a = 0.02 + (i / 16) * 1.73;
    prof.push(new Vector2(Math.sin(a), 0.75 * Math.cos(a)));
  }
  const bell = new LatheGeometry(prof, 30);
  const bp = bell.attributes.position;
  const strips = [];
  const strip = (part, angle, rad, y0, len, wide, segs) => {
    const cx = Math.cos(angle);
    const cz = Math.sin(angle);
    strips.push({ part, cx, cz, rad, y0, len, wide, segs, ph: rnd() * TAU });
  };
  const T = 11;
  for (let i = 0; i < T; i++) strip(1, (i / T) * TAU + rnd() * 0.3, 0.72 + rnd() * 0.2, -0.08, 2.2 + rnd() * 1.5, 0.03, 20);
  for (let i = 0; i < 4; i++) strip(2, (i / 4) * TAU + 0.4, 0.16, 0.1, 1.1 + rnd() * 0.5, 0.2, 12);

  let nv = bp.count;
  let ni = bell.index.count;
  for (const s of strips) {
    nv += (s.segs + 1) * 2;
    ni += s.segs * 6;
  }
  const pos = new Float32Array(nv * 3);
  const nor = new Float32Array(nv * 3);
  const part = new Float32Array(nv);
  const along = new Float32Array(nv);
  const phase = new Float32Array(nv);
  const idx = new Uint16Array(ni);
  pos.set(bp.array);
  nor.set(bell.attributes.normal.array);
  idx.set(bell.index.array);
  let v = bp.count;
  let k = bell.index.count;
  for (const s of strips) {
    const base = v;
    for (let j = 0; j <= s.segs; j++) {
      const t = j / s.segs;
      const half = (s.wide / 2) * (1 - 0.7 * t);
      for (const side of [-1, 1]) {
        pos[v * 3] = s.cx * s.rad - s.cz * half * side;
        pos[v * 3 + 1] = s.y0 - t * s.len;
        pos[v * 3 + 2] = s.cz * s.rad + s.cx * half * side;
        nor[v * 3] = s.cx;
        nor[v * 3 + 2] = s.cz;
        part[v] = s.part;
        along[v] = t;
        phase[v] = s.ph;
        v++;
      }
    }
    for (let j = 0; j < s.segs; j++) {
      const a = base + j * 2;
      idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], k);
      k += 6;
    }
  }
  bell.dispose();
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(nor, 3));
  g.setAttribute('aPart', new BufferAttribute(part, 1));
  g.setAttribute('aT', new BufferAttribute(along, 1));
  g.setAttribute('aPh', new BufferAttribute(phase, 1));
  g.setIndex(new BufferAttribute(idx, 1));
  return g;
}


function fishGeometry() {
  // along (0 nose to 1 tail tips) and half height of the outline
  const prof = [
    [0, 0.0],
    [0.07, 0.15],
    [0.18, 0.25],
    [0.33, 0.29],
    [0.48, 0.25],
    [0.62, 0.16],
    [0.74, 0.065],
    [0.85, 0.17],
    [1, 0.36],
  ];
  const pos = [];
  const body = [];
  const idx = [];
  prof.forEach(([a, hb], i) => {
    const x = 1 - 2 * a;
    const last = i === prof.length - 1;
    pos.push(x, hb, 0, last ? x + 0.24 : x, 0, 0, x, -hb, 0);
    body.push(a, 1, a, 0, a, -1);
    if (i) {
      const p = (i - 1) * 3;
      const q = i * 3;
      idx.push(p, q, p + 1, q, q + 1, p + 1, p + 1, q + 1, p + 2, q + 1, q + 2, p + 2);
    }
  });
  // the dorsal fin
  const n = pos.length / 3;
  pos.push(0.5, 0.26, 0, 0.0, 0.27, 0, 0.08, 0.47, 0);
  body.push(0.25, 1.1, 0.5, 1.1, 0.46, 1.6);
  idx.push(n, n + 1, n + 2);
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aBody', new BufferAttribute(new Float32Array(body), 2));
  g.setIndex(idx);
  return g;
}

const DEG = Math.PI / 180;
const sm = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
/* A value along a track of [key, value] pairs, eased between neighbours. */
function along(keys, y, linear) {
  if (!keys.length) return 0;
  if (y <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (y <= keys[i][0]) {
      const t = (y - keys[i - 1][0]) / Math.max(1e-6, keys[i][0] - keys[i - 1][0]);
      return keys[i - 1][1] + (keys[i][1] - keys[i - 1][1]) * (linear ? t : t * t * (3 - 2 * t));
    }
  }
  return keys[keys.length - 1][1];
}

/* What the journey scalar J means for the light and the land's camera. */
const TRACK = {
  sunEl: [[2, 9.5], [3, 8], [3.3, 4], [3.5, -1.5], [3.8, -18]], // degrees above the horizon
  land: [[1.92, 0], [2.3, 1], [3.06, 0.9], [3.5, 0.62], [3.86, 0.6], [4, 0.86], [4.14, 0.64], [4.26, 0.44], [4.52, 0.42], [4.7, 0]], // how much of the window the land takes
  orbit: [[4.6, 0], [4.95, 1]],
  camX: [[2, 0], [3, 36], [4, 300], [5, 400]], // the land camera travels as the page is read
};

/** Build the scene on a canvas. Throws if WebGL is not available. `days` is the
    GitHub snapshot's day list (the same data the commit graph draws). */
export function createWorld(canvas, { days, scenes = {}, counts = {}, solo = '' } = {}) {
  const css = getComputedStyle(document.documentElement);
  const col = (name, fallback) => {
    const v = triple(css, name);
    return new Vector3(...(v.length === 3 && v.every((n) => n >= 0) ? v : fallback).map((n) => n / 255));
  };
  const C = {};
  for (const name of [
    'sea-shallow', 'sea-mid', 'sea-abyss', 'sea-warm', 'sea-ray', 'sea-ray-warm', 'sea-foam', 'sea-snow-a', 'sea-snow-b',
    'giant-night', 'giant-day', 'giant-band', 'giant-rim', 'giant-ring',
    'jelly-a', 'jelly-b', 'jelly-c', 'manta-a', 'manta-rim',
    'dusk-top', 'dusk-mid', 'dusk-low', 'night-top', 'night-low', 'dawn-low', 'sun', 'star', 'ridge', 'ridge-far', 'ember',
    'moon-night', 'moon-day', 'moon-band', 'moon-rim',
    'earth-night', 'earth-day', 'earth-band', 'earth-rim',
    'gal-core', 'gal-a', 'gal-b',
  ]) {
    C[name] = col(`--${name}`, [128, 128, 128]);
  }
  // New world tokens, with the values used until tokens.css names them.
  C.sand = col('--sand', [206, 146, 98]); // sunlit dune
  C['sand-shade'] = col('--sand-shade', [70, 42, 44]); // rock strata, tent cloth, shadowed ground
  C['sea-floor'] = col('--sea-floor', [11, 33, 44]); // the darkest the water gets
  C['sea-tint'] = col('--sea-tint', [128, 218, 232]); // what the water does to white light
  const phone = window.matchMedia('(max-width: 760px)').matches;
  const rnd = seeded(41);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !phone, stencil: false });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 10, 12000);
  const time = { value: 0 };
  const zone = { uMid: { value: 0 }, uCol: { value: 1e5 }, uCalm: { value: phone ? 0.5 : 0.34 }, uShow: { value: 1 } };
  const dpr = { value: 1 };
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  let w = 1;
  let h = 1;
  let camZ = 1;
  const view = (z) => (camZ - z) / camZ; // how much more of the world a screen shows at depth z

  /* ---- The backdrop: water and sky, soft in a small target, sharp in the composite */
  const V3 = (name) => ({ value: C[name] });
  const tanF = Math.tan((LAND_FOV * Math.PI) / 360);
  const stage = {
    uView: { value: new Vector2(1, 1) },
    uRes: { value: new Vector2(1, 1) },
    uTime: time,
    uTop: { value: 1e5 },
    uExit: { value: -1e5 },
    uScroll: { value: 0 },
    uSurfDoc: { value: 0 },
    uShoreDoc: { value: 1e6 },
    uPitch: { value: 0 },
    uTanF: { value: tanF },
    uColHalf: { value: 1e5 },
    uVista: { value: new Vector2(-1e5, -1e5) },
    uLmax: { value: 0.042 },
    uNight: { value: 0 },
    uDay: { value: 1 },
    uOrbit: { value: 0 },
    uBreak: { value: 0 },
    uSunDir: { value: new Vector3(0, 0.1, -1) },
    uSunI: { value: new Vector3(1, 1, 1) },
    uDuskTop: V3('dusk-top'),
    uDuskMid: V3('dusk-mid'),
    uDuskLow: V3('dusk-low'),
    uNightTop: V3('night-top'),
    uNightLow: V3('night-low'),
    uDawnLow: V3('dawn-low'),
    uSun: V3('sun'),
    uStar: V3('star'),
  };
  // The water's own colours: what is left of white light at depth, and its floor.
  const sigma = new Vector3(1.15, 0.5, 0.36);
  const half = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float'));
  const target = keep(new WebGLRenderTarget(2, 2, { depthBuffer: false, ...(half ? { type: HalfFloatType } : {}) }));
  const full = keep(new PlaneGeometry(2, 2));
  const backMat = keep(
    new ShaderMaterial({
      vertexShader: BACK_VERT,
      fragmentShader: BACK_FRAG,
      uniforms: {
        ...stage,
        uBackRes: { value: new Vector2(2, 2) },
        uShallow: V3('sea-shallow'),
        uMid: V3('sea-mid'),
        uAbyss: V3('sea-abyss'),
        uWarmSea: V3('sea-warm'),
        uRay: V3('sea-ray'),
        uRayWarm: V3('sea-ray-warm'),
        uFoam: V3('sea-foam'),
        uBeam: { value: col('--beam-b', [76, 118, 255]) },
        uSigma: { value: sigma },
        uFloor: V3('sea-floor'),
        uSunX: { value: 0.72 },
        uSteps: { value: phone ? 3 : 4 },
        uBandTilt: { value: phone ? 1.0 : 0.62 },
      },
      depthTest: false,
      depthWrite: false,
    })
  );
  const backScene = new Scene();
  const backMesh = new Mesh(full, backMat);
  backMesh.frustumCulled = false;
  backScene.add(backMesh);
  const compMat = keep(
    new ShaderMaterial({
      vertexShader: COMP_VERT,
      fragmentShader: COMP_FRAG,
      uniforms: { ...stage, uBack: { value: target.texture }, uDpr: dpr, uTexel: { value: 2 }, uStarPx: { value: 1000 }, uFoam: V3('sea-foam') },
      transparent: true,
      depthWrite: false,
    })
  );
  const comp = new Mesh(full, compMat);
  comp.renderOrder = -100;
  comp.frustumCulled = false;
  scene.add(comp);

  /* ---- The land: its own scene and camera, drawn last ------------------------ */
  // The commit buttes are retired: the wyrm's roost and the page's own graph carry the weeks now.
  const land = createLand({ C, stage, time, dpr, phone, aspect: window.innerWidth / Math.max(1, window.innerHeight), crew: counts.crew ?? [] });
  const sunAz = land.sunAz;

  /* ---- In the water: one uniform set for everything the sea is seen through --- */
  const wet = { uSigmaW: { value: new Vector3(1.05, 0.42, 0.28) }, uWaterCol: { value: new Vector3() }, uWet: { value: 0 } };
  const dry = { uSigmaW: wet.uSigmaW, uWaterCol: wet.uWaterCol, uWet: { value: 0 } };

  /* ---- Snow -------------------------------------------------------------- */
  const nSnow = phone ? 420 : 1300;
  const sp = new Float32Array(nSnow * 3);
  const ss = new Float32Array(nSnow * 3);
  for (let i = 0; i < nSnow; i++) {
    const near = rnd() < 0.025;
    sp[i * 3] = rnd() - 0.5;
    sp[i * 3 + 1] = rnd();
    sp[i * 3 + 2] = near ? 200 + rnd() * 500 : -3800 * Math.pow(rnd(), 1.4);
    ss[i * 3] = near ? 9 + rnd() * 14 : 1.8 + rnd() * rnd() * 4.4;
    ss[i * 3 + 1] = 4 + rnd() * 16;
    ss[i * 3 + 2] = rnd();
  }
  const snowGeo = keep(new BufferGeometry());
  snowGeo.setAttribute('position', new BufferAttribute(sp, 3));
  snowGeo.setAttribute('aSeed', new BufferAttribute(ss, 3));
  const snowMat = keep(
    new ShaderMaterial({
      vertexShader: SNOW_VERT,
      fragmentShader: SNOW_FRAG,
      uniforms: { uCamY: { value: 0 }, uCamZ: { value: 1 }, uH: { value: 1 }, uW: { value: 1 }, uTime: time, uDpr: dpr, uTop: { value: 0 }, uExit: { value: -1e5 }, uStreak: { value: 0 }, uLamp: { value: new Vector3(0, 0, 0) }, uA: { value: C['sea-snow-a'] }, uB: { value: C['sea-snow-b'] }, uTint: { value: C['sea-tint'].clone().multiplyScalar(0.8) } },
      ...additive,
    })
  );
  const snow = new Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  scene.add(snow);

  /* ---- Worlds ------------------------------------------------------------ */
  const sphere = keep(new SphereGeometry(1, phone ? 64 : 128, phone ? 40 : 72));
  function world({ paint, bands, seed, light, lit, halo = 1.1, rimPow = 3, rimGain = 1, air: airGain = 0.9, water = dry }) {
    const P = (part) => C[`${paint}-${part}`];
    const g = new Group();
    const L = new Vector3(...light).normalize();
    const body = new Mesh(
      sphere,
      keep(
        new ShaderMaterial({
          vertexShader: PLANET_VERT,
          fragmentShader: PLANET_FRAG,
          uniforms: { uLight: { value: L }, uNight: { value: P('night') }, uDay: { value: P('day') }, uBand: { value: P('band') }, uRim: { value: P('rim') }, uRay: V3('sea-ray'), uBands: { value: bands }, uSeed: { value: seed }, uTime: time, uLit: { value: lit }, uRimPow: { value: rimPow }, uRimGain: { value: rimGain }, uNear: { value: 1 }, uSpan: { value: 1 }, uLightO: { value: new Vector3(0, 1, 0) }, uRingN: { value: new Vector3(0, -1, 0) }, ...water },
        })
      )
    );
    const air = new Mesh(
      sphere,
      keep(
        new ShaderMaterial({
          vertexShader: PLANET_VERT,
          fragmentShader: HALO_FRAG,
          uniforms: { uLight: { value: L }, uRim: { value: P('rim') }, uEdge: { value: Math.sqrt(1 - 1 / (halo * halo)) }, uGain: { value: airGain }, ...water },
          side: BackSide,
          ...additive,
        })
      )
    );
    air.scale.setScalar(halo);
    g.add(body, air);
    g.userData.body = body;
    g.userData.air = air;
    g.userData.light = L; // shared by the body and its air: move it and both follow
    scene.add(g);
    return g;
  }

  // The giant hangs in the sea, so its light is the sea's: from the sun overhead.
  const giant = world({ paint: 'giant', bands: 9, seed: 3.7, light: [0.5, 0.74, 0.42], lit: 0.95, water: wet });
  const ringGeo = keep(new RingGeometry(1.42, 2.36, phone ? 96 : 160, 1));
  const ring = new Mesh(
    ringGeo,
    keep(
      new ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: { uRim: { value: C['giant-rim'] }, uA: { value: C['giant-ring'] }, uLight: { value: giant.userData.light }, uIn: { value: 1.42 }, uOut: { value: 2.36 }, ...wet },
        side: DoubleSide,
        ...additive,
      })
    )
  );
  ring.rotation.x = -1.26;
  giant.add(ring);
  giant.rotation.z = -0.36;
  // What the giant carries: a moon for each flagship, a ring light for every other build.
  const lead = counts.flagships ?? [];
  const carried = moonsPiece.create({
    lead,
    rest: counts.rest ?? [],
    colors: { dim: C['giant-night'], day: C['giant-band'], rim: C['giant-rim'], glint: C['giant-rim'] },
    light: giant.userData.light,
    wet,
    time,
  });
  carried.object.rotation.x = -1.26;
  giant.add(carried.object);

  const moon = world({ paint: 'moon', bands: 0, seed: 11.3, light: [-0.78, 0.5, 0.22], lit: 1.15, halo: 1.07, rimGain: 1.2 });
  const horizon = world({ paint: 'earth', bands: 5, seed: 23.1, light: [0.1, 0.36, -0.93], lit: 0.75, halo: 1.014, rimPow: 9, rimGain: 0.8, air: 0.7 });

  /* ---- Galaxy ------------------------------------------------------------ */
  const nGal = phone ? 1300 : 4200;
  const gp = new Float32Array(nGal * 3);
  const gs = new Float32Array(nGal * 3);
  for (let i = 0; i < nGal; i++) {
    const core = rnd() < 0.24;
    const r = core ? Math.pow(rnd(), 2) * 0.2 : 0.08 + Math.pow(rnd(), 0.8) * 0.92;
    const arm = Math.floor(rnd() * 2) * Math.PI;
    const spread = (rnd() - 0.5) * (core ? TAU : 0.9 * (1.15 - r));
    gp[i * 3] = r;
    gp[i * 3 + 1] = (rnd() - 0.5) * 0.09 * (1.2 - r);
    gp[i * 3 + 2] = arm + r * 4.4 + spread;
    gs[i * 3] = 2 + rnd() * rnd() * 5.5;
    gs[i * 3 + 1] = (core ? 0.6 : 1) * (0.45 + rnd() * 0.55);
    gs[i * 3 + 2] = rnd();
  }
  const galGeo = keep(new BufferGeometry());
  galGeo.setAttribute('position', new BufferAttribute(gp, 3));
  galGeo.setAttribute('aSeed', new BufferAttribute(gs, 3));
  const galScale = { value: 1 };
  const galaxy = new Group();
  const stars = new Points(
    galGeo,
    keep(
      new ShaderMaterial({
        vertexShader: GALAXY_VERT,
        fragmentShader: GALAXY_FRAG,
        uniforms: { uTime: time, uDpr: dpr, uScale: galScale, uSpin: { value: 0 }, uBoost: { value: 0.8 }, uCore: { value: C['gal-core'] }, uA: { value: C['gal-a'] }, uB: { value: C['gal-b'] } },
        ...additive,
      })
    )
  );
  stars.frustumCulled = false;
  const plane = keep(new PlaneGeometry(1, 1));
  const glowMat = (color, alpha) =>
    keep(new ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: { value: color }, uAlpha: { value: alpha } }, ...additive }));
  const tilt = new Group();
  tilt.rotation.set(1.02, 0, 0.38);
  tilt.add(stars);
  const core = new Mesh(plane, glowMat(C['gal-core'], 0.55));
  core.scale.setScalar(0.62);
  const haze = new Mesh(plane, glowMat(C['gal-b'], 0.22));
  haze.rotation.x = -Math.PI / 2;
  haze.scale.setScalar(2.3);
  tilt.add(haze);
  galaxy.add(tilt, core);
  scene.add(galaxy);

  // The moon's light on the air around it, and first light on the limb at dawn.
  const moonGlow = new Mesh(plane, glowMat(C['moon-rim'], 0));
  const sunrise = new Mesh(plane, glowMat(C.sun, 0));
  const flare = new Mesh(plane, glowMat(C['earth-rim'], 0));
  scene.add(moonGlow, sunrise, flare);

  /* ---- The wyrm: a year of weeks as one creature of light (src/world/wyrm.js) ---
     It lives in the sea's scene while it is under water (so the giant can hide it)
     and in a scene of its own, drawn over the land, once it is in the air. */
  const overScene = new Scene();
  const tok = readTokens(css, wyrm.tokens);
  const dragon = wyrm.create({
    weeks: weeksFrom(days),
    colors: { water: [tok['wyrm-sea-lo'], tok['wyrm-sea'], tok['wyrm-sea-hi']], air: [tok['wyrm-air-lo'], tok['wyrm-air'], tok['wyrm-air-hi']] },
    tier: phone ? 'phone' : 'desktop',
    wet,
  });
  const stations = createWyrmStations({ live: dragon, phone });
  scene.add(dragon.object);
  dragon.object.renderOrder = 5;

  /* ---- A world for each flagship build, in its own window (src/world/flagWorlds.js) */
  const ftok = readTokens(css, flagWorlds.tokens);
  const flags = flagWorlds.create({ scenes, colors: [ftok['flag-lo'], ftok.flag, ftok['flag-hi']], tier: phone ? 'phone' : 'desktop', time });
  flags.object.renderOrder = 6;
  scene.add(flags.object);

  /* ---- The wins: one gold star each, over the land (src/world/constellation.js) */
  const wtok = readTokens(css, constellation.tokens, [255, 211, 107]);
  const winStars = constellation.create({ ids: counts.winIds ?? Array.from({ length: counts.wins ?? 0 }, (_, i) => i), color: wtok['win-star'] });
  winStars.object.renderOrder = 7;
  overScene.add(winStars.object);
  dragon.object.userData.solo = 'wyrm';

  /* ---- The school: fish that circle in the warm water under the shore -------- */
  const nFish = phone ? 14 : 26;
  const fishGeo = keep(fishGeometry());
  const fishSeed = new Float32Array(nFish * 3);
  for (let i = 0; i < nFish * 3; i++) fishSeed[i] = rnd();
  fishGeo.setAttribute('aSeed', new InstancedBufferAttribute(fishSeed, 3));
  const schoolMat = keep(
    new ShaderMaterial({
      vertexShader: SCHOOL_VERT,
      fragmentShader: SCHOOL_FRAG,
      uniforms: { uTime: time, uScatter: { value: 0 }, uSize: { value: 5 }, uHome: { value: new Vector3() }, uLoop: { value: new Vector2(1, 1) }, uBackC: { value: C['sea-mid'].clone().multiplyScalar(0.9) }, uBelly: { value: C['manta-rim'].clone().multiplyScalar(0.82) }, uShine: V3('sea-ray'), uShow: { value: 1 }, ...wet },
      side: DoubleSide,
      transparent: true,
      depthWrite: false,
    })
  );
  const school = new InstancedMesh(fishGeo, schoolMat, nFish);
  school.frustumCulled = false;
  scene.add(school);

  /* ---- Medusae ----------------------------------------------------------- */
  const jellyGeo = keep(jellyGeometry(rnd));
  const nJelly = phone ? 2 : 3;
  const hues = [C['jelly-a'], C['jelly-b'], C['jelly-c']];
  const jellies = [];
  for (let i = 0; i < nJelly; i++) {
    const mat = keep(
      new ShaderMaterial({
        vertexShader: JELLY_VERT,
        fragmentShader: JELLY_FRAG,
        uniforms: { uTime: time, uPhase: { value: rnd() * TAU }, uColor: { value: hues[i % hues.length] }, uGlow: { value: 0.7 + rnd() * 0.2 }, ...zone },
        side: DoubleSide,
        ...additive,
      })
    );
    const mesh = new Mesh(jellyGeo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);
    // Mostly in the outer thirds of the screen, where the page has the least text.
    jellies.push({
      mesh,
      z: -120 - i * 320,
      side: i % 2 ? -1 : 1,
      off: 0.25 + rnd() * 0.5,
      y: (i + rnd() * 0.5) / nJelly,
      size: phone ? 40 + rnd() * 16 : 62 + rnd() * 30,
      rise: 5 + rnd() * 4,
      sway: rnd() * TAU,
      lean: (rnd() - 0.5) * 0.5,
    });
  }

  /* ---- Comets ------------------------------------------------------------ */
  const comets = [0].map(() => {
    const mat = keep(new ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: COMET_FRAG, uniforms: { uColor: { value: C.star }, uAlpha: { value: 0 } }, ...additive }));
    const mesh = new Mesh(plane, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, mat, t0: 14, dur: 2.6, from: [0, 0], to: [0, 0] };
  });
  const crnd = seeded(97);
  function aim(c) {
    const dir = crnd() < 0.5 ? 1 : -1;
    const y0 = -0.5 + crnd() * 0.5;
    c.from = [-dir * 0.62, y0];
    c.to = [dir * (0.1 + crnd() * 0.5), y0 + 0.3 + crnd() * 0.3];
    c.dur = 2.2 + crnd() * 1.4;
  }
  comets.forEach(aim);

  /* ---- Layout: sizes and the set pieces' homes, read from the page --------- */
  const home = { surf: 0, giant: 0, giantH: 400, shore: 0, shoreH: 0, crew: 0, crewEnd: 0, galaxy: 0, value: 0, valueEnd: 0, moonDoc: 0, contact: 0, foot: 0 };
  let journey = [];
  let vistas = [];
  /* Choreography: the reading sections are quiet. While the middle of the screen
     is in (or near) one of them, the drifting things and the meteor are gone and
     only the snow (in the water) or the stars (over the land) are left. */
  const QUIET = ['#work', '#principles', '#value', '#toolkit'];
  let quiet = [];
  function show(scroll) {
    const c = scroll + h / 2;
    let d = Infinity;
    for (const [a, b] of quiet) d = Math.min(d, c < a ? a - c : c > b ? c - b : 0);
    const t = Math.max(0, Math.min(1, (d - h * 0.3) / (h * 0.5)));
    return t * t * (3 - 2 * t);
  }
  const rect = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.height ? { top: r.top + window.scrollY, h: r.height, mid: r.top + window.scrollY + r.height / 2 } : null;
  };
  // Put an object so it shows at (sx, sy) px from the screen centre, r px in radius,
  // when the document line `line` is in the middle of the screen.
  function place(obj, z, line, sx, sy, r) {
    const k = view(z);
    obj.position.set(sx * k, -line - sy * k, z);
    obj.scale.setScalar(r * k);
  }

  /* Quality: 0 is everything; 1 and 2 give back pixels and fine detail when the
     frames run long (World.jsx decides, with hysteresis). */
  let quality = 0;
  const sizes = { gr: 100, mr: 60, moonX: 0 };

  function layout() {
    w = window.innerWidth;
    h = window.innerHeight;
    const cap = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75);
    const ratio = Math.max(0.75, cap * [1, 0.82, 0.66][quality]);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    dpr.value = ratio;
    stage.uRes.value.set(Math.floor(w * ratio), Math.floor(h * ratio));
    stage.uView.value.set(w, h);
    // The soft backdrop is drawn small: half the window on a phone, three quarters on a desktop.
    const s = (phone ? 0.5 : 0.75) * (quality ? 0.8 : 1);
    const bw = Math.max(2, Math.round(w * ratio * s));
    const bh = Math.max(2, Math.round(h * ratio * s));
    target.setSize(bw, bh);
    backMat.uniforms.uBackRes.value.set(bw, bh);
    compMat.uniforms.uTexel.value = h / bh;
    compMat.uniforms.uStarPx.value = h / 2 / tanF;
    camZ = h / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.aspect = w / h;
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
    land.resize(w / h);
    snowMat.uniforms.uCamZ.value = camZ;
    snowMat.uniforms.uH.value = h;
    snowMat.uniforms.uW.value = w;

    const pad = Math.max(16, Math.min(w * 0.05, 72));
    colHalf = Math.min(600, w / 2) - pad;
    // Builds is set wider than the reading sections: inside it the column is its own.
    const deep = document.querySelector('#builds');
    const deepWrap = deep?.querySelector('.wrap')?.getBoundingClientRect();
    const deepBox = deep?.getBoundingClientRect();
    home.deep = deepBox ? [deepBox.top + window.scrollY, deepBox.bottom + window.scrollY] : [1e9, 1e9];
    wideHalf = Math.max(colHalf, deepWrap ? deepWrap.width / 2 - 8 : colHalf);
    zone.uMid.value = (w / 2) * ratio;
    zone.uCol.value = phone ? 1e5 : colHalf * ratio;
    stage.uColHalf.value = phone ? 1e5 : colHalf;
    vistas = [...document.querySelectorAll('.vista')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.top + window.scrollY, r.top + window.scrollY + r.height];
    });
    const H = document.documentElement.scrollHeight;
    quiet = QUIET.map((sel) => rect(sel))
      .filter(Boolean)
      .map((r) => [r.top, r.top + r.h]);

    const surf = anchorRect('surface');
    const work = rect('#work');
    home.surf = surf ? surf.top + surf.h * 0.36 : (work ? work.top : H * 0.1) - 60;
    home.giant = anchorRect('giant')?.mid ?? H * 0.2;
    home.giantH = anchorRect('giant')?.h ?? h * 0.44;
    const shore = anchorRect('shore');
    const crew = rect('.crew');
    home.shore = shore ? shore.top : crew ? crew.top - h : H * 0.55;
    home.shoreH = shore ? shore.h : h;
    home.crew = crew ? crew.top : home.shore + home.shoreH;
    home.crewEnd = crew ? crew.top + crew.h : home.crew + h;
    home.galaxy = anchorRect('galaxy')?.mid ?? H * 0.7;
    const value = rect('#value');
    const head = rect('#value .sec-head');
    home.value = value ? value.top : H * 0.84;
    home.valueEnd = value ? value.top + value.h : home.value + h;
    home.foot = anchorRect('horizon')?.mid ?? H - 120;
    home.contact = rect('#contact')?.top ?? home.foot - h * 0.8;
    stage.uSurfDoc.value = home.surf;
    stage.uShoreDoc.value = home.shore;
    // The journey: document lines and the J each one stands for, in order.
    journey = [
      [home.surf, 0],
      [home.giant, 1],
      [home.shore, 2],
      [Math.max(home.shore + home.shoreH, home.crew), 3],
      [home.crewEnd, 3.5],
      [home.galaxy, 4],
      [home.contact, 4.6],
      [home.foot, 5],
    ];
    for (let i = 1; i < journey.length; i++) journey[i][0] = Math.max(journey[i][0], journey[i - 1][0] + 1);

    const gr = Math.max(84, Math.min(w * 0.17, 225));
    const mr = phone ? 22 : Math.max(40, Math.min(w * 0.055, 84));
    const gal = Math.max(140, Math.min(w * 0.22, 330));
    sizes.gr = gr;
    sizes.mr = mr;
    galScale.value = gal / 480;
    // The school turns in the warm water just under the shore, and scatters on a scroll.
    const fz = -60;
    const fk = view(fz);
    schoolMat.uniforms.uSize.value = (phone ? 11 : 15) * fk;
    schoolMat.uniforms.uHome.value.set(0, -(home.shore - h * 0.42), fz);
    schoolMat.uniforms.uLoop.value.set(w * (phone ? 0.3 : 0.34) * fk, (phone ? 46 : h * 0.13) * fk);
    place(giant, -220, home.giant + (phone ? 20 : 70), w * (phone ? 0.2 : 0.27), 0, gr);
    const gk = view(-220);
    giant.userData.body.material.uniforms.uNear.value = camZ + 220 - gr * gk;
    giant.userData.body.material.uniforms.uSpan.value = gr * gk;
    // The spiral stands high and to the left, clear of the Milky Way and the buttes.
    place(galaxy, -1400, home.galaxy - (phone ? 70 : 96), w * (phone ? -0.16 : -0.24), 0, gal);
    // The moon is the reading lamp of Value. With a margin it is pinned there while
    // the section is read; on a phone it stands in the gap above the heading, at
    // the right, where there is no text.
    const margin = w / 2 - colHalf;
    const fits = margin >= mr * 2 + 28;
    sizes.moonX = phone ? w / 2 - 20 - mr : fits ? colHalf + 14 + mr : w / 2 - mr * 0.3;
    home.moonDoc = phone ? (home.value + (head ? head.top : home.value + 56)) / 2 + 4 : home.value + h * 0.3;
    // The lit limb crosses the horizon spacer; the body runs down under the footer.
    const hr = w * 1.7 + 500;
    place(horizon, -300, home.foot, 0, hr + 4, hr);
    sizes.hr = hr;
    flags.layout();
    winStars.layout({ w, h });
    flagRects = lead.map((id) => anchorRect(`flag-${id}`));
    // The wyrm's stations read the same page.
    const sunX = w * (phone ? 0.2 : 0.17);
    stations.layout({
      w,
      h,
      camZ,
      surf: home.surf,
      giant: { x: w * (phone ? 0.2 : 0.27), doc: home.giant + (phone ? 20 : 70), r: gr, k: gk },
      sun: { x: sunX, doc: home.foot + 4 + (sunX * sunX) / (2 * hr), r: hr },
    });
  }

  /* The drifting things keep to the margins: `edge(off)` is a screen x from the
     column edge (off 0) to the window edge (off 1), so on a narrow margin they
     peek in from the side; a negative off is a place inside the column, where the
     shader's calm() turns the light down. */
  let colHalf = 600;
  let wideHalf = 600;
  let colNow = 600; // the half-width of the column the reader is in
  const edge = (off) => (off < 0 ? colNow * (1 + off) : colNow + 16 + off * Math.max(w / 2 - colNow - 16, 0));

  let camY = 0;
  let flagRects = [];
  const run = { pulse: 0, hold: 0 };
  const hop = { dir: 0, until: 0 };
  let lampOn = 0;
  const gq = new Quaternion();
  const yAxis = new Vector3(0, 1, 0);
  const clock = { t: 0, s: 0, scatter: 0 };
  const dawn = { want: 0, now: 0 };
  const state = { camX: 0, camH: 60, pitch: 0, sunTan: 0.1, day: 1, night: 0, lamp: 0, moon: 0, moonDir: new Vector3(0.55, 0.62, -0.3).normalize(), fine: 1, pulse: 0, hold: 0 };
  const hue = { want: C.ember.clone(), amt: 0 };
  const frame = { t: 0, scroll: 0, line: 0, cam: { x: 0, y: 0, z: 1 }, top: 0, exit: 0, rise: 0, dpr: 1, resY: 1 };
  function wrap(y, span) {
    return camY + ((((y - camY + span / 2) % span) + span) % span) - span / 2;
  }

  /** Draw one frame. `t` in seconds, `scroll` in px, pointer in -1..1. */
  function render(t, scroll, px = 0, py = 0) {
    time.value = t;
    camY = -(scroll + h / 2);
    camera.position.x = px * 16;
    camera.position.y = camY - py * 10;
    snowMat.uniforms.uCamY.value = camY;

    const dt = Math.min(0.1, Math.max(0, t - clock.t));
    const speed = Math.abs(scroll - clock.s);
    clock.t = t;
    clock.s = scroll;
    const line = scroll + h / 2;

    // The text column here: Builds is wider, so the drifting things keep further out.
    colNow = line > home.deep[0] && line < home.deep[1] ? wideHalf : colHalf;
    if (!phone) {
      zone.uCol.value = colNow * dpr.value;
      stage.uColHalf.value = colNow;
    }

    // Where the reader is in the journey, and what the one light does there.
    const J = along(journey, line, true);
    const rise = sm((scroll - (home.shore - h * 0.3)) / (h * 0.55)); // 0 under water, 1 ashore
    const exit = rise <= 0 ? -h * 0.08 : rise >= 1 ? h * 4 : h * (-0.08 + 1.22 * rise);
    const top = home.surf - scroll;
    const landAmt = along(TRACK.land, J);
    const orbit = along(TRACK.orbit, J);
    dawn.now += (dawn.want - dawn.now) * (1 - Math.exp(-dt / 0.38));
    const el = along(TRACK.sunEl, J) * DEG;
    const day = sm((el / DEG + 8) / 11);
    const night = sm((-el / DEG - 4) / 9);
    const e = Math.max(Math.sin(el), 0);
    const am = 1 / (e + 0.15 * Math.pow(3.885 + Math.asin(e) / DEG, -1.253));
    const dusk = el >= 0 ? 1 : Math.exp(el * 10);
    stage.uSunI.value.set(Math.exp(-0.0516 * am * 0.3) * dusk, Math.exp(-0.1132 * am * 0.3) * dusk, Math.exp(-0.27 * am * 0.3) * dusk);
    stage.uSunDir.value.set(Math.sin(sunAz) * Math.cos(el), Math.sin(el), -Math.cos(sunAz) * Math.cos(el));
    stage.uTop.value = top;
    stage.uExit.value = exit;
    stage.uScroll.value = scroll;
    stage.uDay.value = day;
    stage.uNight.value = night;
    stage.uOrbit.value = orbit;
    stage.uBreak.value = dawn.now;
    // The vista in the window, if any: the one place the world is not hushed.
    let open = 0;
    stage.uVista.value.set(-1e5, -1e5);
    for (const [a, b] of vistas) {
      const on = Math.min(b, scroll + h) - Math.max(a, scroll);
      if (on > open) {
        open = on;
        stage.uVista.value.set(a - scroll, b - scroll);
      }
    }
    // The land's camera: the horizon stands on the waterline while the camera comes
    // up through it, then the camera tilts toward the sky as the land sinks to a
    // low band for reading, and travels sideways as the page goes by.
    const base = rise > 0 ? Math.max(0, Math.min(h, h - exit)) : 0;
    // While it rises, sky and far land share what is above the waterline; once ashore
    // the horizon settles where the land track puts it.
    const yHz = rise > 0 && rise < 1 ? Math.min(exit * 0.6, h - h * 0.3 * landAmt) : h - base - h * 0.3 * landAmt;
    state.pitch = -Math.atan((1 - (2 * yHz) / h) * tanF);
    stage.uPitch.value = state.pitch;
    state.camX = along(TRACK.camX, J) + px * 5;
    state.camH = 24 + 66 * rise - py * 2;
    state.sunTan = Math.tan(el);
    state.day = day;
    state.night = night;
    state.lamp = (0.34 + 0.66 * sm((4 - el / DEG) / 7)) * (1 - orbit);
    state.fine = quality > 1 || rise < 1 ? 0 : 1;
    state.shore = rise > 0 && rise < 1 ? Math.min(1, landAmt * 1.4) : 0;
    const landOn = landAmt > 0.004 && exit > -h * 0.05;
    snowMat.uniforms.uTop.value = top;
    snowMat.uniforms.uExit.value = exit;
    const sea = sm((line - home.surf) / (h * 0.5)) * (1 - rise);
    wet.uWet.value = sea;
    // The colour of the water at the reader's depth is what distance fades things to.
    const dep = Math.max(0, line - home.surf) / h;
    wet.uWaterCol.value.set(
      C['sea-floor'].x + (C['sea-shallow'].x * 1.18 - C['sea-floor'].x) * Math.exp(-sigma.x * dep),
      C['sea-floor'].y + (C['sea-shallow'].y * 1.18 - C['sea-floor'].y) * Math.exp(-sigma.y * dep),
      C['sea-floor'].z + (C['sea-shallow'].z * 1.18 - C['sea-floor'].z) * Math.exp(-sigma.z * dep)
    );
    // The medusae belong to the deep: they are gone well before the warm water.
    zone.uShow.value = show(scroll) * sea * (1 - sm((line - (home.shore - h * 1.5)) / (h * 0.6)));
    // Where the column leaves no margin for them (Builds, on most windows), they stay away.
    if (w / 2 - colNow < 110) zone.uShow.value = 0;
    snow.visible = sea > 0.002 || (top < h && exit > 0);

    // The galaxy wakes as the reader comes to it: it spins up, brightens, and
    // leans toward the pointer. It belongs to the night, so it stays down until then.
    const sky = night * (1 - orbit);
    const near = Math.max(0, 1 - Math.abs(line - home.galaxy) / (h * 1.1));
    const wake = near * near * (3 - 2 * near);
    galaxy.visible = sky > 0.01 && Math.abs(line - home.galaxy) < h * 2.4;
    if (galaxy.visible) {
      stars.material.uniforms.uSpin.value += dt * (0.34 * wake + Math.min(0.5, speed * 0.004) * near);
      stars.material.uniforms.uBoost.value = (0.6 + 0.5 * wake) * sky;
      core.material.uniforms.uAlpha.value = (0.16 + 0.24 * wake) * sky;
      haze.material.uniforms.uAlpha.value = 0.09 * sky;
      tilt.rotation.set(1.02 + py * 0.16 * wake, 0, 0.38 + px * 0.2 * wake);
    }

    // The wyrm: at most one station at a time (src/world/wyrmStations.js). In the
    // sea it is part of the sea's scene; in the air it is drawn over the land.
    frame.t = t;
    frame.scroll = scroll;
    frame.line = line;
    frame.cam.x = camera.position.x;
    frame.cam.y = camera.position.y;
    frame.cam.z = camZ;
    frame.top = top;
    frame.exit = exit;
    frame.rise = rise;
    frame.dpr = dpr.value;
    frame.resY = stage.uRes.value.y;
    const station = stations.update(frame);
    const aloft = station === 'breach' || station === 'roost' || station === 'flight';
    if (aloft !== (dragon.object.parent === overScene)) (aloft ? overScene : scene).add(dragon.object);

    // The flagship worlds, the giant's moons and the wins' stars.
    frame.w = w;
    frame.h = h;
    frame.night = night * (1 - orbit);
    flags.update(frame);
    winStars.update(frame);
    let front = '';
    for (let i = 0; i < lead.length; i++) {
      const r = flagRects[i];
      if (r && r.top - scroll < h * 0.7 && r.bottom - scroll > h * 0.2) front = lead[i];
    }
    carried.update({ px: sizes.gr * dpr.value, front });
    // The lamp at the pointer, and the streak of a hop.
    snowMat.uniforms.uLamp.value.set(((px + 1) / 2) * w, ((py + 1) / 2) * h, lampOn * sea);
    const su = snowMat.uniforms.uStreak;
    su.value += ((t < hop.until ? hop.dir : 0) - su.value) * 0.22;
    if (Math.abs(su.value) > 0.01) snowMat.uniforms.uCamY.value = camY + hop.dir * (hop.until - t) * h * 1.6;
    run.pulse *= Math.exp(-dt / 0.35);
    state.pulse = run.pulse;
    state.hold += (run.hold - state.hold) * 0.12;
    giant.visible = sea > 0.002 && Math.abs(line - home.giant) < h * 1.6 + sizes.gr * 3;

    // The school startles on a scroll and regroups at rest.
    clock.scatter += (Math.min(1, speed / 36) - clock.scatter) * (speed > 2 ? 0.25 : 0.035);
    schoolMat.uniforms.uScatter.value = clock.scatter;
    school.visible = rise < 0.7 && Math.abs(line - (home.shore - h * 0.42)) < h * 1.4;
    schoolMat.uniforms.uShow.value = 1 - sm((rise - 0.3) / 0.4);

    // The moon is the lamp Value is read by: it comes in with the section, stays in
    // the margin while it is read, and fills from a crescent to full by the last row.
    const span = Math.max(h * 0.6, home.valueEnd - home.value - h * 0.6);
    const phase = phone ? 0.5 + 0.5 * sm((line - home.value + h * 0.4) / (h * 0.6)) : sm((line - home.value) / span);
    const sun = 2.5 - 2.2 * phase;
    moon.userData.light.set(-Math.sin(sun), 0.24, Math.cos(sun)).normalize();
    const mk2 = view(-2600);
    const pin = phone ? home.moonDoc : Math.max(home.value + h * 0.22, Math.min(home.valueEnd - h * 0.42, line - h * 0.2));
    moon.visible = sky > 0.01 && Math.abs(pin - line) < h * 0.8;
    moonGlow.visible = moon.visible;
    state.moon = moon.visible ? sm(1 - Math.abs(pin - line) / (h * 0.7)) * (0.35 + 0.65 * phase) : 0;
    if (moon.visible) {
      moon.position.set(camera.position.x + sizes.moonX * mk2, camY - (pin - line) * mk2, -2600);
      moon.scale.setScalar(sizes.mr * mk2);
      moonGlow.position.copy(moon.position);
      moonGlow.position.z -= 4;
      moonGlow.scale.setScalar(sizes.mr * mk2 * 7);
      moonGlow.material.uniforms.uAlpha.value = 0.16 * state.moon;
      moon.userData.body.rotation.y = t * 0.02;
    }

    giant.userData.body.rotation.y = t * 0.012;
    if (giant.visible) {
      // The light and the ring's plane in the planet's own frame, for the ring's shadow.
      const gu = giant.userData.body.material.uniforms;
      giant.userData.body.getWorldQuaternion(gq).invert();
      gu.uLightO.value.copy(giant.userData.light).applyQuaternion(gq);
      gu.uRingN.value.set(0, 0.952, 0.306).applyAxisAngle(yAxis, -giant.userData.body.rotation.y);
    }

    // The limb of the world. Until the dawn is asked for it is first light, a thin
    // line of air; `dawn.now` brings the sun over it.
    horizon.visible = orbit > 0.002 || line > home.contact - h;
    sunrise.visible = flare.visible = horizon.visible && dawn.now > 0.004;
    if (horizon.visible) {
      const b = dawn.now;
      horizon.userData.body.rotation.x = t * 0.004;
      horizon.userData.light.set(0.1 + 0.16 * b, 0.36 + 0.3 * b, -0.93 + 0.62 * b).normalize();
      horizon.userData.air.material.uniforms.uGain.value = 0.7 + 1.5 * b;
      horizon.userData.body.material.uniforms.uRimGain.value = 0.8 + 1.4 * b;
      if (sunrise.visible) {
        const k = view(-300);
        const sx = w * (phone ? 0.2 : 0.17);
        const sy = 4 + (sx * sx) / (2 * sizes.hr);
        sunrise.position.set(sx * k, -home.foot - sy * k, -290);
        sunrise.scale.setScalar((phone ? 260 : 420) * k * (0.3 + 0.7 * b));
        sunrise.material.uniforms.uAlpha.value = 0.95 * b;
        flare.position.set(sx * k, -home.foot - sy * k, -289);
        flare.scale.set(w * 1.3 * k * (0.2 + 0.8 * b), 22 * k, 1);
        flare.material.uniforms.uAlpha.value = 0.55 * b;
      }
    }

    for (const j of jellies) {
      j.mesh.visible = zone.uShow.value > 0.002;
      if (!j.mesh.visible) continue;
      const k = view(j.z);
      const lap = h * k * 3.2 + j.size * k * 8; // long laps: one or two in sight at a time
      const beat = t * 1.15 + j.mesh.material.uniforms.uPhase.value;
      // It rises in strokes: fastest just after the bell closes.
      const y = wrap(j.y * lap + t * j.rise + Math.sin(beat - 1.2) * 5, lap);
      const sx = j.side * edge(j.off) + Math.sin(t * 0.13 + j.sway) * 22;
      j.mesh.position.set(sx * k, y, j.z);
      j.mesh.scale.setScalar(j.size * k);
      j.mesh.rotation.set(0.18, t * 0.05 + j.sway, j.lean + Math.sin(t * 0.21 + j.sway) * 0.08);
    }

    for (const c of comets) {
      let u = (t - c.t0) / c.dur;
      if (u > 1) {
        c.t0 = t + 28 + crnd() * 24;
        aim(c);
        u = -1;
      }
      c.mesh.visible = u >= 0 && sky > 0.05;
      if (!c.mesh.visible) continue;
      const z = -700;
      const k = view(z);
      const x = (c.from[0] + (c.to[0] - c.from[0]) * u) * w * k;
      const y = camY - (c.from[1] + (c.to[1] - c.from[1]) * u) * h * k;
      c.mesh.position.set(x, y, z);
      c.mesh.rotation.z = Math.atan2(-(c.to[1] - c.from[1]) * h, (c.to[0] - c.from[0]) * w);
      c.mesh.scale.set(380 * k, 22 * k, 1);
      c.mat.uniforms.uAlpha.value = Math.sin(Math.PI * u) * 0.9 * show(scroll) * sky;
    }

    // The crew's lamp takes the chosen character's colour.
    if (hue.amt > 0) land.lampCol.lerp(hue.want, 0.08);

    // Draw. Nothing of the world is in the window above the first surface.
    renderer.setRenderTarget(null);
    renderer.clear();
    if (solo) {
      // Dev: one piece alone on a clear ground, for counting its light against the page.
      for (const c of scene.children) c.visible = c.visible && c.userData.solo === solo;
      for (const c of overScene.children) c.visible = c.visible && c.userData.solo === solo;
      renderer.render(scene, camera);
      renderer.render(overScene, camera);
      return;
    }
    if (top >= h + 20) return;
    renderer.setRenderTarget(target);
    renderer.render(backScene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    if (landOn) {
      land.update(state);
      renderer.clearDepth();
      renderer.render(land.scene, land.camera);
    }
    if ((dragon.object.parent === overScene && dragon.object.visible) || winStars.object.visible) {
      renderer.clearDepth();
      renderer.render(overScene, camera);
    }
  }

  /* Compile every program while the page is idle, so the breach never waits on one. */
  async function prewarm() {
    // compileAsync lets the driver build the programs off the main thread where it
    // can (KHR_parallel_shader_compile), one scene at a time.
    try {
      await renderer.compileAsync(backScene, camera);
      await renderer.compileAsync(scene, camera);
      await renderer.compileAsync(land.scene, land.camera);
      await renderer.compileAsync(dragon.object, camera);
      await renderer.compileAsync(overScene, camera);
    } catch {
      // A lost context: World.jsx handles it.
    }
  }

  function setQuality(q) {
    const next = Math.max(0, Math.min(2, q));
    if (next === quality) return;
    quality = next;
    layout();
  }

  /* The character on the crew's stage: `rgb` is 0 to 255 per channel, or null. */
  function setHue(rgb) {
    if (!rgb) {
      hue.want.copy(C.ember);
    } else {
      // Keep it a lamp: the hue of the character, the warmth and weight of the ember.
      hue.want.set(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).lerp(C.ember, 0.35);
      const m = Math.max(hue.want.x, hue.want.y, hue.want.z, 0.001);
      hue.want.multiplyScalar(1 / m);
    }
    hue.amt = 1;
  }

  function dispose() {
    for (const d of disposables) d.dispose();
    for (const p of [dragon, flags, winStars, carried]) p.dispose();
    land.dispose();
    renderer.dispose();
  }

  layout();
  return {
    layout,
    render,
    dispose,
    prewarm,
    setQuality,
    setHue,
    breakDawn: () => {
      dawn.want = 1;
      stations.fly(time.value);
    },
    setWeek(index) {
      dragon.setLit(index);
    },
    station: () => stations.shown,
    /** world:focus { kind, id }: a win's star flares, a build's moon lights. */
    setFocus(kind, id, extra) {
      if (kind === 'win') winStars.setFocus(id);
      else if (kind === 'build') carried.setFocus(id);
      else if (kind === 'tool') carried.setFocus(extra ?? []);
    },
    /** world:run { state }: the camp's lamp beats on a step and stands steady at a gate. */
    setRun(s) {
      if (s === 'step') run.pulse = 1;
      run.hold = s === 'hold' ? 1 : 0;
    },
    /** world:agent: which member of the crew is on the stage (their fire stands up). */
    setAgent(id) {
      land.fires?.choose(id ?? -1, id == null ? null : hue.want);
    },
    /** world:travel { dir }: the snow streaks along the hop for half a second. */
    setTravel(dir) {
      hop.dir = dir < 0 ? -1 : 1;
      hop.until = time.value + 0.5;
    },
    /** A fine pointer lights what drifts near it. */
    setLamp(on) {
      lampOn = on ? 1 : 0;
    },
    /** Where each piece is in the window, for the labels of Receipts: [{ id, x, y, side, visible }]. */
    bindings() {
      const line = -camY;
      const out = [];
      const put = (id, x, y, visible) => out.push({ id, x: Math.round(x), y: Math.round(y), side: x < w / 2 ? 'left' : 'right', visible: !!visible && y > 0 && y < h && x > -40 && x < w + 40 });
      const d = dragon.binding.project();
      put('wyrm', d.x + w / 2, d.y + h / 2, d.visible);
      put('giant', w / 2 + w * (phone ? 0.2 : 0.27), (home.giant + (phone ? 20 : 70) - line) / view(-220) + h / 2, giant.visible);
      for (const b of flags.binding) {
        const p = b.project();
        put(b.id, p.x, p.y, p.visible);
      }
      put('school', w / 2, home.shore - h * 0.42 - line + h / 2, school.visible);
      put('fires', w * 0.8, h * 0.72, land.fires?.object.visible && state.lamp > 0.05 && -camY > home.shore);
      put('stars', winStars.place.x, winStars.place.y - line + h / 2, winStars.object.visible);
      put('moon', w / 2 + sizes.moonX, h * 0.3, moon.visible);
      return out;
    },
    pieces: () => ({ dragon, flags, winStars, carried, fires: land.fires }),
    weeks: dragon.count(),
  };
}
