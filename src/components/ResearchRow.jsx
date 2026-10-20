import Badge from './Badge';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import PaperTile from './PaperTile';
import Rich from './Rich';

/* The paper: full-width, its own shape, so it does not read as a seventh
   product. A preprint, never "published". */
export default function ResearchRow({ item }) {
  return (
    <article className="research reveal" id={`build-${item.id}`}>
      <PaperTile className="research-tile">
        <span className="research-awards">
          {item.awards.map((a) => (
            <Badge key={a}>{a}</Badge>
          ))}
        </span>
      </PaperTile>
      <div className="research-body">
        <div className="build-kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="research-title">{item.title}</h3>
        <p className="build-one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="build-text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        <Metrics items={item.metrics} />
        <p className="research-meta">
          {item.fullTitle}. {item.role} {item.awardsLong}.
        </p>
        <p className="build-stack">{item.stack}</p>
        <LinkRow links={item.links} />
      </div>
    </article>
  );
}
