import { principles } from '../data/content';

/* Plain 2x2 grid. Deliberately a different shape from Value's hairline rows. */
export default function Principles() {
  return (
    <section className="sec" id="principles">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{principles.eyebrow}</span>
            <h2>{principles.heading}</h2>
          </div>
        </div>
        <div className="pri-grid">
          {principles.items.map((p, n) => (
            <article className="pri-card reveal" key={p.title}>
              <span className="pri-idx">{String(n + 1).padStart(2, '0')}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
