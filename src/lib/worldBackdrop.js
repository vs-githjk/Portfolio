/* The backdrop of the three worlds: the water and the sky, for lib/worldScene.js.

   It is drawn in two steps. BACK holds everything that is soft (the colour of the
   water at this depth, the fans of light from the sun above it, the underside of a
   surface, the air and its Milky Way) and is rendered into a small half-float
   target, half or three quarters of the window. COMP is one full-window quad under
   every object: it reads that target and adds what has to stay sharp at full
   resolution, the two waterlines with their meniscus, the sun's disc, the stars
   and the grain.

   Both work in CSS pixels measured from the top left of the window. The two
   waterlines are the only hard edges in the journey:
     uTop   the surface the reader dives through; it is a place in the page
            (the "surface" vista) and leaves through the top of the window
     uExit  the surface the camera rises through at the shore; it comes down
            from the top of the window while the "shore" vista scrolls in
   Everything else follows one light. The scene (worldScene.js) turns the reader's
   place in the journey into a sun direction, and the sky here, the fog on the land
   (worldLand.js) and the stars all read that same sun. */

export const COMMON = /* glsl */ `
precision highp float;
uniform vec2 uView;
uniform float uTime, uTop, uExit, uScroll, uSurfDoc, uShoreDoc;
uniform float uPitch, uTanF, uNight, uDay, uOrbit, uBreak;
uniform vec3 uSunDir, uSunI;
uniform vec3 uDuskTop, uDuskMid, uDuskLow, uNightTop, uNightLow, uDawnLow, uSun, uStar;
uniform float uColHalf, uLmax;
uniform vec2 uVista;

float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
float fbm1(float x){ return 0.5 * n1(x) + 0.25 * n1(x * 2.03 + 11.3) + 0.125 * n1(x * 4.01 + 3.7) + 0.0625 * n1(x * 8.1 + 7.9); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y);
}
/* A waterline seen in section: three slow swells, a few pixels tall. */
float swell(float x, float t){ return sin(x * 0.011 + t * 0.6) * 6.5 + sin(x * 0.027 - t * 0.9) * 3.0 + sin(x * 0.0041 + t * 0.23) * 10.0 + sin(x * 0.061 + t * 1.7) * 1.2; }
/* Where the page sets text (the column, while a reading section is in the window)
   the world keeps its hue and its shapes but gives up its brightest values: any
   luminance over uLmax is pulled most of the way back to it. The vistas, the
   margins and the gaps keep everything. uVista is the top and bottom of the vista
   in the window, if there is one; c is in CSS px from the window's top left. */
vec3 hush(vec3 col, vec2 c){
  float vista = smoothstep(uVista.x - 130.0, uVista.x, c.y) * (1.0 - smoothstep(uVista.y, uVista.y + 130.0, c.y));
  float inCol = (1.0 - smoothstep(uColHalf - 70.0, uColHalf + 190.0, abs(c.x - 0.5 * uView.x))) * (1.0 - vista); // a long ramp: a short one drew a box on bright water
  float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float k = L > uLmax ? (uLmax + (L - uLmax) * 0.22) / L : 1.0;
  return col * mix(1.0, k, inCol);
}
/* The ray through a pixel of the window, for the land's camera: it looks down -z
   and is pitched up by uPitch, so the sky turns with the ground under it. */
vec3 viewDir(vec2 c){
  vec2 n = vec2(c.x - 0.5 * uView.x, 0.5 * uView.y - c.y) / (0.5 * uView.y) * uTanF;
  vec3 d = normalize(vec3(n, -1.0));
  float cp = cos(uPitch); float sp = sin(uPitch);
  return vec3(d.x, d.y * cp - d.z * sp, d.y * sp + d.z * cp);
}
`;

/* One sky for the whole land: single scattering, worked out in closed form.
   Rayleigh and Mie coefficients and scale heights after Maxime Heckel's write-up,
   the airmass after Kasten and Young; no march and no table. The sun's own colour
   (uSunI: what is left of it after its path through the air, and how much twilight
   remains once it is under the horizon) is worked out once a frame on the CPU.
   The physical result sets luminance and hue; the dusk and night tokens pull it
   onto the page's palette. The land's fog asks this same function for the colour
   of the air along a ray, which is why there is no seam where they meet. */
export const SKY = /* glsl */ `
const vec3 BETA_R = vec3(0.0464, 0.1080, 0.2648);
const float BETA_M = 0.0052;
vec3 skyAt(vec3 rd){
  float e = max(rd.y, 0.0);
  float am = 1.0 / (e + 0.15 * pow(3.885 + degrees(asin(e)), -1.253));
  vec3 beta = BETA_R + BETA_M;
  float mu = dot(rd, uSunDir);
  float pR = 0.0597 * (1.0 + mu * mu);
  float pM = 0.0336 / pow(1.5776 - 1.52 * mu, 1.5) + 0.06 / pow(1.25 - 1.0 * mu, 1.5);
  vec3 sc = (BETA_R * pR + BETA_M * pM * 0.8) / beta;
  vec3 phys = uSunI * sc * (1.0 - exp(-beta * am * 0.3)) * 26.0;
  // After sunset the light that is left hugs the horizon on the sun's side.
  float belt = exp(-e * mix(3.0, 11.0, 1.0 - uDay)) * (0.55 + 0.45 * mu);
  phys *= mix(belt * 1.6 * vec3(1.0, 0.7, 0.62), vec3(1.0), uDay);
  vec3 brand = mix(uDuskLow, uDuskMid, smoothstep(0.0, 0.28, e));
  brand = mix(brand, uDuskTop, smoothstep(0.14, 0.62, e));
  // Night: darkest overhead, with a band of airglow low down that the land stands against.
  vec3 night = mix(uNightLow * 1.25, uNightTop, smoothstep(0.0, 0.36, e)) + (uNightLow * 0.9 + uStar * 0.035) * exp(-e * 13.0) * (1.0 - uDay);
  vec3 lit = 1.0 - exp(-phys * 1.25);
  vec3 col = mix(lit, brand * (0.35 + 1.3 * dot(lit, vec3(0.3, 0.5, 0.2))), 0.4);
  return night * (1.0 - 0.7 * uDay) + col;
}
`;

export const BACK_VERT = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const COMP_VERT = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.9999, 1.0); }`;

export const BACK_FRAG = /* glsl */ `
${COMMON}
${SKY}
uniform vec2 uBackRes;
uniform vec3 uShallow, uMid, uAbyss, uWarmSea, uRay, uRayWarm, uFoam, uBeam, uSigma, uFloor;
uniform float uSunX, uSteps, uBandTilt;

/* Light through a moving surface, after Dave Hoskins' tileable water caustic. */
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 4; n++) {
    if (float(n) >= uSteps) break;
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= uSteps;
  c = 1.17 - pow(c, 1.4);
  return pow(abs(c), 8.0);
}

/* Shafts that fan out from a sun above the surface: a swell field across the angle
   around it, with a finer, faster caustic web inside each shaft. No march. */
float fan(float ang, float r, float t){
  float sw = sin(ang * 23.0 + sin(ang * 7.0 + t * 0.29) * 0.62 + t * 0.24) + 0.6 * sin(ang * 41.0 - t * 0.19);
  float shaft = pow(smoothstep(-0.2, 1.0, sw * 0.5 + 0.5), 1.7);
  float streak = smoothstep(0.6, 1.0, sin(ang * 59.8 + t * 0.324 + r * 4.0));
  // Each shaft breaks up along its length, so none is a clean stripe.
  float body = 0.62 + 0.55 * n2(vec2(ang * 9.0, r * 2.6 - t * 0.12));
  return shaft * (0.86 + 0.26 * streak) * body * exp(-r * 0.9);
}

/* The underside of a surface, seen from just below it: a bright rippled ceiling
   that runs away from the lens, and Snell's window, the cone under the sun where
   the sky still shows through. Outside the cone the ceiling mirrors the deep. */
vec3 ceiling(vec3 w, vec2 c, float y0, float sx, vec3 tint, float amt){
  float H = uView.y;
  float d = c.y - y0;
  if (d <= 0.0 || d > 0.46 * H || amt < 0.01) return w;
  float v = d / (0.46 * H);
  float z = 1.0 / (v + 0.07);
  vec2 p = vec2((c.x - 0.5 * uView.x) / H * z * 0.5, z * 0.9);
  float k = caustic(p * 0.3, uTime * 0.34);
  float fade = (1.0 - v) * (1.0 - v);
  float win = exp(-pow((c.x - sx) / (d * 1.5 + 0.1 * H), 2.0));
  w *= 1.0 - 0.22 * fade * (1.0 - win) * amt;
  return w + tint * fade * amt * (k * (0.2 + 0.5 * win) + 0.16 * win * (1.0 - v));
}

vec3 water(vec2 c){
  float H = uView.y; float W = uView.x;
  float doc = uScroll + c.y;
  float dep = max(doc - uSurfDoc, 0.0) / H;                   // screens of water overhead
  float b = clamp((uShoreDoc - doc) / (1.7 * H), 0.0, 1.0);   // 1 in the deep, 0 at the shore
  // Beer-Lambert: every channel dies at its own rate on the way down, red first,
  // so the water goes from a clear teal to a blue-green dark that never reaches black.
  vec3 T = exp(-uSigma * dep);
  vec3 w = mix(uFloor, uShallow * 1.18, T);
  w *= mix(1.24, 0.84, c.y / H);                              // the light is overhead
  float under = clamp((c.y - uExit) / H, 0.0, 1.0);
  vec3 warm = mix(uWarmSea, uMid, smoothstep(0.0, 1.1, under));
  w = mix(warm, w, smoothstep(0.0, 1.0, b));
  // The worlds bleed into each other: the hero's beams carry on down as the first
  // shafts under the surface, and the low sun reaches the last of the water.
  float fresh = exp(-dep * 1.3);
  fresh *= fresh;
  w = mix(w, uBeam * 0.42, fresh * 0.3);

  float lit1 = (0.13 + 0.87 * exp(-dep / 1.5)) * smoothstep(0.0, 0.7, b);
  vec2 S = vec2(W * 0.6, min(uTop, -0.15 * H) - 0.34 * H);
  vec2 v1 = c - S;
  w += mix(uRay, uBeam, fresh * 0.8) * fan(atan(v1.x, v1.y) * 0.62, length(v1) / H, uTime) * lit1 * (0.44 + 0.2 * fresh);
  float lit2 = (1.0 - b) * (1.0 - b);
  if (lit2 > 0.004) {
    vec2 S2 = vec2(W * uSunX, min(uExit, 0.0) - 0.55 * H);
    vec2 v2 = c - S2;
    w += uRayWarm * fan(atan(v2.x, v2.y) + 2.0, length(v2) / H, uTime * 1.1) * lit2 * 0.42;
  }
  w = ceiling(w, c, uTop, S.x, mix(uRay, uBeam, 0.35), 1.0);
  w = ceiling(w, c, uExit, W * uSunX, uRayWarm, step(-0.4 * H, uExit));
  return w;
}

vec3 sky(vec2 c){
  vec3 rd = viewDir(c);
  vec3 col = skyAt(rd);
  if (uNight > 0.01) {
    // The Milky Way: a tilted band of unresolved stars with a dust rift down it.
    float az = atan(rd.x, -rd.z);
    float el = asin(clamp(rd.y, -1.0, 1.0));
    float ca = cos(uBandTilt); float sa = sin(uBandTilt);
    vec2 g = mat2(ca, -sa, sa, ca) * vec2(az + 0.12, el - 0.2);
    float wide = 0.105 + 0.03 * n1(g.x * 5.0 + 2.0);
    float band = exp(-pow(g.y / wide, 2.0)) * (0.5 + 0.5 * fbm1(g.x * 6.0 + 1.3));
    float cloud = n2(g * vec2(9.0, 26.0) + 4.0) * 0.6 + n2(g * vec2(21.0, 60.0)) * 0.4;
    float rift = smoothstep(0.34, 0.62, fbm1(g.x * 9.0 + 3.0) * 0.6 + cloud * 0.5) * exp(-pow((g.y - 0.012 + 0.03 * sin(g.x * 7.0)) / (wide * 0.42), 2.0));
    float air = smoothstep(0.0, 0.2, rd.y);
    col += (uStar * 0.5 + uNightLow * 1.6) * band * (0.55 + 0.6 * cloud) * (1.0 - 0.86 * rift) * 0.52 * uNight * air;
  }
  // From orbit the air is below the reader; first light gathers along the limb.
  float low = smoothstep(0.55, 1.0, c.y / uView.y);
  col = mix(col, col * 0.7, uOrbit * (1.0 - low));
  col += uDawnLow * low * low * uOrbit * (0.1 + 0.5 * uBreak);
  return col;
}

void main(){
  vec2 c = vec2(gl_FragCoord.x / uBackRes.x * uView.x, (1.0 - gl_FragCoord.y / uBackRes.y) * uView.y);
  vec3 col = c.y < uExit ? sky(c) : water(c);
  gl_FragColor = vec4(col, 1.0);
}`;

export const COMP_FRAG = /* glsl */ `
${COMMON}
uniform sampler2D uBack;
uniform vec2 uRes;
uniform float uDpr, uTexel, uStarPx;
uniform vec3 uFoam;

float starLayer(vec2 g, float cellPx, float rare, float size){
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec2 o = (vec2(h2(id), h2(id + 7.3)) - 0.5) * 0.8;
  float d = length(f - o) * cellPx;
  float b = pow(h2(id + 3.1), rare);
  float tw = 0.74 + 0.26 * sin(uTime * (0.6 + h2(id) * 1.6) + h2(id) * 40.0);
  return b * smoothstep(size, 0.15, d) * tw;
}

void main(){
  vec2 c = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float H = uView.y; float W = uView.x;
  float yTop = uTop + swell(c.x, uTime);
  float dTop = c.y - yTop;
  if (dTop < 0.0) {
    // Above the sea there is only its glint: the beams and the stars are behind the canvas.
    gl_FragColor = vec4(uFoam, exp(dTop / 2.2) * 0.85);
    return;
  }
  float yExit = uExit + swell(c.x + 300.0, uTime * 1.1);
  float dExit = c.y - yExit;
  float open = step(-40.0, uExit);
  // The target is soft, so each side of the shore's waterline samples its own side.
  float y = dExit < 0.0 ? min(c.y, uExit - 1.5 * uTexel) : max(c.y, uExit + 1.5 * uTexel);
  vec3 col = texture2D(uBack, vec2(c.x / W, 1.0 - y / H)).rgb;
  if (dExit < 0.0) {
    vec3 rd = viewDir(c);
    // The sun: a disc with a darkened limb, the colour the air has left it.
    float ds = length(rd - uSunDir);
    float R = 0.021;
    float up = smoothstep(0.02, 0.3, uDay) * (1.0 - uOrbit);
    vec3 warm = uSun * (uSunI / max(max(uSunI.r, uSunI.g), max(uSunI.b, 0.001)));
    // Its light spills into the air around it before the disc itself.
    col += warm * (0.6 * exp(-ds / 0.03) + 0.26 * exp(-ds / 0.13)) * up;
    float disc = smoothstep(R * 1.3, R * 0.72, ds);
    if (disc > 0.0) {
      float q = clamp(ds / R, 0.0, 1.0);
      vec3 body = mix(warm, vec3(1.0), 0.6) * (1.0 - 0.1 * q * q);
      col = mix(col, body * 1.12, disc * up);
    }
    if (uNight > 0.01) {
      // Stars sit in the sky, not on the glass: they turn with the camera and thin
      // out in the thick air near the horizon.
      float az = atan(rd.x, -rd.z);
      float el = asin(clamp(rd.y, -1.0, 1.0));
      float air = smoothstep(0.0, 0.22, rd.y) * mix(1.0, 0.45 + 0.55 * smoothstep(0.5, 1.0, 1.0 - c.y / H), uOrbit);
      vec2 g = vec2(az, el);
      float s = starLayer(g * 44.0, uStarPx / 44.0, 7.0, 1.75) + 0.5 * starLayer(g * 104.0 + 31.0, uStarPx / 104.0, 5.0, 1.1);
      col += uStar * s * uNight * air;
    }
    // The waterline from above: a bright line of surface.
    col = mix(col, uFoam, exp(dExit / 2.0) * 0.8 * open);
  } else {
    // The meniscus: just under each bright line the water goes dark where the
    // surface curls up the glass, then the brightest water there is.
    col *= 1.0 - 0.42 * exp(-max(dExit - 1.0, 0.0) / 3.2) * open;
    col *= 1.0 - 0.42 * exp(-max(dTop - 1.0, 0.0) / 3.2);
    col += uFoam * (0.26 * exp(-dTop / 26.0) + 0.5 * exp(-dTop / 1.3));
    col += uFoam * (0.26 * exp(-dExit / 26.0) + 0.5 * exp(-dExit / 1.3)) * open;
  }
  col = hush(col, c);
  // A little grain, so the long grades never band.
  col += (h2(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.014;
  gl_FragColor = vec4(col, 1.0);
}`;
