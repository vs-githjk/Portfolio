import { useEffect, useRef } from 'react';
import { deepFade } from '../lib/beamFade';
import { clamp01, seeded, smooth, triple } from '../lib/field';

/* The hall of light: the hero's beams, continued in depth behind every section
   below the first screen. One 2D canvas (no WebGL, no dependency).

   The scene is a real 3D space with one camera: shafts of indigo, blue and
   violet light stand on a floor to the left and right of a dark centre aisle
   (so the text column stays on clean ground), with dust between them. Scrolling
   walks the camera forward: near shafts slide out past the edges, far ones
   come up out of the fog, and the dust streams by at every depth. The field
   repeats along its depth, so the walk never runs out.

   Cost control: nothing moves unless the page scrolls. A frame is asked for
   only while the camera is catching up with the scroll position, and not at
   all while the layer is invisible (the first screen, the contact section) or
   the tab is hidden. A frame is one drawImage per shaft plus the dust; the
   shafts are three pre-rendered sprites and the backing store is 1x CSS pixels
   (the light is soft by design). Phones get about half the shafts and dust.
   Under prefers-reduced-motion the camera stands still: one pose, drawn once.
   Opacity is CSS, driven by --bg-deep set in Background.jsx. */

const FOCAL = 620; // px: a shaft this far away is drawn at its own size
const DEPTH = 4400; // length of the hall before it repeats
const NEAR = 240; // a shaft closer than this has left the frame
const TRAVEL = 0.5; // camera units walked per pixel scrolled
const STILL = 1300; // the camera position used under reduced motion

export default function DepthField() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const css = getComputedStyle(document.documentElement);
    const HUES = ['--beam-a', '--beam-b', '--beam-c'].map((n) => triple(css, n));
    const STAR = triple(css, '--star-b');

    let w = 0;
    let h = 0;
    let shafts = [];
    let dust = [];
    let sprites = [];
    let pools = [];
    let cam = -1;
    let raf = 0;

    // A shaft: soft across (no blur filter needed), a little dimmer toward its foot.
    function shaft(hue) {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 256;
      const g = c.getContext('2d');
      const rgb = hue.join(',');
      const across = g.createLinearGradient(0, 0, c.width, 0);
      [0, 0.03, 0.14, 0.42, 1, 0.42, 0.14, 0.03, 0].forEach((a, i, all) => {
        across.addColorStop(i / (all.length - 1), `rgba(${rgb},${a})`);
      });
      g.fillStyle = across;
      g.fillRect(0, 0, c.width, c.height);
      const down = g.createLinearGradient(0, 0, 0, c.height);
      down.addColorStop(0, 'rgba(0,0,0,0.9)');
      down.addColorStop(0.9, 'rgba(0,0,0,0.5)');
      down.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in';
      g.fillStyle = down;
      g.fillRect(0, 0, c.width, c.height);
      return c;
    }

    // The pool of light where a shaft meets the floor.
    function pool(hue) {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 128;
      const g = c.getContext('2d');
      const rgb = hue.join(',');
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, `rgba(${rgb},0.9)`);
      r.addColorStop(0.35, `rgba(${rgb},0.34)`);
      r.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
      return c;
    }

    function build() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      const phone = w < 760;
      const rnd = seeded(23);
      const n = phone ? 9 : 16;
      shafts = [];
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        shafts.push({
          z: ((i + rnd() * 0.7) / n) * DEPTH,
          // Outside the centre aisle: the nearest shafts pass by the page edges.
          x: side * w * (0.4 + rnd() * 0.8),
          w: 80 + rnd() * 150,
          hue: Math.floor(rnd() * HUES.length),
          a: 0.55 + rnd() * 0.45,
        });
      }
      const m = phone ? 40 : 96;
      dust = [];
      for (let i = 0; i < m; i++) {
        dust.push({
          x: (rnd() - 0.5) * w * 2.8,
          y: (rnd() - 0.42) * h * 1.7,
          z: rnd() * DEPTH,
          r: 0.9 + rnd() * 1.5,
          a: 0.25 + rnd() * 0.5,
        });
      }
      cam = -1;
      kick();
    }

    const fog = (d) => Math.pow(1 - d / DEPTH, 1.6) * smooth(clamp01((d - NEAR) / (NEAR * 1.4)));

    function draw() {
      const hy = h * 0.44; // the horizon
      const eye = h * 0.62; // camera height above the floor
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const s of shafts) {
        const d = (((s.z - cam) % DEPTH) + DEPTH) % DEPTH;
        if (d < NEAR) continue;
        const k = FOCAL / d;
        const sx = w / 2 + s.x * k;
        const sw = s.w * k * 2.4;
        if (sx + sw < 0 || sx - sw > w) continue;
        const foot = hy + eye * k;
        ctx.globalAlpha = s.a * fog(d);
        ctx.drawImage(sprites[s.hue], sx - sw / 2, -8, sw, foot + 8);
        const pw = sw * 1.5;
        const ph = pw * Math.min(0.5, 0.22 * k + 0.04);
        ctx.drawImage(pools[s.hue], sx - pw / 2, foot - ph / 2, pw, ph);
      }
      ctx.fillStyle = `rgb(${STAR.join(',')})`;
      for (const p of dust) {
        const d = (((p.z - cam) % DEPTH) + DEPTH) % DEPTH;
        if (d < NEAR * 0.5) continue;
        const k = FOCAL / d;
        const sx = w / 2 + p.x * k;
        const sy = hy + p.y * k;
        if (sx < -4 || sx > w + 4 || sy < -4 || sy > h + 4) continue;
        ctx.globalAlpha = p.a * Math.pow(1 - d / DEPTH, 1.2) * clamp01((d - NEAR * 0.5) / NEAR);
        ctx.beginPath();
        ctx.arc(sx, sy, Math.min(2.6, Math.max(0.5, p.r * k)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame() {
      raf = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const want = rm.matches ? STILL : y * TRAVEL;
      // Invisible: remember where the camera should be and draw nothing.
      if (deepFade(y, vh, max) < 0.004) {
        cam = want;
        return;
      }
      const gap = want - cam;
      cam = cam < 0 || Math.abs(gap) < 0.4 || Math.abs(gap) > 4000 ? want : cam + gap * 0.16;
      draw();
      if (cam !== want) raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
    }

    let rsz = 0;
    let builtW = -1;
    let builtH = -1;
    const onResize = () => {
      clearTimeout(rsz);
      rsz = window.setTimeout(() => {
        // Phone URL bars change the height on every scroll; only a real change rebuilds.
        if (window.innerWidth === builtW && Math.abs(window.innerHeight - builtH) < 150) return;
        builtW = window.innerWidth;
        builtH = window.innerHeight;
        build();
      }, 120);
    };

    sprites = HUES.map(shaft);
    pools = HUES.map(pool);
    builtW = window.innerWidth;
    builtH = window.innerHeight;
    build();
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', kick);
    rm.addEventListener('change', kick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rsz);
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', kick);
      rm.removeEventListener('change', kick);
    };
  }, []);

  return <canvas ref={ref} className="bg-depth" />;
}
