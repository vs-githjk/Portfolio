import { useEffect, useRef } from 'react';
import { welcome } from '../data/content';
import { entry as words, loadLines } from '../data/world';
import { heroOrigin } from '../lib/origin';
import { measureFace } from '../lib/face';
import { createEntry } from '../shell/entry';
import LoadLine from '../shell/LoadLine';
import WelcomeScene from './WelcomeScene';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';

/* The Threshold: the first screen. A hologram of him says hello (Hologram.jsx
   projects his photograph into the fixed background, over the empty box marked
   data-holo-anchor here), then the greeting and the door. Nothing waits on it:
   the text is in the HTML, the nav works, and Enter is a real link to the hero.

   Only he is a hologram. His work stands round him as real things (welcome.hub):
   six crisp, full-colour cards in a symmetric arc, three a side, each with its
   name and one word under it; and at the foot of the projector a gold plaque
   with the fact about him. Behind is the room (WelcomeScene: a floor of light
   round the plate, a few constellations) and the sky (WelcomeBackdrop). Nothing
   touches his figure or sits on the greeting.

   The hand-off is direct: on Enter, or as the reader scrolls, the greeting and
   the panels fade, curtains of light close over the projection and leave one
   beam, the beam lifts away and the hero is there. KNOTS is that scroll on a
   clock ([ms, share of the way to the hero]); the reader's own scroll scrubs it
   both ways. Skip (the link, Escape, or any wheel, touch or key while the clock
   runs) lands the hero at rest at once. Under reduced motion, in plain view and
   without WebGL there are no beats and Enter is a plain anchor.

   The greeting is plain text and the LCP element. Each line carries its length as
   --n so the stylesheet can type it in steps while the projector starts. */
const KNOTS = [
  [0, 0],
  [220, 0.05, 'in'],
  [1300, 0.72, 'linear'],
  [1800, 1],
];
/* The hero lights as the beam leaves; it waits again when the reader goes back up. */
const SPANS = { land: 0.5, back: 0.4 };
const LATE_MS = 3600;

export default function Welcome() {
  const host = useRef(null);
  const ctl = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const late = setTimeout(() => {
      if (!root.dataset.holo) root.dataset.holo = 'late';
    }, LATE_MS);
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    ctl.current = createEntry({
      origin: heroOrigin,
      host: host.current,
      knots: KNOTS,
      spans: SPANS,
      still: () => rm.matches || root.dataset.holo === 'off' || root.dataset.plain != null,
    });
    // The projection's box is published at once (lib/face.js), so the panels can keep
    // clear of it before the photograph has loaded.
    const place = () => measureFace();
    place();
    window.addEventListener('resize', place, { passive: true });
    // The room has depth: the panels and the sky shift a few pixels against the
    // pointer (--px, --py, -1 to 1, on the section). A mouse only, and never under
    // reduced motion; one write a frame.
    let raf = 0;
    let at = null;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const lean = (e) => {
      at = e;
      if (raf || rm.matches || window.scrollY > window.innerHeight) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        host.current?.style.setProperty('--px', ((at.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        host.current?.style.setProperty('--py', ((at.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    if (fine) window.addEventListener('pointermove', lean, { passive: true });
    return () => {
      window.removeEventListener('pointermove', lean);
      cancelAnimationFrame(raf);
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
    // Take keyboard and screen-reader users along: the next Tab starts from the name.
    document.querySelector('.hero-name')?.focus({ preventScroll: true });
  };

  return (
    <section className="welcome" id="welcome" aria-label={welcome.label} ref={host}>
      <div className="welcome-face" data-holo-anchor="" aria-hidden="true" />
      <WelcomeScene />
      <div className="hub" aria-hidden="true">
        {welcome.hub.map((item, k) => {
          const src = item.kind === 'crew' ? `/agents/${item.id}.webp` : `/builds/ring/${item.id}.webp`;
          return (
            <figure className="hub-card" data-at={item.at} style={{ '--k': k }} key={item.at}>
              <span className="hub-shot">
                <img
                  src={src}
                  srcSet={item.kind === 'crew' ? undefined : `${src.replace('.webp', '-320.webp')} 320w, ${src} 640w`}
                  sizes="(max-width: 760px) 112px, 210px"
                  alt=""
                  width={item.kind === 'crew' ? 294 : 640}
                  height={item.kind === 'crew' ? 294 : 400}
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              </span>
              <figcaption>
                <b>{item.label}</b>
                <span>{item.note}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="welcome-plate">
        <b>{welcome.plate.value}</b>
        <span>
          {welcome.plate.line} <i aria-hidden="true">·</i> {welcome.plate.more}
        </span>
      </p>
      <p className="welcome-say">
        {welcome.lines.map((line, k) => (
          <span className="say" data-line={k + 1} style={{ '--n': line.length }} key={line}>
            {line}
          </span>
        ))}
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
        <LoadLine lines={loadLines} />
        <a className="door-skip" href="#top" onClick={skip}>
          {words.skip}
        </a>
      </div>
    </section>
  );
}
