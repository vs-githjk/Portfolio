import MediaBadges from './MediaBadges';
import Media from './Media';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';
import Stack from './Stack';

/* One featured build. The anchor id matches the ring card id. */
export default function BuildCard({ item, delay }) {
  return (
    <article className="build reveal" id={`build-${item.id}`} data-delay={delay}>
      <div className="build-media">
        <Media
          image={item.media?.image}
          alt={item.media?.alt}
          tile={item.tile}
          tilt={4}
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
        {item.body.map((p) => (
          <p className="text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        {item.role && <p className="role">{item.role}</p>}
        <Metrics items={item.metrics} />
        <Stack text={item.stack} />
        <LinkRow links={item.links} />
      </div>
    </article>
  );
}
