import { principles } from '../data/content';
import { useTilt } from '../hooks/useTilt';

/* Four raised tiles in a 2x2 grid. There are no numbers: the four are not a
   sequence. Deliberately a different shape from Value's hairline rows. Under a
   mouse each tile leans a few degrees toward the pointer (useTilt). */
export default function Principles() {
  useTilt('.p-tile');

  return (
    <section className="sec principles" id="principles">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{principles.eyebrow}</span>
          <h2>{principles.heading}</h2>
        </div>
        <div className="p-grid">
          {principles.items.map((p, n) => (
            <article className="p-tile reveal" data-delay={n || undefined} key={p.title}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
