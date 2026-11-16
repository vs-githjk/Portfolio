import { builds } from '../data/content';
import Count from './Count';
import LinkRow from './LinkRow';
import Metrics from './Metrics';
import Rich from './Rich';
import ScenePlate from './ScenePlate';
import Stack from './Stack';
import Stills from './Stills';
import { fill, place } from './counts';

/* A flagship is a chapter of two parts.

   Arrival: its place among the flagships, the name at display size across the
   whole column, then a window onto its own world on one side (left, right, left)
   and, on the other, the one-liner and ONE figure with the label that says what
   it measures. The window is empty space the scene draws into
   (data-world-anchor="flag-<id>"); the engraved plate inside it is the same
   counts as a hairline drawing, so the window is never bare without the scene.

   Story: a calmer panel. The stills as one viewer, the other figures, the role
   line and what is being built now. The story itself and the stack open under
   "The full story" (a native <details>, so the text is in the HTML). */
export default function Flagship({ item, index }) {
  const { lead, stack } = item.media;
  const frames = [
    { ...lead, width: 1200, height: 750, steps: [640, 900] },
    ...stack.map((s) => ({ ...s, width: 800, height: 500, steps: [320, 640] })),
  ];
  const figure = item.metrics[item.figure ?? 0];
  const rest = item.metrics.filter((m) => m !== figure);
  return (
    <article className="ch" id={`build-${item.id}`} data-side={index % 2 ? 'right' : 'left'} data-build={item.id}>
      <div className="ch-arrival reveal">
        <p className="ch-index">
          <span className="ch-kind">
            <span className="num">{place(item.id)}</span> {item.kind}
          </span>
          <i aria-hidden="true" />
          <span className="ch-when">{item.when}</span>
        </p>
        <h3 className="ch-title">{item.title}</h3>
        <div className="ch-world" data-world-anchor={`flag-${item.id}`}>
          <ScenePlate scene={item.scene} />
        </div>
        <div className="ch-intro">
          <p className="ch-desc">{item.descriptor}</p>
          <p className="one">{item.oneLiner}</p>
          <p className="ch-figure">
            <Count value={figure.value} />
            <span>{figure.label.replace(/\n/g, ' ')}</span>
          </p>
          <LinkRow links={item.links} />
        </div>
      </div>
      <div className="ch-story reveal">
        <Stills id={item.id} title={item.title} frames={frames} />
        <div className="ch-tell">
          <Metrics items={rest} />
          <p className="role">{item.role}</p>
          <div className="now-box">
            <span className="now">
              <i aria-hidden="true" />
              {item.now.label}
            </span>
            <p className="text">
              <Rich text={item.now.text} />
            </p>
          </div>
        </div>
        <details className="ch-more fold">
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
      </div>
    </article>
  );
}
