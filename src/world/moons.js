import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Points, ShaderMaterial, Vector3 } from 'three';
import { definePiece } from './piece';

/* What the giant carries: one moon for every flagship build and one light in its
   ring for every other build. Both counts come from the lists it is given. A
   moon lights when its build is the one in front of the reader. They ride in
   the ring's own plane (the caller gives this object the ring's rotation and
   adds it to the giant): the lights all along the arc a window can see, the
   moons on its near side, in front of the giant, clear of any text column. */
const VERT = /* glsl */ `
attribute vec3 aBody; // size in giant radii, kind (0 moon, 1 ring light), lit 0 to 1
uniform float uPx, uTime;
varying vec3 vBody;
void main(){
  vBody = aBody;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  float tw = aBody.y > 0.5 ? 0.8 + 0.2 * sin(uTime * 1.3 + position.x * 9.0) : 1.0;
  gl_PointSize = max(2.0, aBody.x * uPx * tw);
}`;
const FRAG = /* glsl */ `
uniform vec3 uLight, uDim, uDay, uRim, uGlint, uSigmaW, uWaterCol; uniform float uWet, uShow;
varying vec3 vBody;
vec3 sea(vec3 col, float d){ vec3 T = exp(-uSigmaW * d * uWet); return col * T + uWaterCol * (1.0 - T); }
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0; p.y = -p.y;
  float r = length(p);
  if (vBody.y > 0.5) {
    // A light in the ring: a small hot glint.
    float a = smoothstep(0.5, 0.1, r) + 0.35 * pow(max(0.0, 1.0 - r), 2.0);
    gl_FragColor = vec4(sea(uGlint, 0.3), a * uShow);
    return;
  }
  // A moon: a little lit sphere with a halo that grows when its build is in front.
  float disc = smoothstep(0.62, 0.56, r);
  vec3 n = vec3(p / 0.6, sqrt(max(0.0, 1.0 - dot(p, p) / 0.36)));
  float day = clamp(dot(n, normalize(uLight)) * 1.2 + 0.1, 0.0, 1.0);
  vec3 c = mix(uDim, uDay, day) * (0.8 + 0.3 * vBody.z) + uRim * pow(1.0 - n.z, 2.0) * (0.45 + 0.55 * vBody.z);
  float halo = pow(max(0.0, 1.0 - r), 2.2) * (0.22 + 0.6 * vBody.z) * (1.0 - disc);
  gl_FragColor = vec4(sea(mix(uRim, c, disc), 0.3), (disc + halo) * uShow);
}`;

export const moons = definePiece({
  name: 'moons',
  tokens: ['giant-night', 'giant-band', 'giant-rim', 'giant-ring'],
  tiers: { phone: {}, desktop: {} },
  /* ctx: { lead: ids of the builds that get a moon, rest: ids of the builds that get a ring light,
            colors: { dim, day, rim, glint } as Vector3, light: Vector3, wet, time } */
  create({ lead, rest, colors, light, wet, time }) {
    const nM = lead.length;
    const nR = rest.length;
    const n = nM + nR;
    const ids = lead.concat(rest);
    const pos = new Float32Array(n * 3);
    const body = new BufferAttribute(new Float32Array(n * 3), 3);
    body.setUsage(DynamicDrawUsage);
    // The arc a window can see: from the far left of the ring round its near side.
    const A0 = 2.42;
    const A1 = 5.28;
    for (let i = 0; i < nM; i++) {
      // The moons ride inside the ring, on its near side, so they cross the giant's
      // own disc: out on the far left of the arc they drifted into the reading
      // column beside it, and wide on the near side they sat on the Builds chart.
      const a = 4.35 + (nM > 1 ? i / (nM - 1) : 0.5) * 0.9;
      const r = 1.3 + 0.08 * Math.abs(i - (nM - 1) / 2);
      pos.set([Math.cos(a) * r, Math.sin(a) * r, 0], i * 3);
      body.setXYZ(i, 0.26, 0, 0);
    }
    for (let i = 0; i < nR; i++) {
      const a = A0 + ((i + 0.5) / nR) * (A1 - A0);
      const r = 1.56 + 0.34 * (i % 3);
      pos.set([Math.cos(a) * r, Math.sin(a) * r, 0], (nM + i) * 3);
      body.setXYZ(nM + i, 0.075, 1, 0);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aBody', body);
    const U = {
      uPx: { value: 1 },
      uTime: time,
      uShow: { value: 1 },
      uLight: { value: new Vector3().copy(light) },
      uDim: { value: colors.dim },
      uDay: { value: colors.day },
      uRim: { value: colors.rim },
      uGlint: { value: colors.glint },
      ...wet,
    };
    const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthWrite: false });
    const points = new Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 2;
    const lit = new Float32Array(n);
    const focus = new Set();

    return {
      object: points,
      layout() {},
      /* f: { px: device px for one giant radius, front: the id of the build in front of the reader or '' } */
      update(f, still = false) {
        U.uPx.value = f.px;
        for (let i = 0; i < n; i++) {
          const want = focus.has(ids[i]) || (i < nM && lead[i] === f.front) ? 1 : 0;
          lit[i] += (want - lit[i]) * (still ? 1 : 0.12);
          // A moon carries its light in z; a ring light simply grows.
          if (i < nM) body.setZ(i, lit[i]);
          else body.setX(i, 0.075 * (1 + 1.6 * lit[i]));
        }
        body.needsUpdate = true;
      },
      still(f) {
        this.update(f, true);
      },
      /** Light a build's moon or ring light: one id, a list of ids, or nothing. */
      setFocus(id) {
        focus.clear();
        for (const x of Array.isArray(id) ? id : id == null ? [] : [id]) focus.add(x);
      },
      dispose() {
        geo.dispose();
        mat.dispose();
      },
      binding: { id: 'giant', count: () => ({ moons: nM, lights: nR }), project: () => ({ x: 0, y: 0, visible: points.visible }) },
    };
  },
});
