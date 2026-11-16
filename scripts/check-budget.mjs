// node scripts/check-budget.mjs  (after `npm run build`)
// The world's budget, checked against the hour 0 baseline of the v3 night:
// the world chunk may grow by at most 12% gzipped (the build's own gzip figure), there is one world canvas,
// and nothing of the world is requested by the prerendered page itself.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BASE_KB = 155.58; // World chunk, gzip, measured at ee20479
const CEILING = BASE_KB * 1.12;
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
  const kb = gz(world[0]);
  console.log(`world chunk ${kb.toFixed(2)} KB gzip, ceiling ${CEILING.toFixed(2)} (baseline ${BASE_KB} + 12%)`);
  if (kb > CEILING) fail.push(`world chunk is ${kb.toFixed(2)} KB gzip, over the ceiling of ${CEILING.toFixed(2)}`);
  const src = readFileSync(new URL(world[0], dir), 'utf8');
  if (/data-world-fixture|mountFixture/.test(src)) fail.push('the dev fixture is in the production world chunk');
  const canvases = (src.match(/bg-world/g) ?? []).length;
  if (canvases !== 1) fail.push(`expected one world canvas in the world chunk, found ${canvases}`);
}
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
if (/<link[^>]+(modulepreload|preload)[^>]+World-/.test(html)) fail.push('the page preloads the world chunk before first paint');
if (fail.length) {
  console.error('check-budget FAILED:\n  ' + fail.join('\n  '));
  process.exit(1);
}
console.log('check-budget ok');
