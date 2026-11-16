import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { seeded } from './field';
import { camp as campPiece } from '../world/camp';
import { COMMON, SKY } from './worldBackdrop';

/* The desert: real ground for the earth world, drawn by its own camera into the
   same canvas after the sea and the sky (lib/worldScene.js clears the depth and
   renders this scene on top, so the sun, the moon and the galaxy set behind it).

   The land is one heightfield, baked once on the CPU from a seeded lattice:
     dunes     barchans across the wind, a long windward back and a short slip
               face toward the reader, largest near the camera
     the playa a flat pan in the middle distance, where the commit buttes stand
     mesas     terraced table land beyond it, and a far range behind that
   Every vertex also stores how high the ground rises toward the sun from where it
   stands (the tangent of its horizon), so one compare against the sun's height
   gives long dusk shadows that lengthen as it sets. No shadow maps.

   The sand is lit after Journey (Alan Zucconi's write-up): a hard-edged diffuse, a
   rim and a glancing sheen toward the low sun, ripples on gentle slopes that fade
   before they can moire, and a little glitter. The air is the sky's own function
   (worldBackdrop.js SKY) asked for the colour along each ray, with extinction by
   distance and a mist that pools low, so far ground melts into the horizon with
   no seam.

   On it stand the crew's base camp (a mast with a lamp, three tents lit from
   inside, one figure) and the commit record: one butte for every week of the
   GitHub snapshot, its height that week's commits to the power 0.4. */

export const LAND_FOV = 38;
const X0 = -4700;
const X1 = 4700;
const Z0 = 90;
const ZD = 4150;
const ZPOW = 1.5;
const ROW = { x: 300, zNear: -1120, zFar: -2020 };

const LAND_VERT = /* glsl */ `
#ifdef SAND
attribute float aHor;
#endif
#ifdef CAMP
attribute float aEmis;
#endif
#ifdef BUTTE
attribute float aGlow;
#endif
varying vec3 vW, vN;
varying float vHor, vEmis, vGlow, vUp;
void main(){
  vec4 wp = vec4(position, 1.0);
  vec3 n = normal;
  vHor = 0.0; vEmis = 0.0; vGlow = 0.0; vUp = position.y;
#ifdef SAND
  vHor = aHor;
#endif
#ifdef CAMP
  vEmis = aEmis;
#endif
#ifdef BUTTE
  wp = instanceMatrix * wp;
  n = normalize(mat3(instanceMatrix) * n);
  vGlow = aGlow;
#endif
  vW = wp.xyz;
  vN = n;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const LAND_FRAG = /* glsl */ `
${COMMON}
${SKY}
uniform vec2 uRes;
uniform float uDpr, uSunTan, uLampOn, uFog, uMist, uFine, uShore;
uniform vec3 uCam, uSand, uSandShade, uAmb, uLampPos, uLampCol, uMoonDir, uMoonCol, uAccent, uFoam;
uniform vec2 uWind;
varying vec3 vW, vN;
varying float vHor, vEmis, vGlow, vUp;

void main(){
  vec2 c = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  // The land stands above the shore's waterline; under it there is only water.
  float above = uExit + swell(c.x + 300.0, uTime * 1.1) - c.y;
  if (above < 0.0) discard;
  vec3 N = normalize(vN);
  vec3 toCam = uCam - vW;
  float d = length(toCam);
  vec3 V = toCam / d;
  vec3 albedo = uSand;
  float aa = 0.0;
#ifdef SAND
  // Ripples run across the wind on gentle slopes only, and fade out before their
  // period nears a pixel, so there is nothing to moire on a phone.
  float ph = dot(vW.xz, uWind) * 2.0 + 3.0 * n2(vW.xz * 0.011);
  aa = (1.0 - smoothstep(0.3, 1.0, fwidth(ph))) * uFine;
  float gentle = pow(clamp(N.y, 0.0, 1.0), 6.0);
  N = normalize(N + vec3(uWind.x, 0.0, uWind.y) * cos(ph) * 0.26 * aa * gentle);
  // Table land shows its strata on the walls; the pans between dunes run darker.
  float wall = smoothstep(0.86, 0.55, vN.y);
  float strata = 0.5 + 0.5 * sin(vW.y * 0.085 + 2.0 * n2(vW.xz * 0.004));
  albedo = mix(albedo, mix(uSandShade * 1.9, uSand * 0.82, strata), wall * 0.5);
  albedo *= 0.86 + 0.28 * n2(vW.xz * 0.0031 + 7.0);
  // Grain underfoot: it is sand, not paint, wherever it is near enough to see.
  albedo *= 1.0 + (n2(vW.xz * 0.9) - 0.5) * 0.2 * (1.0 - smoothstep(180.0, 800.0, d)) * uFine;
#endif
#ifdef BUTTE
  float strata = 0.5 + 0.5 * sin(vW.y * 0.2 + vW.x * 0.02);
  albedo = mix(uSandShade * 1.9, uSand * 0.8, strata * 0.6 + 0.2) * (0.8 + 0.4 * h1(floor(vW.x * 0.03)));
#endif
#ifdef CAMP
  albedo = uSandShade * 1.3;
#endif
  float ndl = dot(N, uSunDir);
  float sh = smoothstep(vHor - 0.025, vHor + 0.045, uSunTan);
  float dif = clamp(ndl * 3.0 + 0.04, 0.0, 1.0) * sh;
  vec3 sunC = uSun * uSunI * 1.9;
  vec3 col = albedo * (sunC * dif + uAmb * (0.55 + 0.45 * N.y));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 4.0) * smoothstep(-0.15, 0.4, ndl);
  float spec = pow(max(dot(N, normalize(uSunDir + V)), 0.0), 60.0) * 0.16;
  col += sunC * max(rim * 0.3, spec) * sh * albedo;
#ifdef BUTTE
  // Backlit rock: the sun wraps round the edges that face it.
  col += sunC * albedo * pow(1.0 - abs(dot(N, V)), 2.0) * smoothstep(-0.5, 0.3, ndl) * 0.7;
#endif
#ifdef SAND
  vec2 cell = floor(vW.xz * 1.3);
  float gl = step(0.992, h2(cell + floor(uTime * 1.5))) * pow(max(dot(reflect(-uSunDir, N), V), 0.0), 6.0);
  col += sunC * gl * aa * sh * 0.9;
#endif
  // Night: the moon while Value is read, and the camp's lamp on the dunes around it.
  col += albedo * uMoonCol * (clamp(dot(N, uMoonDir) * 2.2 + 0.1, 0.0, 1.0) + 0.7 * pow(1.0 - max(dot(N, V), 0.0), 3.0));
  vec3 Lp = uLampPos - vW;
  float ld = length(Lp);
  col += albedo * uLampCol * uLampOn * (3.6 / (1.0 + ld * ld * 0.00042)) * (0.22 + 0.78 * max(dot(N, Lp / ld), 0.0));
  col = mix(col, uLampCol * (0.95 + 0.4 * uLampOn), vEmis * (0.5 + 0.5 * uLampOn));
#ifdef BUTTE
  // The week under the pointer: its butte takes the accent from the foot up.
  col += uAccent * vGlow * (0.7 + 0.8 * vUp);
#endif
  // The air: extinction by distance (blue goes first), a mist that pools low, and
  // the colour of the sky along this very ray, so the far ground has no edge.
  vec3 rd = -V;
  vec3 air = skyAt(normalize(vec3(rd.x, max(rd.y, 0.0), rd.z)));
  vec3 ext = exp(-d * uFog * vec3(0.8, 1.0, 1.3));
  float low = uMist * exp(-max(vW.y, 0.0) * 0.016) * (1.0 - exp(-d * 0.0011));
  col = mix(air, col, ext * (1.0 - clamp(low, 0.0, 0.85)));
  if (uShore > 0.01 && above < uView.y * 0.2) {
    // Between the lens and the beach lies the sea's surface, seen at a glance: it
    // mirrors the sky and the land, carries the sun's glitter, laps at an uneven
    // shoreline and leaves the sand above it wet and dark.
    float edge = uView.y * (0.03 + 0.05 * n1(c.x * 0.0045 + 3.0) + 0.006 * sin(c.x * 0.05 + uTime * 0.8)) * uShore;
    float t = clamp(above / edge, 0.0, 1.0);
    float surf = 1.0 - smoothstep(0.86, 1.0, above / edge);
    float rip = 0.6 * n2(vec2(c.x * 0.018, above * 0.3 - uTime * 0.9)) + 0.4 * n2(vec2(c.x * 0.05 + uTime * 0.3, above * 0.7));
    vec3 mirror = skyAt(normalize(vec3(rd.x, 0.05 + 0.3 * (1.0 - t), rd.z)));
    vec3 sea = mix(mirror, col * 0.5, 0.25 + 0.5 * t) * (0.72 + 0.4 * rip);
    float toSun = max(dot(normalize(rd.xz), normalize(uSunDir.xz)), 0.0);
    sea += uSun * uSunI * pow(toSun, 90.0) * smoothstep(0.45, 0.8, rip) * 1.2 * uDay;
    col *= 1.0 - 0.42 * (1.0 - smoothstep(edge, edge * 2.4, above)) * (1.0 - surf);
    col = mix(col, sea, surf);
    col += uSun * 0.2 * exp(-abs(above - edge * 0.93) / 1.6) * (0.4 + 0.6 * rip);
  }
  // The same bright line of surface the backdrop draws, so the cut has no stair.
  col = mix(col, uFoam, exp(-above / 2.0) * 0.8);
  col = 1.12 * col / (1.0 + 0.3 * col);
  col = hush(col, c);
  col += (h2(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

/* Sand on the wind: thin streaks low over the dunes that only show against the
   light, brightest when the reader looks toward the sun through them. */
const STREAK_VERT = /* glsl */ `
attribute vec4 aSeed;
uniform float uTime;
uniform vec3 uCam, uSunDir;
uniform vec2 uWind;
varying float vA; varying vec2 vUv;
void main(){
  float span = 1500.0;
  float along = mod(aSeed.x * span + uTime * (26.0 + 30.0 * aSeed.w), span) - span * 0.5;
  vec3 p = vec3(uCam.x + along * uWind.x + (aSeed.y - 0.5) * 1900.0, 10.0 + aSeed.z * 54.0 + sin(uTime * 0.5 + aSeed.w * 20.0) * 3.0, -160.0 - aSeed.y * 1150.0 + along * uWind.y * 0.3);
  float len = 60.0 + 110.0 * aSeed.w;
  p += vec3(uWind.x, 0.0, uWind.y * 0.3) * position.x * len + vec3(0.0, 1.0, 0.0) * position.y * (5.0 + 9.0 * aSeed.z);
  vec3 rd = normalize(p - uCam);
  float mu = dot(rd, uSunDir);
  float hg = min(0.51 / pow(1.49 - 1.4 * mu, 1.5), 6.0) * 0.07;
  vA = hg * smoothstep(0.0, 0.12, (along + span * 0.5) / span) * smoothstep(1.0, 0.88, (along + span * 0.5) / span) * smoothstep(160.0, 520.0, distance(p, uCam));
  vUv = position.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const STREAK_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uAlpha;
varying float vA; varying vec2 vUv;
void main(){
  float a = (1.0 - abs(vUv.y) * 2.0) * (1.0 - abs(vUv.x) * 2.0);
  gl_FragColor = vec4(uColor, a * a * vA * uAlpha);
}`;
const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GLOW_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uAlpha, uTall;
varying vec2 vUv;
void main(){
  vec2 q = (vUv - 0.5) * 2.0;
  float a = mix(pow(max(0.0, 1.0 - length(q)), 2.4), pow(max(0.0, 1.0 - abs(q.x)), 3.0) * pow(1.0 - vUv.y, 1.6), uTall);
  gl_FragColor = vec4(uColor, a * uAlpha);
}`;

const sm = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/* A week of the commit graph is a column of it: the same indexing as Heatmap.jsx. */
export function weeksOf(days) {
  if (!days || !days.length) return [];
  const start = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const out = new Array(Math.ceil((days.length + start) / 7)).fill(0);
  days.forEach((d, n) => {
    out[Math.floor((n + start) / 7)] += d.count;
  });
  return out;
}

export function createLand({ C, stage, time, dpr, phone, aspect, days, crew = [], buttes: withButtes = true }) {
  const rnd = seeded(733);
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  // The camp stands left of centre when the shore fills the window, at any aspect.
  const CAMP = { x: 18 - 0.4 * 470 * Math.tan((LAND_FOV * Math.PI) / 360) * Math.min(aspect, 1.9), z: -470 };

  /* ---- Noise: a seeded lattice, smooth between its points -------------------- */
  const LAT = 256;
  const lat = new Float32Array(LAT * LAT);
  for (let i = 0; i < lat.length; i++) lat[i] = rnd();
  const noise = (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let fx = x - xi;
    let fy = y - yi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    const x0 = xi & 255;
    const x1 = (xi + 1) & 255;
    const y0 = (yi & 255) * LAT;
    const y1 = ((yi + 1) & 255) * LAT;
    const a = lat[y0 + x0];
    const b = lat[y0 + x1];
    const c = lat[y1 + x0];
    const d = lat[y1 + x1];
    return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
  };
  const fbm = (x, y) => 0.5 * noise(x, y) + 0.25 * noise(x * 2.03 + 11.3, y * 2.03 + 5.1) + 0.125 * noise(x * 4.01 + 3.7, y * 4.01 + 9.2) + 0.0625 * noise(x * 8.1 + 7.9, y * 8.1 + 1.4);

  /* ---- The ground ----------------------------------------------------------- */
  const wind = { x: -0.72, z: 0.694 }; // from the sun's side, toward the reader's left: the long backs of the dunes face the light
  function dune(x, z, lambda, warp, sharp) {
    let s = (x * wind.x + z * wind.z) / lambda + warp;
    s -= Math.floor(s);
    return s < 0.76 ? Math.pow(s / 0.76, sharp) : (1 - s) / 0.24;
  }
  const campY = 46;
  function height(x, z) {
    const back = -z;
    const dunes = (1 - sm((back - 760) / 520)) * sm((back - 70) / 230); // level under the camera, so it never stands in a dune
    const table = sm((back - 2080) / 520);
    const range = sm((back - 3250) / 420);
    let y = 26 * fbm(x * 0.0006 + 2.0, z * 0.0006) - 10;
    if (dunes > 0) {
      const warp = 1.5 * fbm(x * 0.0013, z * 0.0013 + 4.0);
      const big = 22 + 96 * noise(x * 0.0012 + 9.0, z * 0.0012);
      y += dunes * (big * dune(x, z, 520, warp, 1.5) + 6 * dune(x + 60, z, 170, warp * 2.3 + 0.4, 1.2));
      // A level pad on a crest for the camp.
      const dc = Math.hypot(x - CAMP.x, (z - CAMP.z) * 1.3);
      y += (campY - y) * sm(1 - (dc - 26) / 110);
    }
    if (table > 0) {
      const n = fbm(x * 0.00068 + 3.0, z * 0.00068 + 9.0) + 0.1 * noise(x * 0.004, z * 0.004);
      const m = Math.max(0, n - 0.5) * 3.6;
      const step = Math.min(m, 1.999);
      const tier = Math.floor(step) + sm((step - Math.floor(step)) / 0.2);
      y += table * (tier * 150 + 26 * noise(x * 0.003 + 1.0, z * 0.003));
    }
    if (range > 0) {
      const r = 1 - Math.abs(2 * fbm(x * 0.00062 + 17.0, z * 0.0004) - 1);
      y += range * (70 + 330 * Math.pow(r, 1.4));
    }
    return y;
  }

  const gx = phone ? 136 : 256;
  const gz = phone ? 84 : 150;
  const zAt = (j) => Z0 - ZD * Math.pow(j / gz, ZPOW);
  const xAt = (i) => X0 + ((X1 - X0) * i) / gx;
  const nv = (gx + 1) * (gz + 1);
  const hs = new Float32Array(nv);
  const pos = new Float32Array(nv * 3);
  for (let j = 0; j <= gz; j++) {
    const z = zAt(j);
    for (let i = 0; i <= gx; i++) {
      const x = xAt(i);
      const k = j * (gx + 1) + i;
      hs[k] = height(x, z);
      pos[k * 3] = x;
      pos[k * 3 + 1] = hs[k];
      pos[k * 3 + 2] = z;
    }
  }
  // The baked grid, read back anywhere: what the shadow march and the things that
  // stand on the ground use.
  function ground(x, z) {
    const fi = Math.max(0, Math.min(gx - 0.001, ((x - X0) / (X1 - X0)) * gx));
    const fj = Math.max(0, Math.min(gz - 0.001, Math.pow(Math.max(0, (Z0 - z) / ZD), 1 / ZPOW) * gz));
    const i = Math.floor(fi);
    const j = Math.floor(fj);
    const u = fi - i;
    const v = fj - j;
    const k = j * (gx + 1) + i;
    return (hs[k] * (1 - u) + hs[k + 1] * u) * (1 - v) + (hs[k + gx + 1] * (1 - u) + hs[k + gx + 2] * u) * v;
  }
  /* The commit row: where each week's butte stands and how tall it is. The row runs
     away from the reader, the oldest week far off on the left, the newest nearest
     on the right. Heights are that week's commits to the power 0.4 (the tallest
     week stands `top` units high), on a low mound so an empty week is still a place. */
  const weeks = weeksOf(days);
  const nB = weeks.length;
  const tanF = Math.tan((LAND_FOV * Math.PI) / 360);
  function row(asp) {
    const peak = Math.max(1, ...weeks);
    const top = 118;
    const half = (z) => -z * tanF * asp * 0.84;
    const dz = ROW.zNear - ROW.zFar;
    const dx = half(ROW.zNear) + half(ROW.zFar);
    const r = (Math.hypot(dx, dz) / Math.max(1, nB)) * 0.92;
    return weeks.map((n, i) => {
      const t = nB > 1 ? i / (nB - 1) : 1;
      const z = ROW.zFar + dz * t;
      const x = ROW.x - half(ROW.zFar) + dx * t;
      return { x, z, r, y: ground(x, z) - 2, tall: 6 + top * Math.pow(n / peak, 0.4) };
    });
  }
  // What stands on the ground shades it: the buttes and the camp's tents.
  const casters = withButtes ? row(aspect).map((b) => ({ x: b.x, z: b.z, r: b.r * 0.8, top: b.y + b.tall * 0.92 })) : [];
  for (const [dx, dz, r, tall] of [[-46, 10, 24, 22], [40, -22, 16, 15], [74, 8, 15, 14], [-12, 17, 9, 8]]) {
    casters.push({ x: CAMP.x + dx, z: CAMP.z + dz, r, top: ground(CAMP.x + dx, CAMP.z + dz) + tall });
  }
  const nor = new Float32Array(nv * 3);
  const hor = new Float32Array(nv);
  // The sun stands to the right of straight ahead, where it shows about three
  // quarters of the way across the window at this aspect.
  const sunAz = Math.atan(0.46 * tanF * aspect);
  const ax = Math.sin(sunAz);
  const az = -Math.cos(sunAz);
  for (let j = 0; j <= gz; j++) {
    for (let i = 0; i <= gx; i++) {
      const k = j * (gx + 1) + i;
      const il = Math.max(0, i - 1);
      const ir = Math.min(gx, i + 1);
      const jn = Math.max(0, j - 1);
      const jf = Math.min(gz, j + 1);
      const dx = (hs[j * (gx + 1) + ir] - hs[j * (gx + 1) + il]) / (xAt(ir) - xAt(il));
      const dz = (hs[jf * (gx + 1) + i] - hs[jn * (gx + 1) + i]) / (zAt(jf) - zAt(jn));
      const l = Math.hypot(dx, 1, dz);
      nor[k * 3] = -dx / l;
      nor[k * 3 + 1] = 1 / l;
      nor[k * 3 + 2] = -dz / l;
      // How high the ground between here and the sun stands, as a tangent.
      const x = pos[k * 3];
      const z = pos[k * 3 + 2];
      let t = 0;
      let step = 14;
      for (let s = 0; s < 26; s++) {
        const r = step;
        t = Math.max(t, (ground(x + ax * r, z + az * r) - hs[k] - 1.5) / r);
        step *= 1.22;
      }
      for (const o of casters) {
        const ox = o.x - x;
        const oz = o.z - z;
        const far = ox * ax + oz * az;
        if (far <= o.r * 0.5 || far > 1400) continue;
        const side = Math.abs(ox * az - oz * ax);
        if (side < o.r) t = Math.max(t, ((o.top - hs[k]) / far) * sm((o.r - side) / (o.r * 0.5)));
      }
      hor[k] = t;
    }
  }
  const idx = new (nv > 65535 ? Uint32Array : Uint16Array)(gx * gz * 6);
  let q = 0;
  for (let j = 0; j < gz; j++) {
    for (let i = 0; i < gx; i++) {
      const a = j * (gx + 1) + i;
      const b = a + gx + 1;
      idx[q++] = a;
      idx[q++] = a + 1;
      idx[q++] = b;
      idx[q++] = a + 1;
      idx[q++] = b + 1;
      idx[q++] = b;
    }
  }
  const terrGeo = keep(new BufferGeometry());
  terrGeo.setAttribute('position', new BufferAttribute(pos, 3));
  terrGeo.setAttribute('normal', new BufferAttribute(nor, 3));
  terrGeo.setAttribute('aHor', new BufferAttribute(hor, 1));
  terrGeo.setIndex(new BufferAttribute(idx, 1));

  const lampPos = new Vector3(CAMP.x + 8.5, ground(CAMP.x, CAMP.z) + 51, CAMP.z);
  const U = {
    ...stage,
    uRes: stage.uRes,
    uDpr: dpr,
    uSunTan: { value: 0.1 },
    uLampOn: { value: 0 },
    uFog: { value: 0.00042 },
    uMist: { value: 0.2 },
    uFine: { value: 1 },
    uShore: { value: 0 },
    uCam: { value: new Vector3() },
    uSand: { value: C.sand },
    uSandShade: { value: C['sand-shade'] },
    uAmb: { value: new Vector3() },
    uLampPos: { value: lampPos },
    uLampCol: { value: C.ember.clone() },
    uMoonDir: { value: new Vector3(0.8, 0.36, -0.42).normalize() },
    uMoonCol: { value: new Vector3() },
    uAccent: { value: C.ember },
    uFoam: { value: C['sea-foam'] },
    uWind: { value: new Vector2(wind.x, wind.z) },
  };
  const mat = (defines) => keep(new ShaderMaterial({ vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, uniforms: U, defines }));
  const scene = new Scene();
  const camera = new PerspectiveCamera(LAND_FOV, aspect, 4, 9000);
  const terrain = new Mesh(terrGeo, mat({ SAND: 1 }));
  terrain.frustumCulled = false;
  scene.add(terrain);

  /* ---- Base camp: flat-shaded boxes and ridge tents, under 200 triangles ----- */
  const cp = [];
  const cn = [];
  const ce = [];
  const tri = (a, b, c, e) => {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    const l = Math.hypot(...n) || 1;
    for (const p of [a, b, c]) {
      cp.push(...p);
      cn.push(n[0] / l, n[1] / l, n[2] / l);
      ce.push(e);
    }
  };
  const quad = (a, b, c, d, e) => {
    tri(a, b, c, e);
    tri(a, c, d, e);
  };
  const turn = (p, o, r) => [o[0] + p[0] * Math.cos(r) + p[2] * Math.sin(r), o[1] + p[1], o[2] - p[0] * Math.sin(r) + p[2] * Math.cos(r)];
  function box(o, sx, sy, sz, r = 0, e = 0) {
    const v = (x, y, z) => turn([x * sx * 0.5, y * sy, z * sz * 0.5], o, r);
    quad(v(-1, 0, 1), v(1, 0, 1), v(1, 1, 1), v(-1, 1, 1), e);
    quad(v(1, 0, -1), v(-1, 0, -1), v(-1, 1, -1), v(1, 1, -1), e);
    quad(v(1, 0, 1), v(1, 0, -1), v(1, 1, -1), v(1, 1, 1), e);
    quad(v(-1, 0, -1), v(-1, 0, 1), v(-1, 1, 1), v(-1, 1, -1), e);
    quad(v(-1, 1, 1), v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1), e);
  }
  function tent(o, len, wide, tall, r, e) {
    const v = (x, y, z) => turn([x * len * 0.5, y * tall, z * wide * 0.5], o, r);
    quad(v(-1, 0, 1), v(1, 0, 1), v(1, 1, 0), v(-1, 1, 0), e);
    quad(v(1, 0, -1), v(-1, 0, -1), v(-1, 1, 0), v(1, 1, 0), e);
    tri(v(1, 0, 1), v(1, 0, -1), v(1, 1, 0), e * 1.6);
    tri(v(-1, 0, -1), v(-1, 0, 1), v(-1, 1, 0), e * 1.6);
  }
  const on = (dx, dz, lift = 0) => [CAMP.x + dx, ground(CAMP.x + dx, CAMP.z + dz) - 0.6 + lift, CAMP.z + dz];
  box(on(0, 0), 1.5, 58, 1.5); // the mast
  box(on(4, 0, 54), 9, 1, 1); // its arm
  box(on(8.5, 0, 48.5), 4.6, 5.6, 4.6, 0.4, 2); // the lamp
  tent(on(-46, 10), 44, 34, 24, 1.3, 0.42); // the command tent
  tent(on(40, -22), 30, 24, 16, 1.75, 0.3);
  tent(on(74, 8), 28, 22, 15, 1.2, 0.24);
  box(on(-8, 16), 9, 6, 7, 0.3);
  box(on(-17, 20), 6, 5, 6, -0.2);
  box(on(-10, 17, 6), 6, 4, 5, 0.8);
  box(on(17, 12), 4.2, 10.5, 3, 0.2); // one figure, looking out
  box(on(17, 12, 10.5), 3.3, 3.6, 3.1, 0.2);
  const campGeo = keep(new BufferGeometry());
  campGeo.setAttribute('position', new BufferAttribute(new Float32Array(cp), 3));
  campGeo.setAttribute('normal', new BufferAttribute(new Float32Array(cn), 3));
  campGeo.setAttribute('aEmis', new BufferAttribute(new Float32Array(ce), 1));
  const camp = new Mesh(campGeo, mat({ CAMP: 1 }));
  camp.frustumCulled = false;
  scene.add(camp);

  const plane = keep(new PlaneGeometry(1, 1));
  const glow = (tall) =>
    keep(new ShaderMaterial({ vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: { value: C.ember.clone() }, uAlpha: { value: 0 }, uTall: { value: tall } }, transparent: true, depthWrite: false, blending: AdditiveBlending }));
  const lampGlow = new Mesh(plane, glow(0));
  lampGlow.position.set(lampPos.x, lampPos.y, lampPos.z + 3);
  lampGlow.scale.setScalar(150);
  lampGlow.material.uniforms.uColor = U.uLampCol;
  scene.add(lampGlow);

  /* ---- The crew's fires, one each (src/world/camp.js) ------------------------- */
  const fires = crew.length ? campPiece.create({ crew, at: on, ember: C.ember, time }) : null;
  if (fires) scene.add(fires.object);

  /* ---- Commit buttes: one for every week, on the playa ------------------------ */
  let buttes = null;
  let glowAttr = null;
  const beacon = new Mesh(plane, glow(1));
  beacon.visible = false;
  const tops = [];
  if (nB && withButtes) {
    // A table of rock: a talus skirt, a cliff, a cap. Eight uneven sides, flat shaded.
    const prof = [
      [1.55, 0],
      [1.0, 0.26],
      [0.7, 0.4],
      [0.5, 0.9],
      [0.54, 0.935],
      [0.36, 1],
    ];
    const SIDES = 8;
    const bp = [];
    const bn = [];
    const jit = Array.from({ length: SIDES }, () => 0.74 + rnd() * 0.52);
    const pt = (s, l) => {
      const a = (s / SIDES) * Math.PI * 2;
      const r = prof[l][0] * jit[s % SIDES];
      return [Math.cos(a) * r, prof[l][1], Math.sin(a) * r];
    };
    const push = (a, b, c) => {
      const n = [(b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])];
      const l = Math.hypot(...n) || 1;
      for (const p of [a, b, c]) {
        bp.push(...p);
        bn.push(n[0] / l, n[1] / l, n[2] / l);
      }
    };
    for (let s = 0; s < SIDES; s++) {
      for (let l = 0; l < prof.length - 1; l++) {
        const a = pt(s, l);
        const b = pt(s + 1, l);
        const c = pt(s + 1, l + 1);
        const d = pt(s, l + 1);
        push(a, c, b);
        push(a, d, c);
      }
      push([0, 1, 0], pt(s + 1, prof.length - 1), pt(s, prof.length - 1));
    }
    const butteGeo = keep(new BufferGeometry());
    butteGeo.setAttribute('position', new BufferAttribute(new Float32Array(bp), 3));
    butteGeo.setAttribute('normal', new BufferAttribute(new Float32Array(bn), 3));
    glowAttr = new InstancedBufferAttribute(new Float32Array(nB), 1);
    glowAttr.setUsage(DynamicDrawUsage);
    butteGeo.setAttribute('aGlow', glowAttr);
    buttes = new InstancedMesh(butteGeo, mat({ BUTTE: 1 }), nB);
    buttes.frustumCulled = false;
    scene.add(buttes, beacon);
  }
  const spin = Array.from({ length: nB }, () => rnd() * Math.PI * 2);
  const lean = Array.from({ length: nB }, () => 0.78 + rnd() * 0.5);
  function placeButtes(asp) {
    if (!buttes) return;
    const m = new Matrix4();
    const qt = new Quaternion();
    const up = new Vector3(0, 1, 0);
    tops.length = 0;
    row(asp).forEach((b, i) => {
      qt.setFromAxisAngle(up, spin[i]);
      m.compose(new Vector3(b.x, b.y, b.z), qt, new Vector3(b.r * lean[i], b.tall, b.r / lean[i]));
      buttes.setMatrixAt(i, m);
      tops.push([b.x, b.y + b.tall, b.z, b.r]);
    });
    buttes.instanceMatrix.needsUpdate = true;
  }
  placeButtes(aspect);

  /* ---- Sand on the wind ------------------------------------------------------ */
  const nS = phone ? 90 : 220;
  const streakGeo = keep(new BufferGeometry());
  streakGeo.setAttribute('position', new BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
  streakGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const seeds = new Float32Array(nS * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = rnd();
  streakGeo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 4));
  const streakMat = keep(
    new ShaderMaterial({
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      uniforms: { uTime: time, uCam: U.uCam, uSunDir: stage.uSunDir, uWind: U.uWind, uColor: { value: C.sun }, uAlpha: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
  );
  const streaks = new InstancedMesh(streakGeo, streakMat, nS);
  streaks.frustumCulled = false;
  scene.add(streaks);

  /* ---- A lit week ------------------------------------------------------------- */
  const lit = { index: -1, level: 0, want: 0 };
  function setWeek(index) {
    if (!buttes) return;
    const i = Number.isInteger(index) && index >= 0 && index < nB ? index : -1;
    if (i >= 0 && i !== lit.index) {
      if (lit.index >= 0) glowAttr.array[lit.index] = 0;
      lit.index = i;
      lit.level = Math.min(lit.level, 0.35);
    }
    lit.want = i >= 0 ? 1 : 0;
  }

  /** Per frame. `s` is the journey's state from worldScene.js. */
  function update(s) {
    camera.position.set(s.camX, s.camH, 0);
    camera.rotation.set(s.pitch, 0, 0);
    camera.updateMatrixWorld();
    U.uCam.value.copy(camera.position);
    U.uSunTan.value = s.sunTan;
    U.uAmb.value.copy(C['dusk-top']).multiplyScalar(1.9 * s.day).addScaledVector(C['night-low'], 0.5 - 0.2 * s.night).addScaledVector(C['dusk-low'], 0.16 * s.day).addScaledVector(C['gal-b'], 0.1 * s.night);
    U.uLampOn.value = s.lamp;
    U.uFog.value = 0.00036 - 0.00015 * s.night;
    U.uMist.value = 0.18 - 0.08 * s.night;
    U.uMoonCol.value.copy(C['gal-b']).multiplyScalar(0.52 * s.night).addScaledVector(C['moon-rim'], 0.36 * s.moon);
    // The lamp follows the crew's run: a beat on every step, steady and full at a gate.
    const flick = (0.9 + 0.1 * Math.sin(time.value * 1.3)) * (1 - (s.hold ?? 0)) + 1.25 * (s.hold ?? 0);
    lampGlow.material.uniforms.uAlpha.value = Math.min(1, (0.16 + 0.5 * s.lamp) * flick + 0.5 * (s.pulse ?? 0) * s.lamp);
    lampGlow.scale.setScalar(150 * (1 + 0.35 * (s.pulse ?? 0) + 0.15 * (s.hold ?? 0)));
    if (fires) {
      fires.object.visible = s.lamp > 0.02;
      if (fires.object.visible) fires.update({ proj: stage.uRes.value.y / (2 * tanF), show: Math.min(1, s.lamp * 1.4) });
    }
    lampGlow.quaternion.copy(camera.quaternion);
    streakMat.uniforms.uAlpha.value = 0.5 * s.day * s.fine;
    streaks.visible = s.day * s.fine > 0.02;
    U.uFine.value = s.fine;
    U.uShore.value = s.shore;
    if (buttes && (lit.level > 0.002 || lit.want > 0)) {
      lit.level += (lit.want - lit.level) * 0.16;
      if (lit.index >= 0) {
        glowAttr.array[lit.index] = lit.level;
        glowAttr.needsUpdate = true;
        const [x, y, z, r] = tops[lit.index];
        beacon.visible = lit.level > 0.01;
        beacon.position.set(x, y + 170, z);
        beacon.scale.set(r * 5, 340, 1);
        beacon.quaternion.copy(camera.quaternion);
        beacon.material.uniforms.uColor.value.copy(C.ember);
        beacon.material.uniforms.uAlpha.value = 0.75 * lit.level;
      }
    }
  }

  function resize(asp) {
    camera.aspect = asp;
    camera.updateProjectionMatrix();
    placeButtes(asp);
  }

  function dispose() {
    for (const d of disposables) d.dispose();
    fires?.dispose();
  }

  return { scene, camera, update, resize, setWeek, dispose, lampCol: U.uLampCol.value, sunAz, tanF, weeks: nB, lit, fires };
}
