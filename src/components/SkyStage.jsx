import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Heatmap from './Heatmap';

/* The stage for the commit graph. The flat SVG graph is what the prerendered
   page paints, and it stays as the accessible image. When the section comes
   near, the skyline chunk loads and draws the same data in 3D on a canvas laid
   over it; once its first frame is down (data-ready) the flat graph fades out.
   The stage reserves its full height up front, so nothing shifts when it does. */
const Skyline = lazy(() => import('./Skyline'));

export default function SkyStage({ days, label }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || !('ResizeObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setNear(true);
        io.disconnect();
      },
      { rootMargin: '900px 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sky" ref={ref} data-ready={ready ? '' : undefined}>
      <Heatmap days={days} label={label} />
      {near && (
        <Suspense fallback={null}>
          <Skyline days={days} onReady={onReady} />
        </Suspense>
      )}
    </div>
  );
}
