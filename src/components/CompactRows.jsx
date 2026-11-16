import LinkRow from './LinkRow';
import Media from './Media';
import MediaBadges from './MediaBadges';
import Metrics from './Metrics';
import Rich from './Rich';
import Stack from './Stack';
import { fill, place } from './counts';

/* "More builds" as a manifest: an index of rows, not cards. A row is its place
   in the list, a small thumbnail, the name, the one-liner, any award and the
   links. The whole row opens in place (a native <details>, so it needs no script
   and the text is in the HTML): the summary's hit area is stretched over the row
   and the links sit above it. */
export default function CompactRows({ more }) {
  return (
    <div className="manifest">
      <div className="manifest-head reveal">
        <h3>{more.heading}</h3>
        <p>{more.intro}</p>
      </div>
      <ol className="manifest-rows">
        {more.items.map((c) => (
          <li className="mrow reveal" id={`build-${c.id}`} data-build={c.id} key={c.id}>
            <span className="mrow-num num">{place(c.id)}</span>
            <div className="mrow-thumb">
              <Media image={c.media?.image} alt={c.media?.alt} tile={c.tile} steps={[640]} sizes="120px" />
            </div>
            <div className="mrow-name">
              <h4 className="mrow-title">
                {c.title} <span>{c.descriptor}</span>
              </h4>
              <p className="eyebrow">
                {c.kind} · {c.when}
              </p>
            </div>
            <div className="mrow-one">
              <p>{c.oneLiner}</p>
              {c.awards.length > 0 && (
                <p className="mrow-awards">
                  <MediaBadges item={c} />
                </p>
              )}
            </div>
            <LinkRow links={c.links} className="links mrow-links" />
            <details className="mrow-more fold">
              <summary>
                <span className="mrow-open">{more.readMore}</span>
                <span className="sr">{fill(more.readMoreSr, { title: c.title })}</span>
              </summary>
              <div className="fold-body">
                {/* On a phone the row is its name and its links; the one-liner opens here. */}
                <p className="text mrow-one-folded">{c.oneLiner}</p>
                {c.role && <p className="role">{c.role}</p>}
                {c.body.map((p) => (
                  <p className="text" key={p.slice(0, 24)}>
                    <Rich text={p} />
                  </p>
                ))}
                <Metrics items={c.metrics} />
                <Stack text={c.stack} />
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
