/* The welcome hologram: his face as a cloud of light, drawn with plain WebGL
   (one program, one draw call, no library, so the chunk stays a few kilobytes).

   The points come from public/holo/face.bin (scripts/bake-hologram.py): a
   position on a scan row, a depth and a brightness each. Every point also has a
   second home on a sphere. The vertex shader moves it between the two:

     intro  0 to 1   a scan line draws the face from the hair down
     morph  0 to 1   the face loosens and gathers into a ball of folded light
     say    0 to 1   the ball unfolds into words: every point has a third home
                     on the letters of one short line (sampleText)
     burst  0 to 1   the words fly apart, out past the edges of the screen
     guide  0 to 1   a few hundred points do not fly: they fall into one small
                     spark, which then goes down the page with the reader

   The spark is the thread through the whole page: the caller moves it (uCenter),
   sets its radius (uOrb) and gives it a trail (uVel, device pixels: each spark
   point hangs back along it by its own share). Once the burst is over only the
   spark's points are drawn.

   Colours are (r, g, b) triples read from the tokens by the caller. */

/* The share of the points that make the spark (every point has a random number
   r2; the spark is those under this). parseFace collects the same ones. */
const SPARK = 0.03;

const VERT = /* glsl */ `
precision highp float;
const float SPARK = ${SPARK.toFixed(3)};
attribute vec3 aFace;   // x, y in units of the picture's height (y up), z toward the viewer
attribute vec3 aBall;   // the same point's place on a unit sphere
attribute vec4 aData;   // brightness, two random numbers, scan row (0 at the top, 1 at the foot)
attribute vec2 aSay;    // the same point's place on the words, in units of the line's width (y up)
uniform vec2 uRes;      // canvas size in device pixels
uniform vec2 uCenter;   // where the head's centre sits, device pixels from the top left
uniform float uSize;    // the picture's height in device pixels
uniform float uBall;    // the ball's radius in device pixels
uniform float uDpr, uTime, uIntro, uMorph, uBurst, uTurn, uNod, uVoice, uStill;
uniform float uSay, uSayW;  // the words: how far they have formed, and the line's width in device pixels
uniform float uGuide, uOrb; // the spark: how far it has formed, and its radius in device pixels
uniform vec2 uVel;          // its trail, device pixels
varying float vGlow;
varying float vMix;

vec3 turn(vec3 p, float a, float b) {
  float c = cos(a), s = sin(a);
  p = vec3(p.x * c + p.z * s, p.y, p.z * c - p.x * s);
  c = cos(b); s = sin(b);
  return vec3(p.x, p.y * c - p.z * s, p.z * c + p.y * s);
}

void main() {
  float lum = aData.x, r1 = aData.y, r2 = aData.z, row = aData.w;
  float t = uTime;

  // ---- the face ------------------------------------------------------------
  vec3 f = aFace;
  // A word being spoken: the jaw eases down a hair's width, and only the jaw.
  float jaw = (1.0 - smoothstep(-0.05, 0.0, f.y + 0.145)) * smoothstep(-0.34, -0.2, f.y) * (1.0 - smoothstep(0.05, 0.2, abs(f.x)));
  f.y -= jaw * uVoice * 0.005;
  // The head turns on the neck: the shoulders stay where they are, the neck
  // follows part of the way, and the axis runs behind the face, not through it.
  float above = smoothstep(-0.3, -0.13, f.y);
  vec3 h = f + vec3(0.0, 0.0, 0.1);
  h = turn(h, uTurn * above, uNod * above);
  f = h - vec3(0.0, 0.0, 0.1);
  // The scan line that draws it: rows above the line are lit, the line itself burns.
  float line = uIntro * 1.25 - 0.12;
  float drawn = 1.0 - smoothstep(line - 0.1, line, row);
  float head = exp(-pow((row - line) * 22.0, 2.0)) * step(uIntro, 0.999);
  f.x += (r1 - 0.5) * 0.5 * (1.0 - drawn);
  // A slow bright sweep keeps running down the finished face.
  float sweep = exp(-pow((row - fract(t * 0.11 + 0.3) * 1.6 + 0.3) * 9.0, 2.0)) * (1.0 - uStill);
  float rows = 0.74 + 0.26 * step(0.5, fract(row * 120.0));
  float faceGlow = (0.2 + 0.95 * lum) * rows * drawn + head * 0.9 + sweep * 0.28 * lum;

  // ---- the ball --------------------------------------------------------------
  vec3 d = turn(aBall, t * 0.21, 0.35 + 0.1 * sin(t * 0.17));
  float fold = 1.0 - abs(sin(d.x * 4.6 + 2.2 * sin(d.y * 3.7 + t * 0.35) + 1.4 * sin(d.z * 5.1 - t * 0.27)));
  float wave = sin(d.x * 3.1 + t * 1.25) * sin(d.y * 2.7 - t * 1.05) * sin(d.z * 3.4 + t * 0.9);
  float core = step(r2, 0.14);
  float rad = mix(1.0 + 0.2 * wave + 0.1 * fold + 0.035 * sin(t * 2.1), 0.2 + 0.5 * sqrt(r1), core);
  vec3 b = d * rad;
  float ballGlow = mix(0.3 + 0.7 * fold * fold, 0.9, core) * mix(0.4, 1.0, smoothstep(-0.7, 0.5, d.z));

  // ---- between them ----------------------------------------------------------
  float m = clamp(uMorph * 1.55 - r1 * 0.55, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(f * uSize, b * uBall, m);
  float loose = sin(m * 3.14159);
  p += vec3(sin(r1 * 40.0 + t * 0.9), cos(r2 * 33.0 + t * 1.1), sin(r1 * 17.0 - t)) * uSize * 0.06 * loose;

  // The words: the ball opens and every point goes to its letter. The wide faint
  // points go dark there, so the letters stay crisp.
  float sy = clamp(uSay * 1.6 - r1 * 0.6, 0.0, 1.0);
  sy = sy * sy * (3.0 - 2.0 * sy);
  vec3 word = vec3(aSay * uSayW, 0.0);
  word.y += sin(t * 1.1 + aSay.x * 9.0) * uSayW * 0.004;
  p = mix(p, word, sy);
  p += vec3(sin(r2 * 51.0 + t), cos(r1 * 47.0 - t), 0.0) * uBall * 0.5 * sin(sy * 3.14159);

  // The spark: the few points that stay when the rest fly.
  float spark = step(r2, SPARK);
  float g = uGuide * spark;
  float halo = step(0.86, fract(r1 * 13.7)); // a few wide faint ones: its glow
  float lag = fract(r1 * 7.13);
  vec3 orb = turn(aBall, t * 1.4 + r1 * 6.283, t * 0.9 + r1 * 3.0) * uOrb * (0.2 + 0.8 * sqrt(lag)) * (1.0 + 0.12 * sin(t * 3.1 + r1 * 20.0));

  float bu = clamp(uBurst * 1.35 - r2 * 0.35, 0.0, 1.0);
  float fly = bu * bu * (0.35 + 1.25 * r1) * (1.0 - spark);
  p += d * fly * max(uRes.x, uRes.y) * 0.62;
  p = mix(p, orb, g);

  float depth = mix(1.0 / (1.0 - p.z / (uSize * 3.2)), 1.0, g);
  vec2 px = uCenter + vec2(p.x, -p.y) * depth + uVel * lag * lag * g;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);

  // One point in nine is a wide, faint one: together they are the haze around the light.
  float haze = step(0.89, r2);
  float size = mix(1.5 + 0.9 * lum, 1.9 + 1.3 * core, m) * mix(1.0, 5.5, haze);
  size *= 1.0 + bu * 1.6 * max(d.z, 0.0);
  float base = mix(size * clamp(uSize / (540.0 * uDpr), 0.7, 1.25), 1.7 + bu * 2.0 * r1, sy) * uDpr * depth;
  float sparkSize = mix(2.1, 0.55 * uOrb / uDpr + 6.0, halo) * uDpr * (1.0 - 0.5 * lag * lag * step(1.0, length(uVel)));
  gl_PointSize = max(1.0, mix(base, sparkSize, g));
  float glow = mix(mix(faceGlow, ballGlow, m) * mix(1.0, 0.07, haze), 0.85 * (1.0 - haze), sy) * pow(1.0 - bu * (1.0 - spark), 1.15);
  vGlow = mix(glow, mix(0.5, 0.06, halo) * (1.0 - 0.6 * lag * lag), g);
  vMix = mix(mix(mix(lum, 0.35 + 0.65 * fold, m), 0.72 + 0.28 * r1, sy), 0.55 + 0.45 * (1.0 - lag), g);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uDeep, uPale, uTint;
uniform float uGain, uFlicker;
varying float vGlow;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.08, 0.5, d)) * vGlow * uGain * uFlicker;
  vec3 col = mix(mix(uTint, uDeep, smoothstep(0.0, 0.4, vMix)), uPale, smoothstep(0.35, 1.0, vMix));
  gl_FragColor = vec4(col * a, a * 0.55);
}
`;

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

/* Where the letters of a few short lines are: the line is drawn once on a 2D
   canvas in the display face and every other lit pixel becomes a place a point
   can go. Returns x, y pairs in units of the block's width, centred, y up. */
export function sampleText(lines, family) {
  const size = 96;
  const lead = size * 1.1;
  const canvas = document.createElement('canvas');
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) return new Float32Array(0);
  const font = `400 ${size}px ${family}`;
  g.font = font;
  const W = Math.ceil(Math.max(...lines.map((l) => g.measureText(l).width))) + 12;
  const H = Math.ceil(lead * lines.length + size * 0.4);
  canvas.width = W;
  canvas.height = H;
  g.font = font;
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  lines.forEach((l, k) => g.fillText(l, W / 2, size * 0.98 + k * lead));
  const d = g.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (d[(y * W + x) * 4 + 3] > 120) pts.push((x - W / 2) / W, (H / 2 - y) / W);
    }
  }
  return new Float32Array(pts);
}

/* Read the baked file into typed arrays. `share` is the part of the points to
   keep (the file is shuffled, so a prefix is an even sample). */
export function parseFace(buffer, share = 1, letters = new Float32Array(0)) {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== 'HOLO') throw new Error('hologram: not a face file');
  const total = view.getUint32(4, true);
  const rows = view.getUint16(8, true);
  const aspect = view.getUint16(10, true) / 1000;
  if (buffer.byteLength < 12 + total * 5) throw new Error('hologram: face file is cut short');
  const n = Math.max(1, Math.floor(total * share));
  const face = new Float32Array(n * 3);
  const ball = new Float32Array(n * 3);
  const data = new Float32Array(n * 4);
  // A tiny seeded generator: the same cloud on every load.
  let s = 20261112;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0, o = 12; i < n; i += 1, o += 5) {
    const row = (view.getUint8(o + 2) + 0.5) / rows;
    // The head's centre is the pivot: 0.51 across and 0.327 down the picture.
    face[i * 3] = (view.getUint16(o, true) / 65535 - 0.51) * aspect;
    face[i * 3 + 1] = 0.327 - row;
    // A shallow relief: enough depth to feel solid in a two degree sway, not enough
    // to push the head out from the neck.
    face[i * 3 + 2] = ((view.getUint8(o + 3) - 128) / 100) * 0.09;
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    ball[i * 3] = Math.cos(i * GOLDEN) * r;
    ball[i * 3 + 1] = y;
    ball[i * 3 + 2] = Math.sin(i * GOLDEN) * r;
    data[i * 4] = view.getUint8(o + 4) / 255;
    data[i * 4 + 1] = rnd();
    data[i * 4 + 2] = rnd();
    data[i * 4 + 3] = row;
  }
  // Each point's letter: an even share of the sampled places, in a fixed shuffle.
  const say = new Float32Array(n * 2);
  const places = letters.length / 2;
  for (let i = 0; i < n && places > 0; i += 1) {
    const j = Math.floor(rnd() * places);
    say[i * 2] = letters[j * 2] + (rnd() - 0.5) * 0.003;
    say[i * 2 + 1] = letters[j * 2 + 1] + (rnd() - 0.5) * 0.003;
  }
  // The spark's points again, on their own, so that after the burst a frame is a
  // few hundred points instead of the whole cloud.
  const keep = [];
  for (let i = 0; i < n; i += 1) if (data[i * 4 + 2] <= SPARK) keep.push(i);
  const pick = (from, size) => {
    const out = new Float32Array(keep.length * size);
    keep.forEach((i, k) => out.set(from.subarray(i * size, i * size + size), k * size));
    return out;
  };
  const spark = { n: keep.length, face: pick(face, 3), ball: pick(ball, 3), data: pick(data, 4), say: pick(say, 2) };
  return { n, face, ball, data, say, spark, speaks: places > 0 };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'hologram: shader');
  return shader;
}

/* Build the scene on a canvas. Throws if WebGL is not there. `colors` holds
   three [r, g, b] arrays in 0 to 1: deep, pale and tint. */
export function createHologram(canvas, cloud, colors) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('hologram: no WebGL');

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'hologram: link');
  gl.useProgram(program);

  // Two sets of the same three attributes: the whole cloud, and the spark alone.
  const buffers = [];
  const SHAPE = [
    ['aFace', 'face', 3],
    ['aBall', 'ball', 3],
    ['aData', 'data', 4],
    ['aSay', 'say', 2],
  ];
  SHAPE.forEach(([name]) => gl.enableVertexAttribArray(gl.getAttribLocation(program, name)));
  const upload = (set) =>
    SHAPE.map(([name, key, size]) => {
      const buffer = gl.createBuffer();
      buffers.push(buffer);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, set[key], gl.STATIC_DRAW);
      return { at: gl.getAttribLocation(program, name), buffer, size };
    });
  const sets = { all: { n: cloud.n, attrs: upload(cloud) }, spark: { n: cloud.spark.n, attrs: upload(cloud.spark) } };
  let bound = null;
  const bind = (set) => {
    if (bound === set) return;
    bound = set;
    for (const a of set.attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.vertexAttribPointer(a.at, a.size, gl.FLOAT, false, 0, 0);
    }
  };

  const u = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uBall', 'uDpr', 'uTime', 'uIntro', 'uMorph', 'uBurst', 'uTurn', 'uNod', 'uVoice', 'uStill', 'uSay', 'uSayW', 'uDeep', 'uPale', 'uTint', 'uGain', 'uFlicker', 'uGuide', 'uOrb', 'uVel']) {
    u[name] = gl.getUniformLocation(program, name);
  }
  gl.uniform3fv(u.uDeep, colors.deep);
  gl.uniform3fv(u.uPale, colors.pale);
  gl.uniform3fv(u.uTint, colors.tint);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  let dpr = 1;
  function resize(width, height, ratio) {
    dpr = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /* One frame. Lengths are CSS pixels; `s` is the state:
     { time, intro, morph, say, sayW, burst, turn, nod, still, gain, flicker, cx, cy, size, ball,
       guide, orb, vx, vy, alone }; `alone` draws only the spark. */
  function render(s) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (s.gain <= 0.002) return;
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uCenter, s.cx * dpr, s.cy * dpr);
    gl.uniform1f(u.uSize, s.size * dpr);
    gl.uniform1f(u.uBall, s.ball * dpr);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uIntro, s.intro);
    gl.uniform1f(u.uMorph, s.morph);
    gl.uniform1f(u.uBurst, s.burst);
    gl.uniform1f(u.uTurn, s.turn);
    gl.uniform1f(u.uNod, s.nod);
    gl.uniform1f(u.uStill, s.still ? 1 : 0);
    gl.uniform1f(u.uGain, s.gain);
    gl.uniform1f(u.uFlicker, s.flicker ?? 1);
    gl.uniform1f(u.uSay, cloud.speaks ? s.say || 0 : 0);
    gl.uniform1f(u.uSayW, (s.sayW || 0) * dpr);
    gl.uniform1f(u.uVoice, s.voice || 0);
    gl.uniform1f(u.uGuide, s.guide || 0);
    gl.uniform1f(u.uOrb, (s.orb || 0) * dpr);
    gl.uniform2f(u.uVel, (s.vx || 0) * dpr, (s.vy || 0) * dpr);
    const set = s.alone ? sets.spark : sets.all;
    bind(set);
    gl.drawArrays(gl.POINTS, 0, set.n);
  }

  function dispose() {
    buffers.forEach((b) => gl.deleteBuffer(b));
    gl.deleteProgram(program);
  }

  return { resize, render, dispose };
}
