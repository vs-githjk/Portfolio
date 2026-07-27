import { hero, contact } from '../data/content';
import Pipeline from './Pipeline';

/* Recruiters shouldn't have to scroll to reach you: the essential links sit
   beside the availability pill, above the fold. Data comes from contact. */
const QUICK_KINDS = ['LinkedIn', 'Résumé', 'GitHub'];

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
        {hero.figure?.src && (
          <img className="hero-figure" src={hero.figure.src} alt={hero.figure.alt || ''} />
        )}
        <div className="eyebrow hero-eyebrow">{hero.eyebrow}</div>

        <h1>
          {hero.headline}
          <br />
          <span className="assert">
            {hero.assertion}
            <i className="caret" aria-hidden="true" />
          </span>
        </h1>

        <div className="hero-sub">
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
