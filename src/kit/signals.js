import { VAR } from './contract';
import { add, kick } from './director';
import { anchors, list, onRelay, pageSize, startAnchors } from './anchors';
import { fine } from './quality';

/* DOM-derived scalars, written on <html> as CSS variables so the page and the
   scene read one truth:

     --w-line   the first waterline, px from the window top, -1 when off screen
     --w-shore  the second waterline, same
     --w-depth  0 to 1 down the page, counted from `origin()`
     --px --py  the pointer, -1 to 1 (fine pointers only)
     data-at    the realm under the bar: `realm(...)` if the caller gives one, else
                the last [data-realm] the bar has reached
     data-split which line is crossing the bar right now ("line" or "shore"), so the
                bar can wear two palettes, cut exactly at that line

   The caller passes how its world places the two lines (`lines.line` and
   `lines.shore`: (anchors, scrollY, viewportH) -> px or null) and where its
   journey starts (`origin`). Everything is computed from the cached anchors and
   the frame's scroll offset: no layout is read per frame, and a variable is only
   written when its rounded value changes. */
export function startSignals({ lines = {}, origin = () => 0, bar = () => 64, realm = null } = {}) {
  const root = document.documentElement;
  const wrote = {};
  const put = (name, value) => {
    if (wrote[name] === value) return;
    wrote[name] = value;
    root.style.setProperty(name, value);
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
      put(VAR[key], px == null || px < 0 || px > f.h ? '-1' : px.toFixed(1));
      if (px != null && px > 0 && px < barH) cut = key;
    }
    if (cut !== split) {
      split = cut;
      if (cut) root.dataset.split = cut;
      else delete root.dataset.split;
    }
    const from = origin();
    const room = pageSize().h - f.h - from;
    put(VAR.depth, room > 0 ? Math.max(0, Math.min(1, (f.y - from) / room)).toFixed(4) : '0');
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

  let moved = null;
  const pointerTask = () => {
    if (moved) {
      put(VAR.px, moved.x.toFixed(3));
      put(VAR.py, moved.y.toFixed(3));
      moved = null;
    }
    return false;
  };
  const onPointer = (e) => {
    moved = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
    kick();
  };
  let stopPointer = null;
  if (fine()) {
    stopPointer = add(pointerTask);
    window.addEventListener('pointermove', onPointer, { passive: true });
  }

  return () => {
    stop();
    offRelay();
    if (stopPointer) stopPointer();
    window.removeEventListener('pointermove', onPointer);
    for (const name of Object.keys(wrote)) root.style.removeProperty(name);
    delete root.dataset.at;
    delete root.dataset.split;
  };
}
