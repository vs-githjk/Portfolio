import Media from './Media';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';

/* "More builds": compact cards with the same fields as the featured ones. The
   one-liner and the links are always visible; the role line, the full story, any
   metric and the stack open under "Read more" (a native <details>, so it needs no
   script). The
   grid balances its last row, see .mini-grid. */
export default function CompactRows({ more }) {
  return (
    <div className="more">
      <div className="more-head reveal">
        <h3>{more.heading}</h3>
        <p>{more.intro}</p>
      </div>
      <div className="mini-grid">
        {more.items.map((c, n) => (
          <article className="mini reveal" id={`build-${c.id}`} data-delay={n % 4 || undefined} key={c.id}>
            <div className="mini-media">
              <Media
                image={c.media?.image}
                alt={c.media?.alt}
                tile={c.tile}
                sizes="(min-width: 1100px) 310px, (min-width: 560px) 46vw, 92vw"
              />
            </div>
            <div className="mini-body">
              <span className="eyebrow">
                {c.kind} · {c.when}
              </span>
              <h4 className="mini-title">
                {c.title} <span>{c.descriptor}</span>
              </h4>
              <p className="mini-one">{c.oneLiner}</p>
              <details className="mini-more">
                <summary>
                  Read more<span className="sr"> about {c.title}</span>
                </summary>
                {c.role && <p className="mini-role">{c.role}</p>}
                {c.body.map((p) => (
                  <p className="text" key={p.slice(0, 24)}>
                    <Rich text={p} />
                  </p>
                ))}
                <Metrics items={c.metrics} />
                {c.stack && <p className="stack">{c.stack}</p>}
              </details>
              <LinkRow links={c.links} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
