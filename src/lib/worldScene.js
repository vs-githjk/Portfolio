import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  Object3D,
  OctahedronGeometry,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { seeded, triple } from './field';

/* The Deep: the three.js scene behind every section below the hero.

   The idea is a galaxy underwater. The hero's beams are the surface light;
   scrolling is a dive. Down there the sea and the sky are one place: a ringed
   gas giant hangs in the water, medusae of light pulse upward past it, shards of
   glass tumble in the current, a spiral galaxy turns like a shoal, comets cross,
   and the page ends on the lit limb of a world rising under the footer.

   One unit is one CSS pixel on the plane z = 0, and the camera sits at
   y = -(scroll + half a screen), so that plane moves exactly with the page.
   Anything deeper moves slower (parallax = camZ / (camZ - z)), anything nearer
   moves faster. The set pieces are placed from the DOM: each `.vista` spacer in
   the page names the piece that is centred on it when it is centred on screen.

   Fields without a home (snow, medusae, shards) wrap around the camera, so the
   dive never runs out however long the page gets. */

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
uniform vec3 uLight, uNight, uDay, uBand, uRim;
uniform float uBands, uSeed, uTime, uLit, uRimPow, uRimGain;
varying vec3 vN; varying vec3 vP; varying vec3 vV;
${NOISE}
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
  vec3 col = uNight + albedo * (0.035 + day * uLit);
  col += uRim * fres * uRimGain * (0.06 + 0.94 * smoothstep(-0.3, 0.5, ndl));
  gl_FragColor = vec4(col, 1.0);
}`;
/* The air around it: a slightly larger shell seen from inside, brightest at the
   limb and gone at its own edge, only on the lit side. */
const HALO_FRAG = /* glsl */ `
uniform vec3 uLight, uRim; uniform float uEdge, uGain;
varying vec3 vN; varying vec3 vV;
void main(){
  vec3 n = normalize(vN);
  float i = clamp(-dot(n, normalize(vV)) / uEdge, 0.0, 1.0);
  float lit = smoothstep(-0.5, 0.5, dot(normalize(n.xy + 0.0001), normalize(uLight.xy + 0.0001)));
  gl_FragColor = vec4(uRim, i * i * i * (0.05 + 0.95 * lit) * uGain);
}`;
const RING_VERT = /* glsl */ `
varying vec2 vXY;
void main(){ vXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = /* glsl */ `
uniform vec3 uRim, uA; uniform float uIn, uOut;
varying vec2 vXY;
${NOISE}
void main(){
  float r = length(vXY);
  float t = (r - uIn) / (uOut - uIn);
  float bands = 0.25 + 0.75 * fbm(vec3(t * 16.0, 3.3, 1.7));
  float gap = smoothstep(0.02, 0.06, abs(t - 0.58));
  float edge = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.8, t);
  float side = 0.45 + 0.55 * smoothstep(-0.9, 0.9, vXY.x / r);
  gl_FragColor = vec4(mix(uA, uRim, bands), bands * gap * edge * side * 0.62);
}`;

/* ---- Marine snow that is also the stars ------------------------------------- */
const SNOW_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uCamY, uCamZ, uH, uW, uTime, uDpr;
varying float vA; varying float vMix;
void main(){
  float k = (uCamZ - position.z) / uCamZ;
  float L = uH * k * 1.3;
  float y = position.y * L + uTime * aSeed.y;
  y = uCamY + mod(y - uCamY + L * 0.5, L) - L * 0.5;
  float x = position.x * uW * k * 1.15 + sin(uTime * 0.11 + aSeed.z * 6.283) * 16.0 * k;
  gl_Position = projectionMatrix * viewMatrix * vec4(x, y, position.z, 1.0);
  float tw = 0.62 + 0.38 * sin(uTime * (0.5 + aSeed.z) + aSeed.z * 40.0);
  gl_PointSize = max(1.2, aSeed.x * uDpr / k);
  vA = tw * clamp(1.5 - k * 0.24, 0.3, 1.0) * clamp(3.4 / aSeed.x, 0.1, 1.0);
  vMix = aSeed.z;
}`;
const SNOW_FRAG = /* glsl */ `
uniform vec3 uA, uB;
varying float vA; varying float vMix;
void main(){
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(mix(uA, uB, vMix), a * a * vA);
}`;

/* The text column is the calm zone: inside it (in device pixels from the middle
   of the screen) the drifting things give only a share of their light. */
const CALM = /* glsl */ `uniform float uMid, uCol, uCalm;
float calm(){ return mix(uCalm, 1.0, smoothstep(uCol - 24.0, uCol + 56.0, abs(gl_FragCoord.x - uMid))); }
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

/* ---- Shards of glass: flat facets, a cold edge light ------------------------ */
const SHARD_VERT = /* glsl */ `
attribute float aTint; attribute vec3 aBary;
varying vec3 vN, vV, vB; varying float vTint;
void main(){
  vB = aBary;
  mat4 m = modelViewMatrix * instanceMatrix;
  vec4 mv = m * vec4(position, 1.0);
  vN = normalize(mat3(m) * normal);
  vV = normalize(-mv.xyz);
  vTint = aTint;
  gl_Position = projectionMatrix * mv;
}`;
const SHARD_FRAG = /* glsl */ `
uniform vec3 uLight, uNight, uA, uB, uRim;
varying vec3 vN, vV, vB; varying float vTint;
${CALM}void main(){
  vec3 n = normalize(vN);
  float line = 1.0 - smoothstep(0.0, 0.07, min(vB.x, min(vB.y, vB.z)));
  float fres = pow(1.0 - abs(dot(n, vV)), 2.0);
  float spec = pow(max(dot(reflect(-uLight, n), vV), 0.0), 18.0);
  float face = 0.5 + 0.5 * dot(n, uLight);
  vec3 col = mix(uA, uB, vTint) * (0.05 + 0.34 * face * face) + uRim * (fres * fres * 0.4 + spec * 0.9 + line * 0.75);
  gl_FragColor = vec4(col, (0.2 + 0.5 * face * face + 0.5 * line) * calm());
}`;

/* ---- The galaxy: a shoal of stars on two arms -------------------------------- */
const GALAXY_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uTime, uDpr, uScale;
varying float vA; varying float vMix;
void main(){
  float r = position.x;
  float ang = position.z + uTime * 0.05 / (0.22 + r);
  vec3 p = vec3(cos(ang) * r, position.y, sin(ang) * r);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.2, aSeed.x * uDpr * uScale);
  vA = aSeed.y * (0.7 + 0.3 * sin(uTime * (0.4 + aSeed.z) + aSeed.z * 30.0));
  vMix = clamp(r * 1.25, 0.0, 1.0);
}`;
const GALAXY_FRAG = /* glsl */ `
uniform vec3 uCore, uA, uB;
varying float vA; varying float vMix;
void main(){
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
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

/** Build the scene on a canvas. Throws if WebGL is not available. */
export function createWorld(canvas, { still }) {
  const css = getComputedStyle(document.documentElement);
  const col = (name) => new Vector3(...triple(css, name).map((v) => v / 255));
  const C = {
    a: col('--beam-a'),
    b: col('--beam-b'),
    c: col('--beam-c'),
    starA: col('--star-a'),
    starB: col('--star-b'),
    night: col('--world-night'),
    day: col('--world-day'),
    band: col('--world-band'),
    rim: col('--world-rim'),
  };
  const phone = window.matchMedia('(max-width: 760px)').matches;
  const rnd = seeded(41);

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: !phone, stencil: false });
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 10, 12000);
  const time = { value: 0 };
  const zone = { uMid: { value: 0 }, uCol: { value: 1e5 }, uCalm: { value: phone ? 0.5 : 0.34 } };
  const dpr = { value: 1 };
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  let w = 1;
  let h = 1;
  let camZ = 1;
  let reduced = false; // one still pose, read again at every layout
  const view = (z) => (camZ - z) / camZ; // how much more of the world a screen shows at depth z

  /* ---- Snow -------------------------------------------------------------- */
  const nSnow = phone ? 520 : 1700;
  const sp = new Float32Array(nSnow * 3);
  const ss = new Float32Array(nSnow * 3);
  for (let i = 0; i < nSnow; i++) {
    const near = rnd() < 0.05;
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
      uniforms: { uCamY: { value: 0 }, uCamZ: { value: 1 }, uH: { value: 1 }, uW: { value: 1 }, uTime: time, uDpr: dpr, uA: { value: C.starA }, uB: { value: C.starB } },
      ...additive,
    })
  );
  const snow = new Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  scene.add(snow);

  /* ---- Worlds ------------------------------------------------------------ */
  const sphere = keep(new SphereGeometry(1, phone ? 64 : 128, phone ? 40 : 72));
  function world({ bands, seed, light, lit, halo = 1.1, rimPow = 3, rimGain = 1, air: airGain = 0.9 }) {
    const g = new Group();
    const L = new Vector3(...light).normalize();
    const body = new Mesh(
      sphere,
      keep(
        new ShaderMaterial({
          vertexShader: PLANET_VERT,
          fragmentShader: PLANET_FRAG,
          uniforms: { uLight: { value: L }, uNight: { value: C.night }, uDay: { value: C.day }, uBand: { value: C.band }, uRim: { value: C.rim }, uBands: { value: bands }, uSeed: { value: seed }, uTime: time, uLit: { value: lit }, uRimPow: { value: rimPow }, uRimGain: { value: rimGain } },
        })
      )
    );
    const air = new Mesh(
      sphere,
      keep(
        new ShaderMaterial({
          vertexShader: PLANET_VERT,
          fragmentShader: HALO_FRAG,
          uniforms: { uLight: { value: L }, uRim: { value: C.rim }, uEdge: { value: Math.sqrt(1 - 1 / (halo * halo)) }, uGain: { value: airGain } },
          side: BackSide,
          ...additive,
        })
      )
    );
    air.scale.setScalar(halo);
    g.add(body, air);
    g.userData.body = body;
    scene.add(g);
    return g;
  }

  const giant = world({ bands: 9, seed: 3.7, light: [0.84, 0.4, 0.26], lit: 0.9 });
  const ringGeo = keep(new RingGeometry(1.42, 2.36, phone ? 96 : 160, 1));
  const ring = new Mesh(
    ringGeo,
    keep(
      new ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: { uRim: { value: C.rim }, uA: { value: C.a }, uIn: { value: 1.42 }, uOut: { value: 2.36 } },
        side: DoubleSide,
        ...additive,
      })
    )
  );
  ring.rotation.x = -1.26;
  giant.add(ring);
  giant.rotation.z = -0.36;

  const moon = world({ bands: 0, seed: 11.3, light: [-0.78, 0.5, 0.22], lit: 1.15, halo: 1.07, rimGain: 1.2 });
  const horizon = world({ bands: 5, seed: 23.1, light: [0.1, 0.36, -0.93], lit: 0.75, halo: 1.014, rimPow: 9, rimGain: 0.8, air: 0.7 });

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
        uniforms: { uTime: time, uDpr: dpr, uScale: galScale, uCore: { value: C.starA }, uA: { value: C.b }, uB: { value: C.c } },
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
  const core = new Mesh(plane, glowMat(C.starB, 0.55));
  core.scale.setScalar(0.9);
  const haze = new Mesh(plane, glowMat(C.a, 0.3));
  haze.rotation.x = -Math.PI / 2;
  haze.scale.setScalar(2.3);
  tilt.add(haze);
  galaxy.add(tilt, core);
  scene.add(galaxy);

  /* ---- Medusae ----------------------------------------------------------- */
  const jellyGeo = keep(jellyGeometry(rnd));
  const nJelly = phone ? 4 : 8;
  const hues = [C.b, C.c, C.a, C.rim];
  const jellies = [];
  for (let i = 0; i < nJelly; i++) {
    const mat = keep(
      new ShaderMaterial({
        vertexShader: JELLY_VERT,
        fragmentShader: JELLY_FRAG,
        uniforms: { uTime: time, uPhase: { value: rnd() * TAU }, uColor: { value: hues[i % hues.length] }, uGlow: { value: 0.5 + rnd() * 0.35 }, ...zone },
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
      z: -160 - rnd() * 1500,
      side: i % 2 ? 1 : -1,
      off: i % 4 === 3 ? -0.5 - rnd() * 0.4 : rnd(),
      y: rnd(),
      size: 30 + rnd() * 44,
      rise: 9 + rnd() * 12,
      sway: rnd() * TAU,
      lean: (rnd() - 0.5) * 0.5,
    });
  }

  /* ---- Shards ------------------------------------------------------------ */
  const nShard = phone ? 6 : 14;
  const shardGeo = keep(new OctahedronGeometry(1, 0));
  const tints = new Float32Array(nShard);
  const shardData = [];
  for (let i = 0; i < nShard; i++) {
    tints[i] = rnd();
    shardData.push({
      z: -80 - rnd() * 1500,
      side: i % 2 ? 1 : -1,
      off: rnd(),
      y: rnd(),
      size: 7 + rnd() * 15,
      long: 1.3 + rnd() * 1.3,
      spin: new Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.5),
      rot: new Vector3(rnd() * TAU, rnd() * TAU, rnd() * TAU),
      fall: -3 - rnd() * 7,
    });
  }
  shardGeo.setAttribute('aTint', new InstancedBufferAttribute(tints, 1));
  const nb = shardGeo.attributes.position.count;
  const bary = new Float32Array(nb * 3);
  for (let i = 0; i < nb; i++) bary[i * 3 + (i % 3)] = 1;
  shardGeo.setAttribute('aBary', new BufferAttribute(bary, 3));
  const shards = new InstancedMesh(
    shardGeo,
    keep(
      new ShaderMaterial({
        vertexShader: SHARD_VERT,
        fragmentShader: SHARD_FRAG,
        uniforms: { uLight: { value: new Vector3(0.5, 0.6, 0.62).normalize() }, uNight: { value: C.night }, uA: { value: C.b }, uB: { value: C.c }, uRim: { value: C.rim }, ...zone },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      })
    ),
    nShard
  );
  shards.frustumCulled = false;
  scene.add(shards);
  const dummy = new Object3D();

  /* ---- Comets ------------------------------------------------------------ */
  const comets = [0, 1].map((i) => {
    const mat = keep(new ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: COMET_FRAG, uniforms: { uColor: { value: i ? C.c : C.rim }, uAlpha: { value: 0 } }, ...additive }));
    const mesh = new Mesh(plane, mat);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, mat, t0: 3 + i * 6.5, dur: 2.6, from: [0, 0], to: [0, 0] };
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
  const home = { giant: 0, galaxy: 0, moon: 0, foot: 0 };
  const mid = (sel, fallback) => {
    const el = document.querySelector(sel);
    if (!el) return fallback;
    const r = el.getBoundingClientRect();
    return r.height ? r.top + window.scrollY + r.height / 2 : fallback;
  };
  // Put an object so it shows at (sx, sy) px from the screen centre, r px in radius,
  // when the document line `line` is in the middle of the screen.
  function place(obj, z, line, sx, sy, r) {
    const k = view(z);
    obj.position.set(sx * k, -line - sy * k, z);
    obj.scale.setScalar(r * k);
  }

  function layout() {
    w = window.innerWidth;
    h = window.innerHeight;
    reduced = still();
    const ratio = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    dpr.value = ratio;
    camZ = h / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.aspect = w / h;
    camera.position.z = camZ;
    camera.updateProjectionMatrix();
    snowMat.uniforms.uCamZ.value = camZ;
    snowMat.uniforms.uH.value = h;
    snowMat.uniforms.uW.value = w;

    const pad = Math.max(16, Math.min(w * 0.05, 72));
    colHalf = Math.min(600, w / 2) - pad;
    zone.uMid.value = (w / 2) * ratio;
    zone.uCol.value = phone ? 1e5 : colHalf * ratio;
    const H = document.documentElement.scrollHeight;
    home.giant = mid('.vista[data-set="giant"]', H * 0.14);
    home.galaxy = mid('.vista[data-set="galaxy"]', H * 0.7);
    home.moon = mid('#value .sec-head', H * 0.84);
    home.foot = mid('.vista[data-set="horizon"]', H - 120);

    const gr = Math.max(84, Math.min(w * 0.17, 225));
    const mr = Math.max(34, Math.min(w * 0.05, 78));
    const gal = Math.max(170, Math.min(w * 0.32, 480));
    galScale.value = gal / 480;
    if (reduced) {
      // One still: the giant low on the right, the galaxy high on the left.
      place(giant, -220, h / 2, w * 0.36, h * 0.3, gr);
      place(galaxy, -1400, h / 2, -w * 0.36, -h * 0.26, gal * 0.7);
      moon.visible = false;
      horizon.visible = false;
    } else {
      moon.visible = true;
      horizon.visible = true;
      place(giant, -220, home.giant + (phone ? 20 : 70), w * (phone ? 0.2 : 0.27), 0, gr);
      place(galaxy, -1400, home.galaxy, w * (phone ? 0 : 0.08), 0, gal);
      place(moon, -500, home.moon, w * (phone ? 0.3 : 0.3), -10, mr);
      // The lit limb crosses the horizon spacer; the body runs down under the footer.
      const hr = w * 1.7 + 500;
      place(horizon, -300, home.foot, 0, hr - 24, hr);
    }
  }

  /* The drifting things keep to the margins: `edge(off)` is a screen x from the
     column edge (off 0) to the window edge (off 1), so on a narrow margin they
     peek in from the side; a negative off is a place inside the column, where the
     shader's calm() turns the light down. */
  let colHalf = 600;
  const edge = (off) => (off < 0 ? colHalf * (1 + off) : colHalf + 16 + off * Math.max(w / 2 - colHalf - 16, 0));

  let camY = 0;
  function wrap(y, span) {
    return camY + ((((y - camY + span / 2) % span) + span) % span) - span / 2;
  }

  /** Draw one frame. `t` in seconds, `scroll` in px, pointer in -1..1. */
  function render(t, scroll, px = 0, py = 0) {
    time.value = t;
    camY = reduced ? -h / 2 : -(scroll + h / 2);
    camera.position.x = px * 16;
    camera.position.y = camY - py * 10;
    snowMat.uniforms.uCamY.value = camY;

    giant.userData.body.rotation.y = t * 0.012;
    moon.userData.body.rotation.y = t * 0.02;
    horizon.userData.body.rotation.x = t * 0.004;

    for (const j of jellies) {
      const k = view(j.z);
      const span = h * k * 1.5 + j.size * k * 8;
      const beat = t * 1.15 + j.mesh.material.uniforms.uPhase.value;
      // It rises in strokes: fastest just after the bell closes.
      const y = wrap(j.y * span + t * j.rise + Math.sin(beat - 1.2) * 5, span);
      const sx = j.side * edge(j.off) + Math.sin(t * 0.13 + j.sway) * 22;
      j.mesh.position.set(sx * k, y, j.z);
      j.mesh.scale.setScalar(j.size * k);
      j.mesh.rotation.set(0.18, t * 0.05 + j.sway, j.lean + Math.sin(t * 0.21 + j.sway) * 0.08);
    }

    for (let i = 0; i < shardData.length; i++) {
      const s = shardData[i];
      const k = view(s.z);
      const span = h * k * 1.4 + 200;
      dummy.position.set((s.side * edge(s.off) + Math.sin(t * 0.09 + i) * 14) * k, wrap(s.y * span + t * s.fall, span), s.z);
      dummy.rotation.set(s.rot.x + t * s.spin.x, s.rot.y + t * s.spin.y, s.rot.z + t * s.spin.z);
      dummy.scale.set(s.size * k, s.size * k * s.long, s.size * k);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;

    for (const c of comets) {
      let u = reduced ? (c === comets[0] ? 0.55 : -1) : (t - c.t0) / c.dur;
      if (u > 1) {
        c.t0 = t + 5 + crnd() * 9;
        aim(c);
        u = -1;
      }
      c.mesh.visible = u >= 0;
      if (u < 0) continue;
      const z = -700;
      const k = view(z);
      const x = (c.from[0] + (c.to[0] - c.from[0]) * u) * w * k;
      const y = camY - (c.from[1] + (c.to[1] - c.from[1]) * u) * h * k;
      c.mesh.position.set(x, y, z);
      c.mesh.rotation.z = Math.atan2(-(c.to[1] - c.from[1]) * h, (c.to[0] - c.from[0]) * w);
      c.mesh.scale.set(380 * k, 22 * k, 1);
      c.mat.uniforms.uAlpha.value = Math.sin(Math.PI * u) * 0.9;
    }

    renderer.render(scene, camera);
  }

  function dispose() {
    for (const d of disposables) d.dispose();
    renderer.dispose();
  }

  layout();
  return { layout, render, dispose };
}
