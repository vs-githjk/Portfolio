// Build step 3 of 3 (see "build" in package.json): prerender the page.
//
//   1. `vite build` writes dist/ (the client bundle and a shell index.html).
//   2. `vite build --ssr` writes dist-ssr/entry-server.js (gitignored).
//   3. This script renders the app to a string, puts it in dist/index.html, and
//      inlines the stylesheet, so the first paint needs no extra request and no
//      JavaScript. The client then hydrates the same markup (its script is
//      fetched at low priority so the first image and the fonts go first).
//
// It only rewrites dist/index.html. If anything is off it exits non-zero, so a
// broken prerender fails the build instead of shipping an empty page.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const ssr = new URL('../dist-ssr/entry-server.js', import.meta.url);

const { render } = await import(pathToFileURL(ssr.pathname).href);
const html = await readFile(new URL('index.html', dist), 'utf8');

const body = render();
if (!body.includes('class="hero-name"')) throw new Error('prerender: the hero is missing from the render');

const link = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
if (!link) throw new Error('prerender: stylesheet link not found in dist/index.html');
const css = await readFile(new URL(`.${link[1]}`, dist), 'utf8');

let out = html.replace(link[0], () => `<style>${css}</style>`);
// The page is already painted from HTML, so hydration can wait: let the first
// image and the fonts have the bandwidth first.
out = out.replace(/<script type="module"/, '<script type="module" fetchpriority="low"');
out = out.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
if (out === html) throw new Error('prerender: nothing changed');
await writeFile(new URL('index.html', dist), out);
console.log(`prerendered: ${(body.length / 1024).toFixed(0)} KB of markup, ${(css.length / 1024).toFixed(0)} KB of CSS inlined`);
