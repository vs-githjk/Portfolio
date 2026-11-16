/* The welcome hologram: his photograph, projected. Plain WebGL, one draw call, no
   library, so the chunk stays a few kilobytes.

   What is drawn, all in one fragment shader over one triangle (clipped with a
   scissor to the part of the window the light can reach):

     the emitter   a small plate under him: two rims seen edge on and a hot slit
     the cone      soft light fanning up from the plate to the foot of the picture
     the pane      the photograph (public/holo/face-1024.webp, or face-512.webp on
                   a phone) in the page's blue light: its own tones mapped onto
                   the hologram's ramp with a little of its own colour left in, so
                   skin stays warm and he reads as himself; fine scan lines; a slow
                   band of brighter light that rolls up it; a hairline frame whose
                   red and blue sit a pixel apart; the foot dissolving into lines

   Nothing ever moves a row of the picture sideways and nothing warps it: a slip
   of that kind was read as a glitch in his eyes. The shimmer is light only.

   Two clocks, both 0 to 1, given by the caller:

     on    the projector starts: the plate lights, the cone rises, the picture
           is scanned in from its foot upward
     out   the projector lets go: two curtains of light close over the picture
           from its sides (the picture under them is never squeezed) and leave
           one vertical beam, which lifts off the plate and is gone

   The same look is drawn in CSS for the small panels beside him (.hub-pic in
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
uniform vec4 uPane;   // the picture: centre x, centre y (from the top), half width, half height
uniform vec3 uEmit;   // the plate: centre x, y, half width
uniform float uPx;    // device pixels to a CSS pixel
uniform float uTime, uOn, uOut, uGain, uWarm, uPitch;
uniform vec3 uDeep, uPale, uHot;
uniform sampler2D uTex;

float ease(float x) { return x * x * (3.0 - 2.0 * x); }
float span(float a, float b, float x) { return clamp((x - a) / (b - a), 0.0, 1.0); }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

float box(vec2 p, vec2 size, float r) {
  vec2 d = abs(p) - size + r;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
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

  // ---- the pane --------------------------------------------------------------
  float corner = size.x * 0.085;
  float d = box(p - c, size, corner);
  float inside = smoothstep(0.0, -1.5 * px, d);
  vec2 uv = q * 0.5 + 0.5;
  // The red and the blue of the picture sit a hair apart, more toward the frame;
  // across his face it is under half a pixel and cannot be seen as a fringe.
  float edge = smoothstep(0.55, 1.0, max(abs(q.x), abs(q.y)));
  vec2 off = vec2(0.0006 + 0.0022 * edge, 0.0);
  vec3 src = texture2D(uTex, uv).rgb;
  float lr = luma(texture2D(uTex, uv - off).rgb);
  float lb = luma(texture2D(uTex, uv + off).rgb);
  float l = luma(src);
  // The hologram's ramp: deep blue in the shadows, the pale blue through the skin,
  // near white on the teeth and the collar. The shadows never fall to nothing, so
  // his hair and eyes are blue, not holes.
  float g = pow(clamp(l * 1.08, 0.0, 1.0), 0.82);
  vec3 ramp = mix(uDeep * 0.2, uDeep * 0.82, smoothstep(0.0, 0.34, g));
  ramp = mix(ramp, uPale, smoothstep(0.22, 0.8, g));
  ramp = mix(ramp, uHot, smoothstep(0.78, 1.0, g) * 0.7);
  ramp.r *= 1.0 + 1.6 * (lr - l);
  ramp.b *= 1.0 + 1.6 * (lb - l);
  // A little of his own colour stays in the light.
  vec3 own = src * vec3(0.92, 0.98, 1.16) * 1.08;
  vec3 pic = mix(ramp, own, uWarm);
  // The light is fullest on him and thins toward the corners of the pane, so the
  // backdrop reads as a field of light and not as a blue card.
  float fall = length(vec2(q.x, (q.y + 0.12) * 0.9));
  pic *= mix(1.06, 0.5, smoothstep(0.45, 1.35, fall));

  // Scan lines, one every uPitch CSS pixels, and stronger toward the foot, where
  // the picture comes apart into them.
  float line = 0.5 + 0.5 * cos(p.y / (uPitch * px) * 6.2832);
  float low = smoothstep(0.42, 1.0, q.y);
  pic *= 1.0 - (0.13 + 0.5 * low) * line;
  // A band of brighter light rolls slowly up the picture; now and then a second,
  // finer one crosses it. Brightness only.
  float roll = fract(uv.y + t * 0.085);
  pic *= 1.0 + 0.1 * exp(-pow((roll - 0.5) * 7.0, 2.0));
  float beat = smoothstep(0.86, 1.0, sin(t * 0.61) * sin(t * 0.23 + 1.3));
  pic *= 1.0 + beat * 0.07 * sin(p.y / px * 1.9 + t * 24.0);
  pic *= 1.0 + 0.012 * sin(t * 31.0) + 0.01 * sin(t * 12.7);

  // The foot dissolves; the scan-in runs from the foot to the crown with a bright edge.
  float body = 1.0 - 0.82 * smoothstep(0.5, 1.0, q.y);
  float lineY = mix(foot, top - 4.0 * px, scan);
  // Above the line he is already there, faintly and whole (a picture that grew from
  // the chin up showed a smile with no eyes); the line firms him up as it passes.
  float drawn = mix(0.42 * smoothstep(0.0, 0.25, scan), 1.0, smoothstep(lineY - 2.0 * px, lineY + 10.0 * px, p.y));
  float writing = (1.0 - step(0.999, scan)) * step(0.001, scan);
  float lead = exp(-abs(p.y - lineY) / (5.0 * px)) * writing;
  pic *= 1.0 + 0.5 * (1.0 - scan);

  // The curtains: light closes in from both sides; the picture under them stays put,
  // and turns to plain light as they come, so what is left between them is never a
  // slice of a face.
  pic = mix(pic, mix(uPale, uHot, 0.6), 0.9 * smoothstep(0.1, 0.75, shut));
  float open = 1.0 - shut;
  float curtain = smoothstep(open + 0.03, open - 0.01, abs(q.x));
  float fold = exp(-abs(abs(q.x) - open) * size.x / (7.0 * px)) * shut * (1.0 - step(0.999, shut));

  float paneA = inside * drawn * curtain * body;
  vec3 col = pic * paneA;
  // A little of the page shows through him, most at the corners.
  float alpha = paneA * mix(0.9, 0.62, smoothstep(0.45, 1.35, fall));

  // The frame: a hairline whose red and blue are a pixel and a half apart.
  float o = 1.5 * px;
  float fr = smoothstep(1.4 * px, 0.0, abs(box(p - c + vec2(o, 0.0), size, corner)));
  float fg = smoothstep(1.4 * px, 0.0, abs(d));
  float fb = smoothstep(1.4 * px, 0.0, abs(box(p - c - vec2(o, 0.0), size, corner)));
  vec3 frame = vec3(fr * 0.7, fg * 0.8, fb) * mix(uPale, uDeep, 0.35);
  col += frame * 0.5 * drawn * curtain * (1.0 - 0.9 * low);
  col += uPale * lead * inside * 0.9;
  col += mix(uPale, uHot, 0.5) * fold * step(abs(q.y), 1.0) * 0.8;

  // ---- the cone ----------------------------------------------------------------
  vec2 e = uEmit.xy;
  float reach = max(1.0, e.y - foot);
  float up = (e.y - p.y) / reach;                    // 0 at the plate, 1 at the picture's foot
  float topUp = 1.0 + (size.y * 1.1) / reach;        // it runs on, faintly, behind the picture
  float halfW = mix(uEmit.z * 0.55, size.x * 0.97, clamp(up, 0.0, 1.0));
  float across = abs(p.x - e.x) / halfW;
  float ang = (p.x - e.x) / halfW;
  float rays = 0.78 + 0.22 * sin(ang * 21.0 + sin(ang * 6.0 + t * 0.4) * 1.6);
  float cone = smoothstep(1.02, 0.35, across) * step(0.0, up) * smoothstep(topUp, 0.9, up);
  cone *= mix(0.62, 0.2, clamp(up, 0.0, 1.0)) * rays * (1.0 - 0.2 * line);
  cone *= smoothstep(coneUp * 1.25 + 0.02, coneUp * 1.25 - 0.2, up) * step(0.001, coneUp);
  cone *= open * plateOff;
  col += mix(uDeep, uPale, 0.45) * cone * (1.0 - alpha * 0.8);

  // ---- the plate ---------------------------------------------------------------
  vec2 r = vec2(uEmit.z, uEmit.z * 0.17);
  vec2 pe = (p - e) / r;
  float de = length(pe);
  float wRim = 1.3 * px / r.y;
  float rim = smoothstep(wRim, 0.0, abs(de - 1.0)) * 0.9 + smoothstep(wRim, 0.0, abs(de - 0.62)) * 0.55;
  float disc = smoothstep(1.0, 0.94, de);
  float slit = exp(-pow(pe.x / 0.5, 2.0)) * exp(-pow(pe.y / 0.16, 2.0));
  float halo = exp(-de * de * 0.9) * 0.22;
  float plate = plateOn * plateOff;
  // The plate has a body: it darkens what is behind it a little, then carries its light.
  alpha = max(alpha, disc * 0.5 * plate);
  col *= 1.0 - disc * 0.5 * plate * (1.0 - paneA);
  col += (mix(uDeep, uPale, 0.6) * rim + uHot * slit * (0.75 + 0.2 * sin(t * 2.1)) + uDeep * halo) * plate;

  // ---- the beam it leaves ------------------------------------------------------
  float bw = mix(size.x * 0.05, 2.2 * px, shut);
  float bx = exp(-pow((p.x - c.x) / bw, 2.0)) + 0.22 * exp(-pow((p.x - c.x) / (bw * 7.0), 2.0));
  float span0 = uRes.y * 1.4;
  float bTop = top - lift * span0;
  float bFoot = e.y - ease(lift) * span0 * 0.9;
  float by = smoothstep(bTop - 30.0 * px, bTop + 60.0 * px, p.y) * smoothstep(bFoot + 8.0 * px, bFoot - 90.0 * px, p.y);
  float beam = bx * by * smoothstep(0.55, 1.0, shut) * (1.0 - smoothstep(0.55, 1.0, lift));
  col += mix(uPale, uHot, 0.55) * beam * 1.15;

  gl_FragColor = vec4(col * uGain, alpha * step(0.001, uGain));
}
`;

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
   { warm, pitch }: how much of the photograph's own colour stays, and the scan
   line pitch in CSS pixels. Throws when there is no WebGL (the caller turns the
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
  for (const name of ['uRes', 'uPane', 'uEmit', 'uPx', 'uTime', 'uOn', 'uOut', 'uGain', 'uWarm', 'uPitch', 'uDeep', 'uPale', 'uHot', 'uTex']) u[name] = gl.getUniformLocation(program, name);
  gl.uniform3fv(u.uDeep, tones.deep);
  gl.uniform3fv(u.uPale, tones.pale);
  gl.uniform3fv(u.uHot, tones.hot);
  gl.uniform1f(u.uWarm, look.warm);
  gl.uniform1f(u.uPitch, look.pitch);
  gl.uniform1i(u.uTex, 0);

  // Until the photograph is in, the pane is a plain field of the deep blue.
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([40, 40, 44, 255]));
  for (const [key, value] of [
    [gl.TEXTURE_MIN_FILTER, gl.LINEAR],
    [gl.TEXTURE_MAG_FILTER, gl.LINEAR],
    [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE],
    [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE],
  ])
    gl.texParameteri(gl.TEXTURE_2D, key, value);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let dpr = 1;

  return {
    setPicture(image) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
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
       centre and half width; all in CSS pixels from the window's top left. */
    render({ pane, emit, time, on, out, gain }) {
      const W = canvas.width;
      const H = canvas.height;
      gl.viewport(0, 0, W, H);
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (gain <= 0) return;
      // Only the column the light can reach is shaded: the picture and the plate, and
      // the whole height of the window once the beam is leaving.
      const reach = (Math.max(pane.w, emit.w) + 24) * dpr;
      const x0 = Math.max(0, Math.floor(pane.x * dpr - reach));
      const x1 = Math.min(W, Math.ceil(pane.x * dpr + reach));
      const tall = out > 0.3;
      const yTop = tall ? 0 : Math.max(0, Math.floor((pane.y - pane.h - 24) * dpr));
      const yFoot = tall ? H : Math.min(H, Math.ceil((emit.y + emit.w * 0.5 + 24) * dpr));
      if (x1 <= x0 || yFoot <= yTop) return;
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, H - yFoot, x1 - x0, yFoot - yTop);
      gl.uniform2f(u.uRes, W, H);
      gl.uniform4f(u.uPane, pane.x * dpr, pane.y * dpr, pane.w * dpr, pane.h * dpr);
      gl.uniform3f(u.uEmit, emit.x * dpr, emit.y * dpr, emit.w * dpr);
      gl.uniform1f(u.uPx, dpr);
      gl.uniform1f(u.uTime, time);
      gl.uniform1f(u.uOn, on);
      gl.uniform1f(u.uOut, out);
      gl.uniform1f(u.uGain, gain);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
