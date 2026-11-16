import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, LineSegments, Points, ShaderMaterial, Vector3 } from 'three';
import { seeded } from '../lib/field';
import { anchorRect } from './anchors';
import { definePiece } from './piece';

/* One star for every win, joined in the order they were won. The count is the
   length of the list it is given. On a wide window the stars climb the margin
   beside the wins themselves (the oldest lowest); with no margin they stand in
   the night vista above the section. The lines draw as the place arrives; a
   star flares when its win is focused. The colour is the award colour and is
   used for nothing else in the scene. */
const STAR_VERT = /* glsl */ `
attribute vec2 aStar; // size in px, flare 0 to 1
uniform float uDpr;
varying float vFlare;
void main(){
  vFlare = aStar.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aStar.x * (1.0 + 0.9 * aStar.y) * uDpr;
}`;
const STAR_FRAG = /* glsl */ `
uniform vec3 uGold; uniform float uShow, uTime;
varying float vFlare;
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  float r = length(p);
  float core = smoothstep(0.2, 0.04, r);
  float halo = pow(max(0.0, 1.0 - r), 2.6) * (0.3 + 0.5 * vFlare);
  // Four fine rays, as a bright point has through a lens.
  float rays = (smoothstep(0.07, 0.0, abs(p.x)) + smoothstep(0.07, 0.0, abs(p.y))) * pow(max(0.0, 1.0 - r), 1.6) * (0.4 + 0.6 * vFlare);
  float a = (core + halo + rays * 0.8) * uShow;
  gl_FragColor = vec4(mix(uGold, vec3(1.0), core * 0.7), a);
}`;
const LINE_VERT = /* glsl */ `
attribute float aOrder; // 0 at the first win's star, 1 at the last
uniform float uDraw;
varying float vA;
void main(){
  vA = smoothstep(aOrder - 0.02, aOrder + 0.02, uDraw);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const LINE_FRAG = /* glsl */ `
uniform vec3 uGold; uniform float uShow;
varying float vA;
void main(){ gl_FragColor = vec4(uGold, 0.34 * vA * uShow); }`;

export const constellation = definePiece({
  name: 'constellation',
  tokens: ['win-star'],
  tiers: { phone: {}, desktop: {} },
  /* ctx: { ids: one id per win in the page's order (newest first), color: [r, g, b] 0 to 1 } */
  create({ ids, color }) {
    const n = ids.length;
    const group = new Group();
    group.userData.solo = 'stars';
    const gold = { value: new Vector3(...color) };
    const U = { uGold: gold, uShow: { value: 0 }, uDraw: { value: 0 }, uDpr: { value: 1 }, uTime: { value: 0 } };
    const pos = new BufferAttribute(new Float32Array(n * 3), 3);
    const star = new BufferAttribute(new Float32Array(n * 2), 2);
    star.setUsage(DynamicDrawUsage);
    const sg = new BufferGeometry();
    sg.setAttribute('position', pos);
    sg.setAttribute('aStar', star);
    const sm = new ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
    const stars = new Points(sg, sm);
    const segs = Math.max(0, n - 1);
    const lpos = new BufferAttribute(new Float32Array(segs * 6), 3);
    const lord = new BufferAttribute(new Float32Array(segs * 2), 1);
    const lg = new BufferGeometry();
    lg.setAttribute('position', lpos);
    lg.setAttribute('aOrder', lord);
    const lm = new ShaderMaterial({ vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending });
    const lines = new LineSegments(lg, lm);
    stars.frustumCulled = lines.frustumCulled = false;
    group.add(lines, stars);
    group.visible = false;

    const rnd = seeded(5081);
    const jit = Array.from({ length: n }, () => [rnd(), rnd(), rnd()]);
    const place = { rect: null, mode: '', x: 0, y: 0 };
    let focus = -1;
    const flare = new Float32Array(n);

    /* env: { w, h } */
    function layout({ w }) {
      const wins = anchorRect('wins');
      const sky = anchorRect('galaxy');
      place.rect = null;
      let at = null;
      if (wins && w - wins.right >= 112) {
        // Up the margin beside the wins: the first win lowest, the latest highest.
        const x0 = wins.right + 30;
        const x1 = w - 26;
        const top = wins.top + 8;
        const bot = wins.bottom - 8;
        place.rect = wins;
        place.mode = 'margin';
        at = (i) => [x0 + (x1 - x0) * (i % 2 ? 0.72 + 0.28 * jit[i][0] : 0.28 * jit[i][0]), bot - (bot - top) * (n > 1 ? i / (n - 1) : 0.5) + (jit[i][1] - 0.5) * 14];
      } else if (sky) {
        // No margin: a rising chain across the right of the night vista.
        const x0 = w * 0.4;
        const x1 = w - 22;
        place.rect = sky;
        place.mode = 'vista';
        at = (i) => [x0 + (x1 - x0) * (n > 1 ? i / (n - 1) : 0.5), sky.bottom - 26 - (sky.h - 60) * (0.1 + 0.8 * (n > 1 ? i / (n - 1) : 0.5)) + (i % 2 ? -1 : 1) * (10 + 16 * jit[i][1])];
      }
      if (!at) return;
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < n; i++) {
        const [x, y] = at(i);
        pos.setXYZ(i, x - w / 2, -y, 0);
        sx += x / n;
        sy += y / n;
        if (i > 0) {
          const [px, py] = at(i - 1);
          lpos.setXYZ((i - 1) * 2, px - w / 2, -py, 0);
          lpos.setXYZ((i - 1) * 2 + 1, x - w / 2, -y, 0);
          lord.setX((i - 1) * 2, (i - 1) / segs);
          lord.setX((i - 1) * 2 + 1, i / segs);
        }
      }
      place.x = sx;
      place.y = sy;
      pos.needsUpdate = lpos.needsUpdate = lord.needsUpdate = true;
    }

    /* f: { t, scroll, h, dpr, night (0 to 1) } */
    function update(f, still = false) {
      const r = place.rect;
      const on = !!r && r.top - f.scroll < f.h + 40 && r.bottom - f.scroll > -40 && f.night > 0.02;
      group.visible = on;
      if (!on) return;
      U.uDpr.value = f.dpr;
      U.uTime.value = f.t;
      U.uShow.value = f.night;
      // The lines draw as the place comes up the window.
      U.uDraw.value = still ? 1 : Math.max(0, Math.min(1, (f.h * 0.92 - (r.top - f.scroll)) / Math.min(f.h * 0.7, r.h + f.h * 0.3)));
      for (let i = 0; i < n; i++) {
        flare[i] += ((i === focus ? 1 : 0) - flare[i]) * (still ? 1 : 0.2);
        const tw = still ? 1 : 0.86 + 0.14 * Math.sin(f.t * (0.7 + jit[i][2]) + i * 2.1);
        const lit = U.uDraw.value >= (n > 1 ? i / (n - 1) : 0) - 0.01 ? 1 : 0.35;
        star.setXY(i, (place.mode === 'margin' ? 15 : 12) * tw * lit, flare[i]);
      }
      star.needsUpdate = true;
    }

    return {
      object: group,
      layout,
      update,
      still: (f) => update(f, true),
      /** Flare the star of a win: its place in the page's list, or its id; anything else clears it. */
      setFocus(id) {
        const i = typeof id === 'number' ? id : ids.findIndex((x) => String(x).toLowerCase() === String(id ?? '').toLowerCase());
        focus = i >= 0 && i < n ? n - 1 - i : -1; // the page lists the newest first; the stars run oldest first
      },
      dispose() {
        for (const x of [sg, sm, lg, lm]) x.dispose();
      },
      binding: {
        id: 'stars',
        count: () => n,
        project: () => ({ x: place.x, y: place.y, visible: group.visible }), // y in document px
      },
      place,
    };
  },
});
