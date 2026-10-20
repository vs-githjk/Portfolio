import Badge from './Badge';
import Media from './Media';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';

/* The paper: its own shape, so it does not read as a seventh product. A
   preprint, never "published". The two headline results sit under the image so
   the media column ends close to the text column. */
export default function ResearchRow({ item }) {
  return (
    <article className="paper reveal" id={`build-${item.id}`}>
      <div className="paper-media">
        <Media
          image={item.media.image}
          alt={item.media.alt}
          tile={item.tile}
          tilt={3}
          sizes="(min-width: 960px) 440px, 92vw"
          badges={<Badge kind="win">{item.awardsLong}</Badge>}
        />
        <Metrics items={item.metrics} />
      </div>
      <div className="paper-body">
        <div className="kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="paper-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        <p className="role">{item.role}</p>
        <p className="stack">{item.stack}</p>
        <LinkRow links={item.links} />
      </div>
    </article>
  );
}
