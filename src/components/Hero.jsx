import { useRef } from 'react';
import { hero } from '../data/content';
import Orbit from './Orbit';
import { GitHubIcon, LinkedInIcon } from './Icons';

/* The first screen. The name is the monument at the centre, lit from above by
   the beam field; the orbit ring of what he has built turns around it. Name,
   one identity line, one plain sentence, credentials, actions: no figures. On a
   phone the same centre block sits on top and the ring becomes a swipe row.

   Email and Resume are text buttons; LinkedIn and GitHub are icon buttons
   (their label is the accessible name). */
const ICONS = { LinkedIn: LinkedInIcon, GitHub: GitHubIcon };

export default function Hero() {
  const stage = useRef(null);
  const centre = useRef(null);
  const [first, ...rest] = hero.headline.split(' ');
  return (
    <header className="hero" id="top">
      <div className="hero-stage" ref={stage}>
        <div className="shield" aria-hidden="true" />
        <div className="centre" ref={centre}>
          <img
            className="portrait"
            src={hero.portrait.src}
            srcSet={`${hero.portrait.src} 1x, ${hero.portrait.src2x} 2x`}
            alt={hero.portrait.alt}
            width="160"
            height="160"
            decoding="async"
          />
          <div className="who-text">
            <span className="status">
              <i aria-hidden="true" />
              {hero.status}
            </span>
            <span className="where">{hero.locationNote}</span>
          </div>
          <div className="who-main">
            <h1 className="hero-name">
              {first}
              <span className="br">
                <br />
              </span>{' '}
              {rest.join(' ')}
            </h1>
            <p className="identity">{hero.identity}</p>
            <p className="identity-sub">{hero.identitySub}</p>
            <p className="cred">
              <span className="cred-short">{hero.credential}</span>
              <span className="cred-long">{hero.credentialLong}</span>
            </p>
            <div className="actions">
              {hero.actions
                .filter((a) => a.href)
                .map((a) => {
                  const Icon = ICONS[a.label];
                  const external = /^https?:/.test(a.href);
                  return (
                    <a
                      key={a.label}
                      className={`btn${a.primary ? ' btn-pri' : ''}${Icon ? ' btn-icon' : ''}`}
                      href={a.href}
                      {...(Icon ? { 'aria-label': a.label, title: a.label } : {})}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {Icon ? <Icon /> : a.label}
                    </a>
                  );
                })}
            </div>
          </div>
        </div>
        <Orbit stageRef={stage} centreRef={centre} />
      </div>
    </header>
  );
}
