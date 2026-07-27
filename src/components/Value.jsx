import { value } from '../data/content';
import Rich from './Rich';
import Check from './Check';

/* The sell. Structure is claim -> receipt: every assertion is immediately
   followed by the evidence for it, which is the same discipline the projects
   themselves are built on. */
export default function Value() {
  return (
    <section className="bring" id="value">
      <div className="wrap sec">
        <div className="sec-head reveal">
          <h2>{value.heading}</h2>
          <p>{value.intro}</p>
        </div>

        <div className="reveal">
          {value.claims.map((c) => (
            <div className="claim" key={c.tag}>
              <div className="claim-tag">{c.tag}</div>
              <div className="claim-text">{c.claim}</div>
              <ul className="receipts">
                {c.receipts.map((r, i) => (
                  <li key={i}>
                    <Check size={13} />
                    <span>
                      <Rich text={r} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="bring-foot reveal">{value.footer}</p>
      </div>
    </section>
  );
}
