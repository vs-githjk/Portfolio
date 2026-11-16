import { ANCHOR } from '../data/world';

/* Where the page says the world's pieces live. The shell and the sections mark
   elements with data-world-anchor="<name>" (the names are the contract's). Until
   every anchor is in the markup, a name falls back to the element that stood for
   it before; a name with neither is simply absent and its piece stays off. */
const FALLBACK = {
  surface: '.vista[data-set="surface"]',
  giant: '.vista[data-set="giant"]',
  shore: '.vista[data-set="shore"]',
  galaxy: '.vista[data-set="galaxy"]',
  horizon: '.vista[data-set="horizon"]',
  camp: '.crew',
  value: '#value',
  contact: '#contact',
  graph: '.heat',
};

export function anchorEl(name) {
  if (!ANCHOR.includes(name)) return null;
  return document.querySelector(`[data-world-anchor="${name}"]`) ?? (FALLBACK[name] ? document.querySelector(FALLBACK[name]) : null);
}

/** An anchor's box in document px, or null when it is missing or collapsed. */
export function anchorRect(name) {
  const el = anchorEl(name);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.height < 2 || r.width < 2) return null;
  const top = r.top + window.scrollY;
  return { el, left: r.left, right: r.right, w: r.width, top, h: r.height, bottom: top + r.height, mid: top + r.height / 2, cx: r.left + r.width / 2 };
}

/** The x of every column of a graph drawn as an SVG (window px, at the middle of
    each column), or null. */
export function columnsOf(el, count) {
  const svg = el?.matches?.('svg') ? el : el?.querySelector?.('svg');
  if (!svg || !count) return null;
  const box = svg.getBoundingClientRect();
  const xs = new Float32Array(count);
  // The graph says where its columns are (px from its own left edge to the middle
  // of the first week, and from one week to the next).
  const x0 = parseFloat(svg.dataset.weekX0 ?? el.dataset?.weekX0);
  const dx = parseFloat(svg.dataset.weekDx ?? el.dataset?.weekDx);
  if (Number.isFinite(x0) && dx > 0) {
    for (let i = 0; i < count; i++) xs[i] = box.left + x0 + i * dx;
    return { xs, pitch: dx, left: box.left, right: box.right };
  }
  // Otherwise the SVG's own screen matrix does it: a viewBox `count` columns wide.
  const vb = svg.viewBox?.baseVal;
  const m = svg.getScreenCTM?.();
  if (!vb || !m || !vb.width) return null;
  const pitch = Number(el.dataset?.pitch) || vb.width / count;
  const cell = Number(el.dataset?.cell) || pitch * (11 / 13);
  for (let i = 0; i < count; i++) xs[i] = m.a * (vb.x + i * pitch + cell / 2) + m.e;
  return { xs, pitch: m.a * pitch, left: box.left, right: box.right };
}
