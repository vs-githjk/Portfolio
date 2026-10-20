import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';

/* The WebGL layer lives in its own chunk and mounts after first paint. The
   static CSS layer under it is always rendered: it is the fallback for reduced
   motion and for browsers without WebGL2, and it never flashes. The canvas
   fades in over it once the first frame is drawn, and is not created at all
   under prefers-reduced-motion. */
const BackgroundField = lazy(() => import('./BackgroundField'));

export default function Background() {
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setOn(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setOn(true), 0);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="bg" aria-hidden="true" data-ready={ready ? '' : undefined}>
      <div className="bg-static" />
      {on && !reduced && (
        <Suspense fallback={null}>
          <BackgroundField onReady={onReady} />
        </Suspense>
      )}
    </div>
  );
}
