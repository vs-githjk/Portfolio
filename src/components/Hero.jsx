import { hero } from '../data/content';
import { GitHubIcon, LinkedInIcon } from './Icons';

/* The hero: his name, set very large, lit from above by the beam field. On the
   left the status and the place, the name, the thesis, one plain sentence, the
   credentials and the actions. On the right his real photograph, crisp, in a
   plain frame: the hologram greets, the person signs. A phone shows it small,
   above the name.

   No figures, and no builds: the ring of builds is the index at the top of
   Builds. This screen says who he is and how to reach him.

   Email and Resume are text buttons; LinkedIn and GitHub are icon buttons
   (their label is the accessible name). */
const ICONS = { LinkedIn: LinkedInIcon, GitHub: GitHubIcon };

export default function Hero() {
  const [first, ...rest] = hero.headline.split(' ');
  return (
    <header className="hero" id="top">
      <div className="wrap hero-in">
        <img
          className="hero-photo"
          src={hero.portrait.src2x}
          srcSet={`${hero.portrait.src} 320w, ${hero.portrait.src2x} 640w`}
          sizes="(max-width: 960px) 96px, 300px"
          alt={hero.portrait.alt}
          width="640"
          height="800"
          decoding="async"
        />
        <div className="who-main">
          <div className="who-text">
            <span className="status">
              <i aria-hidden="true" />
              {hero.status}
            </span>
            <span className="where">{hero.locationNote}</span>
          </div>
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
