import { useEffect, useRef } from 'react';
import { heroOrigin } from '../lib/origin';
import { createHologram, parseFace } from '../lib/holoScene';

/* The welcome hologram (plain WebGL, its own small chunk; the scene itself is
   lib/holoScene.js). This file is the lifecycle, the choreography and the budget.

   - It arrives after the first paint (Background mounts it when the page is
     idle) and then fetches the point cloud, so the greeting text is the first
     thing painted and the face draws itself in a moment later.
   - The canvas is fixed, so the light stays in the window while the page scrolls
     under it. Scroll is the timeline: over the welcome screen the face loosens
     into a ball of folded light, the ball says one line (the caption in
     Welcome.jsx types under it while the ball pulses with the words; this file
     writes --speak, --speak-on and --ball-y on the welcome section), then the ball
     bursts and the hero is what it leaves.
   - It tells the page where it is with <html data-holo>: "in" while the face is
     being drawn (the greeting types in step, see sections.css), "seen" once it
     has (or at once for a visitor who has already watched it in this session),
     "off" when there is no WebGL (the welcome screen closes up).
   - It draws only while some of it is on screen and the tab is visible: every
     frame while the scroll is moving or the face is being drawn, about 30 a
     second while it only breathes. DPR is capped (1.75, 1.5 on a phone) and a
     phone draws half the points. The glow is a bloom pass in a third-size buffer
     (desktop only; a phone gets one wide faint point in ten instead).
   - On a desktop he also looks a little toward the pointer (eased, a few degrees).
   - Under prefers-reduced-motion it is one still frame of the face that scrolls
     away with the page: no drawing in, no turn, no ball. */

const FACE_URL = '/holo/face.bin';
const SEEN_KEY = 'holo-seen';
const INTRO_MS = 1700;
/* When the greeting is being typed, in ms after the face starts to draw. These
   mirror --say-delay and --say-dur in tokens.css. */
const VOICE = [500, 2700];
const IDLE_MS = 1000 / 30;

const ease = (t) => t * t * (3 - 2 * t);
const span = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));

function triple(style, name) {
  return style
    .getPropertyValue(name)
    .split(',')
    .map((v) => Number(v) / 255);
}

export default function Hologram() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const root = document.documentElement;
    const anchor = document.querySelector('[data-holo-anchor]');
    if (!anchor) return undefined;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 760px)').matches;
    const style = getComputedStyle(root);
    // A phone draws fewer, smaller points, so each one burns a little brighter.
    const gain = (Number(style.getPropertyValue('--holo-gain')) || 1) * (phone ? 1.35 : 1);

    let scene;
    let raf = 0;
    let dead = false;
    let started = 0; // when the face began to draw (performance.now)
    let seen = false;
    let eased = -1; // scroll progress, eased
    let last = 0;
    let box = null; // the anchor's place in the page
    let faded = ''; // how far the greeting has faded (written to the welcome as --out)
    let spoke = ''; // the last state written for the ball's line
    let turned = ''; // the last head turn written (--head, -1 to 1)
    let cleared = false; // the canvas has been wiped after the burst
    const want = { x: 0, y: 0 }; // where the pointer is, -1 to 1
    const gaze = { x: 0, y: 0 }; // and where he is looking, eased

    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = false;
    }

    const off = () => {
      dead = true;
      cancelAnimationFrame(raf);
      root.dataset.holo = 'off';
    };

    function measure() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const r = anchor.getBoundingClientRect();
      box = { x: r.left + r.width / 2, y: r.top + window.scrollY + r.height / 2, w: r.width, h: r.height };
      scene.resize(w, h, Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75));
    }

    function frame(now) {
      raf = 0;
      if (dead || document.hidden) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const y = window.scrollY;
      const still = rm.matches;
      const reach = Math.max(1, heroOrigin());
      const p = still ? 0 : y / reach;
      const moving = eased < 0 ? false : Math.abs(p - eased) > 0.0015;
      eased = eased < 0 || Math.abs(p - eased) > 1.5 ? p : eased + (p - eased) * 0.16;

      const intro = still || seen ? 1 : span(0, INTRO_MS, now - started);
      if (intro >= 1 && !seen) {
        seen = true;
        try {
          window.sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* private mode: the welcome simply plays again next time */
        }
      }
      const since = now - started;
      if (root.dataset.holo === 'in' && since > VOICE[1] + 400) root.dataset.holo = 'seen';

      if (still) {
        // One frame; the canvas then rides the page like any other picture.
        canvas.style.transform = `translate3d(0, ${-y}px, 0)`;
        if (last === 0) {
          last = now;
          scene.render({ ...pose(w, h, 0), time: 4, intro: 1, morph: 0, burst: 0, turn: -0.08, nod: 0.01, voice: 0, speak: 0, still: true, gain, glow: 0.45 });
        }
        return;
      }
      canvas.style.transform = '';

      const gone = eased > 1.06 && p > 1.06;
      if (gone && !cleared) {
        // Past the hero (a jump from a nav link lands here in one step): leave nothing
        // behind, neither the last frame of light nor a half-typed line.
        cleared = true;
        scene.render({ ...pose(w, h, 1), time: 0, intro: 1, morph: 1, burst: 1, turn: 0, nod: 0, voice: 0, speak: 0, still: false, gain: 0 });
        const host = anchor.parentElement.style;
        host.setProperty('--speak', '1');
        host.setProperty('--speak-on', '0');
        host.setProperty('--out', '1');
        spoke = '';
        faded = '';
      }
      if (!gone) cleared = false;
      const busy = moving || intro < 1 || since < VOICE[1];
      if (!gone && (busy || now - last >= IDLE_MS - 2)) {
        const t = now / 1000;
        const talking = !seenAtStart && since > VOICE[0] && since < VOICE[1];
        const burst = span(0.76, 1, eased);
        const at = pose(w, h, eased);
        // The ball speaks: its line types as the page moves, and it pulses with it.
        const typed = span(0.4, 0.58, eased);
        const speaking = ease(span(0.38, 0.42, eased)) * (1 - ease(span(0.68, 0.75, eased)));
        const said = `${typed.toFixed(3)}|${speaking.toFixed(2)}|${Math.round(at.cy + at.ball * 1.28)}`;
        if (said !== spoke) {
          spoke = said;
          const host = anchor.parentElement.style;
          host.setProperty('--speak', typed.toFixed(3));
          host.setProperty('--speak-on', speaking.toFixed(2));
          host.setProperty('--ball-y', `${Math.round(at.cy + at.ball * 1.28)}px`);
        }
        // The panels wired to him drift a little with the turn of his head.
        // He looks slowly from side to side, and a little toward the pointer.
        gaze.x += (want.x - gaze.x) * 0.04;
        gaze.y += (want.y - gaze.y) * 0.04;
        const look = Math.max(-1, Math.min(1, Math.sin(t * 0.42) * 0.7 + gaze.x * 0.6)) * (1 - span(0, 0.3, eased));
        const head = look.toFixed(2);
        if (head !== turned) {
          turned = head;
          anchor.parentElement.style.setProperty('--head', head);
        }
        const word = typed > 0 && typed < 1 ? speaking : 0;
        const pulse = 1 + word * 0.07 * Math.sin(t * 9.5) * Math.sin(t * 2.3);
        const out = span(0.01, 0.15, eased).toFixed(2);
        if (out !== faded) {
          faded = out;
          anchor.parentElement.style.setProperty('--out', out);
        }
        scene.render({
          ...at,
          ball: at.ball * pulse,
          time: t,
          intro: ease(intro),
          morph: ease(span(0.04, 0.34, eased)),
          burst,
          // A slow look to one side and back: one eased swing every fifteen seconds.
          turn: look * 0.15,
          nod: 0.02 + Math.sin(t * 0.27) * 0.02 + gaze.y * 0.05 * (1 - span(0, 0.3, eased)),
          voice: talking ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0,
          // While the ball says its line a wave runs round its ring.
          speak: word * (0.55 + 0.45 * Math.sin(t * 5.3) * Math.sin(t * 1.9)),
          // The face keeps its features: less bloom on it than on the ball.
          glow: 0.45 + 0.55 * ease(span(0.04, 0.34, eased)),
          still: false,
          // The burst starts with a flash, then the light thins out as it flies.
          gain: gain * (1 + 0.8 * Math.sin(Math.PI * span(0, 0.3, burst)) + word * 0.12 * Math.sin(t * 9.5)) * (1 - span(0.9, 1.04, eased)),
        });
        last = now;
      }
      if (!gone) raf = requestAnimationFrame(frame);
    }

    /* Where the light sits in the window. It starts on its place in the welcome
       screen and stays close to the middle of the window while the page leaves. */
    function pose(w, h, p) {
      const size = Math.min(box.h / 0.84, box.w * 1.3, 760);
      const home = box.y - 0.1 * size; // the head's centre sits a little above the box's
      // It lifts a little before it speaks, so the hero has room to arrive under the line.
      const mid = h * (0.4 - 0.13 * ease(span(0.3, 0.42, p)));
      return {
        cx: box.x,
        cy: home + (mid - home) * ease(span(0, 0.36, p)),
        size,
        // The globe's radius; its ring reaches twice as far, so a phone gets a smaller one.
        ball: Math.min(w, h) * (phone ? 0.18 : 0.15),
      };
    }

    const kick = () => {
      if (!raf && !dead && scene) raf = requestAnimationFrame(frame);
    };
    const relayout = () => {
      if (!scene) return;
      measure();
      last = 0;
      kick();
    };
    const onLost = (e) => {
      e.preventDefault();
      off();
    };
    let seenAtStart = seen;

    fetch(FACE_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('hologram: face file missing'))))
      .then((buffer) => {
        if (dead) return;
        const cloud = parseFace(buffer, phone ? 0.5 : 1);
        // Parsing and compiling are two tasks, not one long one.
        return new Promise((resolve) => setTimeout(() => resolve(cloud), 0));
      })
      .then((cloud) => {
        if (dead) return;
        scene = createHologram(
          canvas,
          cloud,
          {
            deep: triple(style, '--holo-deep'),
            pale: triple(style, '--holo-pale'),
            tint: triple(style, '--holo-deep'),
            hot: triple(style, '--holo-hot'),
          },
          // The bloom is a desktop pass; a phone gets the cheap haze instead.
          phone ? 0 : Number(style.getPropertyValue('--holo-bloom')) || 0
        );
        measure();
        seenAtStart = seen || rm.matches || window.scrollY > 40;
        seen = seenAtStart;
        started = performance.now();
        root.dataset.holo = seenAtStart ? 'seen' : 'in';
        canvas.dataset.ready = '';
        kick();
      })
      .catch(off);

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    document.addEventListener('visibilitychange', kick);
    canvas.addEventListener('webglcontextlost', onLost);
    rm.addEventListener('change', relayout);
    const onPointer = (e) => {
      want.x = (e.clientX / window.innerWidth) * 2 - 1;
      want.y = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (fine) window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointer);
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('webglcontextlost', onLost);
      rm.removeEventListener('change', relayout);
      if (scene) scene.dispose();
      for (const name of ['--out', '--speak', '--speak-on', '--ball-y', '--head']) anchor.parentElement.style.removeProperty(name);
      delete root.dataset.holo;
    };
  }, []);

  return <canvas ref={ref} className="bg-holo" />;
}
