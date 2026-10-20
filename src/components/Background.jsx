import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';
import { beamFade } from '../lib/beamFade';

/* One fixed layer stack behind the page: the vertical light-beam field.

   - .bg-glow and .bg-static are CSS only and always rendered: they are the
     whole background before the canvas chunk arrives, without canvas, and under
     any failure. Nothing flashes when the canvas fades in over them.
   - BackgroundField (a 2D canvas with beams and stars) lives in its own chunk
     and mounts after first paint.
   - Scroll sets two custom properties on .bg (--bg-y, --bg-fade); CSS turns
     them into parallax (transform only) and the fade-out after the first
     screen. Under prefers-reduced-motion there is no parallax and no shimmer. */
const BackgroundField = lazy(() => import('./BackgroundField'));

export default function Background() {
  const root = useRef(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setOn(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setOn(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const node = root.current;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      node.style.setProperty('--bg-fade', beamFade(y, window.innerHeight).toFixed(3));
      node.style.setProperty('--bg-y', reduced ? '0' : y.toFixed(1));
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
    </div>
  );
}
