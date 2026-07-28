import { useEffect, useRef, useState } from 'react';
import { value } from '../data/content';
import Rich from './Rich';
import Check from './Check';

/* The sell. Structure is claim -> receipt: every assertion is immediately
   followed by the evidence for it, which is the same discipline the projects
   themselves are built on. */
export default function Value() {
  const secRef = useRef(null);
  const [Rays, setRays] = useState(null);
  const [rayColors, setRayColors] = useState({ red: '#ff2e4d', orange: '#ff7a1a' });

  /* SideRays backdrop — bright red and orange rays cascading in from the
     four corners, colors alternating per corner. Lazy, token-colored,
     skipped under reduced motion. Each instance manages its own visibility
     observer and WebGL teardown. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const css = getComputedStyle(document.documentElement);
    setRayColors({
      red: css.getPropertyValue('--accent-2').trim() || '#ff2e4d',
      orange: css.getPropertyValue('--accent-orange').trim() || '#ff7a1a',
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./SideRays').then((m) => setRays(() => m.default));
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
      {Rays && (
        <div className="bring-fx" aria-hidden="true">
          {/* diagonal pairs: red from top-left/bottom-right, orange from the others */}
          {[
            ['top-left', rayColors.red],
            ['top-right', rayColors.orange],
            ['bottom-left', rayColors.orange],
            ['bottom-right', rayColors.red],
          ].map(([corner, color]) => (
            <Rays
              key={corner}
              origin={corner}
              speed={1.6}
              rayColor1={color}
              rayColor2={color}
              intensity={2.2}
              spread={2}
              tilt={0}
              saturation={1.5}
              blend={0.75}
              falloff={1.6}
              opacity={1}
            />
          ))}
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
