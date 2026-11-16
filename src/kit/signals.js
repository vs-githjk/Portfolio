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
     data-at    the realm under the bar (the last [data-realm] the bar has reached)

   The caller passes how its world places the two lines (`lines.line` and
   `lines.shore`: (anchors, scrollY, viewportH) -> px or null) and where its
   journey starts (`origin`). Everything is computed from the cached anchors and
   the frame's scroll offset: no layout is read per frame, and a variable is only
   written when its rounded value changes. */
export function startSignals({ lines = {}, origin = () => 0, bar = 64 } = {}) {
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

  const task = (now, f) => {
    const a = anchors();
    for (const key of ['line', 'shore']) {
      const px = lines[key] ? lines[key](a, f.y, f.h) : null;
      put(VAR[key], px == null || px < 0 || px > f.h ? '-1' : px.toFixed(1));
    }
    const from = origin();
    const room = pageSize().h - f.h - from;
    put(VAR.depth, room > 0 ? Math.max(0, Math.min(1, (f.y - from) / room)).toFixed(4) : '0');
    let realm = '';
    for (const r of realms()) if (r.h > 0 && r.top - f.y <= bar) realm = r.el.dataset.realm;
    if (realm !== at) {
      at = realm;
      if (realm) root.dataset.at = realm;
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
  };
}
