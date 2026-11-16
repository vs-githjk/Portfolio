import { PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import { createDragon } from './dragon';

/* Dev only (kit-demo.html is not a build input): the dragon alone on a plain
   ground, to judge the model, its clips and each place's light.

   ?clip=fly|glide|perch|roar   ?light=sea|dusk|night|dawn   ?yaw=deg (0 flies to the right, 90 toward the reader)
   ?pitch=deg   ?bank=deg   ?size=px per unit   ?lite (the phone file)   ?still   ?t=seconds   ?bare (no label)   ?bg=hex|none

   public/dragon/perch.webp (the still that stands on the roost under reduced motion) is a
   screenshot of ?clip=perch&light=night&yaw=145&look=-28&still&bare&bg=none with no page ground. */
const q = new URLSearchParams(location.search);
const root = document.documentElement;
if (q.has('bare')) root.dataset.bare = '';
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);

const canvas = document.getElementById('c');
const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
const scene = new Scene();
const camera = new PerspectiveCamera(36, 1, 10, 12000);
const time = { value: 0 };
const live = await createDragon({ url: q.has('lite') ? '/dragon/dragon-lite.glb' : '/dragon/dragon.glb', tier: q.has('lite') ? 'phone' : 'desktop', time });
scene.add(live.object);
const v = (r, g, b, k = 1) => new Vector3((r / 255) * k, (g / 255) * k, (b / 255) * k);
const LIGHT = {
  sea: { keyDir: [0.25, 0.9, 0.35], key: v(150, 232, 232, 0.95), lowDir: [0, -1, 0.2], low: v(15, 84, 96, 0.5), amb: v(15, 84, 96, 0.7), hide: v(12, 46, 58), belly: v(60, 128, 132), rim: v(150, 232, 232, 0.9), glow: v(150, 240, 255), fog: v(6, 40, 50), fogK: 0, caust: 0.55, rimGain: 0.85, fire: 0.55, thin: 0.5 },
  dusk: { keyDir: [0.5, 0.22, -0.7], key: v(255, 226, 178, 1.5), lowDir: [-0.3, -0.8, 0.5], low: v(226, 120, 64, 0.22), amb: v(104, 52, 74, 0.55), hide: v(30, 20, 22), belly: v(120, 70, 50), rim: v(255, 190, 136), glow: v(255, 140, 70), fog: v(226, 120, 64), fogK: 0, caust: 0, rimGain: 1.25, fire: 0.9, thin: 1.15 },
  night: { keyDir: [-0.5, 0.62, 0.6], key: v(246, 230, 210, 0.8), lowDir: [0.25, -0.85, 0.45], low: v(255, 150, 84, 0.34), amb: v(30, 22, 20, 2.6), hide: v(30, 20, 22), belly: v(120, 70, 50), rim: v(255, 150, 84, 0.8), glow: v(255, 140, 70), fog: v(30, 22, 20), fogK: 0, caust: 0, rimGain: 0.7, fire: 1.25, thin: 0.5 },
};
LIGHT.dawn = { ...LIGHT.dusk, keyDir: [-0.62, 0.12, -0.6], amb: v(30, 22, 20, 1.7) };
live.light(LIGHT[q.get('light')] ?? LIGHT.night);
const ground = { sea: '#0a3a44', dusk: '#b4705a', night: '#120d0c', dawn: '#1a1416' }[q.get('light') ?? 'night'];
document.body.style.background = q.get('bg') === 'none' ? 'transparent' : q.get('bg') ? '#' + q.get('bg') : ground;
if (q.get('bg') === 'none') root.style.background = 'transparent';
document.getElementById('label').textContent = `dragon · ${live.bones} bones · ${live.triangles} triangles · clips ${live.clips.join(', ')}`;

let w = 1;
let h = 1;
let camZ = 1;
let dpr = 1;
function layout() {
  w = window.innerWidth;
  h = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  camZ = h / 2 / Math.tan((36 * Math.PI) / 360);
  camera.aspect = w / h;
  camera.position.set(0, 0, camZ);
  camera.updateProjectionMatrix();
}
const clip = q.get('clip') || 'fly';
const still = q.has('still');
const rad = Math.PI / 180;
function frame(ms) {
  const t = q.has('t') ? Number(q.get('t')) : ms / 1000;
  time.value = t;
  const yaw = num('yaw', 35) * rad;
  const pitch = num('pitch', 0) * rad;
  const fwd = [Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch), Math.sin(yaw) * Math.cos(pitch)];
  const perch = clip === 'perch' || clip === 'roar';
  if (clip === 'roar' && !still) live.roar(t);
  const pose = { t, cam: { x: 0, y: 0, z: camZ }, x: num('x', 0), y: num('y', perch ? h * 0.2 : 0), z: num('z', 0), size: num('size', Math.min(w / 17, h / 11)), feet: perch, fwd, up: [0, 1, 0], bank: num('bank', 0) * rad, clips: { [perch ? 'perch' : clip]: 1 }, beat: num('beat', 0.8), look: [num('look', 0) * rad, num('nod', 0) * rad], show: 1, dpr, resY: Math.floor(h * dpr), phase: num('phase', 0.3) };
  if (still) live.still(pose);
  else live.update(pose);
  renderer.render(scene, camera);
  root.dataset.demo = 'ready';
  if (!still) requestAnimationFrame(frame);
}
layout();
window.addEventListener('resize', () => {
  layout();
  if (still) frame(0);
});
requestAnimationFrame(frame);
