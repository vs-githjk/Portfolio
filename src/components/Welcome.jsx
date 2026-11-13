import { useEffect } from 'react';
import { welcome } from '../data/content';
import { heroOrigin } from '../lib/origin';

/* The welcome: the first screen. His face in light (Hologram.jsx draws it into
   the fixed background, on the empty box marked data-holo-anchor here), a
   greeting, and a quiet cue. Nothing waits on it: the text is in the HTML, the
   nav works, and one scroll or a click on the cue plays the face into the hero.

   Around the face, six of his Master Agents crew work as small holograms: tiny
   cut-corner cards in the hologram's own blue, each lighting up in turn, as if he
   is running them. They are decoration (inside the aria-hidden box).

   The greeting is plain text. Each line carries its length as --n so the
   stylesheet can type it in steps while the face draws (html[data-holo='in']).
   If the hologram has not said anything after a few seconds, the greeting lights
   up on its own.

   The cue is a real link to the hero. With scripts it glides there slowly enough
   for the face to turn into the ball, the ball to say its line and burst on the way; any wheel, touch or
   key hands the scroll straight back to the reader. */
/* The glide, as [share of the time, share of the way]: down to the words, a slow
   beat while they are read, then on into the hero. */
const GLIDE_MS = 5600;
const BEATS = [
  [0, 0],
  [0.44, 0.66],
  [0.72, 0.74],
  [1, 1],
];
const LATE_MS = 3600;

export default function Welcome() {
  useEffect(() => {
    const root = document.documentElement;
    const late = setTimeout(() => {
      if (!root.dataset.holo) root.dataset.holo = 'late';
    }, LATE_MS);
    return () => clearTimeout(late);
  }, []);

  const glide = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    const from = window.scrollY;
    const to = heroOrigin();
    const t0 = performance.now();
    let raf = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) => window.removeEventListener(type, stop));
    };
    const step = (now) => {
      const t = Math.min(1, (now - t0) / GLIDE_MS);
      const n = BEATS.findIndex((beat) => t <= beat[0]) || 1;
      const [ta, ka] = BEATS[n - 1];
      const [tb, kb] = BEATS[n];
      const u = (t - ta) / (tb - ta);
      const k = ka + (kb - ka) * (u * u * (3 - 2 * u));
      window.scrollTo(0, from + (to - from) * k);
      if (t < 1) raf = requestAnimationFrame(step);
      else stop();
    };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((type) => window.addEventListener(type, stop, { passive: true }));
    raf = requestAnimationFrame(step);
  };

  return (
    <section className="welcome" id="welcome" aria-label={welcome.label}>
      <div className="welcome-face" data-holo-anchor="" aria-hidden="true">
        {welcome.crew.map((id, k) => (
          <span className="holo-agent" data-seat={k + 1} key={id}>
            <img src={`/agents/${id}-148.webp`} alt="" width="148" height="148" loading="lazy" decoding="async" fetchPriority="low" />
          </span>
        ))}
      </div>
      <p className="welcome-say">
        {welcome.lines.map((line, k) => (
          <span className="say" data-line={k + 1} style={{ '--n': line.length }} key={line}>
            {line}
          </span>
        ))}
      </p>
      <a className="welcome-cue" href="#top" onClick={glide}>
        <span>{welcome.cue}</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
