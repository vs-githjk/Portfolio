import { useEffect, useRef } from 'react';
import { heroOrigin } from '../lib/origin';
import { createHologram, parseFace, sampleText } from '../lib/holoScene';
import { welcome } from '../data/content';

/* The welcome hologram (plain WebGL, its own small chunk; the scene itself is
   lib/holoScene.js). This file is the lifecycle, the choreography and the budget.

   - It arrives after the first paint (Background mounts it when the page is
     idle) and then fetches the point cloud, so the greeting text is the first
     thing painted and the face draws itself in a moment later.
   - The canvas is fixed, so the light stays in the window while the page scrolls
     under it. Scroll is the timeline: over the welcome screen the face loosens
     into a ball of folded light, the ball opens into one line of words
     (welcome.ball), the words burst, and the hero is what they leave.
   - A few hundred points do not fly. They fall into a spark that goes down the
     whole page with the reader: it rides the margin, swings past the giant, dives
     into the galaxy's core and comes to rest as the light on the horizon. Its
     places mirror the set pieces in lib/worldScene.js (same depths, same lines).
   - It tells the page where it is with <html data-holo>: "in" while the face is
     being drawn (the greeting types in step, see sections.css), "seen" once it
     has (or at once for a visitor who has already watched it in this session),
     "off" when there is no WebGL (the welcome screen closes up).
   - It draws only while some of it is on screen and the tab is visible: every
     frame while the scroll is moving or the face is being drawn, about 30 a
     second while it only breathes. DPR is capped (1.75, 1.5 on a phone) and a
     phone draws a little over half the points.
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
    const gain = Number(style.getPropertyValue('--holo-gain')) || 1;

    let scene;
    let raf = 0;
    let dead = false;
    let started = 0; // when the face began to draw (performance.now)
    let seen = false;
    let eased = -1; // scroll progress, eased
    let last = 0;
    let box = null; // the anchor's place in the page
    let faded = ''; // how far the greeting has faded (written to the welcome as --out)
    const stops = { giant: null, galaxy: null, foot: null }; // The Deep's set pieces, as lines in the document
    const prev = { x: 0, y: 0, s: -1 };
    const trail = { x: 0, y: 0 };

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
      for (const [key, set] of [['giant', 'giant'], ['galaxy', 'galaxy'], ['foot', 'horizon']]) {
        const el = document.querySelector(`.vista[data-set="${set}"]`);
        const v = el ? el.getBoundingClientRect() : null;
        stops[key] = v && v.height ? v.top + window.scrollY + v.height / 2 : null;
      }
      scene.resize(w, h, Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 1.75));
    }

    /* Where the spark is when the hero has gone by: a place in the window for a
       scroll offset. It cruises in the right margin and is pulled to each set
       piece of The Deep while that piece is near the middle of the screen. */
    function guideAt(y, t, w, h) {
      const c = y + h / 2;
      const camZ = h / 2 / Math.tan((36 * Math.PI) / 360);
      const pad = Math.max(16, Math.min(w * 0.05, 72));
      const col = Math.min(600, w / 2) - pad;
      const margin = w / 2 - col;
      let x = phone ? w - 11 : w / 2 + col + margin * (0.5 + 0.2 * Math.sin(c / 900));
      let top = h * (0.42 + 0.07 * Math.sin(c / 640)) + Math.sin(t * 0.7) * 6;
      let orb = phone ? 9 : 15;
      let light = 1;
      const pull = (tx, ty, k) => {
        x += (tx - x) * k;
        top += (ty - top) * k;
      };
      if (stops.giant !== null) {
        const u = span(stops.giant - 0.9 * h, stops.giant + 0.9 * h, c);
        const r = Math.max(84, Math.min(w * 0.17, 225));
        const px = w / 2 + w * (phone ? 0.2 : 0.27);
        const py = h / 2 + (stops.giant + (phone ? 20 : 70) - c) * (camZ / (camZ + 220));
        const a = -2.7 + 3.5 * u; // a swing over the top of the planet, left to right
        pull(px + Math.cos(a) * r * 1.3, py + Math.sin(a) * r * 0.7, Math.sin(Math.PI * u) ** 0.8);
      }
      if (stops.galaxy !== null) {
        const u = span(stops.galaxy - 0.9 * h, stops.galaxy + 0.9 * h, c);
        const k = Math.sin(Math.PI * u) ** 0.8;
        pull(w / 2 + w * (phone ? 0 : 0.08), h / 2 + (stops.galaxy - c) * (camZ / (camZ + 1400)), k);
        orb *= 1 - 0.45 * k;
        light *= 1 + 0.7 * k;
      }
      if (stops.foot !== null) {
        const k = ease(span(stops.foot - 0.95 * h, stops.foot - 0.1 * h, c));
        pull(w / 2, h / 2 + (stops.foot - c) * (camZ / (camZ + 300)) + 3, k);
        orb *= 1 + 2.4 * k;
        light *= 1 + 0.5 * k;
      }
      return { x, y: top, orb, light };
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
          scene.render({ ...pose(w, h, 0), time: 4, intro: 1, morph: 0, burst: 0, turn: -0.08, nod: 0.01, voice: 0, still: true, gain });
        }
        return;
      }
      canvas.style.transform = '';

      const t = now / 1000;
      const alone = eased > 1.04; // the burst is over: only the spark is left
      const at = pose(w, h, eased);
      const to = guideAt(eased * reach, t, w, h);
      const k = ease(span(0, 0.7 * h, eased * reach - reach));
      const cx = at.cx + (to.x - at.cx) * k;
      const cy = at.cy + (to.y - at.cy) * k;
      // The trail: the spark is diving, so it streams back up the way it came.
      const dive = prev.s < 0 ? 0 : eased * reach - prev.s;
      const tx = prev.s < 0 ? 0 : -(cx - prev.x) * 5;
      const ty = prev.s < 0 ? 0 : -(cy - prev.y) * 5 - dive * 1.5;
      trail.x += (tx - trail.x) * 0.2;
      trail.y += (Math.max(-150, Math.min(150, ty)) - trail.y) * 0.2;
      prev.x = cx;
      prev.y = cy;
      prev.s = eased * reach;
      const trailing = Math.abs(trail.x) + Math.abs(trail.y) > 0.6;

      const busy = moving || trailing || intro < 1 || since < VOICE[1];
      if (busy || now - last >= IDLE_MS - 2) {
        const talking = !seenAtStart && since > VOICE[0] && since < VOICE[1];
        const burst = span(0.8, 1, eased);
        const out = span(0.01, 0.15, eased).toFixed(2);
        if (out !== faded) {
          faded = out;
          anchor.parentElement.style.setProperty('--out', out);
        }
        scene.render({
          cx,
          cy,
          size: at.size,
          ball: at.ball,
          time: t,
          intro: ease(intro),
          morph: ease(span(0.04, 0.38, eased)),
          say: span(0.44, 0.6, eased),
          sayW: Math.min(w - 40, phone ? 330 : 880),
          burst,
          // A slow look to one side and back: one eased swing every fifteen seconds.
          turn: Math.sin(t * 0.42) * 0.15 * (1 - span(0, 0.3, eased)),
          nod: 0.02 + Math.sin(t * 0.27) * 0.02,
          voice: talking ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0,
          still: false,
          guide: ease(span(0.84, 1, eased)),
          orb: to.orb,
          vx: trail.x,
          vy: trail.y,
          alone,
          // The burst starts with a flash; afterwards the spark carries the light.
          gain: gain * (alone ? to.light : 1 + 0.8 * Math.sin(Math.PI * span(0, 0.3, burst))),
          flicker: 1,
        });
        last = now;
      }
      raf = requestAnimationFrame(frame);
    }

    /* Where the light sits in the window. It starts on its place in the welcome
       screen, moves to the middle of the window while the page leaves, and lifts a
       little when it speaks so the hero has room to arrive under the words. */
    function pose(w, h, p) {
      const size = Math.min(box.h / 0.84, box.w * 1.3, 760);
      const home = box.y - 0.1 * size; // the head's centre sits a little above the box's
      const mid = h * (0.4 - 0.11 * ease(span(0.44, 0.6, p)));
      return {
        cx: box.x,
        cy: home + (mid - home) * ease(span(0, 0.4, p)),
        size,
        ball: Math.min(w, h) * (phone ? 0.25 : 0.18),
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
        // The words need the display face; it is preloaded, so this does not wait long.
        const family = style.getPropertyValue('--font-display');
        const ready = document.fonts ? document.fonts.load(`400 96px ${family}`).catch(() => null) : Promise.resolve();
        return ready.then(() => buffer);
      })
      .then((buffer) => {
        if (dead) return;
        const lines = phone ? welcome.ball : [welcome.ball.join(' ')];
        const cloud = parseFace(buffer, phone ? 0.58 : 1, sampleText(lines, style.getPropertyValue('--font-display')));
        scene = createHologram(canvas, cloud, {
          deep: triple(style, '--beam-b'),
          pale: triple(style, '--world-rim'),
          tint: triple(style, '--beam-b'),
        });
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

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('webglcontextlost', onLost);
      rm.removeEventListener('change', relayout);
      if (scene) scene.dispose();
      anchor.parentElement.style.removeProperty('--out');
      delete root.dataset.holo;
    };
  }, []);

  return <canvas ref={ref} className="bg-holo" />;
}
