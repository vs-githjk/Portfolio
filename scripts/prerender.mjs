// Build step 3 of 3 (see "build" in package.json): prerender the page.
//
//   1. `vite build` writes dist/ (the client bundle and a shell index.html).
//   2. `vite build --ssr` writes dist-ssr/entry-server.js (gitignored).
//   3. This script renders the app to a string, puts it in dist/index.html, and
//      inlines the stylesheet, so the first paint needs no extra request and no
//      JavaScript. The client then hydrates the same markup (its script is
//      requested after the first paint so the first image and the fonts go first).
//
// It rewrites dist/index.html and writes dist/llms.txt (the page as plain text,
// generated from content.js). If anything is off it exits non-zero, so a
// broken prerender fails the build instead of shipping an empty page.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const ssr = new URL('../dist-ssr/entry-server.js', import.meta.url);

const { render, meta } = await import(pathToFileURL(ssr.pathname).href);
const html = await readFile(new URL('index.html', dist), 'utf8');

const body = render();
if (!body.includes('class="hero-name"')) throw new Error('prerender: the hero is missing from the render');

const link = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!link) throw new Error('prerender: stylesheet link not found in dist/index.html');
const css = await readFile(new URL(`.${link[1]}`, dist), 'utf8');

let out = html.replace(link[0], () => `<style>${css}</style>`);
// Title and description come from content.js (meta), the one place for copy.
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const setMeta = (re, tag) => {
  if (!re.test(out)) throw new Error(`prerender: ${tag} not found in dist/index.html`);
  out = out.replace(re, () => tag);
};
setMeta(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
setMeta(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(meta.description)}" />`);
setMeta(/<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(meta.title)}" />`);
setMeta(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${esc(meta.description)}" />`);
// The page is already painted from HTML, so hydration can wait: the first image and
// the fonts get the bandwidth first. The bundle is requested only after the first
// largest-contentful-paint entry (the name), or after 1.5s where that is not
// supported, so it is not part of the work the first paint waits for.
const bundle = out.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
if (!bundle) throw new Error('prerender: module script not found in dist/index.html');
const loader = `<script>(function(){var n=0;function go(){if(n++)return;var s=document.createElement('script');s.type='module';s.crossOrigin='';s.src='${bundle[1]}';document.head.appendChild(s)}try{new PerformanceObserver(function(){setTimeout(go,0)}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}setTimeout(go,1500)})()</script>`;
out = out.replace(bundle[0], () => loader);
out = out.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
if (out === html) throw new Error('prerender: nothing changed');
await writeFile(new URL('index.html', dist), out);

// /llms.txt: the page for a model that reads instead of scrolls. Written from
// content.js on every build, so it can only say what the page says.
const site = (html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '').replace(/\/$/, '');
const c = await import(pathToFileURL(new URL('../src/data/content.js', import.meta.url).pathname).href);
const plain = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s*\n\s*/g, ' ');
const first = (links = []) => links.find((l) => l.href)?.href;
const entry = (b) => `- [${b.title}](${first(b.links) ?? `${site}/#build-${b.id}`}): ${plain(b.oneLiner)}${b.role ? ` ${plain(b.role)}` : ''}`;
const llms = [
  `# ${c.meta.name}`,
  '',
  `> ${c.meta.description}`,
  '',
  `${c.hero.where ?? ''}`.trim(),
  `Site: ${site}/`,
  '',
  `## ${c.experience.heading}`,
  ...c.experience.roles.map((r) => `- ${r.org}, ${r.role} (${plain(r.when)}; ${r.where}): ${[r.note, ...r.wins].map(plain).join(' ')}`),
  '',
  `## ${c.builds.heading}`,
  ...[...c.builds.flagships, ...c.builds.items].map(entry),
  `- [${c.builds.research.fullTitle}](${first(c.builds.research.links)}): ${plain(c.builds.research.oneLiner)} ${plain(c.builds.research.role)} ${c.builds.research.kind}.`,
  ...c.builds.more.items.map(entry),
  `- ${c.builds.building.title} (${c.builds.building.eyebrow.toLowerCase()}, ${c.builds.building.descriptor}): ${plain(c.builds.building.oneLiner)} ${plain(c.builds.building.lead)}`,
  '',
  `## ${c.highlights.eyebrow}`,
  ...c.highlights.items.map((h) => `- ${plain(h.text)}`),
  '',
  `## ${c.proofOfWork.wins.eyebrow}`,
  ...c.proofOfWork.wins.items.map((w) => `- ${w.project}: ${w.place}, ${w.prize}. ${w.event}${w.href ? ` (${w.href})` : ''}`),
  plain(c.proofOfWork.wins.provenance),
  '',
  `## ${c.proofOfWork.checkLabel}`,
  ...c.proofOfWork.tiles.filter((t) => t.href).map((t) => `- [${t.kind}: ${t.value}](${t.href}): ${t.detail}`),
  '',
  `## ${c.principles.heading}`,
  ...c.principles.items.map((p) => `- ${p.title} ${plain(p.body)}`),
  '',
  `## ${c.contact.eyebrow}`,
  `- ${c.contact.availability}`,
  `- Email: ${c.contact.email}`,
  ...c.contact.links.filter((l) => /^https?:/.test(l.href)).map((l) => `- [${l.kind}: ${l.value}](${l.href})`),
  '',
]
  .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
  .join('\n');
if (/[\u2013\u2014]/.test(llms)) throw new Error('prerender: a dash found its way into llms.txt');
await writeFile(new URL('llms.txt', dist), llms);
console.log(`prerendered: ${(body.length / 1024).toFixed(0)} KB of markup, ${(css.length / 1024).toFixed(0)} KB of CSS inlined`);
