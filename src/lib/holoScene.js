/* The welcome hologram: a figure, projected. Plain WebGL, one draw call, no
   library, so the chunk stays a few kilobytes.

   The figure is any picture with a transparent background (PNG or WebP with
   alpha, any aspect, a bust or a whole body): its alpha is its silhouette, and
   nothing rectangular is ever drawn round it. A picture with no alpha comes out
   as its own rectangle. What is drawn, all in one fragment shader over one
   triangle (clipped with a scissor to the part of the window the light reaches):

     the emitter   a small plate under the figure: two rims seen edge on, a hot slit
     the cone      soft light fanning up from the plate to the figure's foot and
                   on, faintly, behind it
     the figure    the picture in the page's blue light: its own tones mapped onto
                   the hologram's ramp with a little of its own colour left in
                   (--holo-warm), at the screen's own resolution and a little
                   sharper than the picture; a thin line of light along its edge
                   and a soft glow in the air outside it only; a trace of red and
                   blue at the silhouette; faint scan lines that leave the face
                   alone; a slow band of brighter light rolling up it; the foot
                   dissolving into lines. A crystal's glow or a ring of glyphs is
                   added to the page as light, never laid over it

   Nothing ever moves a row of the picture sideways and nothing warps it: a slip
   of that kind was read as a glitch in his eyes. The shimmer is light only.

   Two clocks, both 0 to 1, given by the caller:

     on    the projector starts: the plate lights, the cone rises, the figure,
           faint and whole at first, is firmed up by a line from its foot upward
     out   the projector lets go: two curtains of light close over the figure
           from its sides (it is never squeezed) and leave one vertical beam,
           which lifts off the plate and is gone

   The same look is drawn in CSS for the small panels beside it (.hub-pic in
   v4-opening.css): the ramp, the line pitch and the plate there mirror the
   numbers here. Colours are (r, g, b) triples read from the tokens by the caller. */

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;    // the canvas in device pixels
uniform vec4 uPane;   // the figure's picture: centre x, centre y (from the top), half width, half height
uniform vec3 uEmit;   // the plate: centre x, y, half width
uniform float uPx;    // device pixels to a CSS pixel
uniform float uKeep;  // no light below this line (device pixels from the top): the hero's words start there
uniform float uTime, uOn, uOut, uGain, uWarm, uPitch, uFoot;
uniform vec3 uFace;   // his face in the picture: centre (0 to 1 across and down) and reach (of the height); reach 0 is no face
uniform vec3 uDeep, uPale, uHot;
uniform sampler2D uTex;
uniform sampler2D uAir;  // the silhouette, small and blurred: the light in the air round the figure

float ease(float x) { return x * x * (3.0 - 2.0 * x); }
float span(float a, float b, float x) { return clamp((x - a) / (b - a), 0.0, 1.0); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

/* How solid the figure is at a point of its picture: its alpha, and nothing outside it. */
float A(vec2 uv) {
  vec2 s = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return texture2D(uTex, uv).a * s.x * s.y;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 c = uPane.xy;
  vec2 size = uPane.zw;
  vec2 q = (p - c) / size;             // -1 to 1 across the picture
  float t = uTime;
  float px = uPx;

  // ---- the clocks ----------------------------------------------------------
  float plateOn = ease(span(0.0, 0.22, uOn));
  float coneUp = ease(span(0.1, 0.5, uOn));
  float scan = ease(span(0.3, 0.92, uOn));           // the picture, foot to crown
  float shut = ease(span(0.0, 0.5, uOut));           // the curtains close
  float lift = span(0.46, 1.0, uOut);                // the beam leaves
  float plateOff = 1.0 - ease(span(0.3, 0.58, uOut));

  float top = c.y - size.y;
  float foot = c.y + size.y;

  // ---- the figure -------------------------------------------------------------
  vec2 uv = q * 0.5 + 0.5;
  vec2 texel = 0.5 / size;             // one device pixel, in the picture's own measure
  vec4 tx = texture2D(uTex, uv);
  float a = A(uv);
  vec3 src = tx.a > 0.004 ? tx.rgb / tx.a : vec3(0.0);
  // Fine detail, a little stronger than the picture has it (the mean of four
  // neighbours a pixel away, taken off): cloth, hair and stars stay sharp in the light.
  vec2 d1 = texel * 1.2;
  vec4 n4 = texture2D(uTex, uv + vec2(d1.x, 0.0)) + texture2D(uTex, uv - vec2(d1.x, 0.0)) + texture2D(uTex, uv + vec2(0.0, d1.y)) + texture2D(uTex, uv - vec2(0.0, d1.y));
  vec3 mean4 = n4.a > 0.016 ? n4.rgb / n4.a : src;
  float solid = step(0.98, tx.a) * step(3.92, n4.a);
  src = clamp(src + (src - mean4) * 0.7 * solid, 0.0, 1.0);
  float l = luma(src);
  // The figure's edge from inside (where the light gathers), read close by, and the
  // air just outside it (the halo), read from the blurred silhouette: a smooth
  // falloff, and never anything over the figure itself.
  float near = 0.0;
  for (int i = 0; i < 8; i++) {
    float ang = float(i) * 0.7854;
    near += A(uv + vec2(cos(ang), sin(ang)) * texel * px * 2.4);
  }
  near /= 8.0;
  float rim = a * clamp((1.0 - near) * 2.6, 0.0, 1.0);
  float wide = texture2D(uAir, clamp(uv, 0.0, 1.0)).a * step(abs(q.x), 1.08) * step(abs(q.y), 1.04);
  float halo = (1.0 - a) * wide * wide * 1.5;
  // Light that is only light (a crystal's glow, a ring of glyphs: bright and not
  // solid) is added to the page, never laid over it, so it has no dark disc.
  float beamy = (1.0 - a) * smoothstep(0.3, 0.75, l);
  // The red and the blue of the silhouette sit under a pixel apart.
  vec2 o = vec2(0.8 * px, 0.0) * texel;
  float aR = A(uv + o);
  float aB = A(uv - o);

  // The hologram's ramp: deep blue in the shadows, the pale blue through the mid
  // tones, near white on the brightest. The shadows never fall to nothing, so dark
  // hair, eyes and cloth are blue, not holes.
  float g = pow(clamp(l * 1.08, 0.0, 1.0), 0.82);
  vec3 ramp = mix(uDeep * 0.24, uDeep * 0.86, smoothstep(0.0, 0.34, g));
  ramp = mix(ramp, uPale, smoothstep(0.22, 0.8, g));
  ramp = mix(ramp, uHot, smoothstep(0.78, 1.0, g) * 0.7);
  // His face is the part that must read as him: there the picture keeps more of
  // its own colour and contrast, takes a little more light, and (below) fewer
  // scan lines. The mask is soft and takes in the hair.
  vec2 fd = vec2((uv.x - uFace.x) * size.x / size.y, uv.y - uFace.y);
  float faceK = uFace.z > 0.0 ? smoothstep(uFace.z * 1.35, uFace.z * 0.55, length(fd)) : 0.0;
  // A little of its own colour stays in the light.
  vec3 own = src * vec3(0.92, 0.98, 1.16) * 1.08;
  vec3 crisp = clamp((src - 0.36) * 1.28 + 0.36, 0.0, 1.0) * vec3(0.9, 1.0, 1.2) * 1.3;
  vec3 pic = mix(mix(ramp, own, uWarm), mix(ramp * 1.15, crisp, 0.74), faceK);
  // The edge of the figure carries more light than its middle: a thin, sharp line.
  pic = mix(pic, mix(uPale, uHot, 0.4), rim * 0.6 * (1.0 - 0.75 * faceK));

  // Scan lines, one every uPitch CSS pixels, and stronger toward the foot, where
  // the figure comes apart into them.
  float line = 0.5 + 0.5 * cos(p.y / (uPitch * px) * 6.2832);
  float low = smoothstep(1.0 - 2.6 * uFoot, 1.0, q.y) * step(0.001, uFoot);
  pic *= 1.0 - (0.075 + 0.5 * low) * line * (1.0 - faceK);
  // A band of brighter light rolls slowly up the figure; now and then a second,
  // finer one crosses it. Brightness only.
  float roll = fract(uv.y + t * 0.085);
  pic *= 1.0 + 0.1 * exp(-pow((roll - 0.5) * 7.0, 2.0));
  float beat = smoothstep(0.86, 1.0, sin(t * 0.61) * sin(t * 0.23 + 1.3));
  pic *= 1.0 + beat * 0.05 * sin(p.y / px * 1.9 + t * 24.0) * (1.0 - faceK);
  pic *= 1.0 + 0.012 * sin(t * 31.0) + 0.01 * sin(t * 12.7);

  // The foot dissolves; the scan-in runs from the foot to the crown with a bright edge.
  // The lowest uFoot of the figure fades into the cone (uFoot is a share of its height).
  float body = 1.0 - smoothstep(1.0 - 2.0 * uFoot, 1.0, q.y) * step(0.001, uFoot);
  float lineY = mix(foot, top - 4.0 * px, scan);
  // Above the line the figure is already there, faintly and whole (one that grew from
  // the chin up showed a smile with no eyes); the line firms it up as it passes.
  float drawn = mix(0.42 * smoothstep(0.0, 0.25, scan), 1.0, smoothstep(lineY - 2.0 * px, lineY + 10.0 * px, p.y));
  float writing = (1.0 - step(0.999, scan)) * step(0.001, scan);
  float lead = exp(-abs(p.y - lineY) / (5.0 * px)) * writing;
  pic *= 1.0 + 0.5 * (1.0 - scan);

  // The curtains: light closes in from both sides; the figure under them stays put,
  // and turns to plain light as they come, so what is left between them is never a
  // slice of a face.
  pic = mix(pic, mix(uPale, uHot, 0.6), 0.9 * smoothstep(0.1, 0.75, shut));
  float open = 1.0 - shut;
  // (Shut means shut: no sliver of the figure is left standing in the middle.)
  float curtain = smoothstep(open + 0.03, open - 0.01, abs(q.x)) * (1.0 - smoothstep(0.8, 1.0, shut));
  float fold = exp(-abs(abs(q.x) - open) * size.x / (7.0 * px)) * shut * (1.0 - step(0.999, shut));

  float show = drawn * curtain * body;
  float figA = a * show;
  vec3 col = pic * figA;
  // A little of the page shows through him; pure light covers nothing.
  float alpha = figA * 0.92 * (1.0 - beamy);

  // The air round the figure glows, outside it only; its edge splits, very
  // slightly, into red and blue (never round the head).
  col += mix(uDeep, uPale, 0.35) * halo * 0.55 * show;
  col += vec3(max(0.0, aR - a) * 0.5, 0.0, max(0.0, aB - a) * 0.7) * mix(uPale, uDeep, 0.35) * show * 0.4 * (1.0 - faceK);
  col += uPale * lead * (0.25 + 0.75 * a) * step(abs(q.x), 1.0) * 0.8;
  col += mix(uPale, uHot, 0.5) * fold * step(abs(q.y), 1.0) * (0.25 + 0.75 * max(a, wide)) * 0.8;

  // ---- the cone ----------------------------------------------------------------
  vec2 e = uEmit.xy;
  float reach = max(1.0, e.y - foot);
  float up = (e.y - p.y) / reach;                    // 0 at the plate, 1 at the picture's foot
  float topUp = 1.0 + (size.y * 1.1) / reach;        // it runs on, faintly, behind the picture
  float halfW = mix(uEmit.z * 0.55, size.x * 0.86, clamp(up, 0.0, 1.0));
  float across = abs(p.x - e.x) / halfW;
  float ang = (p.x - e.x) / halfW;
  float rays = 0.78 + 0.22 * sin(ang * 21.0 + sin(ang * 6.0 + t * 0.4) * 1.6);
  float cone = smoothstep(1.02, 0.35, across) * step(0.0, up) * smoothstep(topUp, 0.9, up);
  cone *= mix(0.62, 0.2, clamp(up, 0.0, 1.0)) * rays * (1.0 - 0.2 * line);
  cone *= smoothstep(coneUp * 1.25 + 0.02, coneUp * 1.25 - 0.2, up) * step(0.001, coneUp);
  cone *= open * plateOff;
  col += mix(uDeep, uPale, 0.45) * cone * (1.0 - alpha * 0.8);

  // ---- motes: small lights rising in the beam, behind and beside the figure --------
  float motes = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 cell = vec2(26.0 + 14.0 * fk, 34.0 + 18.0 * fk) * px;
    vec2 gp = vec2(p.x - e.x, p.y + t * (16.0 + 11.0 * fk) * px) / cell;
    vec2 id = floor(gp);
    float h1 = fract(sin(dot(id + fk * 17.0, vec2(127.1, 311.7))) * 43758.5453);
    float h2 = fract(h1 * 57.31);
    vec2 at = (fract(gp) - vec2(0.2 + 0.6 * h2, 0.5)) * cell;
    motes += step(0.74, h1) * smoothstep((1.3 + 1.4 * h2) * px, 0.0, length(at)) * (0.45 + 0.55 * sin(t * (1.0 + h2) + h1 * 40.0) * 0.5 + 0.275);
  }
  float column = smoothstep(size.x * 1.05, size.x * 0.3, abs(p.x - e.x));
  float rise = smoothstep(top - 30.0 * px, top + 0.5 * size.y, p.y) * smoothstep(e.y, e.y - 0.3 * size.y, p.y);
  col += mix(uPale, uHot, 0.4) * motes * column * rise * coneUp * open * plateOff * (1.0 - alpha) * 0.8;

  // ---- the plate ---------------------------------------------------------------
  vec2 r = vec2(uEmit.z, uEmit.z * 0.17);
  vec2 pe = (p - e) / r;
  float de = length(pe);
  float wRim = 1.3 * px / r.y;
  float rims = smoothstep(wRim, 0.0, abs(de - 1.0)) * 0.9 + smoothstep(wRim, 0.0, abs(de - 0.62)) * 0.55;
  float disc = smoothstep(1.0, 0.94, de);
  float slit = exp(-pow(pe.x / 0.5, 2.0)) * exp(-pow(pe.y / 0.16, 2.0));
  float glow = exp(-de * de * 0.9) * 0.22;
  float plate = plateOn * plateOff;
  // The plate has a body: it darkens what is behind it a little, then carries its light.
  alpha = max(alpha, disc * 0.5 * plate);
  col *= 1.0 - disc * 0.5 * plate * (1.0 - figA);
  col += (mix(uDeep, uPale, 0.6) * rims + uHot * slit * (0.75 + 0.2 * sin(t * 2.1)) + uDeep * glow) * plate;

  // ---- the beam it leaves ------------------------------------------------------
  float bw = mix(size.x * 0.05, 2.2 * px, shut);
  float bx = exp(-pow((p.x - c.x) / bw, 2.0)) + 0.22 * exp(-pow((p.x - c.x) / (bw * 7.0), 2.0));
  float span0 = uRes.y * 1.4;
  float bTop = top - lift * span0;
  float bFoot = e.y - ease(lift) * span0 * 0.9;
  float by = smoothstep(bTop - 30.0 * px, bTop + 60.0 * px, p.y) * smoothstep(bFoot + 8.0 * px, bFoot - 90.0 * px, p.y);
  float beam = bx * by * smoothstep(0.55, 1.0, shut) * (1.0 - smoothstep(0.55, 1.0, lift));
  col += mix(uPale, uHot, 0.55) * beam * 1.15;

  // A guarantee, not a tuned path: no light at all below the line where the hero's
  // own words begin (uKeep, a window y), with a short fade above it.
  float keep = smoothstep(uKeep, uKeep - 56.0 * px, p.y);
  gl_FragColor = vec4(col * uGain * keep, alpha * step(0.001, uGain) * keep);
}
`;

/* The blurred silhouette the halo is read from: its height in pixels, and the reach
   of each of its three box blurs (so the glow reaches about 5% of the figure's height). */
const AIR_TALL = 160;
const AIR_BLUR = 3;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`hologram shader: ${log}`);
  }
  return shader;
}

/* `tones` are three (r, g, b) triples, 0 to 1: deep, pale, hot. `look` is
   { warm, pitch, foot }: how much of the picture's own colour stays, the scan line
   pitch in CSS pixels, and the share of the figure's height that dissolves at its foot. Throws when there is no WebGL (the caller turns the
   welcome into its still form). */
export function createHologram(canvas, tones, look) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) throw new Error('hologram: no WebGL');

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`hologram program: ${gl.getProgramInfoLog(program)}`);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = {};
  for (const name of ['uRes', 'uPane', 'uEmit', 'uPx', 'uKeep', 'uTime', 'uOn', 'uOut', 'uGain', 'uWarm', 'uPitch', 'uFoot', 'uFace', 'uDeep', 'uPale', 'uHot', 'uTex', 'uAir']) u[name] = gl.getUniformLocation(program, name);
  gl.uniform3fv(u.uDeep, tones.deep);
  gl.uniform3fv(u.uPale, tones.pale);
  gl.uniform3fv(u.uHot, tones.hot);
  gl.uniform1f(u.uWarm, look.warm);
  gl.uniform1f(u.uPitch, look.pitch);
  gl.uniform1f(u.uFoot, look.foot);
  gl.uniform3f(u.uFace, look.face ? look.face.x : 0, look.face ? look.face.y : 0, look.face ? look.face.r : 0);
  gl.uniform1i(u.uTex, 0);
  gl.uniform1i(u.uAir, 1);

  // Until the picture is in there is no figure: one clear pixel.
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
  const smooth = () => {
    for (const key of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, key, gl.LINEAR);
    for (const key of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, key, gl.CLAMP_TO_EDGE);
  };
  smooth();
  const air = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, air);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 1, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, new Uint8Array([0]));
  smooth();
  gl.activeTexture(gl.TEXTURE0);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let dpr = 1;

  return {
    /* An image or a canvas; its alpha is the silhouette (uploaded premultiplied, so a
       clear pixel's colour never bleeds into the edge). */
    setPicture(image) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      // The air: the silhouette at AIR_TALL pixels, blurred here (three box passes,
      // a few thousand pixels), so the halo is one smooth falloff.
      const w0 = image.naturalWidth || image.width;
      const h0 = image.naturalHeight || image.height;
      const h = AIR_TALL;
      const w = Math.max(8, Math.round((w0 * h) / h0));
      const small = document.createElement('canvas');
      small.width = w;
      small.height = h;
      const ctx = small.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, w, h);
      const rgba = ctx.getImageData(0, 0, w, h).data;
      let from = new Float32Array(w * h);
      let to = new Float32Array(w * h);
      for (let i = 0; i < w * h; i++) from[i] = rgba[i * 4 + 3];
      for (let pass = 0; pass < 6; pass++) {
        const across = pass % 2 === 0;
        const n = across ? w : h;
        const lines = across ? h : w;
        const step = across ? 1 : w;
        for (let j = 0; j < lines; j++) {
          const start = across ? j * w : j;
          for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let k = -AIR_BLUR; k <= AIR_BLUR; k++) {
              const at = i + k;
              sum += at < 0 || at >= n ? 0 : from[start + at * step];
            }
            to[start + i * step] = sum / (2 * AIR_BLUR + 1);
          }
        }
        [from, to] = [to, from];
      }
      const bytes = new Uint8Array(w * h);
      for (let i = 0; i < w * h; i++) bytes[i] = Math.round(from[i]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, air);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, w, h, 0, gl.ALPHA, gl.UNSIGNED_BYTE, bytes);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    },
    resize(w, h, ratio) {
      dpr = ratio;
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    },
    /* pane: { x, y, w, h } its centre and half sizes; emit: { x, y, w } the plate's
       centre and half width; keep: the window y below which nothing is lit; all in CSS
       pixels from the window's top left. */
    render({ pane, emit, time, on, out, gain, keep = 1e6 }) {
      const W = canvas.width;
      const H = canvas.height;
      gl.viewport(0, 0, W, H);
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (gain <= 0 || out >= 1) return;
      // Only the column the light can reach is shaded: the picture and the plate, and
      // the whole height of the window once the beam is leaving.
      const reach = (Math.max(pane.w, emit.w) + 32) * dpr;
      const x0 = Math.max(0, Math.floor(pane.x * dpr - reach));
      const x1 = Math.min(W, Math.ceil(pane.x * dpr + reach));
      const tall = out > 0.3;
      const yTop = tall ? 0 : Math.max(0, Math.floor((pane.y - pane.h - 32) * dpr));
      const yFoot = tall ? H : Math.min(H, Math.ceil((emit.y + emit.w * 0.5 + 24) * dpr));
      if (x1 <= x0 || yFoot <= yTop) return;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, H - yFoot, x1 - x0, yFoot - yTop);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform4f(u.uPane, pane.x * dpr, pane.y * dpr, pane.w * dpr, pane.h * dpr);
      gl.uniform3f(u.uEmit, emit.x * dpr, emit.y * dpr, emit.w * dpr);
      gl.uniform1f(u.uPx, dpr);
      gl.uniform1f(u.uKeep, keep * dpr);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uOn, on);
      gl.uniform1f(u.uOut, out);
      gl.uniform1f(u.uGain, gain);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteTexture(air);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
