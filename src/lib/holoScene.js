/* The welcome hologram: his face as a cloud of light, drawn with plain WebGL
   (no library, so the chunk stays a few kilobytes).

   The points come from public/holo/face.bin (scripts/bake-hologram.py): a
   position on a scan row, a depth and a brightness each. Every point also has a
   second home in the ball, which is a small world of light, not a noise sphere:
   a globe whose points sit on parallels that turn at their own speeds (as the
   face sits on scan rows), a flat ring around it with a gap, and a hot core.
   When the ball speaks, a wave runs round the ring like a voice on a scope. It
   is the page in miniature: the ring of builds round his name, the ringed giant
   in the sea. The vertex shader moves every point between its homes:

     intro  0 to 1   stars gather into the face behind a scan line, hair first
     morph  0 to 1   the face loosens and gathers into the ringed world
     burst  0 to 1   the ring goes out as a shock wave, the globe flies apart

   Light: a fixed key from the upper left and a rim on the silhouette, both from
   a normal estimated from where a point sits on the head, so the light moves
   across the face as it turns. Glow: the same points are drawn a second time,
   larger, into a third-size buffer that is blurred and added back (a bloom), so
   the light has air around it instead of a halo of big sprites.

   Colours are (r, g, b) triples read from the tokens by the caller. */

const VERT = /* glsl */ `
precision highp float;
attribute vec3 aFace;   // x, y in units of the picture's height (y up), z toward the viewer
attribute vec3 aBall;   // globe: longitude, latitude, 0. ring: angle, radius, lift. core: angle, height, radius
attribute vec4 aData;   // brightness, two random numbers, scan row (0 at the top, 1 at the foot)
attribute float aKind;  // 0 globe, 1 ring, 2 core
uniform vec2 uRes;      // target size in device pixels
uniform vec2 uCenter;   // where the head's centre sits, device pixels from the top left
uniform float uSize;    // the picture's height in device pixels
uniform float uBall;    // the globe's radius in device pixels
uniform float uDpr, uTime, uIntro, uMorph, uBurst, uTurn, uNod, uVoice, uSpeak, uStill, uWide, uHaze;
varying float vGlow;
varying float vMix;
varying float vHot;

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
  // Where the point sits on the head gives a rough normal; it turns with the head.
  vec3 n = normalize(vec3(aFace.x * 3.1, (aFace.y - 0.02) * 1.5, 0.6));
  n = turn(n, uTurn * above, uNod * above);
  float key = clamp(dot(n, normalize(vec3(-0.5, 0.36, 0.78))), 0.0, 1.0);
  float edge = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.2) * above;

  // The scan line that draws it. Ahead of the line a point is still a star, far
  // out on a wide field; as the line passes it comes home.
  float line = uIntro * 1.34 - 0.17;
  float drawn = 1.0 - smoothstep(line - 0.17, line, row);
  float home = drawn * drawn * (3.0 - 2.0 * drawn);
  float head = exp(-pow((row - line) * 26.0, 2.0)) * step(uIntro, 0.999);
  vec3 star = vec3((r1 - 0.5) * 3.6, (r2 - 0.5) * 2.3 + 0.08, -0.5 - r1);
  f = mix(star, f, home);
  // A slow bright sweep keeps running down the finished face.
  float sweep = exp(-pow((row - fract(t * 0.11 + 0.3) * 1.6 + 0.3) * 9.0, 2.0)) * (1.0 - uStill);
  float lit = (0.1 + 0.8 * lum) * (0.66 + 0.46 * key) + edge * 0.26;
  float twinkle = 0.5 + 0.5 * sin(t * (1.0 + r1 * 2.0) + r2 * 40.0);
  float faceGlow = mix(0.16 * twinkle * step(0.55, r2), lit, home) + head * 0.9 + sweep * 0.24 * lum;
  float faceHot = smoothstep(0.72, 1.0, lum) * 0.5 * home + head * 0.8 + sweep * 0.2 * lum;

  // ---- the ball: a small ringed world ---------------------------------------
  float live = 1.0 - uStill;
  vec3 b;
  float ballGlow;
  float ballHot;
  float ballSize;
  if (aKind < 0.5) {
    // The globe: parallels that turn at their own speeds, like the bands of a giant.
    float lat = aBall.y;
    float lon = aBall.x + t * (0.2 + 0.12 * sin(lat * 5.0 + 1.0)) * live;
    b = vec3(cos(lat) * sin(lon), sin(lat), cos(lat) * cos(lon)) * (1.0 + 0.03 * uSpeak * sin(t * 9.5));
    float band = 0.5 + 0.5 * sin(lat * 13.0 + 0.6);
    ballGlow = 0.2 + 0.62 * band * band;
    ballHot = 0.0;
    ballSize = 1.35;
  } else if (aKind < 1.5) {
    // The ring: nearer rock turns faster. When the ball speaks a wave runs round it.
    float r = aBall.y;
    float ang = aBall.x + t * 0.42 / pow(r, 1.5) * live;
    float wave = sin(ang * 6.0 - t * 8.0) * 0.1 + sin(ang * 11.0 + t * 13.0) * 0.055;
    b = vec3(cos(ang) * r, aBall.z + wave * uSpeak, sin(ang) * r);
    ballGlow = 0.46 + 0.44 * r2 + 0.5 * uSpeak * abs(wave) * 6.0;
    ballHot = 0.25 * uSpeak;
    ballSize = 1.15;
  } else {
    // The core: a small hot star that the globe is wrapped round.
    float y = aBall.y;
    float q = sqrt(max(0.0, 1.0 - y * y));
    float th = aBall.x + t * 0.6 * live;
    b = vec3(cos(th) * q, y, sin(th) * q) * aBall.z * (1.0 + 0.12 * sin(t * 2.6 + r1 * 6.3) * live + 0.2 * uSpeak * sin(t * 9.5));
    ballGlow = 0.8;
    ballHot = 0.7;
    ballSize = 1.7;
  }
  // The whole world leans toward the viewer and rolls a little, so the ring reads as a ring.
  b = turn(b, 0.22 * sin(t * 0.13), 0.4);
  b = vec3(b.x * 0.951 + b.y * 0.309, b.y * 0.951 - b.x * 0.309, b.z);
  ballGlow *= mix(0.3, 1.0, smoothstep(-0.9, 0.5, b.z));

  // ---- between them ----------------------------------------------------------
  float m = clamp(uMorph * 1.55 - r1 * 0.55, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(f * uSize, b * uBall, m);
  float loose = sin(m * 3.14159);
  p += vec3(sin(r1 * 40.0 + t * 0.9), cos(r2 * 33.0 + t * 1.1), sin(r1 * 17.0 - t)) * uSize * 0.045 * loose;

  // The burst: the ring leaves first, as a wave; the globe and the core follow.
  float lead = aKind > 0.5 && aKind < 1.5 ? 0.12 : 0.36;
  float bu = clamp(uBurst * (1.0 + lead) - r2 * lead, 0.0, 1.0);
  float fly = bu * bu * (aKind > 0.5 && aKind < 1.5 ? 1.5 : 0.35 + 1.25 * r1);
  vec3 dir = normalize(b + 0.0001);
  p += dir * fly * max(uRes.x, uRes.y) * 0.62;

  float depth = 1.0 / (1.0 - p.z / (uSize * 3.2));
  vec2 px = uCenter + vec2(p.x, -p.y) * depth;
  gl_Position = vec4(px.x / uRes.x * 2.0 - 1.0, 1.0 - px.y / uRes.y * 2.0, 0.0, 1.0);

  float size = mix(mix(0.9, 1.25 + 0.95 * lum, home), ballSize, m);
  size *= 1.0 + bu * 1.4 * max(dir.z, 0.0);
  // Nearer points are a little larger: the cloud has a front and a back.
  size *= depth * clamp(uSize / (540.0 * uDpr), 0.7, 1.25);
  // Without the bloom pass (a phone), one point in ten is a wide, faint one:
  // together they are the air around the light, for the price of nothing.
  float haze = uHaze * step(0.9, r1);
  gl_PointSize = max(1.0, size * uDpr * uWide * mix(1.0, 6.0, haze));
  vGlow = mix(faceGlow, ballGlow, m) * pow(1.0 - bu, 1.15) * mix(1.0, 0.06, haze);
  vHot = mix(faceHot, ballHot, m);
  vMix = mix(lum * (0.6 + 0.4 * home), 0.3 + 0.7 * ballGlow, m);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
uniform vec3 uDeep, uPale, uTint, uHot;
uniform float uGain;
varying float vGlow;
varying float vMix;
varying float vHot;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5) * vGlow * uGain;
  vec3 col = mix(mix(uTint, uDeep, smoothstep(0.0, 0.4, vMix)), uPale, smoothstep(0.35, 1.0, vMix));
  col = mix(col, uHot, clamp(vHot, 0.0, 1.0));
  gl_FragColor = vec4(col * a, a * 0.55);
}
`;

/* The bloom: a full-target triangle pair, a nine-tap blur and a plain copy. */
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
  const kind = new Float32Array(n);
  // A tiny seeded generator: the same cloud on every load.
  let s = 20261112;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const BANDS = 44; // the globe's parallels
  for (let i = 0, o = 12; i < n; i += 1, o += 5) {
    const row = (view.getUint8(o + 2) + 0.5) / rows;
    // The head's centre is the pivot: 0.51 across and 0.327 down the picture.
    face[i * 3] = (view.getUint16(o, true) / 65535 - 0.51) * aspect;
    face[i * 3 + 1] = 0.327 - row;
    // A shallow relief: enough depth to feel solid in a slow turn, not enough to
    // push the head out from the neck.
    face[i * 3 + 2] = ((view.getUint8(o + 3) - 128) / 100) * 0.09;
    const pick = rnd();
    if (pick < 0.55) {
      // Globe: equal-area parallels, so no pole is crowded.
      const y = 1 - (2 * (Math.floor(rnd() * BANDS) + 0.5)) / BANDS;
      ball[i * 3] = rnd() * TAU;
      ball[i * 3 + 1] = Math.asin(y);
    } else if (pick < 0.88) {
      // Ring: 1.42 to 2.02 globe radii, denser inside, with one clear gap.
      kind[i] = 1;
      let r = 1.42 + Math.pow(rnd(), 1.25) * 0.6;
      if (Math.abs(r - 1.76) < 0.035) r += 0.075;
      ball[i * 3] = rnd() * TAU;
      ball[i * 3 + 1] = r;
      ball[i * 3 + 2] = (rnd() - 0.5) * 0.02;
    } else {
      kind[i] = 2;
      ball[i * 3] = rnd() * TAU;
      ball[i * 3 + 1] = rnd() * 2 - 1;
      ball[i * 3 + 2] = 0.05 + 0.2 * Math.sqrt(rnd());
    }
    data[i * 4] = view.getUint8(o + 4) / 255;
    data[i * 4 + 1] = rnd();
    data[i * 4 + 2] = rnd();
    data[i * 4 + 3] = row;
  }
  return { n, face, ball, data, kind };
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
   four [r, g, b] arrays in 0 to 1: deep, pale, tint and hot. `bloom` is the
   strength of the glow (0 turns the second pass off). */
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
  attribute('aBall', cloud.ball, 3);
  attribute('aData', cloud.data, 4);
  attribute('aKind', cloud.kind, 1);
  const quad = gl.createBuffer();
  buffers.push(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const quadAt = gl.getAttribLocation(blur, 'aPos');

  const u = {};
  for (const name of ['uRes', 'uCenter', 'uSize', 'uBall', 'uDpr', 'uTime', 'uIntro', 'uMorph', 'uBurst', 'uTurn', 'uNod', 'uVoice', 'uSpeak', 'uStill', 'uWide', 'uHaze', 'uDeep', 'uPale', 'uTint', 'uHot', 'uGain']) {
    u[name] = gl.getUniformLocation(program, name);
  }
  const ub = { uTex: gl.getUniformLocation(blur, 'uTex'), uStep: gl.getUniformLocation(blur, 'uStep'), uGain: gl.getUniformLocation(blur, 'uGain') };
  gl.useProgram(program);
  gl.uniform3fv(u.uDeep, colors.deep);
  gl.uniform3fv(u.uPale, colors.pale);
  gl.uniform3fv(u.uTint, colors.tint);
  gl.uniform3fv(u.uHot, colors.hot);
  gl.uniform1f(u.uHaze, bloom > 0 ? 0 : 1);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  // Two third-size targets for the bloom: the points go into one, the blur
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

  function points(s, scale, wide) {
    gl.useProgram(program);
    for (const a of attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buffer);
      gl.enableVertexAttribArray(a.at);
      gl.vertexAttribPointer(a.at, a.size, gl.FLOAT, false, 0, 0);
    }
    gl.uniform2f(u.uRes, canvas.width * scale, canvas.height * scale);
    gl.uniform2f(u.uCenter, s.cx * dpr * scale, s.cy * dpr * scale);
    gl.uniform1f(u.uSize, s.size * dpr * scale);
    gl.uniform1f(u.uBall, s.ball * dpr * scale);
    gl.uniform1f(u.uDpr, dpr * scale);
    gl.uniform1f(u.uWide, wide);
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uIntro, s.intro);
    gl.uniform1f(u.uMorph, s.morph);
    gl.uniform1f(u.uBurst, s.burst);
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
     { time, intro, morph, burst, turn, nod, voice, speak, still, gain, glow, cx, cy, size, ball } */
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
      points(s, 1 / SHRINK, 2.4);
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
    points(s, 1, 1);
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
