import { builds, contact } from '../data/content';
import { BINDING, receipts } from '../data/world';
import { fill, put } from './counts';

/* The foot of the page: the colophon in two lines, then the credits, rolled only
   when asked for (a native <details>, closed: after the dawn at Contact a
   fourteen-row cast list read as a long tail; Nov 16). The cast is the crew, each
   with their job (small portraits, in grey: their colours stay at the Camp).
   Then whatever lives in the world, each with the fact it is drawn from (the
   sentences come from data/world.js, one per binding in the kit contract; a
   binding with no sentence yet is left out). Then the faces, what the page is
   made with and set in, what it measured (only when content.js holds numbers
   measured on the production build), and the way back up. Every count here is
   computed. */
export default function Footer() {
  const c = contact.colophon;
  const k = contact.credits;
  const crew = builds.building.crew;
  const world = BINDING.map((id) => ({ id, line: receipts(id) })).filter((w) => w.line);
  return (
    <footer className="foot" data-realm="earth">
      <div className="wrap">
        <div className="credits">
          <p className="credits-part credits-notes">
            <a href={c.llms.href}>{c.llms.label}</a>
          </p>

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

          <a className="credits-top" href="#top">
            {contact.footerTop} <span aria-hidden="true">↑</span>
          </a>
        </div>
        <div className="foot-line">
          <span>{contact.footerLeft}</span>
          <span>{contact.footerRight}</span>
        </div>
      </div>
    </footer>
  );
}
