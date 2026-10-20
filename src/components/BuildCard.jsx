import MediaBadges from './MediaBadges';
import Media from './Media';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';
import Stack from './Stack';
import { builds } from '../data/content';

/* One featured build. The anchor id matches the ring card id. The one-liner, the role
   line, the results, the stack and the links stay on show; the full story opens under
   "Read more" at the card foot (a native <details>, like the compact cards), so the
   page stays a minute's read and the story is one click away. It is the last row so
   that opening it in one card leaves its row mate padding at the foot, never a hole
   in the middle. */
export default function BuildCard({ item, delay }) {
  return (
    <article className="build reveal" id={`build-${item.id}`} data-delay={delay}>
      <div className="build-media">
        <Media
          image={item.media?.image}
          alt={item.media?.alt}
          tile={item.tile}
          sizes="(min-width: 800px) 500px, 92vw"
          badges={<MediaBadges item={item} />}
        />
      </div>
      <div className="build-body">
        <div className="kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="build-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="one">{item.oneLiner}</p>
        {item.role && <p className="role">{item.role}</p>}
        <Metrics items={item.metrics} />
        <Stack text={item.stack} />
        <LinkRow links={item.links} />
        <details className="mini-more build-more">
          <summary>
            {builds.more.readMore}
            <span className="sr">{builds.more.readMoreSr.replace('{title}', item.title)}</span>
          </summary>
          {item.body.map((p) => (
            <p className="text" key={p.slice(0, 24)}>
              <Rich text={p} />
            </p>
          ))}
        </details>
      </div>
    </article>
  );
}
