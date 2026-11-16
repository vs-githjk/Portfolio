import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
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

   On it stand the crew's base camp (a mast with a lamp, nine tents, banners,
   crates, eight figures, loose rock, a fire for every member of the crew). The commit buttes that
   stood on the playa are retired: the page's own graph carries the weeks. */

export const LAND_FOV = 38;
const X0 = -4700;
const X1 = 4700;
const Z0 = 90;
const ZD = 4150;
const ZPOW = 1.5;

const LAND_VERT = /* glsl */ `
#ifdef SAND
attribute float aHor;
attribute float aDeep;
#endif
#ifdef CAMP
attribute float aEmis;
attribute float aTint;
#endif
varying vec3 vW, vN;
varying float vHor, vEmis, vGlow, vUp, vDeep, vTint;
void main(){
  vec4 wp = vec4(position, 1.0);
  vec3 n = normal;
  vHor = 0.0; vEmis = 0.0; vGlow = 0.0; vUp = position.y; vDeep = 0.0; vTint = 0.0;
#ifdef SAND
  vHor = aHor;
  vDeep = aDeep;
#endif
#ifdef CAMP
  vEmis = aEmis;
  vTint = aTint;
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
uniform vec3 uCam, uSand, uSandShade, uAmb, uLampPos, uLampCol, uMoonDir, uMoonCol, uAccent, uFoam, uRock, uScrub, uSnow, uPath[4];
uniform vec2 uWind;
varying vec3 vW, vN;
varying float vHor, vEmis, vGlow, vUp, vDeep, vTint;

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
  float wet = 0.0;      // 1 on the inlet's water
  float snow = 0.0;
#ifdef SAND
  float alt = vW.y;
  // Detail the mesh is too coarse to carry: the slope of two layers of noise leans the normal.
  float nearK = 1.0 - smoothstep(2600.0, 4200.0, d);
  vec2 q1 = vW.xz * 0.011; vec2 q2 = vW.xz * 0.034;
  float h0 = n2(q1) + 0.45 * n2(q2);
  vec2 grad = vec2(n2(q1 + vec2(0.35, 0.0)) + 0.45 * n2(q2 + vec2(0.35, 0.0)) - h0, n2(q1 + vec2(0.0, 0.35)) + 0.45 * n2(q2 + vec2(0.0, 0.35)) - h0);
  float high = smoothstep(60.0, 190.0, alt);
  float wall = smoothstep(0.9, 0.6, vN.y);
  float rocky = max(wall, high * 0.75);
  N = normalize(N - vec3(grad.x, 0.0, grad.y) * (0.5 + 1.3 * rocky) * (0.35 + 0.65 * nearK) * uFine);
  // Sand: ripples across the wind on gentle, low ground only, fading before their
  // period nears a pixel, so there is nothing to moire on a phone.
  float sandy = (1.0 - high) * (1.0 - wall);
  float ph = dot(vW.xz, uWind) * 2.0 + 3.0 * n2(vW.xz * 0.011);
  aa = (1.0 - smoothstep(0.3, 1.0, fwidth(ph))) * uFine * sandy;
  float gentle = pow(clamp(N.y, 0.0, 1.0), 6.0);
  N = normalize(N + vec3(uWind.x, 0.0, uWind.y) * cos(ph) * 0.26 * aa * gentle);
  albedo *= 0.86 + 0.28 * n2(vW.xz * 0.0031 + 7.0);
  albedo *= 1.0 + (n2(vW.xz * 0.9) - 0.5) * 0.2 * (1.0 - smoothstep(180.0, 800.0, d)) * uFine;
  // Rock: strata across the faces, darker in the gullies, streaked down the fall line.
  float strata = 0.5 + 0.5 * sin(alt * 0.06 + 3.0 * n2(vW.xz * 0.004));
  float streak = n2(vec2(vW.x * 0.03 + vW.z * 0.012, alt * 0.006));
  vec3 rock = mix(uRock * 0.72, uRock * 1.35 + uSandShade * 0.2, strata * 0.6 + streak * 0.4);
  // Scrub on the gentler ground between the beach and the rock.
  float scrub = smoothstep(26.0, 70.0, alt) * (1.0 - smoothstep(210.0, 380.0, alt)) * smoothstep(0.66, 0.9, N.y) * smoothstep(0.38, 0.62, n2(vW.xz * 0.006 + 2.0) * 0.6 + 0.4 * n2(vW.xz * 0.03));
  albedo = mix(albedo, rock, rocky);
  albedo = mix(albedo, uScrub * (0.8 + 0.4 * n2(vW.xz * 0.05)), scrub * 0.8);
  // Snow above the line, where the ground is not too steep to hold it; it runs lower in the gullies.
  snow = smoothstep(400.0, 520.0, alt + 110.0 * (n2(vW.xz * 0.0045 + 9.0) - 0.5) - 90.0 * grad.x) * smoothstep(0.42, 0.7, N.y);
  albedo = mix(albedo, uSnow, snow);
  // A worn path from the beach up to the camp and on along the shore.
  float pd = 1e5;
  for (int i = 0; i < 3; i++) {
    vec2 pa = uPath[i].xz; vec2 pb = uPath[i + 1].xz - pa;
    float pt = clamp(dot(vW.xz - pa, pb) / dot(pb, pb), 0.0, 1.0);
    pd = min(pd, length(vW.xz - pa - pb * pt));
  }
  float path = (1.0 - smoothstep(5.0, 13.0, pd + 5.0 * n2(vW.xz * 0.05))) * sandy;
  albedo *= 1.0 - 0.3 * path;
  aa *= 1.0 - path;
  wet = smoothstep(0.0, 2.5, vDeep);
#endif
#ifdef CAMP
  // 0 dark cloth, 1 rock, 2 a banner in the accent, 3 pale canvas
  albedo = vTint < 0.5 ? uSandShade * 1.3 : vTint < 1.5 ? mix(uRock, uSand, 0.35) * (0.9 + 0.4 * h2(floor(vW.xz * 0.2))) : vTint < 2.5 ? uAccent * 0.8 : uSand * 0.9 + 0.12;
#endif
  float ndl = dot(N, uSunDir);
  float sh = smoothstep(vHor - 0.025, vHor + 0.045, uSunTan);
  float dif = clamp(ndl * 3.0 + 0.04, 0.0, 1.0) * sh;
  vec3 sunC = uSun * uSunI * 1.9;
  vec3 col = albedo * (sunC * dif + uAmb * (0.55 + 0.45 * N.y)) * (1.0 + 0.5 * snow);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 4.0) * smoothstep(-0.15, 0.4, ndl);
  float spec = pow(max(dot(N, normalize(uSunDir + V)), 0.0), 60.0) * 0.16;
  col += sunC * max(rim * 0.3, spec) * sh * albedo;
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
  vec3 rd = -V;
#ifdef SAND
  if (wet > 0.0) {
    /* The inlet: a mirror for the sky at a glance, the bed showing through close
       to the shore, the sun's road of glitter, and surf where it meets the land. */
    vec2 rp = vW.xz * 0.02 + vec2(uTime * 0.05, uTime * 0.11);
    vec3 wn = normalize(vec3((n2(rp) - 0.5) * 0.22 + (n2(rp * 3.1 + 4.0) - 0.5) * 0.1, 1.0, (n2(rp + 9.0) - 0.5) * 0.22));
    vec3 rf = reflect(rd, wn);
    vec3 mirror = skyAt(normalize(vec3(rf.x, max(rf.y, 0.02), rf.z)));
    float fres = 0.25 + 0.75 * pow(1.0 - max(dot(wn, V), 0.0), 3.0);
    vec3 bed = col * vec3(0.5, 0.78, 0.82) * exp(-vDeep * 0.09);
    vec3 sea = mix(bed, mirror * 0.92, clamp(fres + smoothstep(2.0, 16.0, vDeep) * 0.5, 0.0, 1.0));
    float road = pow(max(dot(normalize(rf), uSunDir), 0.0), 220.0) + 0.35 * pow(max(dot(normalize(rf), uSunDir), 0.0), 26.0);
    sea += uSun * uSunI * road * 2.2 * uDay * sh;
    // Surf: a bright edge and two lines of foam that run in and fade.
    float lap = vDeep + 1.6 * sin(uTime * 0.8 + vW.x * 0.02) + 3.0 * (n2(vW.xz * 0.05) - 0.5);
    float foam = (1.0 - smoothstep(0.6, 3.2, lap)) + 0.6 * smoothstep(0.55, 0.9, sin(lap * 0.55 - uTime * 0.9)) * (1.0 - smoothstep(5.0, 16.0, lap)) * smoothstep(0.35, 0.6, n2(vW.xz * 0.09 + uTime * 0.05));
    sea = mix(sea, uFoam * (0.35 + 0.5 * dif + 0.4 * length(uAmb)), clamp(foam, 0.0, 1.0) * 0.85);
    col = mix(col, sea, wet);
  } else {
    // Wet sand just above the water's edge.
    col *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 9.0, vW.y)) * (1.0 - smoothstep(60.0, 140.0, vW.y + 100.0 * smoothstep(0.9, 0.6, vN.y)));
  }
#endif
  // The air: extinction by distance (blue goes first), a mist that pools low, and
  // the colour of the sky along this very ray, so the far ground has no edge.
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
    // Surf on the beach: foam along the line where the water stops, and a thinner line running in behind it.
    float fl = above / edge;
    float foamB = exp(-abs(fl - 1.0) * 14.0) * smoothstep(0.3, 0.6, rip + 0.25 * sin(c.x * 0.09 + uTime)) + 0.5 * exp(-abs(fl - 0.72 - 0.06 * sin(uTime * 0.7)) * 22.0) * smoothstep(0.45, 0.7, rip);
    col = mix(col, uFoam * (0.5 + 0.5 * uDay), clamp(foamB, 0.0, 1.0) * 0.8);
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

export function createLand({ C, stage, time, dpr, phone, aspect, crew = [] }) {
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
  // The sun stands to the right of straight ahead, where it shows about three
  // quarters of the way across the window at this aspect.
  const tanF = Math.tan((LAND_FOV * Math.PI) / 360);
  const sunAz = Math.atan(0.46 * tanF * aspect);
  const ax = Math.sin(sunAz);
  const az = -Math.cos(sunAz);
  const sunSlope = Math.tan(sunAz);
  const narrow = Math.max(0.3, Math.min(1, aspect / 1.6)); // a phone's window sees a narrow wedge: the inlet narrows with it, so its mountains are in view
  // Sharp ridges: folded noise, squared, over a warped ground, in a few octaves.
  const ridge = (x, z) => {
    const r = 1 - Math.abs(2 * noise(x, z) - 1);
    return r * r;
  };
  function ridged(x, z) {
    const wx = x + 1.4 * (fbm(x * 0.5 + 3.0, z * 0.5) - 0.5);
    const wz = z + 1.4 * (fbm(x * 0.5, z * 0.5 + 8.0) - 0.5);
    let sum = 0;
    let amp = 0.55;
    let f = 1;
    let prev = 1;
    for (let o = 0; o < 4; o++) {
      const r = ridge(wx * f + o * 17.0, wz * f + o * 5.0) * prev;
      sum += r * amp;
      prev = 0.35 + 0.65 * r;
      amp *= 0.5;
      f *= 2.1;
    }
    return sum;
  }
  /* The coast (Vidyut, Nov 16: the flat buttes were "bland and boring"). From the
     reader: the beach and its low dunes with the camp on a rise; then an inlet of
     the sea that runs away toward the setting sun; foothills on both its shores;
     a first range behind them and a higher, snow-capped range behind that. The
     ranges part where the inlet runs, so the sun sets down the water between
     them. Sea level is y = 0: `height` goes below it in the inlet, and the mesh
     stops at the surface (the depth is kept for the water's shading). */
  function height(x, z) {
    const back = -z;
    const dunes = (1 - sm((back - 620) / 420)) * sm((back - 70) / 230); // level under the camera, so it never stands in a dune
    let y = 22 * fbm(x * 0.0006 + 2.0, z * 0.0006) - 4;
    if (dunes > 0) {
      const warp = 1.5 * fbm(x * 0.0013, z * 0.0013 + 4.0);
      const big = 14 + 62 * noise(x * 0.0012 + 9.0, z * 0.0012);
      y += dunes * (big * dune(x, z, 520, warp, 1.5) + 5 * dune(x + 60, z, 170, warp * 2.3 + 0.4, 1.2));
      // A level pad on a crest for the camp.
      const dc = Math.hypot(x - CAMP.x, (z - CAMP.z) * 1.3);
      y += (campY - y) * sm(1 - (dc - 40) / 130);
    }
    // How far this point is from the line the inlet runs along (toward the sun), and how wide the inlet is here.
    const side = Math.abs(x - back * sunSlope - 60 * Math.sin(back * 0.0021) - 150 * (fbm(back * 0.0011, 3.3) - 0.5));
    const wide = (210 + 0.2 * Math.max(0, back - 900) + 90 * (noise(back * 0.004, 1.7) - 0.5)) * narrow;
    const shoreN = 70 * (fbm(x * 0.004 + 5.0, z * 0.004) - 0.5);
    const inlet = sm((back - 860) / 240) * (1 - sm((side + shoreN - wide) / 150));
    // The mountains stand back from the water: their feet at the inlet's shores.
    const rise = sm((side - wide - 40 * narrow) / ((250 + 0.07 * back) * narrow));
    const foot = sm((back - 1150) / 500) * (1 - sm((back - 2500) / 500));
    const near = sm((back - 1900) / 620) * (1 - 0.55 * sm((back - 3150) / 400));
    const far = sm((back - 2950) / 520);
    let m = 0;
    if (foot > 0) m += foot * 150 * ridged(x * 0.0021 + 4.0, z * 0.0021);
    if (near > 0) m += near * (60 + 470 * ridged(x * 0.00105 + 11.0, z * 0.00125 + 2.0));
    if (far > 0) m += far * (150 + 760 * ridged(x * 0.00074 + 23.0, z * 0.0009 + 7.0));
    y += m * rise * (0.6 + 0.4 * sm((side - wide) / (1100 * narrow)));
    // Loose rock at the mountains' feet.
    y += rise * foot * 14 * noise(x * 0.02, z * 0.02);
    return y + (-46 - y) * inlet;
  }

  const gx = phone ? 168 : 256;
  const gz = phone ? 104 : 150;
  const zAt = (j) => Z0 - ZD * Math.pow(j / gz, ZPOW);
  const xAt = (i) => X0 + ((X1 - X0) * i) / gx;
  const nv = (gx + 1) * (gz + 1);
  const hs = new Float32Array(nv);
  const deep = new Float32Array(nv); // how far under the sea's surface the ground is
  const pos = new Float32Array(nv * 3);
  for (let j = 0; j <= gz; j++) {
    const z = zAt(j);
    for (let i = 0; i <= gx; i++) {
      const x = xAt(i);
      const k = j * (gx + 1) + i;
      const hgt = height(x, z);
      hs[k] = Math.max(hgt, 0);
      deep[k] = Math.max(0, -hgt);
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
  // What stands on the ground shades it: the camp's tents.
  const casters = [];
  for (const [dx, dz, r, tall] of [[-46, 10, 24, 22], [40, -22, 16, 15], [74, 8, 15, 14], [-12, 17, 9, 8], [-98, -16, 15, 13], [114, -22, 14, 12], [18, -56, 15, 13], [-134, 24, 11, 9], [152, 16, 11, 9], [-72, 46, 10, 8]]) {
    casters.push({ x: CAMP.x + dx, z: CAMP.z + dz, r, top: ground(CAMP.x + dx, CAMP.z + dz) + tall });
  }
  const nor = new Float32Array(nv * 3);
  const hor = new Float32Array(nv);
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
      for (let s = 0; s < 30; s++) {
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
  terrGeo.setAttribute('aDeep', new BufferAttribute(deep, 1));
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
    uRock: { value: C['land-rock'] },
    uScrub: { value: C['land-scrub'] },
    uSnow: { value: C['land-snow'] },
    uPath: { value: [new Vector3(CAMP.x + 150, 0, -150), new Vector3(CAMP.x + 60, 0, CAMP.z + 150), new Vector3(CAMP.x + 10, 0, CAMP.z + 30), new Vector3(CAMP.x - 260, 0, CAMP.z - 240)] },
  };
  const mat = (defines) => keep(new ShaderMaterial({ vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, uniforms: U, defines }));
  const scene = new Scene();
  const camera = new PerspectiveCamera(LAND_FOV, aspect, 4, 9000);
  const terrain = new Mesh(terrGeo, mat({ SAND: 1 }));
  terrain.frustumCulled = false;
  scene.add(terrain);

  /* ---- Base camp: flat-shaded boxes, ridge tents, banners, people and loose rock,
     about a thousand triangles (Vidyut, Nov 16: "two tents? are you kidding me") -- */
  const cp = [];
  const cn = [];
  const ce = [];
  const ct = [];
  let tint = 0; // 0 dark cloth, 1 rock, 2 banner, 3 pale canvas
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
      ct.push(tint);
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
  // More of the camp: a street of tents either side of the mast, some pale canvas, some lit.
  const person = (dx, dz, r, tall = 10.5) => {
    box(on(dx, dz), 4.2, tall, 3, r);
    box(on(dx, dz, tall), 3.3, 3.6, 3.1, r);
  };
  tint = 3;
  tent(on(-98, -16), 28, 22, 14, 1.5, 0.2);
  tent(on(114, -22), 26, 20, 13, 1.4, 0.34);
  tint = 0;
  tent(on(18, -56), 28, 22, 14, 1.9, 0.26);
  tent(on(-134, 24), 20, 16, 10, 1.1, 0.18);
  tint = 3;
  tent(on(152, 16), 20, 16, 10, 1.6, 0.3);
  tent(on(-72, 46), 18, 14, 9, 1.35, 0.22);
  tint = 0;
  // Crates and a table by the tents.
  for (const [dx, dz, sx, sy, sz, r] of [[52, -4, 7, 5, 6, 0.4], [58, -9, 5, 4, 5, 1.1], [-92, 6, 6, 5, 6, 0.2], [100, -2, 8, 4, 5, 0.7], [104, 3, 5, 6, 5, 0.1], [-30, -10, 12, 3.4, 6, 0.5], [26, 30, 6, 4, 5, 0.9]]) box(on(dx, dz), sx, sy, sz, r);
  // The crew: standing in twos and threes, and one looking out to sea.
  person(17, 12, 0.2);
  person(-28, 28, 0.9);
  person(-22, 31, -0.4, 9.6);
  person(56, 20, 0.5);
  person(90, 22, -0.2, 11);
  person(95, 25, 1.2, 9.8);
  person(-86, 28, 0.3);
  person(134, 34, 0.7, 10);
  // Banners in the accent: a pole and a long pennant, one on the mast.
  tint = 2;
  const banner = (dx, dz, tall, r) => {
    tint = 0;
    box(on(dx, dz), 0.9, tall, 0.9);
    tint = 2;
    const o = on(dx, dz, tall - 7.5);
    const v = (x, y) => turn([x, y, 0], o, r);
    quad(v(0.5, 0), v(13, 1.4), v(13, 4.6), v(0.5, 6.4), 0.5);
    quad(v(0.5, 6.4), v(13, 4.6), v(13, 1.4), v(0.5, 0), 0.5);
  };
  banner(0.8, 0.2, 58, 0.3);
  banner(-60, -6, 30, 0.5);
  banner(66, -2, 28, 0.2);
  banner(130, -6, 26, 0.6);
  banner(-116, 4, 24, 0.35);
  // Loose rock: round the camp, down the path to the beach and along the water.
  tint = 1;
  const rock = (x, z, r) => {
    const o = [x, ground(x, z) - r * 0.28, z];
    const a = rnd() * 6.3;
    const top = [o[0] + (rnd() - 0.5) * r * 0.7, o[1] + r * (0.42 + rnd() * 0.3), o[2] + (rnd() - 0.5) * r * 0.7];
    const ring = [];
    for (let i = 0; i < 5; i++) {
      const t = a + (i / 5) * 6.283;
      const rr = r * (0.8 + rnd() * 0.7);
      ring.push([o[0] + Math.cos(t) * rr, o[1] + r * 0.25 * rnd(), o[2] + Math.sin(t) * rr]);
    }
    for (let i = 0; i < 5; i++) tri(ring[i], top, ring[(i + 1) % 5], 0);
  };
  for (let i = 0; i < (phone ? 34 : 70); i++) {
    const far = rnd();
    const x = CAMP.x + (rnd() - 0.5) * (360 + 1500 * far);
    const z = CAMP.z + 150 - 620 * far * far - rnd() * 120 + (rnd() < 0.3 ? 190 : 0);
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 30 || z > -60) continue;
    rock(x, z, 2.5 + rnd() * rnd() * 11);
  }
  tint = 0;
  const campGeo = keep(new BufferGeometry());
  campGeo.setAttribute('position', new BufferAttribute(new Float32Array(cp), 3));
  campGeo.setAttribute('normal', new BufferAttribute(new Float32Array(cn), 3));
  campGeo.setAttribute('aEmis', new BufferAttribute(new Float32Array(ce), 1));
  campGeo.setAttribute('aTint', new BufferAttribute(new Float32Array(ct), 1));
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
  }

  function resize(asp) {
    camera.aspect = asp;
    camera.updateProjectionMatrix();
  }

  function dispose() {
    for (const d of disposables) d.dispose();
    fires?.dispose();
  }

  return { scene, camera, update, resize, dispose, lampCol: U.uLampCol.value, sunAz, tanF, fires };
}
