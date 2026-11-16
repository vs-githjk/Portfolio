import { useEffect, useRef } from 'react';
import { heroOrigin } from '../lib/origin';
import { ring } from '../lib/ring';
import { face, measureFace } from '../lib/face';
import { createHologram, parseFace } from '../lib/holoScene';

/* The welcome portrait (plain WebGL, its own small chunk; the scene itself is
   lib/holoScene.js). This file is the lifecycle, the choreography and the budget.

   - At rest it is him, in his own colours, in a round window (not a face of blue
     light: that was judged ghostly, see CLAUDE.md): the photograph itself, crisp,
     on a mesh that turns with his head. The points assemble him at the start and
     take the picture apart when it lets go; it becomes light only then.

   - It arrives after the first paint (Background mounts it when the page is
     idle) and then fetches the point cloud, so the greeting text is the first
     thing painted and the face draws itself in a moment later.
   - The canvas is fixed, so the light stays in the window while the page scrolls
     under it. Scroll is the timeline (or --face-out on <html>, when the entry
     beats set it: lib/face.js): the picture lets go of its light, which gathers
     into a small planet (the eyes go last), the planet says one line
     (the caption in Welcome.jsx types under it while it swells with the words;
     this file writes --speak, --speak-on and --ball-y on the welcome section),
     then its light pours onto the orbit ring of builds as the hero arrives (the
     ring's place comes from lib/ring.js, which Orbit.jsx keeps; on a phone the
     light lands on the two drifting rows instead) and fades there.
   - It tells the page where it is with <html data-holo>: "in" while the face is
     being drawn (the greeting types in step, see sections.css), "seen" once it
     has (or at once for a visitor who has already watched it in this session),
     "off" when there is no WebGL (the welcome screen closes up).
   - It draws only while some of it is on screen and the tab is visible: every
     frame while the scroll is moving or the face is being drawn, about 30 a
     second while it only breathes. DPR is capped (1.75, 1.5 on a phone). A phone
     downloads and draws the base tier only (face-a.bin); a desktop adds the
     fill-in (face-b.bin). The glow is a bloom pass in a third-size buffer, run
     only once there is light to glow (desktop only).
   - On a desktop he also looks a little toward the pointer (eased, a few degrees).
   - Under prefers-reduced-motion it is one still frame of the face that scrolls
     away with the page: no drawing in, no turn, no planet. */

const FACE_URLS = ['/holo/face-a.bin', '/holo/face-b.bin'];
/* The photograph the window shows at rest: a smaller one for a phone. */
const PICTURE_URLS = ['/holo/face-512.webp', '/holo/face-1024.webp'];
const SEEN_KEY = 'holo-seen';
const INTRO_MS = 2000;
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
    const gain = (Number(style.getPropertyValue('--holo-gain')) || 1) * (phone ? 1.15 : 1);

    let scene;
    let cloud = null; // the parsed points (and where the round window sits among them)
    let lastOut = ''; // the last --face-out seen
    let raf = 0;
    let dead = false;
    let started = 0; // when the face began to draw (performance.now)
    let seen = false;
    let eased = -1; // scroll progress, eased
    let last = 0;
    let box = null; // the anchor's place in the page
    const drift = document.querySelector('.drift'); // where the light lands on a phone
    const land = { on: false, x: 0, y: 0, rx: 1, rz: 1, sinT: 0, cosT: 1, persp: 1500, theta: 0, cardW: 1, cardH: 1, front: 0, side: 0, yaw: 0, lean: 0, n: 12, clearL: 0, clearR: 0, copyL: 0, copyT: 0, copyR: 0, copyB: 0 };
    const copy = document.querySelector('#top .who-main'); // the hero copy: the light must go round it
    let faded = ''; // how far the greeting has faded (written to the welcome as --out)
    let spoke = ''; // the last state written for the ball's line
    let turned = ''; // the last head turn written (--head, -1 to 1)
    let cleared = false; // the canvas has been wiped after the hand-off
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
      // The welcome closes up now: there is no portrait box to publish.
      requestAnimationFrame(() => measureFace(anchor));
    };

    function measure() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const r = anchor.getBoundingClientRect();
      box = { x: r.left + r.width / 2, y: r.top + window.scrollY + r.height / 2, w: r.width, h: r.height };
      measureFace(anchor); // the portrait's box and seed point, for the entry beats (lib/face.js)
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
          const at = pose(w, h, 0, 0);
          scene.render({ ...at, ...windowAt(at, 0, 1), ring: land, time: 4, intro: 1, morph: 0, flow: 0, turn: -0.07, nod: 0.01, voice: 0, speak: 0, still: true, gain, glow: 0.5 });
        }
        return;
      }
      canvas.style.transform = '';

      const gone = eased > 1.06 && p > 1.06;
      if (gone && !cleared) {
        // Past the hero (a jump from a nav link lands here in one step): leave nothing
        // behind, neither the last frame of light nor a half-typed line.
        cleared = true;
        const end = pose(w, h, 1, 1);
        scene.render({ ...end, ...windowAt(end, 1, 0), ring: land, time: 0, intro: 1, morph: 1, flow: 1, turn: 0, nod: 0, voice: 0, speak: 0, still: false, gain: 0 });
        const host = anchor.parentElement.style;
        host.setProperty('--speak', '1');
        host.setProperty('--speak-on', '0');
        host.setProperty('--out', '1');
        spoke = '';
        faded = '';
      }
      if (!gone) cleared = false;
      // The entry beats (another lane) may drive how far the portrait's light has left:
      // --face-out, 0 to 1, on <html>. When it is set it replaces the scroll for that.
      const outNow = root.style.getPropertyValue('--face-out').trim();
      const driven = outNow !== '';
      const faceOut = driven ? Math.min(1, Math.max(0, parseFloat(outNow) || 0)) : 0;
      const outMoved = outNow !== lastOut;
      lastOut = outNow;
      const busy = moving || outMoved || intro < 1 || since < VOICE[1];
      if (!gone && (busy || now - last >= IDLE_MS - 2)) {
        const t = now / 1000;
        const talking = !seenAtStart && since > VOICE[0] && since < VOICE[1];
        const flow = span(0.68, 0.86, eased);
        const morph = driven ? faceOut : span(0.04, 0.37, eased);
        const at = pose(w, h, eased, driven ? faceOut : -1);
        if (flow > 0) where();
        // The ball speaks: its line types as the page moves, and it pulses with it.
        const typed = span(0.41, 0.57, eased);
        const speaking = ease(span(0.39, 0.43, eased)) * (1 - ease(span(0.66, 0.72, eased)));
        const said = `${typed.toFixed(3)}|${speaking.toFixed(2)}|${Math.round(at.cy + at.ball * 1.22)}`;
        if (said !== spoke) {
          spoke = said;
          const host = anchor.parentElement.style;
          host.setProperty('--speak', typed.toFixed(3));
          host.setProperty('--speak-on', speaking.toFixed(2));
          host.setProperty('--ball-y', `${Math.round(at.cy + at.ball * 1.22)}px`);
        }
        // The thoughts beside him drift a little with the turn of his head.
        // He looks slowly from side to side, and a little toward the pointer.
        gaze.x += (want.x - gaze.x) * 0.04;
        gaze.y += (want.y - gaze.y) * 0.04;
        const look = Math.max(-1, Math.min(1, Math.sin(t * 0.42) * 0.7 + gaze.x * 0.6)) * (1 - span(0, 0.3, eased)) * (1 - span(0, 0.3, morph));
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
          ...windowAt(at, morph, ease(span(0.25, 0.9, intro))),
          ball: at.ball * pulse,
          time: t,
          intro: ease(intro),
          ring: land,
          morph,
          flow,
          // A slow look to one side and back: one eased swing every fifteen seconds.
          turn: look * 0.11,
          nod: 0.02 + Math.sin(t * 0.27) * 0.02 + gaze.y * 0.05 * (1 - span(0, 0.3, eased)),
          voice: talking ? 0.5 + 0.5 * Math.sin(t * 7.5) : 0,
          // While the planet says its line it swells and a ripple runs over it.
          speak: word * (0.55 + 0.45 * Math.sin(t * 5.3) * Math.sin(t * 1.9)),
          // The glow comes up with the light as it leaves the picture.
          glow: 0.5 + 0.5 * ease(morph),
          still: false,
          // The light lands on the builds, then leaves them to it: it is all gone by the
          // time the hero sits under the nav, where the cue's glide (and many readers) stop.
          // A phone has no cards for it to frame, so there it thins out on the way down
          // (landed in a row it read as two bands of static).
          gain: gain * (1 + word * 0.1 * Math.sin(t * 9.5)) * (1 - ease(phone ? span(0.72, 0.88, eased) : span(0.92, 1, eased))),
        });
        last = now;
      }
      if (!gone) raf = requestAnimationFrame(frame);
    }

    /* Where the light sits in the window. It starts on its place in the welcome
       screen and stays close to the middle of the window while the page leaves. */
    function pose(w, h, p, out = -1) {
      // The round window is centred in the box and fills it; the picture is sized so the
      // window has that width (cloud.disc is where the window sits among the points).
      const d = cloud.disc;
      const side = face.rect ? face.rect.w : Math.min(box.h, box.w, 640);
      const size = side / (2 * d.r);
      const homeX = box.x - d.x * size;
      const homeY = box.y + d.y * size; // the head's centre: the window's centre is the box's
      if (out >= 0) {
        // Driven by --face-out: the light leaves toward the seed point (the middle of the
        // window across, 58% down the portrait's box), where the planet forms.
        const e = ease(out);
        const seedY = face.seed ? face.seed.y - window.scrollY : h * 0.5;
        return { cx: homeX + (w / 2 - homeX) * e, cy: homeY + (seedY - homeY) * e, size, ball: Math.min(w, h) * (phone ? 0.2 : 0.17) };
      }
      // It lifts a little before it speaks, so the hero has room to arrive under the line.
      // And it lifts again as it pours: his name is rising toward it, and the light
      // that is still leaving must be clear of the name's top corners.
      const mid = h * (0.4 - 0.13 * ease(span(0.3, 0.42, p)) - 0.1 * ease(span(0.68, 0.8, p)));
      return {
        cx: homeX,
        cy: homeY + (mid - homeY) * ease(span(0, 0.36, p)),
        size,
        // The planet's radius.
        ball: Math.min(w, h) * (phone ? 0.2 : 0.17),
      };
    }

    /* The round window for this frame: the circle the picture is cut to (it rides
       with the picture) and how strong the hairline at its rim is. `open` is how far
       the window has opened at the start; the rim goes as the picture lets go. */
    function windowAt(at, morph, open) {
      const d = cloud.disc;
      return {
        disc: { x: at.cx + d.x * at.size, y: at.cy - d.y * at.size, r: d.r * at.size },
        rim: open * (1 - ease(span(0, 0.3, morph))),
      };
    }

    /* Where the light is to land, in the window, now. The orbit ring when it is
       the layout (its centre moves with the page, so this is read per frame while
       the light is in the air), else the two rows that drift under the name. */
    function where() {
      if (copy) {
        // Where his name and the lines under it are in the window, now: no light may fall there.
        const c = copy.getBoundingClientRect();
        Object.assign(land, { copyL: c.left, copyT: c.top, copyR: c.right, copyB: c.bottom });
      }
      if (ring.on && ring.el) {
        const r = ring.el.getBoundingClientRect();
        Object.assign(land, ring, { on: true, x: r.left + r.width / 2, y: r.top + ring.oy });
        if (copy && box) {
          // How far his name and the lines under it reach each side of the light's centre.
          const c = copy.getBoundingClientRect();
          land.clearL = Math.max(0, box.x - c.left);
          land.clearR = Math.max(0, c.right - box.x);
        }
      } else if (drift) {
        const r = drift.getBoundingClientRect();
        Object.assign(land, { on: false, x: r.left + r.width / 2, y: r.top + r.height / 2, rx: r.width / 2, rz: r.height });
      }
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

    const load = (url) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('hologram: face file missing'))));
    // A phone stops at the base tier. A desktop that cannot get the fill-in still has a face.
    // The photograph is fetched here, by script, and drawn in the canvas: it is never an
    // element of the page, so it cannot become the largest contentful paint (the greeting is).
    // Without it the points are the picture, as they were before it was allowed.
    const photograph = new Promise((resolve) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = PICTURE_URLS[phone ? 0 : 1];
    });
    let image = null;
    Promise.all([load(FACE_URLS[0]), phone ? null : load(FACE_URLS[1]).catch(() => null), photograph])
      .then((files) => {
        if (dead) return;
        image = files.pop();
        cloud = parseFace(files.filter(Boolean), ring.n);
        // Parsing and compiling are two tasks, not one long one.
        return new Promise((resolve) => setTimeout(() => resolve(cloud), 0));
      })
      .then(() => {
        if (dead) return;
        scene = createHologram(
          canvas,
          cloud,
          {
            deep: triple(style, '--holo-deep'),
            pale: triple(style, '--holo-pale'),
            hot: triple(style, '--holo-hot'),
          },
          // The bloom is a desktop pass.
          phone ? 0 : Number(style.getPropertyValue('--holo-bloom')) || 0
        );
        if (image) scene.setPicture(image);
        measure();
        seenAtStart = seen || rm.matches || window.scrollY > 40;
        seen = seenAtStart;
        started = performance.now();
        root.dataset.holo = seenAtStart ? 'seen' : 'in';
        canvas.dataset.ready = '';
        kick();
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error(`hologram off: ${error && error.message}`);
        off();
      });

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
