import { useEffect, useRef, useState } from 'react';
import { value } from '../data/content';
import Rich from './Rich';
import Check from './Check';

/* The sell. Structure is claim -> receipt: every assertion is immediately
   followed by the evidence for it, which is the same discipline the projects
   themselves are built on. */
export default function Value() {
  const secRef = useRef(null);
  const [Grid, setGrid] = useState(null);
  const [gridBlue, setGridBlue] = useState('#2e7bff');

  /* GridScan backdrop in blue — the motif's third escalation (green in
     Principles, cyan in Contact). Lazy, token-colored, skipped under
     reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setGridBlue(
      getComputedStyle(document.documentElement).getPropertyValue('--accent-3').trim() ||
        '#2e7bff'
    );
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./GridScan').then((m) => setGrid(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(secRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="bring" id="value" ref={secRef}>
      {Grid && (
        <div className="bring-fx" aria-hidden="true">
          <Grid
            sensitivity={0.4}
            lineThickness={1.6}
            linesColor={gridBlue}
            scanOpacity={0}
            gridScale={0.14}
            lineJitter={0}
            noiseIntensity={0.01}
            fadeStrength={1.0}
          />
        </div>
      )}
      <div className="wrap sec">
        <div className="sec-head reveal">
          <h2>{value.heading}</h2>
          <p>{value.intro}</p>
        </div>

        <div className="reveal">
          {value.claims.map((c) => (
            <div className="claim" key={c.tag}>
              <div className="claim-tag">{c.tag}</div>
              <div className="claim-text">{c.claim}</div>
              <ul className="receipts">
                {c.receipts.map((r, i) => (
                  <li key={i}>
                    <Check size={13} />
                    <span>
                      <Rich text={r} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="bring-foot reveal">{value.footer}</p>
      </div>
    </section>
  );
}
