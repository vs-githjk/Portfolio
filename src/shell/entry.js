import { add, kick } from '../kit/director';
import { entryState, setEntry } from './entryState';

/* The entry, as a controller with no words and no look of its own. Scroll is the
   timeline: `p` is how far the page has come from its top to `origin()`. A click on
   the door plays the same timeline on a clock (`knots`: [ms, p] pairs, eased
   between, a pair marked 'linear' runs evenly), and the reader's own scroll scrubs
   it both ways.

   What it writes, all on <html> unless said:
     data-entry       pre | land | (absent: rest), through entryState
     data-run         on the `host` while the clock runs (the first beat: its words leave)
     data-skip        for two frames after a skip, so nothing eases
     data-cut         after a skip, until the reader scrolls back: the portrait's
                      canvas stays dark, so no stale frame of light is left behind

   Skip (the link, Escape, or any wheel, touch or key while the clock is running)
   lands the rest state at once: an instant scroll, no beats. `seen` (a session
   flag) makes the next visit start at rest and the next entry short. */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (t) => t * t * (3 - 2 * t);

export function createEntry({ origin, host, knots, shortMs = 900, spans, landMs = 900, seenKey = 'entry-seen', still = () => false }) {
  const root = document.documentElement;
  let run = null; // the clock: { t0, from, to, short }
  let seen = false;
  let landT = 0;
  try {
    seen = window.sessionStorage.getItem(seenKey) === '1';
  } catch {
    seen = false;
  }
  const remember = () => {
    seen = true;
    try {
      window.sessionStorage.setItem(seenKey, '1');
    } catch {
      /* private mode: the entry simply plays in full next time */
    }
  };

  const reach = () => Math.max(1, origin());
  // A first visit waits unlit below the first screen, and waits again whenever the
  // reader scrolls back up to it; a returning visitor's page simply stands.
  const armed = !still() && !seen;
  if (armed && window.scrollY < reach() * 0.5) setEntry('pre');

  function land() {
    if (entryState() !== 'pre') return;
    setEntry('land');
    remember();
    clearTimeout(landT);
    landT = setTimeout(() => {
      if (entryState() === 'land') setEntry('rest');
    }, landMs);
  }

  const interrupt = ['wheel', 'touchstart', 'keydown'];
  function stopClock() {
    if (!run) return;
    run = null;
    if (host) delete host.dataset.run;
    interrupt.forEach((type) => window.removeEventListener(type, skip));
  }

  function at(ms) {
    const n = knots.findIndex((k) => ms <= k[0]);
    if (n <= 0) return n === 0 ? knots[0][1] : knots[knots.length - 1][1];
    const [ta, pa] = knots[n - 1];
    const [tb, pb, how] = knots[n];
    const u = (ms - ta) / (tb - ta);
    return pa + (pb - pa) * (how === 'linear' ? u : how === 'in' ? u * u : smooth(u));
  }

  const task = (now, f) => {
    if (run) {
      const ms = now - run.t0;
      const total = run.short ? shortMs : knots[knots.length - 1][0];
      const k = run.short ? smooth(clamp01(ms / shortMs)) : at(ms);
      window.scrollTo({ top: run.from + (run.to - run.from) * k, behavior: 'instant' });
      if (ms >= total) stopClock();
    }
    const y = run ? window.scrollY : f.y;
    const p = y / reach();
    if (!still()) {
      const state = entryState();
      if (state === 'pre' && p >= spans.land) land();
      else if (state !== 'pre' && armed && !run && p < spans.back && f.dy < 0) setEntry('pre');
      if (p < spans.back && root.dataset.cut != null) delete root.dataset.cut;
    }
    return run != null;
  };
  const stop = add(task);

  function skip() {
    const playing = run != null;
    stopClock();
    clearTimeout(landT);
    root.dataset.skip = '';
    root.dataset.cut = '';
    setEntry('rest');
    remember();
    window.scrollTo({ top: origin(), behavior: 'instant' });
    requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.skip));
    kick();
    return playing;
  }

  /* The door. Returns false when the link should simply be a link (reduced motion,
     no portrait, a modified click). */
  function enter() {
    if (still()) return false;
    if (window.scrollY >= origin() - 2) return false;
    stopClock();
    run = { t0: performance.now(), from: window.scrollY, to: origin(), short: seen };
    if (host) host.dataset.run = '';
    interrupt.forEach((type) => window.addEventListener(type, skip, { passive: true }));
    kick();
    return true;
  }

  // The portrait can turn out to be absent after the page has armed (no WebGL is
  // only known once its chunk has tried), and motion can be switched off: the place
  // below then simply stands.
  const stand = () => {
    if (!still()) return;
    stopClock();
    clearTimeout(landT);
    setEntry('rest');
  };
  const mo = new MutationObserver(stand);
  mo.observe(root, { attributes: true, attributeFilter: ['data-holo', 'data-plain'] });
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  rm.addEventListener('change', stand);

  const onKey = (e) => {
    if (e.key === 'Escape' && window.scrollY < origin() - 2 && !still() && !document.querySelector('dialog[open]')) skip();
  };
  window.addEventListener('keydown', onKey);

  return {
    enter,
    skip,
    dispose() {
      stop();
      stopClock();
      clearTimeout(landT);
      window.removeEventListener('keydown', onKey);
      mo.disconnect();
      rm.removeEventListener('change', stand);
      setEntry('rest');
      delete root.dataset.skip;
      delete root.dataset.cut;
    },
  };
}
