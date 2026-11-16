// node scripts/check-budget.mjs  (after `npm run build`)
// The world's budget, checked against the hour 0 baseline of the v3 night:
// the world chunk (with three's core) may grow by at most 14% gzipped, there is one world canvas,
// nothing of the world is requested by the prerendered page itself, and the dragon (its own chunk, asked
// for after the world has drawn, and its two model files, of which a visitor gets one) stays under its own ceilings.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BASE_KB = 155.58; // World chunk, gzip, measured at ee20479
// Since the dragon became a model (v4), three's core is a chunk the world and the dragon share, and it
// carries the skinning and animation classes only the dragon uses (about 19 KB gzip). The ceiling is on
// the two together, and the allowance went from 12% to 14% for it: measured 175.0 KB on Nov 16 2026.
const CEILING = BASE_KB * 1.14;
const dir = new URL('../dist/assets/', import.meta.url);
let files;
try {
  files = readdirSync(dir);
} catch {
  console.error('check-budget: no dist/assets. Run `npm run build` first.');
  process.exit(1);
}
const fail = [];
const gz = (name) => gzipSync(readFileSync(new URL(name, dir))).length / 1000;
const world = files.filter((f) => /^World-.*\.js$/.test(f));
if (world.length !== 1) fail.push(`expected one World chunk, found ${world.length}`);
for (const f of files.filter((f) => f.endsWith('.js'))) console.log(`${gz(f).toFixed(2).padStart(8)} KB gzip  ${f}`);
if (world.length) {
  const core = files.filter((f) => /^three\..*\.js$/.test(f));
  const kb = gz(world[0]) + core.reduce((a, f) => a + gz(f), 0);
  console.log(`world chunk with three's core ${kb.toFixed(2)} KB gzip, ceiling ${CEILING.toFixed(2)} (baseline ${BASE_KB} + 14%)`);
  if (kb > CEILING) fail.push(`world chunk with three's core is ${kb.toFixed(2)} KB gzip, over the ceiling of ${CEILING.toFixed(2)}`);
  const src = readFileSync(new URL(world[0], dir), 'utf8');
  if (/data-world-fixture|mountFixture/.test(src)) fail.push('the dev fixture is in the production world chunk');
  const canvases = (src.match(/bg-world/g) ?? []).length;
  if (canvases !== 1) fail.push(`expected one world canvas in the world chunk, found ${canvases}`);
}
// The dragon: code in a chunk of its own (never inside the world chunk), models under public/dragon.
const DRAGON_JS_KB = 45; // gzip: the loader, the mesh decoder, the shader and the stations
const DRAGON_MODEL_KB = { 'dragon.glb': 380, 'dragon-lite.glb': 160 }; // gzip, per file
const dragonJs = files.filter((f) => /^dragon.*\.js$/i.test(f));
if (!dragonJs.length) fail.push('expected the dragon in a chunk of its own');
const dragonKb = dragonJs.reduce((a, f) => a + gz(f), 0);
console.log(`dragon chunks ${dragonKb.toFixed(2)} KB gzip, ceiling ${DRAGON_JS_KB}`);
if (dragonKb > DRAGON_JS_KB) fail.push(`the dragon's code is ${dragonKb.toFixed(2)} KB gzip, over ${DRAGON_JS_KB}`);
if (world.length && /GLTFLoader|EXT_meshopt_compression/.test(readFileSync(new URL(world[0], dir), 'utf8'))) fail.push('the model loader is inside the world chunk');
for (const [name, cap] of Object.entries(DRAGON_MODEL_KB)) {
  try {
    const kb = gzipSync(readFileSync(new URL(`../dist/dragon/${name}`, import.meta.url))).length / 1000;
    console.log(`${kb.toFixed(2).padStart(8)} KB gzip  dragon/${name} (ceiling ${cap})`);
    if (kb > cap) fail.push(`dragon/${name} is ${kb.toFixed(2)} KB gzip, over ${cap}`);
  } catch {
    fail.push(`dist/dragon/${name} is missing`);
  }
}
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
if (/<link[^>]+(modulepreload|preload)[^>]+World-/.test(html)) fail.push('the page preloads the world chunk before first paint');
if (/assets\/dragon|\/dragon\/[\w-]+\.glb/i.test(html.replace(/<style[\s\S]*?<\/style>/g, ''))) fail.push('the prerendered page asks for the dragon: nothing of it may load before the world');
if (fail.length) {
  console.error('check-budget FAILED:\n  ' + fail.join('\n  '));
  process.exit(1);
}
console.log('check-budget ok');
