import { builds } from '../data/content';
import Rich from './Rich';
import Check from './Check';

export default function Builds() {
  return (
    <section className="sec" id="builds" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{builds.heading}</h2>
          <p>{builds.intro}</p>
        </div>

        {builds.items.map((p) => (
          <article className="proj reveal" key={p.id}>
            <div className="proj-grid">
              {/* left: identity */}
              <div>
                <span className="proj-kind">{p.kind}</span>
                <h3 className="proj-title">
                  {p.title} <em>{p.titleMuted}</em>
                </h3>
                <div className="proj-when">{p.when}</div>

                {p.laurels.length > 0 && (
                  <div className="laurels">
                    {p.laurels.map((l) => (
                      <div className="laurel" key={l}>
                        <Check size={11} />
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* right: the argument */}
              <div className="proj-body">
                {p.oneLiner && <p className="proj-lead">{p.oneLiner}</p>}

                {p.body.map((para, i) => (
                  <p key={i}>
                    <Rich text={para} />
                  </p>
                ))}

                {p.media?.video && (
                  <video
                    className="proj-video"
                    src={p.media.video}
                    poster={p.media.poster || undefined}
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}

                <div className="metrics">
                  {p.metrics.map((m) => (
                    <div className="metric" key={m.value + m.label}>
                      <b>{m.value}</b>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </div>

                <div className="stackline">
                  <b>Stack</b> — {p.stack}
                </div>

                <div className="proj-links">
                  {p.links
                    .filter((l) => l.href) /* empty href = not ready, so hide it */
                    .map((l) => (
                      <a
                        className="plink"
                        href={l.href}
                        key={l.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {l.label} ↗
                      </a>
                    ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
