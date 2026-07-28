import { useEffect, useState } from 'react';
import { hero, contact } from '../data/content';
import Pipeline from './Pipeline';

/* Recruiters shouldn't have to scroll to reach you: the essential links sit
   beside the availability pill, above the fold. Data comes from contact. */
const QUICK_KINDS = ['LinkedIn', 'Résumé', 'GitHub'];

export default function Hero() {
  const [Fx, setFx] = useState(null);

  /* Galaxy backdrop — lazy so ogl stays out of the main bundle, skipped
     under reduced motion. The hero is above the fold, so load immediately. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    import('./Galaxy').then((m) => setFx(() => m.default));
  }, []);

  return (
    <header className="hero" id="top">
      {Fx && (
        <div className="hero-fx" aria-hidden="true">
          <Fx
            density={1}
            glowIntensity={0.25}
            saturation={0}
            twinkleIntensity={0.35}
            rotationSpeed={0.03}
            starSpeed={0.2}
            speed={0.45}
            mouseInteraction={false}
            mouseRepulsion={false}
            repulsionStrength={0}
            transparent
          />
        </div>
      )}
      {/* outside .wrap so it anchors to the page's top-right corner */}
      {hero.figure?.src && (
        <img className="hero-figure" src={hero.figure.src} alt={hero.figure.alt || ''} />
      )}
      <div className="wrap">
        <div className="eyebrow hero-eyebrow reveal">{hero.eyebrow}</div>

        <h1 className="reveal">
          {/* each letter pulses through the neon trio on a stagger */}
          <span className="name-wave" aria-label={hero.headline} role="text">
            {hero.headline.split('').map((ch, i) =>
              ch === ' ' ? (
                ' '
              ) : (
                <span className="name-l" style={{ '--i': i }} aria-hidden="true" key={i}>
                  {ch}
                </span>
              )
            )}
          </span>
          <br />
          <span className="assert">
            {hero.assertion}
            <i className="caret" aria-hidden="true" />
          </span>
        </h1>

        <div className="hero-sub reveal">
          <p>
            {hero.blurb} <span className="em">{hero.blurbEmphasis}</span> {hero.blurbTail}
          </p>
          <div className="hero-meta">
            <span className="status">
              <i className="dot" />
              {hero.availability}
            </span>
            <span className="hero-loc">{hero.locationNote}</span>
            <div className="hero-links">
              <a href={`mailto:${contact.email}`}>email</a>
              {contact.links
                .filter((l) => l.href && QUICK_KINDS.includes(l.kind))
                .map((l) => (
                  <a
                    href={l.href}
                    key={l.kind}
                    target={l.href.startsWith('http') ? '_blank' : undefined}
                    rel="noopener noreferrer"
                  >
                    {l.kind}
                  </a>
                ))}
            </div>
          </div>
        </div>

        {/* Swap for <RepairLoop /> if you ever want the research-first framing. */}
        <Pipeline />
      </div>
    </header>
  );
}
