import { AnimationMixer, Box3, BufferAttribute, DoubleSide, Group, Matrix4, Quaternion, ShaderMaterial, SkinnedMesh, Vector2, Vector3, Vector4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/* The dragon: a rigged, animated model, repainted and lit by the place it is in.

   Model: "European Dragon" by Nonexistent 101, Sketchfab,
   https://sketchfab.com/3d-models/european-dragon-82f393a2e6c048ad80c171ce3b3a7b87 ,
   CC-BY 4.0 (credited in content.js). scripts/prep-dragon.py and gltf-transform
   make the two files in public/dragon/. Its clips: Fly (it hovers upright, four
   beats to the clip), Perch (its "Idle Sit") and Stand.

   Vidyut did not want the model's own colours (Nov 16), so the shader repaints it:
   only the light and dark of its base colour and its normal map are used. Blue
   scales with a sheen, a gold belly and claws, red wing skin with the light
   through it, faint glowing eyes, a soft rim. Which part is which is read once at
   load from the skin weights (wing bones, toe bones) into a vertex colour.

   This file is its own chunk, asked for after the world is drawing. It is told
   where to be by dragonStations.js: a place in the window (px from the middle,
   y down), a depth, a heading and which clips to play. Like every piece of light
   it gives nothing inside the caller's keep-out boxes or outside its band. */

export const GUARD_BOXES = 6;
export const MODEL = { length: 11, span: 16, tall: 8.4 }; // the units the stations think in: the model is scaled so it sits 8.4 tall (wings folded up)

const VERT = /* glsl */ `
attribute vec4 color;
uniform mat4 uRestM;
varying vec2 vUv;
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
  vUv = uv;
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
uniform vec3 uKeyDir, uKey, uLowDir, uLow, uAmb, uHide, uBelly, uWing, uRim, uGlow, uFog, uWaterCol, uSigmaW;
uniform float uTime, uFogK, uCaust, uRimGain, uFire, uThin, uSplit;
uniform sampler2D uMap, uNormalMap;
varying vec2 vUv;
varying vec3 vN; varying vec3 vW; varying vec3 vRest; varying vec3 vRN; varying vec3 vMask;
${GUARD}
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
  vec3 col;
#ifdef EYE
  // The eyes: faint lamps, brighter where the fire is up.
  float iris = dot(texture2D(uMap, vUv).rgb, vec3(0.333));
  col = uGlow * (0.35 + 1.4 * iris) * (0.45 + 0.55 * uFire) + uRim * 0.06;
  float dif = 1.0;
#else
  float skin = vMask.r;                 // wing membrane
  float claw = vMask.b;                 // toes and claws
  float body = 1.0 - skin;
  // The model's own paint is used only for its light and dark: scales, veins, grime.
  vec3 tex = texture2D(uMap, vUv).rgb;
  float lum = dot(tex, vec3(0.299, 0.587, 0.114));
  float d = clamp(lum * mix(5.2, 2.3, skin), 0.0, 1.5);
  #ifdef TEETH
    d = 1.0; skin = 0.0; body = 1.0; claw = 1.0;
  #else
    // Its normal map, in a frame built from the surface itself.
    vec3 nm = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    vec3 dp1 = dFdx(vW); vec3 dp2 = dFdy(vW); vec2 du1 = dFdx(vUv); vec2 du2 = dFdy(vUv);
    vec3 T = dp1 * du2.y - dp2 * du1.y; vec3 B = dp2 * du1.x - dp1 * du2.x;
    float tl = max(dot(T, T), dot(B, B));
    if (tl > 1e-12) N = normalize(N * sqrt(tl) * 0.9 + (T * nm.x + B * nm.y) * 1.25);
  #endif
  float under_ = smoothstep(-0.15, -0.7, vRN.y) * body;   // belly, throat and the underside of the tail
  float back = smoothstep(0.35, 0.95, vRN.y) * body;
  vec3 albedo = mix(uHide * (0.5 + 1.0 * d) * (1.0 - 0.25 * back), uBelly * (0.55 + 0.75 * d), max(under_, smoothstep(0.25, 0.7, claw)));
  // Wing skin: red, darker along its veins and bones.
  albedo = mix(albedo, uWing * (0.4 + 0.75 * d), skin);

  float ndl = dot(N, uKeyDir);
  float dif = smoothstep(-0.2, 1.0, ndl);
  float low = smoothstep(-0.1, 1.0, dot(N, uLowDir));
  col = albedo * (uAmb * (0.55 + 0.45 * N.y) + uKey * dif + uLow * low);
  // The sheen of the scales: a tight highlight and a broad, cooler one under it.
  vec3 H = normalize(uKeyDir + V);
  float nh = max(dot(N, H), 0.0);
  col += (uKey * pow(nh, 48.0) * 0.7 + (uKey * 0.5 + uHide * 2.0) * pow(nh, 9.0) * 0.16) * body * (0.35 + 0.65 * d);
  // Light through the wing: the far side lit shows on the near side, most when the reader looks toward the light.
  float thru = max(-ndl, 0.0) * (0.45 + 0.55 * pow(max(dot(V, -uKeyDir), 0.0), 2.0));
  col += uKey * uThin * mix(uWing * 2.6, uGlow, 0.38) * thru * skin * 2.2 * (0.25 + 0.75 * d);
  // The rim: the place's own light on every edge turned away from the reader.
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col += uRim * fres * uRimGain * (0.3 + 0.7 * smoothstep(-0.5, 0.5, ndl));
  // The fire inside shows between the scales under the throat and the chest.
  col += uGlow * uFire * under_ * (1.0 - skin) * pow(1.0 - min(d, 1.0), 2.0) * 0.5 * (0.72 + 0.28 * sin(uTime * 1.7 + vRest.y * 6.0));
#endif

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

/* ctx: { url, time: { value } (seconds), wet: { uSigmaW, uWaterCol } }.
   Resolves once the model is in memory; the caller adds `object` to a scene. */
export async function createDragon({ url, time, wet }) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  const meshes = [];
  gltf.scene.traverse((o) => {
    if (o.isSkinnedMesh) meshes.push(o);
  });
  if (!meshes.length) throw new Error('dragon: no skinned mesh in ' + url);
  gltf.scene.updateMatrixWorld(true);
  const main = meshes.reduce((a, b) => (b.geometry.attributes.position.count > a.geometry.attributes.position.count ? b : a));
  const bones = main.skeleton.bones;
  const named = (re) => bones.filter((b) => re.test(b.name));

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
    uWing: { value: new Vector3(0.4, 0.1, 0.1) },
    uRim: { value: new Vector3(1, 1, 1) },
    uGlow: { value: new Vector3(1, 0.6, 0.3) },
    uFog: { value: new Vector3() },
    uFogK: { value: 0 },
    uCaust: { value: 0 },
    uRimGain: { value: 1 },
    uFire: { value: 1 },
    uThin: { value: 1 },
    uSplit: { value: 0 },
    uSigmaW: wet?.uSigmaW ?? { value: new Vector3(1, 0.4, 0.3) },
    uWaterCol: wet?.uWaterCol ?? { value: new Vector3() },
  };

  /* Every part gets the one shader. Each is stored quantized in its own frame, so each
     has its own matrix from a stored vertex to where it stands at rest; the eyes and
     the teeth are told apart by their names. */
  const kept = [];
  const depthMeshes = [];
  for (const mesh of meshes) {
    const old = mesh.material;
    const eye = /eye/i.test(mesh.name) || /eye/i.test(mesh.parent?.name ?? '');
    const teeth = /teeth/i.test(mesh.name) || /teeth/i.test(mesh.parent?.name ?? '');
    const restM = new Matrix4().multiplyMatrices(mesh.skeleton.bones[0].matrixWorld, mesh.skeleton.boneInverses[0]);
    const uniforms = { ...U, uRestM: { value: restM }, uMap: { value: old.map ?? null }, uNormalMap: { value: old.normalMap ?? old.map ?? null } };
    const defines = eye ? { EYE: 1 } : teeth ? { TEETH: 1 } : {};
    const material = new ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, defines, transparent: true, side: DoubleSide, depthWrite: false, depthTest: true });
    const depthMaterial = new ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: DEPTH_FRAG, side: DoubleSide, colorWrite: false });
    kept.push(material, depthMaterial, mesh.geometry, old);
    if (old.map) kept.push(old.map);
    if (old.normalMap) kept.push(old.normalMap);
    mesh.material = material;
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    // Which part is which, from the skin: R wing skin (the folding wing bones), B toes and claws.
    const geo = mesh.geometry;
    const n = geo.attributes.position.count;
    const mask = new Uint8Array(n * 4);
    const kind = mesh.skeleton.bones.map((b) => (/Wing_Fold/i.test(b.name) ? 1 : /Finger|toe/i.test(b.name) ? 2 : 0));
    const si = geo.attributes.skinIndex;
    const sw = geo.attributes.skinWeight;
    for (let i = 0; i < n; i++) {
      let wing = 0;
      let claw = 0;
      let tot = 0;
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        const t = kind[si.getComponent(i, k)];
        tot += w;
        if (t === 1) wing += w;
        else if (t === 2) claw += w;
      }
      mask[i * 4] = Math.round(255 * Math.min(1, (wing / (tot || 1)) * 1.6));
      mask[i * 4 + 1] = 255;
      mask[i * 4 + 2] = Math.round(255 * (claw / (tot || 1)));
      mask[i * 4 + 3] = 255;
    }
    geo.setAttribute('color', new BufferAttribute(mask, 4, true));
    const depth = new SkinnedMesh(geo, depthMaterial);
    depth.bind(mesh.skeleton, mesh.bindMatrix);
    depth.frustumCulled = false;
    depth.renderOrder = 4;
    mesh.parent.add(depth);
    depthMeshes.push(depth);
  }

  const mixer = new AnimationMixer(gltf.scene);
  const act = {};
  for (const clip of gltf.animations) {
    const a = mixer.clipAction(clip);
    a.play();
    a.setEffectiveWeight(0);
    act[clip.name.toLowerCase()] = a;
  }
  const BEATS = 4; // wing beats in the Fly clip

  /* The model arrives in its author's frame and size. Posed in a clip, it is measured
     and brought to the frame the stations think in: head toward +z, back toward +y,
     feet on y = 0 (or, in flight, its middle on the origin), 8.4 units tall sitting. */
  const box = new Box3();
  const tmpBox = new Box3();
  function measure(name) {
    for (const k in act) act[k].setEffectiveWeight(k === name ? 1 : 0);
    if (act[name]) act[name].time = 0;
    mixer.update(0);
    gltf.scene.updateMatrixWorld(true);
    box.makeEmpty();
    for (const m of meshes) {
      m.computeBoundingBox();
      box.union(tmpBox.copy(m.boundingBox).applyMatrix4(m.matrixWorld));
    }
    return box.clone();
  }
  const at = (b) => new Vector3().setFromMatrixPosition(b.matrixWorld);
  const sit = measure(act.perch ? 'perch' : 'fly');
  const head = at(named(/neck/i).pop() ?? bones[bones.length - 1]);
  const tail = at(named(/tail/i)[4] ?? bones[0]);
  const yaw = Math.atan2(head.x - tail.x, head.z - tail.z); // the way it faces, about y
  const scale = MODEL.tall / (sit.max.y - sit.min.y);
  const feet = new Vector3((sit.min.x + sit.max.x) / 2, sit.min.y, (sit.min.z + sit.max.z) / 2);
  const flyBox = measure('fly');
  const middle = flyBox.getCenter(new Vector3());
  for (const k in act) act[k].setEffectiveWeight(0);
  const dims = (b) => b.getSize(new Vector3()).applyAxisAngle(new Vector3(0, 1, 0), -yaw).multiplyScalar(scale).toArray().map((v) => Math.round(Math.abs(v) * 10) / 10);
  const metrics = { sit: dims(sit), fly: dims(flyBox) }; // [across, tall, long] in the stations' units

  const norm = new Group(); // the author's frame, turned and scaled
  norm.add(gltf.scene);
  norm.rotation.y = -yaw;
  norm.scale.setScalar(scale);
  const seat = new Group(); // where the pivot is: the feet, or the middle of the body in flight
  seat.add(norm);
  const tilt = new Group(); // nose down or up about the wings' axis
  tilt.add(seat);
  const object = new Group();
  object.add(tilt);
  object.visible = false;
  object.matrixAutoUpdate = false;
  const pivot = new Vector3();
  const place = (p) => {
    pivot.copy(p).applyAxisAngle(axisY, -yaw).multiplyScalar(scale);
    seat.position.copy(pivot).negate();
  };
  const axisY = new Vector3(0, 1, 0);

  const weight = { fly: 0, perch: 0, stand: 0 };
  let last = -1;
  const X = new Vector3();
  const Y = new Vector3();
  const Z = new Vector3();
  const basis = new Matrix4();
  const q0 = new Quaternion();
  const q1 = new Quaternion();
  const q2 = new Quaternion();
  const axis = new Vector3();
  const state = { x: 0, y: 0, shown: false };
  const neck = named(/^DEF-neck/i);

  /* Turn the neck and head by `yaw` (toward the creature's left) and `pitch` (down)
     radians, shared along the neck, about the creature's own axes. */
  function look(yawBy, pitchBy) {
    if (!neck.length || (Math.abs(yawBy) < 1e-3 && Math.abs(pitchBy) < 1e-3)) return;
    for (let i = 0; i < neck.length; i++) {
      const b = neck[i];
      const share = (0.6 + 0.8 * (i / Math.max(1, neck.length - 1))) / neck.length;
      b.parent.updateWorldMatrix(true, false);
      b.parent.getWorldQuaternion(q0);
      // the turn in world space, then carried into the bone's parent frame
      q1.setFromAxisAngle(axis.copy(Y), yawBy * share);
      q2.setFromAxisAngle(axis.copy(X), pitchBy * share);
      q1.multiply(q2);
      q2.copy(q0).invert().multiply(q1).multiply(q0);
      b.quaternion.premultiply(q2);
    }
  }

  /* pose: { t, cam: { x, y, z }, x, y, z (window px from the middle, y down, and depth),
     size (px a model unit at depth 0), fwd [x, y, z] and up [x, y, z] (world: x right, y up,
     z toward the reader), bank (radians), feet (the place given is where it stands),
     lean (radians: in flight the model hovers upright; this tips it nose down toward level),
     clips { fly, glide, perch, stand } (weights; glide is the Fly clip), beat (wing beats a
     second), look [yaw, pitch], show (0 to 1), dpr, resY, still, phase } */
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
    place(pose.feet ? feet : middle);
    tilt.rotation.x = pose.feet ? 0 : (pose.lean ?? 0);
    state.x = pose.x;
    state.y = pose.y;
    U.uGRes.value.set(pose.dpr, pose.resY);

    // The clips: weights ease toward what the station asks for; the beat sets the wing's pace.
    const dt = last < 0 || pose.still ? 0 : Math.min(0.1, Math.max(0, pose.t - last));
    last = pose.t;
    const ease = pose.still || dt === 0 ? 1 : 1 - Math.exp(-dt / 0.35);
    const want = { fly: (pose.clips?.fly ?? 0) + (pose.clips?.glide ?? 0), perch: pose.clips?.perch ?? 0, stand: pose.clips?.stand ?? 0 };
    let sum = 0;
    for (const k in weight) {
      weight[k] += (want[k] - weight[k]) * ease;
      sum += weight[k];
    }
    for (const k in weight) act[k]?.setEffectiveWeight(weight[k] / (sum || 1));
    if (act.fly) act.fly.timeScale = ((pose.beat ?? 0.7) * act.fly.getClip().duration) / BEATS;
    if (pose.still) {
      for (const k in act) act[k].time = (pose.phase ?? 0.3) * act[k].getClip().duration * (k === 'fly' ? 1 / BEATS : 1);
      mixer.update(0);
    } else mixer.update(dt);
    if (pose.look) look(pose.look[0], pose.look[1]);
  }

  /** p: { keyDir, key, lowDir, low, amb, hide, belly, wing, rim, glow, fog (Vector3s or [r,g,b]), fogK, caust, rimGain, fire, thin, split } */
  function light(p) {
    for (const k of ['keyDir', 'key', 'lowDir', 'low', 'amb', 'hide', 'belly', 'wing', 'rim', 'glow', 'fog']) {
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
    metrics,
    clips: Object.keys(act),
    bones: bones.length,
    triangles: meshes.reduce((a, m) => a + (m.geometry.index ? m.geometry.index.count / 3 : 0), 0),
    layout() {},
    update,
    still: (pose) => update({ ...pose, still: true }),
    light,
    /** The model has no roar: kept so a station may ask. */
    roar() {},
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
      for (const k of kept) k.dispose?.();
      mixer.stopAllAction();
    },
    binding: { id: 'dragon', count: () => bones.length, project: () => ({ x: state.x, y: state.y, visible: state.shown }) },
  };
}
