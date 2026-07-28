import { useEffect, useRef, useState } from 'react';
import { toolkit } from '../data/content';
import RainbowText from './RainbowText';

export default function Toolkit() {
  const secRef = useRef(null);
  const [Fx, setFx] = useState(null);
  const [radarColor, setRadarColor] = useState('#7df3ff');

  /* Radar backdrop — lazy, token-colored, skipped under reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setRadarColor(
      getComputedStyle(document.documentElement).getPropertyValue('--accent-3-light').trim() ||
        '#7df3ff'
    );
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./Radar').then((m) => setFx(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(secRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec kit-sec" ref={secRef}>
      {Fx && (
        <div className="kit-fx" aria-hidden="true">
          <Fx
            speed={0.2}
            scale={0.32}
            ringCount={10}
            spokeCount={10}
            ringThickness={0.05}
            spokeThickness={0.01}
            sweepSpeed={0.08}
            sweepWidth={2}
            sweepLobes={1}
            color={radarColor}
            backgroundColor="#000000"
            falloff={1.1}
            brightness={0.9}
            enableMouseInteraction
            mouseInfluence={0.04}
          />
        </div>
      )}
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{toolkit.heading}</h2>
          <p>{toolkit.intro}</p>
        </div>

        <div className="kit reveal">
          {toolkit.groups.map((group) => (
            <div className="kit-cell" key={group.name}>
              <h4>{group.name}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>
                    <RainbowText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
