import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Heatmap from './Heatmap';

/* The stage for the commit graph. The flat SVG graph is what the prerendered
   page paints; it stays as the accessible image, the keyboard's way through the
   weeks and the scene's "graph" anchor. When the section comes near, the skyline
   chunk loads and draws the same days as 3D towers on a canvas laid exactly over
   the flat graph; once its first frame is down (data-ready) the flat picture
   fades out under it. The box is the flat graph's own, so nothing shifts. */
const Skyline = lazy(() => import('./Skyline'));

export default function SkyStage({ days, label, copy }) {
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
      { rootMargin: '1400px 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div className="sky" ref={ref} data-ready={ready ? '' : undefined}>
      <Heatmap days={days} label={label} copy={copy}>
        {near && (
          <Suspense fallback={null}>
            <Skyline days={days} copy={copy} onReady={onReady} />
          </Suspense>
        )}
      </Heatmap>
    </div>
  );
}
