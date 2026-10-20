import { hero } from '../data/content';
import Rich from './Rich';
import Deck from './Deck';

/* Left: name, identity, proof line, actions. Right: the glass deck of what
   he has built. The h1 is the name; "Sriram" is the one brass word. */
export default function Hero() {
  const [first, ...rest] = hero.headline.split(' ');
  return (
    <header className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="status">
            <i aria-hidden="true" />
            {hero.status}
          </span>
          <h1 className="hero-name">
            {first}
            <br />
            <em>{rest.join(' ')}</em>
          </h1>
          <p className="hero-identity">
            {hero.identity} <span>{hero.identitySub}</span>
          </p>
          <p className="hero-proof">
            <Rich text={hero.proofLine} />
          </p>
          <div className="hero-actions">
            {hero.actions
              .filter((a) => a.href)
              .map((a) => {
                const external = /^https?:/.test(a.href);
                return (
                  <a
                    key={a.label}
                    className={`btn${a.primary ? ' btn-pri' : ''}`}
                    href={a.href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {a.label}
                  </a>
                );
              })}
          </div>
        </div>
        <Deck />
      </div>
    </header>
  );
}
