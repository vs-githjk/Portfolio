// node scripts/check-classes.mjs
// The shell's stylesheet (v3-shell.css) and the sections' (sections.css, v3-sections.css)
// are written by different hands. On Nov 16 two bare class names were in both: `.plate`
// (the Orrery's SVG and the fleet cards: every fleet card was 2px wide on a desktop) and
// `.chart` (the Chart dialog and the Builds index: opening the Chart scrolled the page to
// the top). This fails when a class that STARTS a rule in the shell sheet also starts a
// rule in a sections sheet, unless it is listed in SHARED (regions both sheets style on
// purpose).
import { readFileSync } from 'node:fs';

const SHARED = new Set(['hero', 'nav', 'nav-links', 'welcome', 'orbit', 'orbit-bar', 'orbit-scene']);
const read = (name) => readFileSync(new URL(`../src/styles/${name}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
/* Every class that is the first simple selector of a rule (so `.a .b` counts `.a`, and
   `html[data-x] .b` counts nothing): those are the names a sheet claims for itself. */
const heads = (css) => {
  const out = new Set();
  for (const m of css.matchAll(/(?:^|[},])\s*\.([a-z][\w-]*)(?=[\s,{:.[>+~])/g)) out.add(m[1]);
  return out;
};
const shell = heads(read('v3-shell.css'));
const sections = new Set([...heads(read('sections.css')), ...heads(read('v3-sections.css'))]);
const both = [...shell].filter((c) => sections.has(c) && !SHARED.has(c)).sort();
if (both.length) {
  console.error(`check-classes FAILED: claimed by the shell sheet and a sections sheet: ${both.map((c) => `.${c}`).join(', ')}`);
  process.exit(1);
}
console.log(`check-classes ok (${shell.size} shell classes, ${sections.size} section classes, ${SHARED.size} shared on purpose)`);
