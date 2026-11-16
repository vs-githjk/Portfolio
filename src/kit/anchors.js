/* Where things are in the document. Every [data-world-anchor] is read into
   { top, h, mid } in document pixels, in one pass, and read again only when the
   page changes size (a ResizeObserver on the body, a window resize, fonts
   arriving). Callers may also ask for a list by selector (the realms, the
   sections); those ride the same pass. Nobody else needs to measure per frame. */
let map = {};
const lists = new Map(); // selector -> [{ top, h, mid, el }]
const subs = new Set();
const page = { h: 0, w: 0, vh: 0 };
let started = false;
let pending = 0;

const box = (el, y) => {
  const r = el.getBoundingClientRect();
  return { top: r.top + y, h: r.height, mid: r.top + y + r.height / 2, el };
};

function read() {
  pending = 0;
  const y = window.scrollY;
  const next = {};
  for (const el of document.querySelectorAll('[data-world-anchor]')) {
    const b = box(el, y);
    if (b.h > 0 || !next[el.dataset.worldAnchor]) next[el.dataset.worldAnchor] = b;
  }
  map = next;
  for (const sel of lists.keys()) lists.set(sel, [...document.querySelectorAll(sel)].map((el) => box(el, y)));
  page.h = document.documentElement.scrollHeight;
  page.w = window.innerWidth;
  page.vh = window.innerHeight;
  for (const fn of subs) fn();
}

export function relay() {
  if (!pending) pending = requestAnimationFrame(read);
}

export function startAnchors() {
  if (started) return;
  started = true;
  read();
  new ResizeObserver(relay).observe(document.body);
  window.addEventListener('resize', relay, { passive: true });
  if (document.fonts?.ready) document.fonts.ready.then(relay);
}

export const anchor = (name) => map[name] ?? null;
export const anchors = () => map;
export const pageSize = () => page;

/* A live list for a selector. The first call measures it; later passes keep it fresh. */
export function list(selector) {
  if (!lists.has(selector)) {
    const y = window.scrollY;
    lists.set(selector, [...document.querySelectorAll(selector)].map((el) => box(el, y)));
  }
  return lists.get(selector);
}

export function onRelay(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
