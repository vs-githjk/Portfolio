import { experience } from '../data/content';
import Badge from './Badge';

/* Hairline rows, not cards: [org] [note + outcome pills] [when / where]. Every
   pill is a complete statement that says what changed and for whom. */
export default function Experience() {
  return (
    <section className="sec work" id="work">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{experience.eyebrow}</span>
          <h2>{experience.heading}</h2>
        </div>
        <div className="xp">
          {experience.roles.map((r, n) => (
            <article className="xp-row reveal" data-delay={n || undefined} key={r.org}>
              <div className="xp-org">
                <span className="xp-logo">
                  <img src={r.logo} alt="" width="48" height="28" loading="lazy" />
                </span>
                <div>
                  <h3>{r.org}</h3>
                  <p className="xp-role">{r.role}</p>
                  {r.team && <p className="xp-team">{r.team}</p>}
                </div>
              </div>
              <div className="xp-note">
                <p>{r.note}</p>
                {r.wins.length > 0 && (
                  <ul className="xp-pills">
                    {r.wins.map((w) => (
                      <li key={w}>
                        <Badge kind="out">{w}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="xp-when">
                {r.when}
                {'\n'}
                {r.where}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
