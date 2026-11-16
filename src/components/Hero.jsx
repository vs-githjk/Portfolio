import { hero } from '../data/content';
import { GitHubIcon, LinkedInIcon } from './Icons';

/* The hero: his name, set very large, lit from above by the beam field. Two
   columns on a wide window: the name, the thesis, one plain sentence, the
   credentials and the actions on the left; his photograph with the status and
   the place on the right, standing on the same foot line as the actions. A phone
   stacks them: the photograph and the status, then the name and the rest.

   No figures, and no builds: the ring of builds lives in Builds now (RingStage),
   where it is the index. This screen says who he is and how to reach him.

   Email and Resume are text buttons; LinkedIn and GitHub are icon buttons
   (their label is the accessible name). */
const ICONS = { LinkedIn: LinkedInIcon, GitHub: GitHubIcon };

export default function Hero() {
  const [first, ...rest] = hero.headline.split(' ');
  return (
    <header className="hero" id="top">
      <div className="wrap hero-in">
        <div className="hero-card">
          <img
            className="portrait"
            src={hero.portrait.src2x}
            srcSet={`${hero.portrait.src} 180w, ${hero.portrait.src2x} 360w`}
            sizes="(max-width: 760px) 88px, 240px"
            alt={hero.portrait.alt}
            width="360"
            height="360"
            decoding="async"
          />
          <div className="who-text">
            <span className="status">
              <i aria-hidden="true" />
              {hero.status}
            </span>
            <span className="where">{hero.locationNote}</span>
          </div>
        </div>
        <div className="who-main">
          <h1 className="hero-name" tabIndex={-1}>
            {first} <br />
            {rest.join(' ')}
          </h1>
          <p className="identity">{hero.identity}</p>
          <p className="identity-sub">{hero.identitySub}</p>
          <p className="cred">
            {hero.credential.map((group, g) => (
              <span className="cred-g" key={g}>
                {group.flatMap((item, k) => [
                  k > 0 || g > 0 ? (
                    <span className="sr" key={`sep-${item}`}>
                      ,
                    </span>
                  ) : null,
                  k > 0 ? ' ' : null,
                  <span className="cred-it" key={item}>
                    {item}
                  </span>,
                ])}{' '}
              </span>
            ))}
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
    </header>
  );
}
