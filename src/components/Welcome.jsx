import { useEffect, useRef } from 'react';
import { hero, welcome } from '../data/content';
import { entry as words, loadLines } from '../data/world';
import { heroOrigin } from '../lib/origin';
import { measureFace } from '../lib/face';
import { createEntry } from '../shell/entry';
import LoadLine from '../shell/LoadLine';
import PlateArc from '../shell/PlateArc';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';

/* The Threshold: the first screen. His face in light (Hologram.jsx draws it into
   the fixed background, on the empty box marked data-holo-anchor here), a
   greeting, and the door. Nothing waits on it: the text is in the HTML, the nav
   works, and Enter is a real link to the hero.

   His work comes to him like thoughts: at the sides of the window, never touching
   the head, small soft holograms (welcome.hub) phase in one after another. All
   CSS; they drift a few pixels with the head's turn (--head, written by Hologram).

   The Sill is the door: a hairline arc at the foot of the screen with one tick
   per ring build (hero.carousel.slides.length), the top edge of the Orrery below
   showing over the horizon. Enter stands on its crest. Skip intro sits bottom
   right, the load line bottom left.

   The entry (shell/entry.js) plays on Enter, and the reader's own scroll scrubs
   the same beats both ways:

     0.00 s  the door presses in; the greeting and the thoughts fade
     0.25 s  the light lets go: the portrait gathers to the seed, the ringed world
     1.05 s  it speaks: welcome.ball types under it
     2.05 s  the ring opens: a plate rim grows out of the ball, past the window's edges
     2.60 s  the plate comes in from past the window's edges as the ring leaves them
     2.85 s  inside: the cards land on it, the name sets (Orbit, CSS)

   KNOTS maps that clock onto the scroll (share of the way to the hero); SPANS says
   where on the way each thing happens and mirrors the numbers Hologram.jsx uses
   for its own morph, line and burst. Skip (the link, Escape, or any wheel, touch
   or key while the clock runs) lands the hero at rest at once. Under reduced
   motion, in plain view and without WebGL there are no beats: the Sill is a still
   arc and Enter is a plain anchor.

   The greeting is plain text and the LCP element. Each line carries its length as
   --n so the stylesheet can type it in steps while the face draws. */
/* The portrait eases after the scroll (about a tenth of a second behind), so the
   middle knots sit that much ahead of the beats they play. */
const KNOTS = [
  [0, 0],
  [250, 0.04, 'in'],
  [900, 0.34, 'linear'],
  [975, 0.4, 'linear'],
  [1950, 0.585, 'linear'],
  [2850, 1],
];
const SPANS = { face: [0.04, 0.34], open: [0.6, 0.98], plate: 0.78, land: 0.8, back: 0.6 };
const LATE_MS = 3600;

/* The Sill and the ring that opens are the same drawing as the Orrery's plate:
   two rims, the outer RIM wider, one tick per ring build between them. */
const N = hero.carousel.slides.length;
const RIM = 1.06;
const fix = (v) => v.toFixed(1);
const ringTicks = Array.from({ length: N }, (_, k) => {
  const a = (k / N) * 2 * Math.PI;
  return [100 * Math.sin(a), 100 * Math.cos(a), 100 * RIM * Math.sin(a), 100 * RIM * Math.cos(a)];
});
const PARALLELS = [-56, -30, 0, 30, 56];
/* The ball's radius as a share of the window's short side, and how far under its
   centre the line of speech sits, in radii: Hologram.jsx's own numbers, today's
   and the face lane's. The ring that opens starts just off the ball's limb and
   widens to RING.grow times that. */
const BALL = { now: { r: 0.15, phone: 0.18, drop: 1.28 }, next: { r: 0.17, phone: 0.2, drop: 1.22 } };
const RING = { from: 1.22, grow: 14 };

export default function Welcome() {
  const host = useRef(null);
  const ctl = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const late = setTimeout(() => {
      if (!root.dataset.holo) root.dataset.holo = 'late';
    }, LATE_MS);
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 760px)').matches;
    const query = new URLSearchParams(window.location.search);
    // The portrait contract. A portrait that follows the scroll by itself is left to
    // it; one with no dissolve of its own asks for the fallback (<html data-face="css">):
    // --face-out is then written on <html> and the stylesheet gathers the canvas to
    // the seed. ?face=css is the same switch for a test.
    if (query.get('face') === 'css') root.dataset.face = 'css';
    ctl.current = createEntry({
      origin: heroOrigin,
      host: host.current,
      knots: KNOTS,
      spans: SPANS,
      ring: (w, h) => {
        // The ball as Hologram.jsx poses it. The face lane's portrait (it publishes
        // --face-seed-y) draws a larger planet with no ring of its own.
        const ball = root.style.getPropertyValue('--face-seed-y') ? BALL.next : BALL.now;
        const globe = Math.min(w, h) * (phone ? ball.phone : ball.r);
        return { reach: (globe * RING.from) / 100, grow: RING.grow, globe: globe / 50, up: globe * ball.drop };
      },
      driveFace: () => root.dataset.face === 'css',
      still: () => rm.matches || root.dataset.holo === 'off' || root.dataset.plain != null,
    });
    // The portrait's box and seed point are published at once (lib/face.js), so the
    // entry beats can meet the portrait before its points have loaded, or without WebGL.
    const place = () => measureFace();
    place();
    window.addEventListener('resize', place, { passive: true });
    return () => {
      clearTimeout(late);
      window.removeEventListener('resize', place);
      ctl.current.dispose();
      ctl.current = null;
    };
  }, []);

  const plainClick = (e) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  const enter = (e) => {
    if (plainClick(e) || !ctl.current) return;
    if (!ctl.current.enter()) return;
    e.preventDefault();
    emit(EV.sound, { cue: 'tick' }); // heard only if Sound is on
  };
  const skip = (e) => {
    if (plainClick(e) || !ctl.current) return;
    e.preventDefault();
    ctl.current.skip();
  };

  return (
    <section className="welcome" id="welcome" aria-label={welcome.label} ref={host}>
      <div className="welcome-face" data-holo-anchor="" aria-hidden="true" />
      <div className="hub" aria-hidden="true">
        {welcome.hub.map((item, k) => (
          <figure className="hub-panel" data-at={item.at} data-kind={item.kind} style={{ '--k': k }} key={item.at}>
            {item.kind === 'fact' ? (
              <b>{item.value}</b>
            ) : (
              <span className="hub-pic">
                <img
                  src={item.kind === 'crew' ? `/agents/${item.id}-148.webp` : `/builds/ring/${item.id}-320.webp`}
                  alt=""
                  width={item.kind === 'crew' ? 148 : 320}
                  height={item.kind === 'crew' ? 148 : 200}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </span>
            )}
            <figcaption>{item.label}</figcaption>
          </figure>
        ))}
      </div>
      <p className="welcome-say">
        {welcome.lines.map((line, k) => (
          <span className="say" data-line={k + 1} style={{ '--n': line.length }} key={line}>
            {line}
          </span>
        ))}
      </p>
      <p className="welcome-ball" style={{ '--n': welcome.ball.length }}>
        <span>{welcome.ball}</span>
      </p>
      <div className="door">
        <a className="door-enter" href="#top" onClick={enter}>
          <span>{words.enter}</span>
          <svg viewBox="0 0 12 14" width="12" height="14" aria-hidden="true" focusable="false">
            <path d="M6 1v11M1.5 7.5 6 12l4.5-4.5" />
          </svg>
        </a>
        <span className="door-hint" aria-hidden="true">
          {words.hint}
        </span>
      </div>
      <div className="threshold">
        <PlateArc className="sill" count={N} />
        <LoadLine lines={loadLines} />
        <a className="door-skip" href="#top" onClick={skip}>
          {words.skip}
        </a>
      </div>
      <svg className="seed" aria-hidden="true" focusable="false">
        <g className="seed-at">
        <g className="seed-ball">
          <circle className="seed-globe" r="50" />
          {PARALLELS.map((lat) => {
            const r = 50 * Math.cos((lat * Math.PI) / 180);
            return <ellipse className="seed-line" key={lat} cy={fix(-50 * Math.sin((lat * Math.PI) / 180))} rx={fix(r)} ry={fix(r * 0.3)} />;
          })}
          <circle className="seed-core" r="9" />
        </g>
        <g className="seed-ring">
          <circle className="seed-rim" r="100" />
          <circle className="seed-rim" data-rim="outer" r={100 * RIM} />
          {ringTicks.map((t, k) => (
            <line className="seed-tick" key={k} x1={fix(t[0])} y1={fix(t[1])} x2={fix(t[2])} y2={fix(t[3])} />
          ))}
        </g>
        </g>
      </svg>
    </section>
  );
}
