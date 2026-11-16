import { builds } from '../data/content';
import LinkRow from './LinkRow';
import MediaBadges from './MediaBadges';
import Metrics from './Metrics';
import RepairLoop from './RepairLoop';
import Rich from './Rich';
import Stack from './Stack';
import { fill, place } from './counts';

/* The paper: its own shape, an instrument, so it does not read as one more
   product. A preprint, never "published". The repair loop is drawn as a small
   machine on one side, with the first result as its two bars and the sentence
   that says what they measure; the kind line, the title, the one-liner, the
   other result and the links sit on the other. The story and the stack open under "The full
   story" (a native <details>). */
export default function ResearchRow({ item }) {
  return (
    <article className="paper reveal" id={`build-${item.id}`} data-build={item.id}>
      <div className="paper-loop">
        <RepairLoop loop={item.loop} metric={item.metrics[0]} />
        <p className="paper-measure">{item.metrics[0].label.replace(/\n/g, ' ')}</p>
      </div>
      <div className="paper-body">
        <div className="kind">
          <span className="eyebrow">
            <span className="num">{place(item.id)}</span> {item.kind}
          </span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="paper-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <div className="paper-awards">
          <MediaBadges item={item} />
        </div>
        <p className="one">{item.oneLiner}</p>
        <Metrics items={item.metrics.slice(1)} />
        <p className="role">{item.role}</p>
        <LinkRow links={item.links} />
      </div>
      <details className="paper-more fold">
        <summary>
          {builds.labels.story}
          <span className="sr">{fill(builds.labels.storySr, { title: item.title })}</span>
        </summary>
        <div className="fold-body">
          {item.body.map((p) => (
            <p className="text" key={p.slice(0, 24)}>
              <Rich text={p} />
            </p>
          ))}
          <Stack text={item.stack} />
        </div>
      </details>
    </article>
  );
}
