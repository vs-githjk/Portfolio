import { AnimationMixer, DoubleSide, Group, LoopOnce, Matrix4, Quaternion, ShaderMaterial, SkinnedMesh, Vector2, Vector3, Vector4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/* The dragon: a rigged, animated model, lit by the place it is in.

   Model: "Low Poly Ice Dragon" by xterryx, OpenGameArt,
   https://opengameart.org/content/low-poly-ice-dragon , CC0 1.0 (public domain).
   scripts/bake-dragon.py smooths it, lengthens the wings, bakes three masks into
   the vertex colours (R wing skin, G occlusion, B points) and writes the four
   clips this file plays: Fly, Glide, Perch, Roar. No textures: the hide, its
   plates, the light through the wings and the fire under the throat are all in
   the shader below, in the palette of the realm it is in.

   This file is its own chunk, asked for after the world is drawing. It is told
   where to be by dragonStations.js: a place in the window (px from the middle,
   y down), a depth, a heading and which clips to play. Like every piece of light
   it gives nothing inside the caller's keep-out boxes or outside its band. */

export const GUARD_BOXES = 6;
export const MODEL = { length: 15.7, span: 11.6, head: 5.4, tail: 10.25, chest: 2.9, tall: 8.4 }; // model units, measured in the bake

const VERT = /* glsl */ `
attribute vec4 color;
uniform mat4 uRestM;
varying vec3 vN; varying vec3 vW; varying vec3 vRest; varying vec3 vRN; varying vec3 vMask;
#include <common>
#include <skinning_pars_vertex>
void main(){
  #include <skinbase_vertex>
  vec3 objectNormal = normalize(normal);
  #include <skinnormal_vertex>
  vec3 transformed = position;
  #include <skinning_vertex>
  #ifdef USE_SKINNING
    vRest = (uRestM * bindMatrix * vec4(position, 1.0)).xyz;
    vRN = normalize(mat3(uRestM) * mat3(bindMatrix) * normal);
  #else
    vRest = position; vRN = normal;
  #endif
  vec4 w = modelMatrix * vec4(transformed, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * objectNormal);
  vMask = color.rgb;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const GUARD = /* glsl */ `
uniform vec4 uBox[${GUARD_BOXES}];
uniform vec2 uBand; uniform vec2 uWater; uniform vec2 uGRes; uniform float uShow;
vec2 winPx(){ return vec2(gl_FragCoord.x, uGRes.y - gl_FragCoord.y) / uGRes.x; }
float guard(vec2 p){
  float g = smoothstep(uBand.x, uBand.x + 40.0, p.y) * (1.0 - smoothstep(uBand.y - 40.0, uBand.y, p.y));
  for (int i = 0; i < ${GUARD_BOXES}; i++) {
    vec2 d = max(uBox[i].xy - p, p - uBox[i].zw);
    g *= smoothstep(0.0, 26.0, max(d.x, d.y));
  }
  return g;
}
// 1 under both waterlines, 0 in air: the surface above (x) and the shore (y).
float under(vec2 p){ return smoothstep(uWater.x - 3.0, uWater.x + 5.0, p.y) * smoothstep(uWater.y - 2.0, uWater.y + 10.0, p.y); }
`;

/* Only the shape, for the depth buffer: the colour pass then draws each pixel
   once, so a fade never shows the far wing through the near one. */
const DEPTH_FRAG = /* glsl */ `
${GUARD}
void main(){
  if (guard(winPx()) * uShow < 0.02) discard;
  gl_FragColor = vec4(0.0);
}`;

const FRAG = /* glsl */ `
uniform vec3 uKeyDir, uKey, uLowDir, uLow, uAmb, uHide, uBelly, uRim, uGlow, uFog, uWaterCol, uSigmaW;
uniform vec3 uEye[2];
uniform float uTime, uFogK, uCaust, uRimGain, uFire, uThin, uSplit, uPlates;
varying vec3 vN; varying vec3 vW; varying vec3 vRest; varying vec3 vRN; varying vec3 vMask;
${GUARD}
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
#ifdef PLATES
/* Plates: the nearest and second nearest of a jittered lattice. x: 0 on a seam, 1 inside a plate; y: the plate's own number; zw unused. */
vec4 plates(vec3 q){
  vec3 c = floor(q); vec3 f = q - c;
  float d1 = 9.0; float d2 = 9.0; vec3 best = vec3(0.0); vec3 to = vec3(0.0);
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 o = vec3(float(i), float(j), float(k));
    vec3 r = o + h33(c + o) * 0.86 - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; best = c + o; to = r; } else if (d < d2) { d2 = d; }
  }
  return vec4(smoothstep(0.015, 0.13, sqrt(d2) - sqrt(d1)), h13(best), normalize(to + 1e-4).xy);
}
#endif
#ifdef PLATES
float fine2(vec3 r){ return 1.0 - smoothstep(0.25, 0.7, length(fwidth(r * 1.7))); }
#endif
float caustic(vec2 uv, float t){
  vec2 p = mod(uv * 6.28318, 6.28318) - 250.0; vec2 i = p; float c = 1.0;
  for (int n = 0; n < 3; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c = 1.17 - pow(c / 3.0, 1.4);
  return pow(abs(c), 8.0);
}
void main(){
  vec2 p = winPx();
  float g = guard(p) * uShow;
  if (g < 0.02) discard;
  vec3 N = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vW);
  float skin = vMask.r;                 // wing membrane
  float occ = mix(0.3, 1.0, vMask.g);
  float point = vMask.b;                // horn, spike, claw, tooth
  float body = 1.0 - skin;

  // The hide: plates with dark seams, each plate a shade of its own, finer than the eye at a distance.
  float seam = 1.0; float shade = 0.5;
  #ifdef PLATES
    vec3 q = vRest * uPlates;
    float fine = 1.0 - smoothstep(0.3, 0.75, length(fwidth(q)));
    vec4 pl = plates(q);
    seam = mix(1.0, pl.x, fine * body);
    shade = mix(0.5, pl.y, fine);
    N = normalize(N + (1.0 - seam) * 0.5 * N.yzx * (pl.z - 0.5) * body);
  #endif
  float under_ = smoothstep(0.15, -0.55, vRN.y) * body;   // belly, throat and the underside of the tail
  vec3 albedo = mix(uHide * (0.7 + 0.6 * shade), mix(uHide, uBelly, 0.5) * (0.85 + 0.3 * shade), under_);
  albedo = mix(albedo, uBelly * 1.3, point * 0.7);
  albedo *= mix(1.0, 0.3, (1.0 - seam));
  // Wing skin: thinner and warmer between the fingers than on them, with veins.
  float vein = 1.0;
  #ifdef PLATES
    vein = mix(1.0, 0.82 + 0.18 * plates(vRest * 1.7 + 7.3).x, fine2(vRest));
  #endif
  albedo = mix(albedo, (uHide * 1.25 + uBelly * 0.14) * vein, skin);

  float ndl = dot(N, uKeyDir);
  float dif = smoothstep(-0.2, 1.0, ndl);
  float low = smoothstep(-0.1, 1.0, dot(N, uLowDir));
  vec3 col = albedo * (uAmb + uKey * dif + uLow * low) * occ;
  // A wet sheen on each plate.
  vec3 H = normalize(uKeyDir + V);
  col += uKey * pow(max(dot(N, H), 0.0), 42.0) * 0.55 * seam * body * occ;
  // Light through the wing: the far side lit shows on the near side, most when the reader looks toward the light.
  float thru = max(-ndl, 0.0) * (0.45 + 0.55 * pow(max(dot(V, -uKeyDir), 0.0), 2.0));
  col += uKey * uThin * mix(uBelly, uGlow, 0.55) * thru * skin * (0.5 + 0.5 * occ) * 2.2 * vein;
  // The rim: the place's own light on every edge turned away from the reader.
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uRim * fres * uRimGain * (0.3 + 0.7 * smoothstep(-0.5, 0.5, ndl)) * mix(0.55, 1.0, occ);

  // The fire inside: it shows in the seams under the throat and the chest, and in the eye.
  float along = vRest.z;                                    // head at +5.4, hips near -4
  float chest = smoothstep(-0.25, -0.8, vRN.y) * body * body * smoothstep(-2.6, 0.2, along) * (1.0 - smoothstep(3.0, 4.6, along));
  float beat = 0.72 + 0.28 * sin(uTime * 1.7 - along * 0.9);
  col += uGlow * uFire * chest * (0.04 + 1.1 * (1.0 - seam)) * beat;
  float eye = 0.0;
  for (int i = 0; i < 2; i++) { vec3 d = vRest - uEye[i]; eye += smoothstep(0.15, 0.06, length(d * vec3(1.0, 1.7, 0.8))); }
  col += (uGlow * 1.5 + 0.25) * eye * max(uFire, 0.35);

  // Under water the surface's net of light plays over its back.
  if (uCaust > 0.001) col += uRim * caustic(vW.xz * 0.0021 + vW.y * 0.0009, uTime * 0.3) * smoothstep(0.0, 0.7, N.y) * uCaust * (0.4 + 0.6 * dif);
  // Distance: water or air comes in between it and the reader.
  float far = 1.0 - exp(-max(-vW.z, 0.0) * uFogK);
  col = mix(col, uFog, far);
  // Whatever of it is still under the waterline is seen through water.
  float wf = under(p) * uSplit;
  if (wf > 0.001) {
    vec3 T = exp(-uSigmaW * 1.5 * wf);
    col = mix(col, col * T * 0.6 + uWaterCol * (1.0 - T) * 0.7, wf);
    g *= mix(1.0, 0.82, wf);
  }
  gl_FragColor = vec4(col, g);
}`;

const sanitize = (name) => name.replace(/\s/g, '_').replace(/[^\w-]/g, '');

/* ctx: { url, tier: 'phone' | 'desktop', time: { value } (seconds), wet: { uSigmaW, uWaterCol } }.
   Resolves once the model is in memory; the caller adds `object` to a scene. */
export async function createDragon({ url, tier = 'desktop', time, wet }) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  let skinned = null;
  gltf.scene.traverse((o) => {
    if (o.isSkinnedMesh) skinned = o;
  });
  if (!skinned) throw new Error('dragon: no skinned mesh in ' + url);
  const bones = Object.fromEntries(skinned.skeleton.bones.map((b) => [b.name, b]));
  const bone = (n) => bones[sanitize(n)];
  gltf.scene.updateMatrixWorld(true);
  // The mesh is stored quantized: this takes a stored vertex to where it stands at rest, in model units.
  const restM = new Matrix4().multiplyMatrices(skinned.skeleton.bones[0].matrixWorld, skinned.skeleton.boneInverses[0]);
  // The eye bones sit inside the skull: the eye itself is a little way out along x.
  const eyeAt = (n, side) => (bone(n) ? new Vector3().setFromMatrixPosition(bone(n).matrixWorld).add(new Vector3(side * 0.2, 0, 0)) : new Vector3(0, 99, 0));

  const U = {
    uBox: { value: Array.from({ length: GUARD_BOXES }, () => new Vector4(-9e4, -9e4, -9e4, -9e4)) },
    uBand: { value: new Vector2(-1e5, 1e5) },
    uWater: { value: new Vector2(1e5, 1e5) },
    uGRes: { value: new Vector2(1, 1) },
    uShow: { value: 0 },
    uTime: time ?? { value: 0 },
    uKeyDir: { value: new Vector3(0.3, 0.85, 0.4).normalize() },
    uKey: { value: new Vector3(1, 1, 1) },
    uLowDir: { value: new Vector3(0, -1, 0.3).normalize() },
    uLow: { value: new Vector3() },
    uAmb: { value: new Vector3(0.1, 0.1, 0.1) },
    uHide: { value: new Vector3(0.1, 0.1, 0.1) },
    uBelly: { value: new Vector3(0.3, 0.3, 0.3) },
    uRim: { value: new Vector3(1, 1, 1) },
    uGlow: { value: new Vector3(1, 0.6, 0.3) },
    uFog: { value: new Vector3() },
    uFogK: { value: 0 },
    uCaust: { value: 0 },
    uRimGain: { value: 1 },
    uFire: { value: 1 },
    uThin: { value: 1 },
    uSplit: { value: 0 },
    uPlates: { value: 5.2 },
    uEye: { value: [eyeAt('eye.L', 1), eyeAt('eye.R', -1)] },
    uRestM: { value: restM },
    uSigmaW: wet?.uSigmaW ?? { value: new Vector3(1, 0.4, 0.3) },
    uWaterCol: wet?.uWaterCol ?? { value: new Vector3() },
  };
  const defines = tier === 'phone' ? {} : { PLATES: 1 };
  const material = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG, defines, transparent: true, side: DoubleSide, depthWrite: false, depthTest: true });
  const depthMaterial = new ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: DEPTH_FRAG, side: DoubleSide, colorWrite: false });
  skinned.material = material;
  skinned.frustumCulled = false;
  skinned.renderOrder = 5;
  const depth = new SkinnedMesh(skinned.geometry, depthMaterial);
  depth.bind(skinned.skeleton, skinned.bindMatrix);
  depth.frustumCulled = false;
  depth.renderOrder = 4;
  skinned.parent.add(depth);

  // The model's own frame: head toward +z, back toward +y, left wing toward +x, feet on y = 0.
  const inner = new Group();
  inner.add(gltf.scene);
  const object = new Group();
  object.add(inner);
  object.visible = false;
  object.matrixAutoUpdate = false;

  const mixer = new AnimationMixer(gltf.scene);
  const act = {};
  for (const clip of gltf.animations) {
    const a = mixer.clipAction(clip);
    a.play();
    a.setEffectiveWeight(0);
    act[clip.name.toLowerCase()] = a;
  }
  if (act.roar) {
    act.roar.setLoop(LoopOnce, 1);
    act.roar.clampWhenFinished = true;
  }
  const weight = { fly: 0, glide: 0, perch: 0, roar: 0 };
  let last = -1;
  let roarAt = -1e9;

  const X = new Vector3();
  const Y = new Vector3();
  const Z = new Vector3();
  const basis = new Matrix4();
  const q0 = new Quaternion();
  const q1 = new Quaternion();
  const q2 = new Quaternion();
  const axis = new Vector3();
  const state = { x: 0, y: 0, shown: false };
  const neck = ['spine.006', 'neck.001', 'neck.002', 'head'].map(bone).filter(Boolean);

  /* Turn the neck and head by `yaw` (toward the creature's left) and `pitch` (down)
     radians, shared along the neck, about the creature's own axes. */
  function look(yaw, pitch) {
    if (!neck.length || (Math.abs(yaw) < 1e-3 && Math.abs(pitch) < 1e-3)) return;
    const share = [0.16, 0.24, 0.28, 0.32];
    for (let i = 0; i < neck.length; i++) {
      const b = neck[i];
      b.parent.updateWorldMatrix(true, false);
      b.parent.getWorldQuaternion(q0);
      // the turn in world space, then carried into the bone's parent frame
      q1.setFromAxisAngle(axis.copy(Y), yaw * share[i]);
      q2.setFromAxisAngle(axis.copy(X), pitch * share[i]);
      q1.multiply(q2);
      q2.copy(q0).invert().multiply(q1).multiply(q0);
      b.quaternion.premultiply(q2);
    }
  }

  /* pose: { t, cam: { x, y, z }, x, y, z (window px from the middle, y down, and depth),
     size (px a model unit at depth 0), fwd [x, y, z] and up [x, y, z] (world: x right, y up,
     z toward the reader), bank (radians), feet (the place given is where it stands),
     clips { fly, glide, perch } (weights), beat (wing beats a second), look [yaw, pitch],
     show (0 to 1), dpr, resY, still } */
  function update(pose) {
    const show = pose.show ?? 0;
    U.uShow.value = show;
    object.visible = show > 0.004;
    state.shown = object.visible;
    if (!object.visible) return;
    const { cam } = pose;
    const kz = (cam.z - pose.z) / cam.z;
    Z.set(pose.fwd[0], pose.fwd[1], pose.fwd[2]).normalize();
    Y.set(pose.up[0], pose.up[1], pose.up[2]);
    X.crossVectors(Y, Z).normalize();
    Y.crossVectors(Z, X);
    if (pose.bank) {
      X.applyAxisAngle(Z, pose.bank);
      Y.applyAxisAngle(Z, pose.bank);
    }
    const s = pose.size;
    basis.makeBasis(X, Y, Z);
    object.matrix.copy(basis).scale(axis.set(s, s, s));
    object.matrix.setPosition(cam.x + pose.x * kz, cam.y - pose.y * kz, pose.z);
    inner.position.y = pose.feet ? 0 : -MODEL.chest;
    state.x = pose.x;
    state.y = pose.y;
    U.uGRes.value.set(pose.dpr, pose.resY);

    // The clips: weights ease toward what the station asks for; the beat sets the wing's pace.
    const dt = last < 0 || pose.still ? 0 : Math.min(0.1, Math.max(0, pose.t - last));
    last = pose.t;
    const ease = pose.still || dt === 0 ? 1 : 1 - Math.exp(-dt / 0.3);
    let sum = 0;
    for (const k of ['fly', 'glide', 'perch']) {
      weight[k] += ((pose.clips?.[k] ?? 0) - weight[k]) * ease;
      sum += weight[k];
    }
    const roaring = act.roar && pose.t - roarAt < act.roar.getClip().duration && !pose.still;
    weight.roar += ((roaring ? 1 : 0) - weight.roar) * (pose.still ? 1 : 1 - Math.exp(-dt / 0.18));
    for (const k of ['fly', 'glide', 'perch']) act[k]?.setEffectiveWeight((weight[k] / (sum || 1)) * (1 - weight.roar));
    act.roar?.setEffectiveWeight(weight.roar);
    if (act.fly) act.fly.timeScale = (pose.beat ?? 0.8) * act.fly.getClip().duration;
    if (pose.still) {
      for (const k in act) act[k].time = (pose.phase ?? 0.3) * act[k].getClip().duration;
      mixer.update(0);
    } else mixer.update(dt);
    if (pose.look) look(pose.look[0], pose.look[1]);
  }

  /** p: { keyDir, key, lowDir, low, amb, hide, belly, rim, glow, fog (Vector3s or [r,g,b]), fogK, caust, rimGain, fire, thin, split } */
  function light(p) {
    for (const k of ['keyDir', 'key', 'lowDir', 'low', 'amb', 'hide', 'belly', 'rim', 'glow', 'fog']) {
      const v = p[k];
      if (!v) continue;
      const u = U['u' + k[0].toUpperCase() + k.slice(1)].value;
      if (v.isVector3) u.copy(v);
      else u.set(v[0], v[1], v[2]);
    }
    U.uKeyDir.value.normalize();
    U.uLowDir.value.normalize();
    for (const k of ['fogK', 'caust', 'rimGain', 'fire', 'thin', 'split']) if (p[k] !== undefined) U['u' + k[0].toUpperCase() + k.slice(1)].value = p[k];
  }

  return {
    object,
    uniforms: U,
    state,
    clips: Object.keys(act),
    bones: skinned.skeleton.bones.length,
    triangles: skinned.geometry.index ? skinned.geometry.index.count / 3 : 0,
    layout() {},
    update,
    still: (pose) => update({ ...pose, still: true }),
    light,
    /** It roars once (the clip is about 2.5 s). */
    roar(t) {
      if (!act.roar || t - roarAt < 4) return;
      roarAt = t;
      act.roar.reset().play();
    },
    /** Up to GUARD_BOXES rectangles [x0, y0, x1, y1] in window px, and a band [top, bottom]. */
    guard(boxes, band) {
      for (let i = 0; i < GUARD_BOXES; i++) {
        const r = boxes?.[i];
        if (r) U.uBox.value[i].set(r[0], r[1], r[2], r[3]);
        else U.uBox.value[i].set(-9e4, -9e4, -9e4, -9e4);
      }
      U.uBand.value.set(band ? band[0] : -1e5, band ? band[1] : 1e5);
    },
    /** The waterlines in window px (y down): what is below both is in water. */
    water(surface, shore) {
      U.uWater.value.set(surface, shore);
    },
    dispose() {
      skinned.geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
      mixer.stopAllAction();
    },
    binding: { id: 'dragon', count: () => skinned.skeleton.bones.length, project: () => ({ x: state.x, y: state.y, visible: state.shown }) },
  };
}
