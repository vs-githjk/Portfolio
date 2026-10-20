// Build step 3 of 3 (see "build" in package.json): prerender the page.
//
//   1. `vite build` writes dist/ (the client bundle and a shell index.html).
//   2. `vite build --ssr` writes dist-ssr/entry-server.js (gitignored).
//   3. This script renders the app to a string, puts it in dist/index.html, and
//      inlines the stylesheet, so the first paint needs no extra request and no
//      JavaScript. The client then hydrates the same markup (its script is
//      requested after the first paint so the first image and the fonts go first).
//
// It only rewrites dist/index.html. If anything is off it exits non-zero, so a
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
console.log(`prerendered: ${(body.length / 1024).toFixed(0)} KB of markup, ${(css.length / 1024).toFixed(0)} KB of CSS inlined`);
