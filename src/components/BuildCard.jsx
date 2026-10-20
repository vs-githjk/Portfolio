import Badge from './Badge';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';

/* One featured build. The anchor id matches the deck slide id. */
export default function BuildCard({ item }) {
  return (
    <article className="build reveal" id={`build-${item.id}`}>
      <div className="build-media">
        <img
          src={item.media.image}
          alt={item.media.alt}
          width="1600"
          height="1000"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="build-body">
        {item.awards.length > 0 && (
          <div className="build-awards">
            {item.awards.map((a) => (
              <Badge key={a}>{a}</Badge>
            ))}
          </div>
        )}
        <div className="build-kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="build-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="build-one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="build-text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        {item.role && <p className="build-role">{item.role}</p>}
        <Metrics items={item.metrics} />
        {item.stack && <p className="build-stack">{item.stack}</p>}
        <LinkRow links={item.links} />
      </div>
    </article>
  );
}
