import { useEffect, useRef, useState } from 'react';
import { builds } from '../data/content';
import Rich from './Rich';
import Check from './Check';

/* The three flagship builds render as a glass-card deck: one card centred,
   the others waiting at the edges. Prev/next (buttons, arrow keys, swipe)
   swooshes the next card into the middle. On mobile and under
   prefers-reduced-motion the deck flattens into a plain stack (see CSS). */

const N = builds.items.length;

function slotFor(i, activeIdx) {
  if (i === activeIdx) return 'active';
  if ((activeIdx + 1) % N === i) return 'next';
  return 'prev';
}

export default function Builds() {
  const secRef = useRef(null);
  const swipeX = useRef(null);
  const [active, setActive] = useState(0);
  const [Fx, setFx] = useState(null);
  const [gradient, setGradient] = useState(null);
  const [flat, setFlat] = useState(false);

  /* Below 760px or under reduced motion the deck renders as a plain stack
     (CSS handles the layout) — every card must stay interactive there. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)');
    const sync = () => setFlat(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /* FloatingLines backdrop — lazy, token-colored, skipped under reduced motion. */
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const css = getComputedStyle(document.documentElement);
    setGradient(
      ['--accent-1', '--accent-2', '--accent-3', '--accent-green'].map((v) =>
        css.getPropertyValue(v).trim()
      )
    );
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./FloatingLines').then((m) => setFx(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(secRef.current);
    return () => io.disconnect();
  }, []);

  const step = (dir) => setActive((a) => (a + dir + N) % N);

  const onPointerDown = (e) => {
    swipeX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (swipeX.current == null) return;
    const dx = e.clientX - swipeX.current;
    swipeX.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };

  return (
    <section className="sec builds-sec" id="builds" ref={secRef}>
      {Fx && gradient && (
        <div className="builds-fx" aria-hidden="true">
          <Fx
            linesGradient={gradient}
            enabledWaves={['top', 'middle', 'bottom']}
            lineCount={8}
            lineDistance={8}
            bendRadius={8}
            bendStrength={-2}
            interactive
            parallax
            animationSpeed={1}
          />
        </div>
      )}
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{builds.heading}</h2>
          <p>{builds.intro}</p>
        </div>

        <div
          className="deck reveal"
          role="group"
          aria-roledescription="carousel"
          aria-label={builds.heading}
          tabIndex={flat ? undefined : 0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="deck-stage">
            {builds.items.map((p, i) => (
              <article
                className="deck-card"
                data-state={slotFor(i, active)}
                aria-hidden={!flat && i !== active}
                inert={!flat && i !== active}
                key={p.id}
              >
                <div className="glass">
                  <div className="glass-top">
                    <span className="proj-kind">{p.kind}</span>
                    <span className="proj-when">{p.when}</span>
                  </div>

                  <h3 className="proj-title">
                    {p.title} <em>{p.titleMuted}</em>
                  </h3>

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

                  <div className="proj-body">
                    {p.oneLiner && <p className="proj-lead">{p.oneLiner}</p>}

                    {p.body.map((para, j) => (
                      <p key={j}>
                        <Rich text={para} />
                      </p>
                    ))}

                    {p.media?.image && (
                      <img
                        className="proj-shot"
                        src={p.media.image}
                        alt={p.media.alt || ''}
                        loading="lazy"
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

          <div className="deck-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous project">
              ←
            </button>
            <div className="deck-dots" role="tablist" aria-label="Project selector">
              {builds.items.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={p.title}
                  data-state={i === active ? 'active' : 'idle'}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>
            <button type="button" onClick={() => step(1)} aria-label="Next project">
              →
            </button>
          </div>
        </div>

        {builds.compact && (
          <div className="reveal">
            <div className="mini-head">{builds.compact.heading}</div>
            <div className="mini-grid">
              {builds.compact.items.map((m) => (
                <article className="mini" key={m.id}>
                  {m.media?.image && (
                    <img className="mini-shot" src={m.media.image} alt={m.media.alt || ''} loading="lazy" />
                  )}
                  <h3 className="mini-title">{m.title}</h3>
                  <p className="mini-line">{m.oneLiner}</p>
                  {m.stack && (
                    <div className="mini-stack">
                      <b>Stack</b> — {m.stack}
                    </div>
                  )}
                  <div className="proj-links">
                    {m.links
                      .filter((l) => l.href)
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
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
