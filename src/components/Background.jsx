import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { beamFade, worldFade } from '../lib/beamFade';
import { heroOrigin } from '../lib/origin';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';

/* One fixed layer stack behind the page: the vertical light-beam field.

   - .bg-glow and .bg-static are CSS only and always rendered: they are the
     whole background before the canvas chunk arrives, without canvas, and under
     any failure. Nothing flashes when the canvas fades in over them.
   - BackgroundField (a 2D canvas with beams and stars) lives in its own chunk
     and mounts after first paint.
   - <html data-at="sea|earth">, the world under the nav, is written by the kit's
     signals (kit/signals.js) from cached section offsets.
   - Scroll sets two custom properties on .bg (--bg-y, --bg-fade); CSS turns
     them into parallax (transform only) and the fade-out after the first
     screen. Under prefers-reduced-motion there is no parallax and no shimmer.
   - World (three.js, its own chunk) is the 3D scene behind every section below
     the first screen; --bg-deep is its opacity, which rises as the hero beams
     fade. Nothing below the first screen is visible until the reader scrolls,
     so the chunk is requested on the first scroll past the welcome (and, on a
     desktop, after the page has been idle for a moment, so it is ready first).
   - Hologram (plain WebGL, a small chunk) is the face of light on the welcome
     screen above the hero. It mounts with the beams, after first paint. */
const BackgroundField = lazy(() => import('./BackgroundField'));
const World = lazy(() =>
  import('./World').then((m) => {
    emit(EV.loaded, { stage: 'chunk' });
    return m;
  })
);
const Hologram = lazy(() => import('./Hologram'));

export default function Background() {
  const root = useRef(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [deep, setDeep] = useState(false);
  const reduced = useReducedMotion();
  const onReady = useCallback(() => {
    setReady(true);
    emit(EV.loaded, { stage: 'beams' });
  }, []);

  // The load line follows the world's own state: its first drawn frame, or its absence.
  useEffect(() => {
    const html = document.documentElement;
    const said = { on: false, off: false };
    const read = () => {
      const world = html.dataset.world;
      if (world === 'on' && !said.on) {
        said.on = true;
        emit(EV.loaded, { stage: 'compiled' });
      } else if (world === 'off' && !said.off) {
        said.off = true;
        emit(EV.loaded, { stage: 'plain' });
      }
    };
    const mo = new MutationObserver(read);
    mo.observe(html, { attributes: true, attributeFilter: ['data-world'] });
    read();
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setOn(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setOn(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const go = () => setDeep(true);
    const onScroll = () => {
      if (window.scrollY - heroOrigin() > 24) go();
    };
    let idle = 0;
    const timer = window.matchMedia('(min-width: 961px)').matches
      ? setTimeout(() => {
          if ('requestIdleCallback' in window) idle = window.requestIdleCallback(go, { timeout: 2000 });
          else go();
        }, 2600)
      : 0;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      clearTimeout(timer);
      if (idle) window.cancelIdleCallback(idle);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    const node = root.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Everything counts from the hero: the welcome screen above it is lit at
      // --welcome-beams, and --bg-open (0 to 1) raises the light as the hero arrives.
      const from = heroOrigin();
      const y = window.scrollY - from;
      const vh = window.innerHeight;
      node.style.setProperty('--bg-open', from > 0 ? Math.max(0, Math.min(1, 1 + y / from)).toFixed(3) : '1');
      node.style.setProperty('--bg-fade', beamFade(y, vh).toFixed(3));
      node.style.setProperty('--bg-deep', worldFade(y, vh).toFixed(3));
      node.style.setProperty('--bg-y', reduced ? '0' : Math.max(0, y).toFixed(1));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <div className="bg" aria-hidden="true" data-ready={ready ? '' : undefined} ref={root}>
      <div className="bg-glow" />
      <div className="bg-static" />
      {on && (
        <Suspense fallback={null}>
          <BackgroundField onReady={onReady} />
        </Suspense>
      )}
      {on && (
        <Suspense fallback={null}>
          <Hologram />
        </Suspense>
      )}
      {deep && (
        <Suspense fallback={null}>
          <World />
        </Suspense>
      )}
    </div>
  );
}
