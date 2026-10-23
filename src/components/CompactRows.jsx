import { useRef } from 'react';
import { useEqualRows } from '../hooks/useEqualRows';
import Media from './Media';
import MediaBadges from './MediaBadges';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';
import Stack from './Stack';

/* "More builds": compact cards with the same fields as the featured ones. The
   one-liner, the role line and the links are always visible; the full story, any
   metric and the stack open under "Read more" at the card foot (a native <details>,
   so it needs no script). The role line is one sentence and stays visible: it is the
   ownership fact a skimmer wants. All seven cards share one size and one height, see .mini-grid. */
export default function CompactRows({ more }) {
  const grid = useRef(null);
  useEqualRows(grid, 7);
  return (
    <div className="more">
      <div className="more-head reveal">
        <h3>{more.heading}</h3>
        <p>{more.intro}</p>
      </div>
      <div className="mini-grid" ref={grid}>
        {more.items.map((c, n) => (
          <article className="mini reveal" id={`build-${c.id}`} data-delay={n % 4 || undefined} key={c.id}>
            <div className="mini-media">
              <Media
                image={c.media?.image}
                alt={c.media?.alt}
                tile={c.tile}
                badges={c.awards.length > 0 ? <MediaBadges item={c} /> : null}
                sizes="(min-width: 1100px) 270px, (min-width: 760px) 30vw, (min-width: 560px) 46vw, 92vw"
              />
            </div>
            <div className="mini-body">
              <span className="eyebrow">
                <span>{c.kind}</span>
                <span>{c.when}</span>
              </span>
              <h4 className="mini-title">
                {c.title} <span>{c.descriptor}</span>
              </h4>
              <p className="mini-one">{c.oneLiner}</p>
              {c.role && <p className="mini-role">{c.role}</p>}
              <LinkRow links={c.links} />
              <details className="mini-more">
                <summary>
                  {more.readMore}
                  <span className="sr">{more.readMoreSr.replace('{title}', c.title)}</span>
                </summary>
                {c.body.map((p) => (
                  <p className="text" key={p.slice(0, 24)}>
                    <Rich text={p} />
                  </p>
                ))}
                <Metrics items={c.metrics} />
                <Stack text={c.stack} />
              </details>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
