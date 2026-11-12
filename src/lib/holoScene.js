/* The welcome hologram: his face as a cloud of light, drawn with plain WebGL
   (one program, one draw call, no library, so the chunk stays a few kilobytes).

   The points come from public/holo/face.bin (scripts/bake-hologram.py): a
   position on a scan row, a depth and a brightness each. Every point also has a
   second home on a sphere. The vertex shader moves it between the two:

     intro  0 to 1   a scan line draws the face from the hair down
     morph  0 to 1   the face loosens and gathers into a ball of folded light
     burst  0 to 1   the ball flies apart, out past the edges of the screen

   Colours are (r, g, b) triples read from the tokens by the caller. */

const VERT = /* glsl */ `
precision highp float;
attribute vec3 aFace;   // x, y in units of the picture's height (y up), z toward the viewer
attribute vec3 aBall;   // the same point's place on a unit sphere
attribute vec4 aData;   // brightness, two random numbers, scan row (0 at the top, 1 at the foot)
uniform vec2 uRes;      // canvas size in device pixels
uniform vec2 uCenter;   // where the head's centre sits, device pixels from the top left
uniform float uSize;    // the picture's height in device pixels
uniform float uBall;    // the ball's radius in device pixels
uniform float uDpr, uTime, uIntro, uMorph, uBurst, uTurn, uNod, uVoice, uStill;
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
  // A word being spoken: the jaw drops a hair's width, and only the jaw.
  float jaw = (1.0 - smoothstep(-0.05, 0.0, f.y + 0.145)) * smoothstep(-0.34, -0.2, f.y) * (1.0 - smoothstep(0.05, 0.2, abs(f.x)));
  f.y -= jaw * uVoice * 0.007;
  // Rarely, a band of rows slips sideways for a few frames.
  float tick = floor(t * 14.0);
  float slip = step(0.965, fract(sin(tick * 91.7) * 43758.5)) * (1.0 - uStill);
  float band = fract(sin(tick * 12.9) * 9631.3);
  f.x += slip * 0.012 * step(abs(row - band), 0.035);
  f = turn(f, uTurn, uNod);
  // The scan line that draws it: rows above the line are lit, the line itself burns.
  float line = uIntro * 1.25 - 0.12;
  float drawn = 1.0 - smoothstep(line - 0.1, line, row);
  float head = exp(-pow((row - line) * 22.0, 2.0)) * step(uIntro, 0.999);
  f.x += (r1 - 0.5) * 0.5 * (1.0 - drawn);
  // A slow bright sweep keeps running down the finished face.
  float sweep = exp(-pow((row - fract(t * 0.11 + 0.3) * 1.6 + 0.3) * 9.0, 2.0)) * (1.0 - uStill);
  float rows = 0.74 + 0.26 * step(0.5, fract(row * 120.0));
  float faceGlow = (0.2 + 0.95 * lum) * rows * drawn + head * 0.9 + sweep * 0.28 * lum;
  faceGlow *= 1.0 + uVoice * 0.1 * sin(t * 31.0 + row * 9.0);

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

  float bu = clamp(uBurst * 1.35 - r2 * 0.35, 0.0, 1.0);
  float fly = bu * bu * (0.35 + 1.25 * r1);
  p += d * fly * max(uRes.x, uRes.y) * 0.62;

  float depth = 1.0 / (1.0 - p.z / (uSize * 3.2));
  vec2 px = uCenter + vec2(p.x, -p.y) * depth;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);

  // One point in nine is a wide, faint one: together they are the haze around the light.
  float haze = step(0.89, r2);
  float size = mix(1.5 + 0.9 * lum, 1.9 + 1.3 * core, m) * mix(1.0, 5.5, haze);
  size *= 1.0 + bu * 1.6 * max(d.z, 0.0);
  gl_PointSize = max(1.0, size * uDpr * depth * clamp(uSize / (540.0 * uDpr), 0.7, 1.25));
  vGlow = mix(faceGlow, ballGlow, m) * mix(1.0, 0.07, haze) * pow(1.0 - bu, 1.15);
  vMix = mix(lum, 0.35 + 0.65 * fold, m);
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

/* Read the baked file into typed arrays. `share` is the part of the points to
   keep (the file is shuffled, so a prefix is an even sample). */
export function parseFace(buffer, share = 1) {
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
    face[i * 3 + 2] = ((view.getUint8(o + 3) - 128) / 100) * 0.2;
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
  return { n, face, ball, data };
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

  const buffers = [];
  const attribute = (name, array, size) => {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
    const at = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
  };
  attribute('aFace', cloud.face, 3);
  attribute('aBall', cloud.ball, 3);
  attribute('aData', cloud.data, 4);

  const u = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uBall', 'uDpr', 'uTime', 'uIntro', 'uMorph', 'uBurst', 'uTurn', 'uNod', 'uVoice', 'uStill', 'uDeep', 'uPale', 'uTint', 'uGain', 'uFlicker']) {
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
     { time, intro, morph, burst, turn, nod, voice, still, gain, flicker, cx, cy, size, ball } */
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
    gl.uniform1f(u.uVoice, s.voice);
    gl.uniform1f(u.uStill, s.still ? 1 : 0);
    gl.uniform1f(u.uGain, s.gain);
    gl.uniform1f(u.uFlicker, s.flicker);
    gl.drawArrays(gl.POINTS, 0, cloud.n);
  }

  function dispose() {
    buffers.forEach((b) => gl.deleteBuffer(b));
    gl.deleteProgram(program);
  }

  return { resize, render, dispose };
}
