import { builds, contact } from '../data/content';
import { BINDING, receipts } from '../data/world';
import { fill, put } from './counts';

/* The foot of the page is one quiet line, so Contact is the last thing on it
   (Vidyut, Nov 16): the plain-text link, Roll the credits, Back to the top.
   The credits open below that line only when asked for (a native <details>):
   the colophon, the cast (the crew, each with their job), whatever lives in the
   world with the fact it is drawn from (sentences from data/world.js), and the
   faces. Every count here is computed. */
export default function Footer() {
  const c = contact.colophon;
  const k = contact.credits;
  const crew = builds.building.crew;
  const world = BINDING.map((id) => ({ id, line: receipts(id) })).filter((w) => w.line);
  return (
    <footer className="foot" data-realm="earth">
      <div className="wrap">
        <div className="credits">
          <a className="credits-link" href={c.llms.href}>
            {c.llms.label}
          </a>
          <a className="credits-link" data-top="" href="#top">
            {contact.footerTop} <span aria-hidden="true">↑</span>
          </a>

          <details className="credits-roll fold">
            <summary>{k.open}</summary>
            <div className="credits-body">
              <h2 className="credits-title">{k.label}</h2>

            <section className="credits-part" aria-labelledby="cr-made">
              <h3 className="eyebrow" id="cr-made">
                {c.label}
              </h3>
              <p>
                {c.made} {c.type}
              </p>
              {c.lighthouse && <p>{put(c.measured, c.lighthouse)}</p>}
            </section>

            <section className="credits-part" aria-labelledby="cr-cast">
              <h3 className="eyebrow" id="cr-cast">
                {fill(k.cast, { crew: crew.length })}
              </h3>
              <ul className="credits-cast">
                {crew.map((m) => (
                  <li key={m.id}>
                    <span className="credits-role">{m.job}</span>
                    <img src={`/agents/${m.id}-148.webp`} alt="" width="48" height="48" loading="lazy" decoding="async" />
                    <span className="credits-name">{m.name}</span>
                  </li>
                ))}
              </ul>
            </section>

            {world.length > 0 && (
              <section className="credits-part" aria-labelledby="cr-world">
                <h3 className="eyebrow" id="cr-world">
                  {k.world}
                </h3>
                <ul className="credits-lines">
                  {world.map((w) => (
                    <li key={w.id}>{w.line}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="credits-part" aria-labelledby="cr-faces">
              <h3 className="eyebrow" id="cr-faces">
                {k.faces.label}
              </h3>
              <dl className="credits-pairs">
                {k.faces.rows.map((r) => (
                  <div key={r.where}>
                    <dt className="credits-role">{r.where}</dt>
                    <dd className="credits-name">{r.what}</dd>
                  </div>
                ))}
              </dl>
            </section>
            </div>
          </details>

        </div>
      </div>
    </footer>
  );
}
