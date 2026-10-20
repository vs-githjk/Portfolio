import { value } from '../data/content';
import Rich from './Rich';

/* Hairline rows: [tag] [claim] [receipts]. Not cards, so it never reads as
   Principles twice. */
export default function Value() {
  return (
    <section className="sec" id="value">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{value.eyebrow}</span>
          <h2>{value.heading}</h2>
        </div>
        <div className="val">
          {value.claims.map((c) => (
            <article className="val-row reveal" key={c.tag}>
              <span className="val-tag">{c.tag}</span>
              <h3>{c.claim}</h3>
              <ul>
                {c.receipts.map((r) => (
                  <li key={r.slice(0, 28)}>
                    <Rich text={r} />
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
