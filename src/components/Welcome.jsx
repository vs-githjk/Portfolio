import { useEffect, useRef } from 'react';
import { welcome } from '../data/content';
import { heroOrigin } from '../lib/origin';

/* The welcome: the first screen. His face in light (Hologram.jsx draws it into
   the fixed background, on the empty box marked data-holo-anchor here), a
   greeting, and a quiet cue. Nothing waits on it: the text is in the HTML, the
   nav works, and one scroll or a click on the cue plays the face into the hero.

   He is the hub: out at the sides of the window a few small holographic panels
   show his work (welcome.hub: four builds, the crew, one fact), each tilted toward
   him and wired to him by a thin line of light that runs from his temple or
   shoulder, with a signal travelling along it. The wires are an SVG whose paths
   this file lays out from the real positions of the panels and of the face box
   (the same geometry Hologram.jsx uses for the head), again on every resize. The
   panels drift a few pixels with the head's turn (--head, written by Hologram).
   Decoration, aria-hidden; a phone keeps four small ones clear of the face.

   When the face has become the ball, the ball speaks: welcome.ball types in a
   caption under it (Hologram.jsx drives it with --speak, --speak-on, --ball-y).

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
  [0.42, 0.59],
  [0.76, 0.69],
  [1, 1],
];
const LATE_MS = 3600;

/* Where a wire leaves him, in units of the picture's height from the head's
   centre (x outward, y down): the temple for the top panels, then two places on
   the shoulder. */
const ROOT = { 1: [0.175, -0.01], 2: [0.27, 0.335], 3: [0.36, 0.4] };

export default function Welcome() {
  const hub = useRef(null);

  useEffect(() => {
    const node = hub.current;
    const face = node.parentElement.querySelector('[data-holo-anchor]');
    const svg = node.querySelector('svg');
    const lay = () => {
      const frame = node.getBoundingClientRect();
      const f = face.getBoundingClientRect();
      if (!frame.width || !f.height) return;
      svg.setAttribute('viewBox', `0 0 ${frame.width} ${frame.height}`);
      const size = Math.min(f.height / 0.84, f.width * 1.3, 760);
      const cx = f.left + f.width / 2 - frame.left;
      const cy = f.top + f.height / 2 - 0.1 * size - frame.top;
      node.querySelectorAll('.hub-panel').forEach((panel) => {
        const at = panel.dataset.at;
        const side = at[0] === 'l' ? -1 : 1;
        const [rx, ry] = ROOT[at[1]];
        const shown = panel.offsetWidth > 0;
        // offsetLeft/Top, not the bounding box: the panel is tilted in 3D.
        const x1 = panel.offsetLeft + (side < 0 ? panel.offsetWidth + 6 : -6);
        const y1 = panel.offsetTop + panel.offsetHeight * 0.42;
        const x0 = cx + side * rx * size;
        const y0 = cy + ry * size;
        const bend = (x1 - x0) * 0.5;
        const d = shown ? `M${x0.toFixed(1)} ${y0.toFixed(1)} C${(x0 + bend).toFixed(1)} ${y0.toFixed(1)} ${(x1 - bend).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}` : '';
        node.querySelectorAll(`[data-wire="${at}"]`).forEach((path) => path.setAttribute('d', d));
      });
    };
    lay();
    const ro = new ResizeObserver(lay);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

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
      <div className="welcome-face" data-holo-anchor="" aria-hidden="true" />
      <div className="hub" aria-hidden="true" ref={hub}>
        <svg className="hub-wires" focusable="false">
          {welcome.hub.map((item, k) => (
            <g key={item.at} style={{ '--k': k }}>
              <path className="hub-wire" data-wire={item.at} pathLength="100" />
              <path className="hub-pulse" data-wire={item.at} data-back={k % 2 ? '' : undefined} pathLength="100" />
            </g>
          ))}
        </svg>
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
      <p className="welcome-ball">
        <span>{welcome.ball}</span>
      </p>
      <a className="welcome-cue" href="#top" onClick={glide}>
        <span>{welcome.cue}</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
