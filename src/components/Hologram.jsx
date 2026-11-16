import { useEffect, useRef } from 'react';
import { welcome } from '../data/content';
import { heroOrigin } from '../lib/origin';
import { face, measureFace } from '../lib/face';
import { createHologram } from '../lib/holoScene';

/* The welcome hologram (plain WebGL, its own small chunk; the picture itself is
   lib/holoScene.js). This file is the lifecycle, the choreography and the budget.

   - It projects one figure: welcome.figure in content.js, any picture with a
     transparent background. A plate under it, a cone of light, and the figure
     standing in it in the page's blue, with light along its edge, scan lines and
     a slow shimmer. Nothing rectangular is drawn round it, and the light never
     distorts the picture. ?figure=/path tries another picture from this site.
   - It arrives after the first paint (Background mounts it when the page is
     idle) and then fetches the picture by script, so the greeting text is the
     first thing painted and the picture is never an element of the page.
   - The canvas is fixed. Scroll is the timeline: the projection drifts up at
     a fifth of the page's speed while two curtains of light close over it and
     leave one vertical beam, and the beam lifts off the plate and is gone as the
     hero arrives. There is no second act between him and his name.
   - It tells the page where it is with <html data-holo>: "in" while the figure
     is being scanned in (the greeting types in step, see sections.css), "seen"
     once it has (or at once for a visitor who has already watched it in this
     session), "off" when there is no WebGL or no picture (the welcome closes up).
   - It draws only while some of it is on screen and the tab is visible: every
     frame while the scroll is moving or it is starting, about 30 a second while
     it only shimmers. DPR is capped at 2 (a 2x screen gets its own pixels), only the column the
     light can reach is shaded, and a large picture is drawn down to TEX_MAX first.
   - Under prefers-reduced-motion it is one still frame that scrolls away with
     the page: no start, no shimmer, no beam. */

/* The longest side of the picture as it is uploaded, in pixels: desktop, phone. */
const TEX_MAX = [1536, 1024];
/* The canvas is drawn at the screen's own pixels up to this ratio: a figure drawn at
   1.5 and stretched to a 2x or 3x screen was soft all over. Only the column the
   light reaches is shaded, so the cost is the figure, not the window. */
const DPR_MAX = 2;
const SEEN_KEY = 'holo-seen';
const INTRO_MS = 1700;
/* When the greeting has been typed, in ms after the projector starts: mirrors
   --say-delay-2 plus --say-dur-2 in tokens.css. */
const SAID_MS = 2700;
const IDLE_MS = 1000 / 30;
/* Where on the way to the hero each thing happens (share of the scroll). */
const LEAVE = [0.04, 0.84]; // the projector lets go: curtains, beam, lift
const RIDE = 0.2; // how much of the page's travel the projection follows

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
    const host = anchor.parentElement;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 760px)').matches;
    const style = getComputedStyle(root);
    const num = (name, fallback) => Number(style.getPropertyValue(name)) || fallback;
    const gain = num('--holo-gain', 1);

    let scene = null;
    let raf = 0;
    let dead = false;
    let started = 0; // when the projector started (performance.now)
    let seen = false;
    let eased = -1; // scroll progress, eased
    let last = 0;
    let faded = ''; // how far the greeting has faded (written to the welcome as --out)
    let cleared = false; // the canvas has been wiped after the hand-off
    let heroTop = 1e6; // where the hero's own words begin, document pixels: no light falls below it
    const words = document.querySelector('#top .hero-in');

    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {
      seen = false;
    }

    const off = () => {
      dead = true;
      cancelAnimationFrame(raf);
      root.dataset.holo = 'off';
      // The welcome closes up now: there is no projection to publish.
      requestAnimationFrame(() => measureFace(anchor));
    };

    function measure() {
      measureFace(anchor);
      if (words) heroTop = words.getBoundingClientRect().top + window.scrollY + parseFloat(getComputedStyle(words).paddingTop || '0');
      scene.resize(window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio || 1, DPR_MAX));
    }

    /* The projection in the window: its place in the page, less the share of the
       scroll it rides. */
    function pose(y, ride) {
      const r = face.rect;
      const e = face.emit;
      const dy = -y * ride;
      return {
        pane: { x: r.x + r.w / 2, y: r.y + r.h / 2 + dy, w: r.w / 2, h: r.h / 2 },
        emit: { x: e.x, y: e.y + dy, w: e.w },
      };
    }

    function frame(now) {
      raf = 0;
      if (dead || document.hidden || !face.rect) return;
      const y = window.scrollY;
      const still = rm.matches;
      const reach = Math.max(1, heroOrigin());
      const p = still ? 0 : y / reach;
      const moving = eased < 0 ? false : Math.abs(p - eased) > 0.0015;
      eased = eased < 0 || Math.abs(p - eased) > 1.5 ? p : eased + (p - eased) * 0.2;

      const since = now - started;
      const intro = still || seen ? 1 : span(0, INTRO_MS, since);
      if (intro >= 1 && !seen) {
        seen = true;
        try {
          window.sessionStorage.setItem(SEEN_KEY, '1');
        } catch {
          /* private mode: the welcome simply plays again next time */
        }
      }
      if (root.dataset.holo === 'in' && since > SAID_MS + 400) root.dataset.holo = 'seen';

      if (still) {
        // One frame; the canvas then rides the page like any other picture.
        canvas.style.transform = `translate3d(0, ${-y}px, 0)`;
        if (last === 0) {
          last = now;
          scene.render({ ...pose(0, 1), time: 2.2, on: 1, out: 0, gain });
        }
        return;
      }
      canvas.style.transform = '';

      const gone = eased > 1.04 && p > 1.04;
      if (gone && !cleared) {
        // Past the hero (a jump from a nav link lands here in one step): leave no light behind.
        cleared = true;
        scene.render({ ...pose(0, 1), time: 0, on: 1, out: 1, gain: 0 });
        host.style.setProperty('--out', '1');
        faded = '';
      }
      if (!gone) cleared = false;
      const busy = moving || intro < 1;
      if (!gone && (busy || now - last >= IDLE_MS - 2)) {
        const out = span(0.01, 0.13, eased).toFixed(2);
        if (out !== faded) {
          faded = out;
          host.style.setProperty('--out', out);
        }
        scene.render({ ...pose(y, RIDE), time: now / 1000, on: intro, out: span(LEAVE[0], LEAVE[1], eased), gain, keep: heroTop - y });
        last = now;
      }
      if (!gone) raf = requestAnimationFrame(frame);
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

    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
    // The picture is fetched here, by script, and drawn in the canvas: it is never an
    // element of the page, so it cannot become the largest contentful paint (the greeting is).
    const photograph = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('hologram: figure missing'));
      // A path on this site only: ?figure= is for trying a figure, never for loading one from elsewhere.
      const asked = new URLSearchParams(window.location.search).get('figure');
      const tryOut = asked && /^\/[\w./-]+\.(png|webp|avif)$/i.test(asked) && !asked.includes('..') ? asked : null;
      image.src = tryOut ?? (phone && welcome.figure.phone ? welcome.figure.phone : welcome.figure.src);
    });
    photograph
      .then(async (image) => {
        if (dead) return;
        // Compiling, uploading the photograph and the first layout read are three
        // tasks, not one long one.
        scene = createHologram(
          canvas,
          { deep: triple(style, '--holo-deep'), pale: triple(style, '--holo-pale'), hot: triple(style, '--holo-hot') },
          { warm: num('--holo-warm', 0.3), pitch: num('--holo-pitch', 3), foot: Number(style.getPropertyValue('--holo-foot')) || 0, face: welcome.figure.face }
        );
        await tick();
        if (dead) return;
        // A picture larger than the screen can use is drawn down first.
        const cap = TEX_MAX[phone ? 1 : 0];
        const k = Math.min(1, cap / Math.max(image.naturalWidth, image.naturalHeight));
        let source = image;
        if (k < 1) {
          source = document.createElement('canvas');
          source.width = Math.round(image.naturalWidth * k);
          source.height = Math.round(image.naturalHeight * k);
          source.getContext('2d').drawImage(image, 0, 0, source.width, source.height);
        }
        scene.setPicture(source);
        face.aspect = image.naturalWidth / image.naturalHeight;
        await tick();
        if (dead) return;
        measure();
        seen = seen || rm.matches || window.scrollY > 40;
        started = performance.now();
        root.dataset.holo = seen ? 'seen' : 'in';
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

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('webglcontextlost', onLost);
      rm.removeEventListener('change', relayout);
      if (scene) scene.dispose();
      host.style.removeProperty('--out');
      delete root.dataset.holo;
    };
  }, []);

  return <canvas ref={ref} className="bg-holo" />;
}
