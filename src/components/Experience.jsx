import { experience } from '../data/content';
import Rich from './Rich';

/* Time as depth. The roles hang off a sounding line that runs down the left of
   the section; its marks are the real dates of each role and nothing else. A
   weight sinks along the line as the section is read (a scroll-driven animation,
   sections.css), and the role it has reached is inked in. Rows, not cards:
   [when, on the line] [org] [story + outcomes]. Every outcome is a complete
   statement, and a figure in one opens its receipt. */
export default function Experience() {
  return (
    <section className="sec work" id="work" data-realm="sea">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{experience.eyebrow}</span>
          <h2>{experience.heading}</h2>
        </div>
        <div className="xp">
          <span className="xp-line" aria-hidden="true">
            <i />
          </span>
          {experience.roles.map((r) => (
            <article className="xp-row" key={r.org}>
              <p className="xp-when">
                {r.when}
                {'\n'}
                <span>{r.where}</span>
              </p>
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
                  <ul className="xp-wins">
                    {r.wins.map((w) => (
                      <li key={w}>
                        <Rich text={w} receipts />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
