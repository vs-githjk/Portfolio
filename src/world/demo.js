import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { readTokens } from './piece';
import { weeksFrom, wyrm } from './wyrm';

/* Dev only (kit-demo.html is not a build input): the wyrm piece mounted with
   another theme's tokens and a labelled demo array, to show that a piece carries
   no site words, colours or counts.

   ?data=real   the site's own snapshot instead of the demo array
   ?weeks=n     length of the demo array (default 30)
   ?pose=s|arc|coil|flat   ?still   ?t=seconds (a frozen moment of the motion)   ?theme=mono|site (site: the site's own piece tokens)   ?bare (no label)   ?line (a waterline through the middle) */
const q = new URLSearchParams(location.search);
const root = document.documentElement;
if (q.get('theme') === 'site') await import('../styles/v3-world.css');
else if (q.has('theme')) root.dataset.theme = q.get('theme');
if (q.has('bare')) root.dataset.bare = '';

const DEMO = Array.from({ length: Number(q.get('weeks')) || 30 }, (_, i) => {
  const levels = Array.from({ length: 7 }, (_, d) => (i * 7 + d * 3) % 5);
  return { total: levels.reduce((a, b) => a + b * 3, 0) + (i % 6) * 4, levels };
});
let weeks = DEMO;
let label = `DEMO DATA: ${DEMO.length} made-up weeks`;
if (q.get('data') === 'real') {
  const snaps = import.meta.glob('../data/github*.json', { eager: true, import: 'default' });
  const github = snaps['../data/github.local.json'] ?? snaps['../data/github.json'];
  weeks = weeksFrom(github.days);
  label = `${weeks.length} weeks from the snapshot`;
}

const canvas = document.getElementById('c');
const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setClearColor(0x000000, 0);
const scene = new Scene();
const camera = new PerspectiveCamera(36, 1, 10, 12000);
const tok = readTokens(getComputedStyle(root), wyrm.tokens);
const live = wyrm.create({
  weeks,
  colors: { water: [tok['wyrm-sea-lo'], tok['wyrm-sea'], tok['wyrm-sea-hi']], air: [tok['wyrm-air-lo'], tok['wyrm-air'], tok['wyrm-air-hi']] },
  tier: window.innerWidth < 760 ? 'phone' : 'desktop',
});
scene.add(live.object);
document.getElementById('label').textContent = `${label} · piece "${wyrm.name}" · ${live.count()} vertebrae`;

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
const kind = q.get('pose') || 's';
const still = q.has('still');
const t0 = Number(q.get('t')) || 0;
function frame(ms) {
  const t = still ? t0 : ms / 1000;
  const L = live.length;
  const scale = Math.min((w * 0.86) / L, kind === 'coil' ? 16 : 22);
  const at = (k, d, out) => {
    const u = d / L; // 0 at the snout, 1 at the tail tip
    const swim = Math.sin(t * 1.5 - d * 0.24) * (0.3 + 2.2 * u) * scale * (still ? 0.4 : 1);
    if (kind === 'flat') {
      out[0] = (0.5 - u) * L * scale;
      out[1] = 0;
      out[2] = 0;
    } else if (kind === 'coil') {
      const a = u * 8.2 - 0.6 + t * 0.15;
      const r = (34 + u * 250) * (scale / 16);
      out[0] = Math.cos(a) * r;
      out[1] = Math.sin(a) * r * 0.62 + swim * 0.2;
      out[2] = Math.sin(a + 1) * 120;
    } else if (kind === 'arc') {
      out[0] = (0.5 - u) * L * scale * 0.9;
      out[1] = -Math.sin(u * Math.PI) * h * 0.3 + h * 0.18 + swim;
      out[2] = Math.cos(u * 5) * 100;
    } else {
      out[0] = (0.5 - u) * L * scale * 0.94;
      out[1] = Math.sin(u * 5.2 + 0.4) * h * 0.13 * (0.5 + u) - h * 0.02 + swim;
      out[2] = Math.cos(u * 5.2 + 0.4) * 150;
    }
  };
  live.water(q.has('line') ? 0 : 1e5, q.has('line') ? 0 : 1e5);
  const pose = { t, scale, at, cam: { x: 0, y: 0, z: camZ }, beat: 0.7, dpr, resY: Math.floor(h * dpr), show: 1, solid: 0 };
  if (still && !t0) live.still(pose);
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
