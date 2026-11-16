import { VAR } from './contract';
import { add, kick } from './director';
import { anchors, list, onRelay, pageSize, startAnchors } from './anchors';

/* DOM-derived scalars, written as CSS variables so the page and the scene read
   one truth:

     --w-line   the first waterline, px from the window top, -1 when off screen
     --w-shore  the second waterline, same
     --w-depth  0 to 1 down the page, counted from `origin()`
     data-at    the realm under the bar: `realm(...)` if the caller gives one, else
                the last [data-realm] the bar has reached
     data-split which line is crossing the bar right now ("line" or "shore"), so the
                bar can wear two palettes, cut exactly at that line

   The variables change on every frame of a scroll, so they are never written on
   <html>: a custom property there is inherited by every element, and each write
   made the browser restyle the whole document (measured on a throttled phone:
   about 10ms a frame, the largest single cost of scrolling). The caller names
   the element that reads each one (`scope.lines`, `scope.depth`: selectors); a
   variable whose reader is not in the page, or is not displayed, is not written
   at all. data-at and data-split stay on <html>: they change a few times a page.

   The caller passes how its world places the two lines (`lines.line` and
   `lines.shore`: (anchors, scrollY, viewportH) -> px or null) and where its
   journey starts (`origin`). Everything is computed from the cached anchors and
   the frame's scroll offset: no layout is read per frame, and a variable is only
   written when its rounded value changes. */
export function startSignals({ lines = {}, origin = () => 0, bar = () => 64, realm = null, scope = {} } = {}) {
  const root = document.documentElement;
  const wrote = {};
  const readers = {};
  const shown = {};
  /* The element that reads a variable, if it is displayed. Whether it is, is
     read once and again after a resize (a fixed element has no offsetParent, so
     this asks for its boxes), never per frame. */
  const reader = (kind) => {
    const sel = scope[kind];
    if (!sel) return null;
    let el = readers[kind];
    if (!el || !el.isConnected) {
      el = readers[kind] = document.querySelector(sel);
      delete shown[kind];
    }
    if (!el) return null;
    if (shown[kind] === undefined) shown[kind] = el.getClientRects().length > 0;
    return shown[kind] ? el : null;
  };
  const onResize = () => {
    for (const kind of Object.keys(shown)) delete shown[kind];
  };
  window.addEventListener('resize', onResize, { passive: true });
  const put = (kind, name, value) => {
    const el = reader(kind);
    if (!el) {
      delete wrote[name];
      return;
    }
    if (wrote[name] === value) return;
    wrote[name] = value;
    el.style.setProperty(name, value);
  };
  startAnchors();
  const realms = () => list('[data-realm]');
  let at = null;

  let split = null;

  const task = (now, f) => {
    const a = anchors();
    const barH = bar();
    let cut = '';
    for (const key of ['line', 'shore']) {
      const px = lines[key] ? lines[key](a, f.y, f.h) : null;
      put('lines', VAR[key], px == null || px < 0 || px > f.h ? '-1' : px.toFixed(1));
      if (px != null && px > 0 && px < barH) cut = key;
    }
    if (cut !== split) {
      split = cut;
      if (cut) root.dataset.split = cut;
      else delete root.dataset.split;
    }
    const from = origin();
    const room = pageSize().h - f.h - from;
    put('depth', VAR.depth, room > 0 ? Math.max(0, Math.min(1, (f.y - from) / room)).toFixed(4) : '0');
    let here = '';
    if (realm) here = realm(a, f.y, f.h, barH) ?? '';
    else for (const r of realms()) if (r.h > 0 && r.top - f.y <= barH) here = r.el.dataset.realm;
    if (here !== at) {
      at = here;
      if (here) root.dataset.at = here;
      else delete root.dataset.at;
    }
    return false;
  };
  const stop = add(task);
  const offRelay = onRelay(kick);

  return () => {
    stop();
    offRelay();
    window.removeEventListener('resize', onResize);
    for (const el of Object.values(readers)) for (const name of Object.values(VAR)) el?.style.removeProperty(name);
    delete root.dataset.at;
    delete root.dataset.split;
  };
}
