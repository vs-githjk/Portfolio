import { useEffect, useRef, useState } from 'react';
import { principles } from '../data/content';
import PlaceName from './PlaceName';

/* Four principles, each run once as a tiny machine: code overrules the model's
   figure, a check says no, a claim inks in after its count, a wire lights end to
   end before anything is finished. The drawings are inline SVG, animated in CSS
   (sections.css, PRINCIPLES): the markup is the end state, so the prerendered
   page, a reader without scripts and reduced motion all see the finished
   drawing. A tile plays when it scrolls in (data-state="run") and again from
   its Replay button or on a mouse entering it. A demo uses a fact already on
   the page or is labelled an illustration (content.js). */

function Decide({ d }) {
  return (
    <>
      <text className="pm-l" x="12" y="20">{d.from}</text>
      <text className="pm-v pm-old" x="12" y="52">{d.fromValue}</text>
      <path className="pm-strike" d="M10 45H146" pathLength="1" />
      <text className="pm-l" x="158" y="20">{d.to}</text>
      <text className="pm-v pm-new" x="158" y="52">{d.toValue}</text>
      <path className="pm-tick" d="M255 44l5 5 10-12" pathLength="1" />
      <path className="pm-rule" d="M12 72H268" />
      <text className="pm-l" x="12" y="91">{d.note}</text>
    </>
  );
}

function Gate({ d }) {
  return (
    <>
      <path className="pm-rule" d="M12 54H268" />
      <text className="pm-l" x="12" y="18">{d.note}</text>
      <text className="pm-l" x="140" y="18" textAnchor="middle">{d.gate}</text>
      <path className="pm-frame" d="M128 28H152M128 80H152" />
      <rect className="pm-bar" x="138" y="32" width="4" height="44" />
      <g className="pm-a">
        <rect x="0" y="0" width="30" height="16" />
      </g>
      <g className="pm-b">
        <rect x="0" y="0" width="30" height="16" />
        <path d="M9 8l4 4 8-8" />
      </g>
      <text className="pm-l pm-no" x="111" y="91" textAnchor="middle">{d.no}</text>
      <text className="pm-l pm-yes" x="229" y="91" textAnchor="middle">{d.yes}</text>
    </>
  );
}

function Measure({ d, uid }) {
  const ticks = Array.from({ length: d.count }, (_, i) => `M${12 + i * 7.6} 30h4.8v20h-4.8z`).join('');
  return (
    <>
      <text className="pm-l" x="12" y="20">{d.label}</text>
      <text className="pm-l" x="268" y="20" textAnchor="end">{d.source}</text>
      <clipPath id={uid}>
        <rect className="pm-count" x="12" y="28" width={d.count * 7.6} height="24" />
      </clipPath>
      <path className="pm-ticks" d={ticks} />
      <path className="pm-ticks pm-lit" d={ticks} clipPath={`url(#${uid})`} />
      <text className="pm-v pm-tally" x="268" y="48" textAnchor="end">{d.tally}</text>
      <path className="pm-rule" d="M12 66H268" />
      <text className="pm-claim" x="12" y="89">{d.claim}</text>
    </>
  );
}

function Wire({ d }) {
  return (
    <>
      <path className="pm-rule" d="M12 44H268" />
      <path className="pm-live" d="M12 44H268" pathLength="1" />
      {d.nodes.map((n, i) => (
        <g className="pm-node" data-n={i} key={n}>
          <rect x={12 + i * 89} y="30" width="78" height="28" />
          <text className="pm-l" x={51 + i * 89} y="47.5" textAnchor="middle">{n}</text>
        </g>
      ))}
      <path className="pm-rule" d="M12 72H268" />
      <text className="pm-l" x="12" y="91">{d.note}</text>
    </>
  );
}

const MACHINES = { decide: Decide, gate: Gate, measure: Measure, wire: Wire };

function Tile({ item, n }) {
  const ref = useRef(null);
  const [run, setRun] = useState(0); // 0: the still end state; each replay remounts the drawing
  const last = useRef(0);
  const Machine = MACHINES[item.demo.kind];

  const play = () => {
    const now = performance.now();
    if (now - last.current < 3200) return; // one run at a time
    last.current = now;
    setRun((r) => r + 1);
  };

  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        play();
        io.disconnect();
      },
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <article className="p-tile reveal" data-delay={n || undefined} onPointerEnter={(e) => e.pointerType === 'mouse' && play()}>
      <div className="p-fig" ref={ref}>
        <svg
          key={run}
          className="pm"
          data-kind={item.demo.kind}
          data-state={run ? 'run' : undefined}
          viewBox="0 0 280 104"
          role="img"
          aria-label={item.demo.alt}
        >
          <Machine d={item.demo} uid={`pm-clip-${n}`} />
        </svg>
        <button type="button" className="p-replay" onClick={play} aria-label={`${principles.replay}: ${item.title}`}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
    </article>
  );
}

export default function Principles() {
  return (
    <section className="sec principles" id="principles" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">
            {principles.eyebrow}
            <PlaceName section="principles" />
          </span>
          <h2>{principles.heading}</h2>
        </div>
        <div className="p-grid">
          {principles.items.map((p, n) => (
            <Tile item={p} n={n} key={p.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
