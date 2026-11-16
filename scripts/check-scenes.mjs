// Fails when a number the world draws is not a number the page states.
//
// Each flagship in src/data/content.js carries a `scene` object: the counts its
// world is built from. Every one of those numbers must appear, as a figure or as
// a word, in that flagship's own one-liner, story, metrics or captions. The
// paper's repair loop is held to the same rule: its `rounds` must be in the
// story, and its first metric must read "before → after" with before the larger.
//
//   node scripts/check-scenes.mjs                      check the data as it is
//   node scripts/check-scenes.mjs --seed prismai.cells=15
//                                                      prove the check bites: it
//                                                      must exit 1 on a wrong number
import { builds, numberWords } from '../src/data/content.js';

const seeds = process.argv.flatMap((a, i, all) => (a === '--seed' && all[i + 1] ? [all[i + 1]] : []));

const textOf = (b) =>
  [
    b.oneLiner,
    b.descriptor,
    ...(b.body || []),
    b.now?.text,
    ...(b.metrics || []).flatMap((m) => [m.value, m.label]),
    ...(b.media?.stack || []).flatMap((s) => [s.caption, s.alt]),
    b.media?.lead?.caption,
    b.media?.lead?.alt,
  ]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase();

// "14" must not be found inside "2014" or "140"; "ten" must not be found inside "often".
const says = (text, n) => {
  const figure = new RegExp(`(^|[^\\d.,])${n}(?![\\d]|[.,]\\d)`);
  const word = numberWords[n] ? new RegExp(`(^|[^a-z])${numberWords[n]}(?![a-z])`) : null;
  return figure.test(text) || Boolean(word && word.test(text));
};

const errors = [];

for (const b of builds.flagships) {
  if (!b.scene) {
    errors.push(`${b.id}: no scene object`);
    continue;
  }
  const scene = { ...b.scene };
  for (const s of seeds) {
    const [path, value] = s.split('=');
    const [id, key] = path.split('.');
    if (id === b.id) scene[key] = Number(value);
  }
  const text = textOf(b);
  for (const [key, value] of Object.entries(scene)) {
    if (typeof value !== 'number') continue;
    if (!says(text, value)) errors.push(`${b.id}: scene.${key} is ${value}, which this build's own copy never states`);
  }
}

const paper = builds.research;
if (paper.loop) {
  let rounds = paper.loop.rounds;
  for (const s of seeds) if (s.startsWith('paper.rounds=')) rounds = Number(s.split('=')[1]);
  if (!says(textOf(paper), rounds)) errors.push(`paper: loop.rounds is ${rounds}, which the paper's own copy never states`);
  const parts = paper.metrics[0].value.split('→').map((v) => Number(v.replace(/[^\d.]/g, '')));
  if (parts.length !== 2 || !(parts[0] > parts[1] && parts[1] > 0)) errors.push(`paper: first metric "${paper.metrics[0].value}" is not "before → after"`);
}

if (errors.length) {
  console.error(`check-scenes: ${errors.length} problem${errors.length > 1 ? 's' : ''}`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log(`check-scenes: ${builds.flagships.length} flagship scenes and the repair loop agree with the page`);
