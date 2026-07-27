import { toolkit } from '../data/content';

export default function Toolkit() {
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{toolkit.heading}</h2>
          <p>{toolkit.intro}</p>
        </div>

        <div className="kit reveal">
          {toolkit.groups.map((group) => (
            <div className="kit-cell" key={group.name}>
              <h4>{group.name}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
