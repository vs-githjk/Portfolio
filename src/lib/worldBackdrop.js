/* The backdrop of the three worlds: two full-window passes for lib/worldScene.js.

   BACK is drawn first, under every object: nothing above the sea's surface (the
   hero's beams and stars show through the canvas there), the water below it, and
   the sky of the earth world once the camera has come up through the second
   waterline. LAND is drawn last, over every object, so the sun, the moon and the
   galaxy set behind the ridges.

   Both work in CSS pixels measured from the top left of the window. The two
   waterlines are the only hard edges in the journey:
     uTop   the surface the reader dives through; it is a place in the page
            (the "surface" vista) and leaves through the top of the window
     uExit  the surface the camera rises through at the shore; it comes down
            from the top of the window while the "shore" vista scrolls in
   Everything else is a grade driven by where the reader is in the page. */

const COMMON = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uDpr, uTime, uTop, uExit, uScroll, uSurfDoc, uShoreDoc;
uniform float uDusk, uDawn, uLand, uDrift, uBase;
uniform vec3 uDuskTop, uDuskMid, uDuskLow, uNightTop, uNightLow, uDawnLow;

float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
float fbm1(float x){ return 0.5 * n1(x) + 0.25 * n1(x * 2.03 + 11.3) + 0.125 * n1(x * 4.01 + 3.7) + 0.0625 * n1(x * 8.1 + 7.9); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
/* A waterline seen in section: three slow swells, a few pixels tall. */
float swell(float x, float t){ return sin(x * 0.011 + t * 0.6) * 4.0 + sin(x * 0.027 - t * 0.9) * 2.0 + sin(x * 0.0041 + t * 0.23) * 6.0; }
/* The line where the sky meets the land's haze. */
float horizon(float H){ return H - uBase - H * 0.3 * uLand; }
vec3 lowSky(){ return mix(mix(uDuskLow, uNightLow, uDusk), uDawnLow, uDawn); }
`;

export const BACK_VERT = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.9999, 1.0); }`;

export const LAND_VERT = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const BACK_FRAG = /* glsl */ `
${COMMON}
uniform vec3 uShallow, uMid, uAbyss, uWarmSea, uRay, uRayWarm, uFoam, uSun, uStar;
uniform float uSunX, uSteps;

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

float shafts(float q, float t){
  float a = 0.5 + 0.5 * sin(q * 13.0 + sin(q * 4.7 + t * 0.11) * 1.6 + t * 0.05);
  return a * a * a * (0.55 + 0.45 * sin(q * 31.0 - t * 0.07));
}

vec3 water(vec2 c, float H, float yTop, float yExit){
  float doc = uScroll + c.y;
  float a = clamp((doc - uSurfDoc) / (1.5 * H), 0.0, 1.0);    // 0 at the surface, 1 in the deep
  float b = clamp((uShoreDoc - doc) / (1.7 * H), 0.0, 1.0);   // 1 in the deep, 0 at the shore
  vec3 w = mix(uShallow, uMid, smoothstep(0.0, 0.55, a));
  w = mix(w, uAbyss, smoothstep(0.35, 1.0, a));
  float under = clamp((c.y - yExit) / H, 0.0, 1.0);
  vec3 warm = mix(uWarmSea, uMid, smoothstep(0.0, 1.1, under));
  w = mix(warm, w, smoothstep(0.0, 1.0, b));

  float lit1 = exp(-max(c.y - yTop, 0.0) / (0.95 * H)) * (1.0 - a * 0.9);
  float lit2 = (1.0 - b) * (1.0 - b) * exp(-max(c.y - yExit, 0.0) / (1.2 * H));
  float r1 = shafts((c.x + (c.y - yTop) * 0.34) / H, uTime);
  float r2 = shafts((c.x - (c.y - yExit) * 0.3) / H + 3.0, uTime);
  w += uRay * r1 * lit1 * 0.2 + uRayWarm * r2 * lit2 * 0.26;
  float cw = max(lit1, lit2);
  if (cw > 0.03) {
    float k = caustic(vec2(c.x, (c.y + uScroll * 0.45) * 1.5) / (H * 0.6), uTime * 0.32);
    w += mix(uRay, uRayWarm, lit2 / (lit1 + lit2 + 0.001)) * k * cw * 0.15;
  }
  // The underside of a surface is the brightest water there is.
  w += uFoam * 0.3 * (exp(-max(c.y - yTop, 0.0) / 30.0) + (1.0 - b) * exp(-max(c.y - yExit, 0.0) / 30.0));
  return w;
}

vec3 sky(vec2 c, float H, float W){
  float hz = horizon(H);
  float v = clamp((hz - c.y) / H, 0.0, 1.0);
  vec3 day = mix(uDuskLow, uDuskMid, smoothstep(0.0, 0.36, v));
  day = mix(day, uDuskTop, smoothstep(0.2, 0.85, v));
  vec3 night = mix(uNightLow, uNightTop, smoothstep(0.0, 0.55, v));
  vec3 dawn = mix(uDawnLow, uNightTop, smoothstep(0.0, 0.62, v));
  vec3 col = mix(mix(day, night, uDusk), dawn, uDawn);

  // The sun: a flat pale disc, as on a screen print, and the glow it leaves.
  float lit = 1.0 - smoothstep(0.25, 0.95, uDusk);
  vec2 s = vec2(W * uSunX, hz - H * mix(0.15, -0.14, uDusk));
  float ds = length(c - s);
  float R = H * 0.052;
  col += uSun * exp(-ds / (H * 0.26)) * 0.34 * lit;
  col = mix(col, uSun, smoothstep(R + 0.75, R - 0.75, ds) * lit);

  // Stars come out as the light goes; they sit a long way back, so they barely move.
  float st = smoothstep(0.3, 1.0, uDusk) * (1.0 - 0.7 * uDawn) * smoothstep(0.03, 0.34, v);
  if (st > 0.01) {
    vec2 g = vec2(c.x, c.y + uScroll * 0.05) / 30.0;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 o = (vec2(h2(id), h2(id + 7.3)) - 0.5) * 0.8;
    float d = length(f - o) * 30.0;
    float b = pow(h2(id + 3.1), 7.0);
    float tw = 0.72 + 0.28 * sin(uTime * (0.6 + h2(id) * 1.6) + h2(id) * 40.0);
    col += uStar * b * smoothstep(1.7, 0.2, d) * tw * st;
  }
  return col;
}

void main(){
  vec2 c = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float H = uRes.y / uDpr;
  float W = uRes.x / uDpr;
  float yTop = uTop + swell(c.x, uTime);
  float yExit = uExit + swell(c.x + 300.0, uTime * 1.1);
  float dTop = c.y - yTop;
  if (dTop < 0.0) {
    // Above the sea there is only its glint: the beams and the stars are behind the canvas.
    float g = exp(dTop / 2.2);
    gl_FragColor = vec4(uFoam, g * 0.85);
    return;
  }
  vec3 col;
  float dExit = c.y - yExit;
  if (dExit < 0.0) {
    col = sky(c, H, W);
    col = mix(col, uFoam, exp(dExit / 2.0) * 0.8 * step(-40.0, uExit));
  } else {
    col = water(c, H, yTop, yExit);
  }
  // A little grain, so the long grades never band.
  col += (h2(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.012;
  gl_FragColor = vec4(col, 1.0);
}`;

/* The land: five flat layers, far range to near dune, each a profile along x.
   They drift sideways with the scroll (near layers faster), and the whole land
   sinks to a low band while the reader reads (uLand). */
export const LAND_FRAG = /* glsl */ `
${COMMON}
uniform vec3 uRidge, uRidgeFar, uSun, uEmber, uStar;
uniform float uFig, uFigShow;

float range(float x){ float r = 1.0 - abs(2.0 * fbm1(x) - 1.0); return pow(r, 1.3); }
float mesas(float x){
  float m = fbm1(x * 0.9 + 5.0);
  return smoothstep(0.5, 0.545, m) * 0.7 + smoothstep(0.6, 0.63, m) * 0.3 + 0.16 * fbm1(x * 3.1 + 2.0);
}
float hills(float x){ return fbm1(x * 1.3 + 31.0); }
float dunes(float x){ return 0.62 * (1.0 - abs(sin(x * 1.9 + 0.6 * sin(x * 0.7)))) + 0.38 * n1(x * 0.8 + 9.0); }
float fore(float x){ return n1(x * 0.6 + 77.0); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }

void main(){
  vec2 c = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  float H = uRes.y / uDpr;
  float yExit = uExit + swell(c.x + 300.0, uTime * 1.1);
  if (c.y > yExit || uLand < 0.004) { gl_FragColor = vec4(0.0); return; }
  // The land stands on the waterline while the camera is still coming up, and
  // settles to the foot of the window once the water has gone.
  float up = (H - uBase - c.y) / H;
  if (up > uLand * 0.52) { gl_FragColor = vec4(0.0); return; }
  float x = c.x / H;
  float px = 1.0 / H;
  float lit = 1.0 - smoothstep(0.2, 0.9, uDusk);
  // Far layers take the colour of the air (a dusty mauve at dusk), near ground is
  // warm umber in the last light and almost black at night. Each layer pales
  // toward its foot, where the mist lies, so the ranges read as separate planes.
  vec3 near = uRidge * mix(2.1, 0.44, uDusk);
  vec3 far = mix(uRidgeFar, uRidge * 0.5 + uNightLow * 0.9, uDusk);
  vec3 mist = mix(lowSky(), far, 0.5);
  vec3 rim = uSun * lit + uStar * 0.1 * uDusk * (1.0 - uDawn);
  vec3 col = near * 0.55;
  float a = up < 0.0 ? 1.0 : 0.0;
  float top;
  float body;

  // far range: sharp peaks, a long way off
  top = uLand * (0.3 + 0.2 * range(x * 2.6 + uDrift * 0.03));
  if (up < top) {
    body = smoothstep(top, top - 0.16 * uLand, up);
    col = mix(far, mist, body * 0.55);
    a = 1.0;
    col += rim * 0.22 * smoothstep(2.5 * px, 0.0, top - up);
  }
  // mesas and buttes
  top = uLand * (0.205 + 0.17 * mesas(x * 1.9 + 40.0 + uDrift * 0.06));
  if (up < top) {
    body = smoothstep(top, top - 0.13 * uLand, up);
    col = mix(mix(far, near, 0.36), mist * 0.86, body * 0.5);
    a = 1.0;
    col += rim * 0.34 * smoothstep(2.0 * px, 0.0, top - up);
  }
  // hills, where the post stands
  float xs = x * 1.0 + uDrift * 0.1;
  top = uLand * (0.15 + 0.1 * hills(xs));
  if (up < top) {
    body = smoothstep(top, top - 0.1 * uLand, up);
    col = mix(mix(far, near, 0.66), mist * 0.6, body * 0.4);
    a = 1.0;
    col += rim * 0.2 * smoothstep(1.5 * px, 0.0, top - up);
  }
  if (uFigShow > 0.01) {
    // The command post: a mast with a lamp, and one figure beside it, looking out.
    float k = H / 900.0;
    vec2 p = vec2((xs - uFig) * H, (up - uLand * (0.15 + 0.1 * hills(uFig))) * H) / k;
    float mast = sdBox(p - vec2(-15.0, 26.0), vec2(0.7, 28.0));
    float arm = sdBox(p - vec2(-10.0, 44.0), vec2(5.0, 0.6));
    float body2 = sdBox(p - vec2(4.0, 9.0), vec2(2.4 + (9.0 - (p.y - 9.0)) * 0.12, 9.0)) - 0.6;
    float head = length(p - vec2(4.0, 21.6)) - 2.9;
    float d = min(min(mast, arm), min(body2, head));
    float fig = smoothstep(0.6, -0.4, d) * uFigShow;
    col = mix(col, near * 0.4, fig);
    a = max(a, fig);
    float lamp = length(p - vec2(-15.0, 56.0));
    float glow = (smoothstep(2.2, 0.6, lamp) + 0.5 * exp(-lamp / 9.0)) * (0.7 + 0.3 * sin(uTime * 1.3)) * uFigShow;
    col += uEmber * glow;
    a = max(a, clamp(glow, 0.0, 1.0));
  }
  // dunes: sharp crests, the lit side toward the sun
  top = uLand * (0.075 + 0.085 * dunes(x * 1.4 + 12.0 + uDrift * 0.16));
  if (up < top) {
    body = smoothstep(top, top - 0.07 * uLand, up);
    col = mix(mix(far, near, 0.86), near * 0.7, body);
    a = 1.0;
    col += rim * 0.26 * smoothstep(1.5 * px, 0.0, top - up);
  }
  // the ground underfoot
  top = uLand * (0.02 + 0.06 * fore(x * 1.2 + uDrift * 0.24));
  if (up < top) { col = near * 0.5; a = 1.0; }
  gl_FragColor = vec4(col, a);
}`;
