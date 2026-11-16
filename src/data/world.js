import { builds, contact, experience, hero, highlights, principles, proofOfWork, toolkit, value, welcome } from './content';

/* The world's own words and wiring for this site (lane A): place names, the
   labels of the shell's controls, the load lines, the receipt sentences, and how
   this world places its two waterlines. Counts are never typed here: every
   number in a sentence is computed from content.js or the GitHub snapshot. */

/* The same snapshot the commit graph draws (ProofOfWork.jsx, World.jsx). */
const snaps = import.meta.glob('./github*.json', { eager: true, import: 'default' });
const github = snaps['./github.local.json'] ?? snaps['./github.json'] ?? { days: [], total: 0 };

/* The two waterlines, as the scene draws them (lib/worldScene.js): the surface is
   a place in the page, 36% down its vista; the shore's line comes down the window
   while the camera rises through it. px from the window top, or null. */
const smooth = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

export const waterlines = {
  line: (a, y) => (a.surface ? a.surface.top + a.surface.h * 0.36 - y : null),
  shore: (a, y, h) => {
    if (!a.shore) return null;
    const rise = smooth((y - (a.shore.top - h * 0.3)) / (h * 0.55));
    return rise <= 0 || rise >= 1 ? null : h * (-0.08 + 1.22 * rise);
  },
};

/* The realm the bar is in, from the same two lines (so the bar changes palette at
   the line, not at a section's edge): space above the surface, the sea under it,
   the earth once the shore's line has come down past the bar. While a line is
   inside the bar, the bar keeps the palette of what is above it for the surface
   and of what is below it for the shore; Nav.jsx paints the other side. */
export function realmAt(a, y, h, bar) {
  if (!a.surface) return null;
  if (a.surface.top + a.surface.h * 0.36 - y > 0) return '';
  if (!a.shore) return 'sea';
  const rise = smooth((y - (a.shore.top - h * 0.3)) / (h * 0.55));
  if (rise >= 1) return 'earth';
  return h * (-0.08 + 1.22 * rise) >= bar ? 'earth' : 'sea';
}

/* The first screen's two links and the short hint between them. */
export const entry = {
  enter: 'Enter',
  hint: 'or scroll',
  skip: 'Skip intro',
};

/* The load line on the first screen: what is arriving, said as it arrives. Keys
   are the stages of EV.loaded. */
export const loadLines = {
  beams: 'Lighting the stars',
  chunk: 'Filling the sea',
  compiled: 'The world is ready', // the scene's programs are compiled
  plain: 'Plain view',
};

/* ------------------------------------------------------------- PLACES ---- */
/* The descent, top to bottom. `id` is the element the Chart links to; where the
   page has no id for it yet, `find` is how to reach the element (the Chart gives
   it the id). `section` is the key the sections use for the same place when it
   differs from the id. `label` is the section's own name, from content.js. A
   `line` is a waterline: drawn on the Chart, not a destination. */
export const places = [
  { id: 'welcome', name: 'The Threshold', label: welcome.label, realm: 'space' },
  { id: 'top', name: 'The Landing', label: hero.headline, realm: 'space' },
  { line: 'surface', name: 'The Waterline' },
  { id: 'work', name: 'The Sounding', label: experience.heading, realm: 'sea' },
  { id: 'builds', name: 'The Deep', label: builds.heading, realm: 'sea' },
  { line: 'shore', name: 'The Breach' },
  { id: 'camp', section: 'crew', find: '.crew', name: 'The Camp', label: builds.building.title, realm: 'earth' },
  { id: 'highlights', find: '.hl', name: 'The Cut', label: highlights.eyebrow, realm: 'earth' },
  { id: 'verify', name: 'The Ridge at night', label: proofOfWork.eyebrow, realm: 'earth' },
  { id: 'principles', name: 'The Bench', label: principles.heading, realm: 'earth' },
  { id: 'value', name: 'Moonrise', label: value.heading, realm: 'earth' },
  { id: 'toolkit', name: 'The Inventory', label: toolkit.eyebrow, realm: 'earth' },
  { id: 'contact', name: 'First Light', label: contact.eyebrow, realm: 'earth' },
];

/* Every build, in page order, in its four groups: the Chart's depth chart. */
export const buildGroups = [
  { id: 'flagships', label: 'Flagships', items: builds.flagships },
  { id: 'featured', label: 'Featured', items: builds.items },
  { id: 'paper', label: 'The paper', items: builds.research ? [builds.research] : [] },
  { id: 'more', label: builds.more.heading, items: builds.more.items },
].map((g) => ({ ...g, items: g.items.map((b) => ({ id: b.id, title: b.title })) }));
export const buildCount = buildGroups.reduce((n, g) => n + g.items.length, 0);

/* The shell's own labels (the Chart, the bar's tools, the switches). */
export const shell = {
  chart: { open: 'Chart', title: 'The Chart', lede: 'One world, top to bottom. Pick a place.', here: 'You are here', close: 'Close the chart', places: 'Places', builds: 'Builds', switches: 'Switches', key: 'M' },
  receipts: { label: 'Receipts', hint: 'Label every living thing with the fact it is drawn from', key: 'R', ledger: 'Receipts' },
  sound: { label: 'Sound', on: 'on', off: 'off', hint: 'Synthesized in the browser. Never plays by itself.' },
  world: { label: 'World', on: 'on', off: 'plain', hint: 'Plain view is the page alone: no canvases.' },
};

/* ------------------------------------------------- ANCHORS AND BINDINGS ---- */
/* The windows the scene reads (data-world-anchor) and the living things Receipts
   can name. Site words, so they live here and not in the kit's contract. */
export const ANCHOR = [
  'surface', 'giant', 'flag-prismai', 'flag-duelwise', 'flag-snapback', 'fleet-fishmarket',
  'shore', 'camp', 'galaxy', 'roost', 'graph', 'wins', 'value', 'contact', 'horizon',
];

export const BINDING = ['orrery', 'wyrm', 'giant', 'prism', 'board', 'scan', 'school', 'fires', 'stars', 'moon'];

/* ----------------------------------------------------------- RECEIPTS ---- */
/* What each living thing in the world is, the count it is drawn from, and the
   file the count comes from. Keys are BINDING ids. Every figure is
   computed here from the data, so a change in the data changes the sentence. */
const days = github.days ?? [];
const weeks = days.length ? Math.ceil((new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + days.length) / 7) : 0;
const scene = (kind) => builds.flagships.find((f) => f.scene?.kind === kind);
const ring = hero.carousel.slides.length;
const crew = builds.building.crew.length;
const wins = proofOfWork.wins.items.length;
const SOURCE = { content: 'content.js', github: 'github.json' };

const facts = {
  orrery: () => ({ name: 'The Orrery', fact: `${ring} builds in orbit, one tick each`, source: SOURCE.content }),
  wyrm: () => ({ name: 'The dragon', fact: `one vertebra for each of the last ${weeks} weeks of commits`, source: SOURCE.github }),
  giant: () => ({ name: 'The giant', fact: `${buildCount} builds: ${builds.flagships.length} moons, ${buildCount - builds.flagships.length} ring lights`, source: SOURCE.content }),
  prism: () => {
    const f = scene('prism');
    return f && { name: f.title, fact: `${f.scene.cells} lights, each in its own cell: ${f.scene.cells} beta users`, source: SOURCE.content };
  },
  board: () => {
    const f = scene('board');
    return f && { name: f.title, fact: `${f.scene.moons} moons for ${f.scene.moons} games, ${f.scene.lights} lights for ${f.scene.lights} players`, source: SOURCE.content };
  },
  scan: () => {
    const f = scene('scan');
    return f && { name: f.title, fact: `${f.scene.placed} of ${f.scene.photos} photos placed, ${f.scene.decoysPlaced} of ${f.scene.decoys} decoys`, source: SOURCE.content };
  },
  school: () => {
    const f = [...builds.items, ...builds.more.items].find((b) => b.id === 'fishmarket');
    return f && { name: 'The school', fact: `${f.title}: seller agents in lanes that never cross`, source: SOURCE.content };
  },
  fires: () => ({ name: 'The camp', fact: `${crew} fires, one per agent`, source: SOURCE.content }),
  stars: () => ({ name: 'The constellation', fact: `${wins} gold stars, one per win`, source: SOURCE.content }),
  moon: () => ({ name: 'The moon', fact: `full when the last of ${value.claims.length} rows is read`, source: SOURCE.content }),
};

/* { name, fact, source } for a binding id, or null when the data has no such thing. */
export function receiptParts(id) {
  return facts[id]?.() ?? null;
}

/* The same as one sentence: "The dragon · one vertebra for each of the last 53 weeks of commits · github.json". */
export function receipts(id) {
  const r = receiptParts(id);
  return r ? `${r.name} · ${r.fact} · ${r.source}` : '';
}
