import { principles } from '../data/content';

/* Deliberately a different shape from the Value section: a 2x2 grid of large
   statements rather than hairline rows, so the two sell-sections don't read
   as the same module twice. */
export default function Principles() {
  return (
    <section className="principles" id="principles">
      <div className="wrap sec">
        <div className="sec-head reveal">
          <h2>{principles.heading}</h2>
          <p>{principles.intro}</p>
        </div>

        <div className="prin-grid reveal">
          {principles.items.map((p) => (
            <div className="prin" key={p.title}>
              <h3 className="prin-title">{p.title}</h3>
              <p className="prin-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
