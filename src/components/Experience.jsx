import { experience } from '../data/content';
import Check from './Check';

export default function Experience() {
  return (
    <section className="sec" id="work">
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
