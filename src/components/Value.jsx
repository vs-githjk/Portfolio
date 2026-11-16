import { value } from '../data/content';
import Rich from './Rich';

/* Hairline rows: [tag] [claim] [evidence]. Not cards, so it never reads as
   Principles twice. The row under the reader's eye is the lit one: as a row
   crosses the middle of the window its marker fills and its evidence inks from
   reading contrast to full (a scroll-driven animation, sections.css). A figure
   in the evidence opens its receipt. */
export default function Value() {
  return (
    <section className="sec" id="value" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal" data-world-anchor="value">
          <span className="eyebrow">
            {value.eyebrow}
          </span>
          <h2>{value.heading}</h2>
        </div>
        <div className="val">
          {value.claims.map((c) => (
            <article className="val-row" key={c.tag}>
              <span className="val-tag">{c.tag}</span>
              <h3>{c.claim}</h3>
              <ul>
                {c.receipts.map((r) => (
                  <li key={r.slice(0, 28)}>
                    <Rich text={r} receipts />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="val-foot reveal">{value.footer}</p>
      </div>
    </section>
  );
}
