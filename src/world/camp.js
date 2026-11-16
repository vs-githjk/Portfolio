import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Points, ShaderMaterial, Vector3 } from 'three';
import { seeded } from '../lib/field';
import { definePiece } from './piece';

/* The camp's fires: one for every member of the crew it is given, in a loose
   ring round the mast. All burn low as embers; the chosen member's fire stands
   up in that member's own colour. The piece is placed by the caller (`at` turns
   an offset from the camp's centre into a point on the ground) and lives in the
   land's scene, so the dunes hide and reveal it like everything else there. */
const VERT = /* glsl */ `
attribute vec4 aFire; // r, g, b, size in world units
attribute float aSeed;
uniform float uProj, uTime;
varying vec3 vCol; varying float vSeed;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float flick = 0.86 + 0.14 * sin(uTime * (5.0 + aSeed * 4.0) + aSeed * 40.0);
  gl_PointSize = max(2.0, aFire.w * flick * uProj / -mv.z);
  vCol = aFire.rgb; vSeed = aSeed;
}`;
const FRAG = /* glsl */ `
uniform float uShow, uTime;
varying vec3 vCol; varying float vSeed;
void main(){
  vec2 p = (gl_PointCoord - 0.5) * 2.0; p.y = -p.y;
  // A flame: broad at the foot, drawn up to a point that leans with the air.
  float lean = 0.12 * sin(uTime * 3.0 + vSeed * 20.0) * (p.y + 0.6);
  float w = mix(0.46, 0.05, smoothstep(-0.7, 0.85, p.y));
  float body = smoothstep(w, w * 0.25, abs(p.x - lean)) * smoothstep(-0.8, -0.55, p.y) * smoothstep(0.95, 0.4, p.y);
  float glow = pow(max(0.0, 1.0 - length(p + vec2(0.0, 0.3))), 2.4);
  vec3 c = mix(vCol, vec3(1.0, 0.96, 0.86), body * 0.55);
  gl_FragColor = vec4(c, (body * 0.95 + glow * 0.5) * uShow);
}`;

export const camp = definePiece({
  name: 'camp',
  tokens: ['ember'],
  tiers: { phone: {}, desktop: {} },
  /* ctx: { crew: one id per member, at: (dx, dz) => [x, y, z], ember: Vector3, time } */
  create({ crew, at, ember, time }) {
    const n = crew.length;
    const rnd = seeded(1409);
    const pos = new Float32Array(n * 3);
    const fire = new BufferAttribute(new Float32Array(n * 4), 4);
    fire.setUsage(DynamicDrawUsage);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // A loose ring, open toward the reader, a little uneven like a real camp.
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.24;
      const r = 1 + (rnd() - 0.5) * 0.3;
      const p = at(Math.cos(a) * 92 * r + 12, Math.sin(a) * 40 * r - 4);
      pos.set([p[0], p[1] + 4.5, p[2]], i * 3);
      seed[i] = rnd();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aFire', fire);
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const U = { uProj: { value: 1 }, uTime: time, uShow: { value: 1 } };
    const mat = new ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthWrite: false, blending: AdditiveBlending });
    const points = new Points(geo, mat);
    points.frustumCulled = false;
    const level = new Float32Array(n);
    const hue = new Vector3().copy(ember);
    let chosen = -1;

    return {
      object: points,
      layout() {},
      /* f: { proj: device px for one world unit at distance 1, show: 0 to 1 } */
      update(f, still = false) {
        U.uProj.value = f.proj;
        U.uShow.value = f.show;
        for (let i = 0; i < n; i++) {
          level[i] += ((i === chosen ? 1 : 0) - level[i]) * (still ? 1 : 0.1);
          const k = level[i];
          fire.setXYZW(i, ember.x + (hue.x - ember.x) * k, ember.y * (0.8 + 0.2 * k) + (hue.y - ember.y) * k, ember.z * (0.8 + 0.2 * k) + (hue.z - ember.z) * k, 11 + 15 * k);
        }
        fire.needsUpdate = true;
      },
      still(f) {
        this.update(f, true);
      },
      /** The chosen member (an id from the crew list, or an index) and their colour (a Vector3), or none. */
      choose(id, color) {
        chosen = typeof id === 'number' ? id : crew.indexOf(id);
        if (color) hue.copy(color);
        else if (chosen < 0) hue.copy(ember);
      },
      dispose() {
        geo.dispose();
        mat.dispose();
      },
      binding: { id: 'fires', count: () => n, project: () => ({ x: 0, y: 0, visible: points.visible }) },
    };
  },
});
