import { toolkit } from '../data/content';

/* Grouped chips, no color, no levels. */
export default function Toolkit() {
  return (
    <section className="sec" id="toolkit">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{toolkit.eyebrow}</span>
            <h2>
              {toolkit.heading} <em>{toolkit.headingEm}</em>
            </h2>
          </div>
        </div>
        <div className="tk">
          {toolkit.groups.map((g) => (
            <div className="tk-row reveal" key={g.name}>
              <h3>{g.name}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
