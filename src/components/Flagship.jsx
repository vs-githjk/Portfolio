import { useReducedMotion } from '../hooks/useMediaQuery';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';

/* The PrismAI panel: a "screen" on the left with the headline metrics, the
   stack and the links under it, the story on the right. A muted loop replaces the still when
   media.video is set (and never autoplays under reduced motion). */
export default function Flagship({ item }) {
  const { media } = item;
  const reduced = useReducedMotion();

  return (
    <article className="flag reveal" id={`build-${item.id}`}>
      <div className="flag-media">
        <div className="flag-sticky">
          <div className="flag-screen">
            {media.video ? (
              <video
                src={media.video}
                poster={media.image}
                muted
                loop
                playsInline
                preload="none"
                autoPlay={!reduced}
                aria-label={media.alt}
              />
            ) : (
              <img
                src={media.image}
                alt={media.alt}
                width="1600"
                height="1000"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
          <Metrics items={item.metrics} />
          <p className="build-stack">{item.stack}</p>
          <LinkRow links={item.links} />
        </div>
      </div>
      <div className="flag-body">
        <div className="build-kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="flag-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="build-one flag-one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="build-text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
      </div>
    </article>
  );
}
