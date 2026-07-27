import { useEffect, useRef, useState } from 'react';
import { experience } from '../data/content';
import Check from './Check';

export default function Experience() {
  const secRef = useRef(null);
  const [Fx, setFx] = useState(null);
  const [cols, setCols] = useState(null);

  /* Lightfall backdrop — lazy, token-colored, skipped under reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const css = getComputedStyle(document.documentElement);
    const v = (name, fb) => css.getPropertyValue(name).trim() || fb;
    setCols({
      streaks: [v('--accent-3-light', '#7df3ff'), v('--accent-3', '#2e7bff'), v('--text', '#edeef2')],
      glow: v('--accent-3', '#2e7bff'),
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./Lightfall').then((m) => setFx(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(secRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec" id="work" ref={secRef}>
      {Fx && cols && (
        <div className="xp-fx" aria-hidden="true">
          <Fx
            colors={cols.streaks}
            backgroundColor={cols.glow}
            speed={0.03}
            streakCount={2}
            streakWidth={1}
            streakLength={1}
            glow={0.7}
            density={0.6}
            twinkle={0.5}
            zoom={3}
            backgroundGlow={0.2}
            opacity={1}
            mouseInteraction
            mouseStrength={0.5}
            mouseRadius={1}
          />
        </div>
      )}
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{experience.heading}</h2>
          <p>{experience.intro}</p>
        </div>

        <div className="reveal">
          {experience.roles.map((role, i) => (
            <div className="xp-row" key={`${role.org}-${i}`}>
              <div>
                <div className="xp-org">
                  {role.logo && <img className="xp-logo" src={role.logo} alt="" />}
                  {role.org}
                </div>
                <span className="xp-role">{role.role}</span>
                {role.team && <span className="xp-team">{role.team}</span>}
              </div>

              <div>
                <div className="xp-note">{role.note}</div>
                {role.wins.length > 0 && (
                  <div className="xp-wins">
                    {role.wins.map((w) => (
                      <span className="xp-win" key={w}>
                        <Check size={11} />
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="xp-when">
                {role.when}
                <span>{role.where}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
