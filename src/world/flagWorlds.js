import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, LineSegments, Points, ShaderMaterial, Vector3 } from 'three';
import { seeded } from '../lib/field';
import { anchorRect } from './anchors';
import { CLIP, clipUniforms, setClip } from './guard';
import { definePiece, textBoxes } from './piece';

/* A small world for each flagship build, drawn in its own window in the page
   (the anchor flag-<id>). Every countable thing in one comes from that build's
   `scene` object in the content file; nothing here is typed.

     prism   a prism in the water. One shaft of light enters it and leaves as a
             fan of filaments that curve back and land on the shaft (what comes
             out is matched against what went in). Round it, `cells` lights, each
             alone in its own cell.
     board   a little planet ruled like a board, `moons` moons round it, and a
             band of `lights` points circling.
     scan    a building drawn in points. `photos` frames arrive: `placed` snap to
             its walls and stay lit, the rest hang outside unlit; `decoys` more
             wait at the edge and `decoysPlaced` of them go in.

   Light and line only: points and one-pixel segments, additive, in the realm's
   accent. Each world plays once when its window arrives, then idles. */

const VERT = /* glsl */ `
attribute vec3 aFrom; attribute vec4 aP; attribute vec2 aSpin;
uniform float uPlay, uTime, uPx;
varying float vTone; varying float vA;
vec3 rotY(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotX(vec3 p, float a){ float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
void main(){
  float k = smoothstep(aP.z, aP.z + 0.26, uPlay);
  float e = 1.0 - pow(1.0 - k, 3.0);
  vec3 p = mix(aFrom, position, e);
  p = rotX(rotY(p, uTime * aSpin.x), aSpin.y);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // What faces away is dimmer (aP.w is 1 for things on a sphere, whose normal is their place).
  float back = aP.w > 0.5 ? smoothstep(-0.35, 0.3, normalize(normalMatrix * p).z) : 1.0;
  vTone = aP.y;
  vA = min(1.0, k * 2.5) * mix(0.16, 1.0, back);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, aP.x * uPx);
}`;
const FRAG = /* glsl */ `
uniform vec3 uLo, uMid, uHi; uniform float uShow, uDots;
varying float vTone; varying float vA;
${CLIP}
void main(){
  float a = vA * uShow * clipA();
  if (uDots > 0.5) {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    a *= smoothstep(1.0, 0.25, r);
  }
  vec3 c = vTone < 0.5 ? mix(uLo, uMid, vTone * 2.0) : mix(uMid, uHi, vTone * 2.0 - 1.0);
  gl_FragColor = vec4(c, a * (uDots > 0.5 ? 0.3 + 0.7 * vTone : 0.5 + 0.5 * vTone));
}`;

/* A builder collects points and segments, each with where it ends up, where it
   comes from, a tone, a delay within the arrival and an optional slow orbit. */
function sketch() {
  const P = { to: [], from: [], p: [], spin: [] };
  const S = { to: [], from: [], p: [], spin: [] };
  return {
    P,
    S,
    dot(to, { from = to, size = 2, tone = 0.6, delay = 0, sphere = 0, spin = [0, 0] } = {}) {
      P.to.push(...to);
      P.from.push(...from);
      P.p.push(size, tone, delay, sphere);
      P.spin.push(...spin);
    },
    seg(a, b, { fromA = a, fromB = b, tone = 0.5, delay = 0, sphere = 0, spin = [0, 0] } = {}) {
      S.to.push(...a, ...b);
      S.from.push(...fromA, ...fromB);
      S.p.push(0, tone, delay, sphere, 0, tone, delay, sphere);
      S.spin.push(...spin, ...spin);
    },
  };
}

const BUILD = {
  prism({ cells }, { rnd, dense }) {
    const k = sketch();
    const R = 0.44;
    const D = 0.17;
    const tri = [90, 210, 330].map((d) => [Math.cos((d * Math.PI) / 180) * R, Math.sin((d * Math.PI) / 180) * R]);
    for (let i = 0; i < 3; i++) {
      const [a, b] = [tri[i], tri[(i + 1) % 3]];
      k.seg([a[0], a[1], D], [b[0], b[1], D], { tone: 0.95, delay: 0.02 });
      k.seg([a[0], a[1], -D], [b[0], b[1], -D], { tone: 0.5, delay: 0.02 });
      k.seg([a[0], a[1], D], [a[0], a[1], -D], { tone: 0.7, delay: 0.04 });
    }
    // The shaft: one line of light in from the left, through the glass.
    const x0 = -2.2;
    const xin = -0.2;
    const xout = 0.2;
    const n = dense ? 56 : 30;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      k.dot([x0 + (xin - x0) * u, 0, 0], { size: 2.4, tone: 0.9, delay: 0.04 + u * 0.22 });
    }
    k.seg([x0, 0, 0], [xin, 0, 0], { tone: 0.75, delay: 0.1 });
    k.seg([xin, 0, 0], [xout, -0.02, 0], { tone: 0.35, delay: 0.26 });
    // It leaves as a fan of filaments that curve back and land on the shaft.
    const F = dense ? 26 : 14;
    const N = dense ? 22 : 14;
    for (let j = 0; j < F; j++) {
      const v = (j + 0.5) / F;
      const up = j % 2 ? 1 : -1;
      const reach = 0.3 + 0.7 * rnd();
      const a = [xout, -0.02 + up * 0.05 * v, 0];
      const c1 = [0.9 + 0.8 * reach, up * (0.2 + 0.6 * reach), 0.3 * (rnd() - 0.5)];
      const c2 = [-0.1 - 1.3 * v, up * (0.4 + 0.5 * reach), 0.3 * (rnd() - 0.5)];
      const land = [x0 + 0.1 + (xin - x0 - 0.25) * v, 0, 0];
      const at = (t) => [0, 1, 2].map((c) => (1 - t) ** 3 * a[c] + 3 * (1 - t) ** 2 * t * c1[c] + 3 * (1 - t) * t * t * c2[c] + t ** 3 * land[c]);
      let prev = at(0);
      for (let i = 1; i <= N; i++) {
        const t = i / N;
        const next = at(t);
        k.seg(prev, next, { tone: 0.2 + 0.3 * reach + 0.25 * t, delay: 0.3 + 0.38 * t + 0.04 * rnd() });
        prev = next;
      }
      k.dot(land, { size: 3.2, tone: 1, delay: 0.72 });
    }
    // The cells: each light alone in its own hexagon, none touching another.
    for (let i = 0; i < cells; i++) {
      const th = ((i + 0.5) / cells) * Math.PI * 2;
      const c = [Math.cos(th) * 2.36, Math.sin(th) * 1.02, 0];
      const r = Math.min(0.13, (Math.PI * 1.02) / cells / 1.6);
      for (let e = 0; e < 6; e++) {
        const [p, q] = [e, e + 1].map((m) => [c[0] + Math.cos((m * Math.PI) / 3) * r, c[1] + Math.sin((m * Math.PI) / 3) * r, 0]);
        k.seg(p, q, { tone: 0.42, delay: 0.5 + 0.3 * (i / cells) });
      }
      k.dot(c, { size: 3.6, tone: 1, delay: 0.56 + 0.3 * (i / cells) });
    }
    return { ...k, tilt: [-0.12, 0.22], sway: 0.08, ext: [2.5, 1.18] };
  },

  board({ moons, lights }, { rnd, dense }) {
    const k = sketch();
    const R = 0.64;
    const seg = dense ? 40 : 24;
    const on = (lat, lon) => [R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon)];
    // Ruled like a board: eight files round it and seven ranks from pole to pole.
    for (let m = 0; m < 16; m++) {
      const lon = (m / 16) * Math.PI * 2;
      for (let i = 0; i < seg / 2; i++) {
        const [a, b] = [i, i + 1].map((q) => -Math.PI / 2 + (q / (seg / 2)) * Math.PI);
        k.seg(on(a, lon), on(b, lon), { tone: m % 2 ? 0.34 : 0.6, delay: 0.02 + 0.2 * (i / seg), sphere: 1, spin: [0.05, 0] });
      }
    }
    for (let p = 1; p < 8; p++) {
      const lat = -Math.PI / 2 + (p / 8) * Math.PI;
      for (let i = 0; i < seg; i++) {
        const [a, b] = [i, i + 1].map((q) => (q / seg) * Math.PI * 2);
        k.seg(on(lat, a), on(lat, b), { tone: 0.5, delay: 0.1 + 0.2 * (p / 8), sphere: 1, spin: [0.05, 0] });
      }
    }
    // The moons, on three leaning orbits.
    for (let i = 0; i < moons; i++) {
      const orbit = i % 3;
      const r = 0.98 + 0.17 * orbit + 0.05 * rnd();
      const a = (i / moons) * Math.PI * 2 + orbit;
      k.dot([Math.cos(a) * r, 0, Math.sin(a) * r], { from: [0, 0, 0], size: 6.4, tone: 1, delay: 0.3 + 0.4 * (i / moons), spin: [0.16 - 0.035 * orbit, [0.2, -0.3, 0.45][orbit]] });
    }
    // The band: every light is one point, all on one tilted ring.
    for (let i = 0; i < lights; i++) {
      const a = (i / lights) * Math.PI * 2 + rnd() * 0.02;
      const r = 1.6 + 0.16 * (rnd() - 0.5);
      k.dot([Math.cos(a) * r, 0.05 * (rnd() - 0.5), Math.sin(a) * r], { from: [Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7], size: 2 + 1.3 * rnd(), tone: 0.55 + 0.45 * rnd(), delay: 0.4 + 0.42 * (i / lights), spin: [0.045, 0.34] });
    }
    return { ...k, tilt: [0.3, 0], sway: 0.06, ext: [1.78, 1.0] };
  },

  scan({ photos, placed, decoys, decoysPlaced }, { rnd, dense }) {
    const k = sketch();
    const [W, H, Dp] = [2.1, 0.8, 1.0];
    const [nx, ny, nz] = [4, 2, 2];
    const gx = (i) => -W / 2 + (i / nx) * W;
    const gy = (j) => -H / 2 + (j / ny) * H;
    const gz = (l) => -Dp / 2 + (l / nz) * Dp;
    // The building, as a scan: points along every edge of every room.
    const step = dense ? 0.045 : 0.085;
    const edge = (a, b) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const n = Math.max(2, Math.round(len / step));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const p = [0, 1, 2].map((c) => a[c] + (b[c] - a[c]) * t + 0.006 * (rnd() - 0.5));
        k.dot(p, { size: 1.7, tone: 0.34 + 0.2 * rnd(), delay: 0.02 + 0.3 * ((p[1] + H / 2) / H) });
      }
    };
    for (let j = 0; j <= ny; j++) for (let l = 0; l <= nz; l++) edge([gx(0), gy(j), gz(l)], [gx(nx), gy(j), gz(l)]);
    for (let i = 0; i <= nx; i++) for (let l = 0; l <= nz; l++) edge([gx(i), gy(0), gz(l)], [gx(i), gy(ny), gz(l)]);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) edge([gx(i), gy(j), gz(0)], [gx(i), gy(j), gz(nz)]);
    // Places on the walls: every room offers its back wall and its side wall, two each.
    const slots = [];
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let l = 0; l < nz; l++) {
          const cy = (gy(j) + gy(j + 1)) / 2;
          for (const f of [0.3, 0.7]) {
            slots.push({ c: [gx(i) + (W / nx) * f, cy, gz(l) + 0.012], u: [1, 0, 0] });
            slots.push({ c: [gx(i) + 0.012, cy, gz(l) + (Dp / nz) * f], u: [0, 0, 1] });
          }
        }
      }
    }
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    const frame = (c, u, { from, tone, delay, spin, half = [0.075, 0.052] }) => {
      const corner = (c0, sx, sy) => [c0[0] + u[0] * half[0] * sx, c0[1] + half[1] * sy, c0[2] + u[2] * half[0] * sx];
      const q = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      for (let e = 0; e < 4; e++) {
        const [s0, s1] = [q[e], q[(e + 1) % 4]];
        k.seg(corner(c, ...s0), corner(c, ...s1), { fromA: corner(from, ...s0), fromB: corner(from, ...s1), tone, delay, spin });
      }
    };
    const outside = (r0, r1) => {
      const a = rnd() * Math.PI * 2;
      const r = r0 + (r1 - r0) * rnd();
      return [Math.cos(a) * r, (rnd() - 0.5) * 1.0, Math.sin(a) * r];
    };
    const take = Math.min(placed, slots.length);
    for (let i = 0; i < photos; i++) {
      const delay = 0.34 + 0.46 * (i / photos);
      const from = outside(1.7, 2.1);
      if (i < take) {
        const s = slots[i];
        frame(s.c, s.u, { from, tone: 0.95, delay });
        k.dot(s.c, { from, size: 3, tone: 1, delay: delay + 0.04 });
      } else {
        // Not placed: it stays outside the walls, unlit.
        const a = -0.5 + 0.34 * (i - take);
        frame([Math.cos(a) * 1.3, 0.6 + 0.05 * (i % 2), Math.sin(a) * 0.6], [1, 0, 0], { from, tone: 0.2, delay });
      }
    }
    // The decoys wait at the edge. `decoysPlaced` of them go in (none, if the count says none).
    for (let i = 0; i < decoys; i++) {
      const a = (i / decoys) * Math.PI * 2;
      const r = 2.0 + 0.14 * rnd();
      const c = [Math.cos(a) * r, (rnd() - 0.5) * 0.7, Math.sin(a) * r];
      const u = [-Math.sin(a), 0, Math.cos(a)];
      const s = i < decoysPlaced ? slots[take + i] : null;
      if (s) frame(s.c, s.u, { from: c, tone: 0.5, delay: 0.8 });
      else frame(c, u, { from: c, tone: 0.16, delay: 0.1 + 0.3 * (i / decoys), spin: [0.03, 0], half: [0.062, 0.044] });
    }
    return { ...k, tilt: [0.34, -0.5], sway: 0.14, ext: [2.3, 1.08] };
  },
};

export const flagWorlds = definePiece({
  name: 'flagWorlds',
  tokens: ['flag-lo', 'flag', 'flag-hi'],
  tiers: { phone: { dense: false }, desktop: { dense: true } },
  /* ctx: { scenes: { <build id>: { kind, ...counts } }, colors: [lo, mid, hi], tier, time: { value } } */
  create({ scenes, colors, tier = 'desktop', time }) {
    const dense = (flagWorlds.tiers[tier] ?? flagWorlds.tiers.desktop).dense;
    const group = new Group();
    group.userData.solo = 'flags';
    const kept = [];
    const worlds = [];
    for (const [id, scene] of Object.entries(scenes)) {
      const build = BUILD[scene.kind];
      if (!build) continue;
      const k = build(scene, { rnd: seeded(977 + id.length * 31), dense });
      const U = {
        uPlay: { value: 0 },
        uTime: time,
        uPx: { value: 1 },
        uShow: { value: 0 },
        uDots: { value: 0 },
        uLo: { value: new Vector3(...colors[0]) },
        uMid: { value: new Vector3(...colors[1]) },
        uHi: { value: new Vector3(...colors[2]) },
        ...clipUniforms(),
      };
      const geo = (d) => {
        const g = new BufferGeometry();
        g.setAttribute('position', new BufferAttribute(new Float32Array(d.to), 3));
        g.setAttribute('aFrom', new BufferAttribute(new Float32Array(d.from), 3));
        g.setAttribute('aP', new BufferAttribute(new Float32Array(d.p), 4));
        g.setAttribute('aSpin', new BufferAttribute(new Float32Array(d.spin), 2));
        kept.push(g);
        return g;
      };
      const mat = (dots) => {
        const m = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: { ...U, uDots: { value: dots } }, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
        kept.push(m);
        return m;
      };
      const g = new Group();
      const dots = new Points(geo(k.P), mat(1));
      const lines = new LineSegments(geo(k.S), mat(0));
      dots.frustumCulled = lines.frustumCulled = false;
      g.add(lines, dots);
      g.visible = false;
      group.add(g);
      worlds.push({ id, kind: scene.kind, scene, g, U, k, rect: null, boxes: [], S: 1, played: -1, play: 0, x: 0, y: 0, on: false, plate: '' });
    }

    function layout() {
      for (const wd of worlds) {
        wd.rect = anchorRect(`flag-${wd.id}`);
        if (!wd.rect) continue;
        wd.boxes = textBoxes(wd.rect.el);
        wd.S = Math.min(wd.rect.w / 2 / wd.k.ext[0], wd.rect.h / 2 / wd.k.ext[1]) * 0.96;
      }
    }

    /* f: { t, scroll, w, h, dpr, resY } */
    function update(f, still = false) {
      for (const wd of worlds) {
        const r = wd.rect;
        wd.on = !!r && r.top - f.scroll < f.h + 40 && r.bottom - f.scroll > -40;
        wd.g.visible = wd.on;
        // The page draws an engraved plate of the same thing in the window; it steps
        // back (--flag-plate) while the world itself is there.
        const plate = wd.on ? (1 - 0.86 * Math.min(1, wd.play * 4)).toFixed(1) : '';
        if (r && plate !== wd.plate) {
          wd.plate = plate;
          if (plate) r.el.style.setProperty('--flag-plate', plate);
          else r.el.style.removeProperty('--flag-plate');
        }
        if (!wd.on) continue;
        const mid = r.mid - f.scroll;
        // It plays once, when the middle of its window is well inside the screen.
        if (wd.played < 0 && mid > f.h * 0.12 && mid < f.h * 0.82) wd.played = f.t;
        wd.play = still ? 1 : wd.played < 0 ? 0 : Math.min(1, (f.t - wd.played) / 3.2);
        wd.U.uPlay.value = wd.play;
        wd.U.uPx.value = f.dpr * Math.max(0.55, Math.min(1.3, wd.S / 150));
        // It dims as its window leaves.
        const seen = Math.max(0, Math.min(r.bottom - f.scroll, f.h) - Math.max(r.top - f.scroll, 0)) / Math.min(r.h, f.h);
        wd.U.uShow.value = Math.min(1, seen * 1.6);
        wd.x = r.cx;
        wd.y = mid;
        wd.g.position.set(r.cx - f.w / 2, -r.mid, 0);
        wd.g.scale.setScalar(wd.S);
        const sway = still ? 0 : Math.sin(f.t * 0.23 + wd.id.length) * wd.k.sway;
        wd.g.rotation.set(wd.k.tilt[0], wd.k.tilt[1] + sway, 0);
        setClip(wd.U, [r.left, r.top, r.right, r.bottom], wd.boxes, f.scroll, f.dpr, f.resY);
      }
    }

    return {
      object: group,
      worlds,
      layout,
      update,
      still: (f) => update(f, true),
      dispose() {
        for (const x of kept) x.dispose();
        for (const wd of worlds) wd.rect?.el.style.removeProperty('--flag-plate');
      },
      binding: worlds.map((wd) => ({
        id: wd.kind,
        count: () => wd.scene,
        project: () => ({ x: wd.x, y: wd.y, visible: wd.on }),
      })),
    };
  },
});
