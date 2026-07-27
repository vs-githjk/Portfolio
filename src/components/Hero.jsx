import { hero } from '../data/content';
import Pipeline from './Pipeline';

export default function Hero() {
  return (
    <header className="hero" id="top">
      <div className="wrap">
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
          </div>
        </div>

        {/* Swap for <RepairLoop /> if you ever want the research-first framing. */}
        <Pipeline />
      </div>
    </header>
  );
}
