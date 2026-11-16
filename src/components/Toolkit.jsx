import { toolkit } from '../data/content';

/* The inventory: a label and a line of tools per group, plain text. No picking
   and no answer line (it named the builds that use a tool; Vidyut, Nov 16:
   "What's the point? They'll see the projects."). No levels either: nobody is
   87% at Python. */
export default function Toolkit() {
  return (
    <section className="sec" id="toolkit" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">
            {toolkit.eyebrow}
          </span>
          <h2>
            {toolkit.heading} <em>{toolkit.headingEm}</em>
          </h2>
        </div>
        <div className="tk">
          {toolkit.groups.map((g) => (
            <div className="tk-row reveal" key={g.name}>
              <h3>{g.name}</h3>
              <div className="tk-body">
                <ul>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
