import { useEffect, useRef } from 'react';
import { beamFade } from '../lib/beamFade';

/* The vertical light-beam field, on two 2D canvases (no WebGL, no dependency).

   Beams: a dozen soft vertical columns of indigo, blue and violet light that
   cluster toward the centre, as if from one source above the name. Each beam is
   rendered ONCE into its own offscreen canvas (the blur is applied there), then
   composited per frame with 'lighter' and a slowly breathing globalAlpha. So a
   frame is a dozen drawImage calls and no blur: about 24 fps, a few percent of
   one core. When the filter property is missing (Safari before 18) each beam is
   masked with a horizontal gradient instead of blurred.

   Stars: one canvas, drawn once.

   Cost control: backing store is 1x CSS pixels (the light is soft by design),
   the loop stops when the layer has faded out after the first screen, when the
   tab is hidden, and under prefers-reduced-motion (drawn once, no shimmer).
   Positions are seeded, so the layout is the same on every load. Parallax and
   the fade are CSS, driven by --bg-y and --bg-fade set in Background.jsx. */

const FRAME_MS = 40; // about 24 fps
const read = (css, name) =>
  css
    .getPropertyValue(name)
    .split(',')
    .map((v) => parseInt(v, 10));

function seeded(start) {
  let s = start;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export default function BackgroundField({ onReady }) {
  const beamsRef = useRef(null);
  const starsRef = useRef(null);

  useEffect(() => {
    const beams = beamsRef.current;
    const stars = starsRef.current;
    const ctx = beams.getContext('2d');
    const sctx = stars.getContext('2d');
    if (!ctx || !sctx) return undefined;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const css = getComputedStyle(document.documentElement);
    const HUES = ['--beam-a', '--beam-b', '--beam-c'].map((n) => read(css, n));
    const STAR_HUES = ['--star-a', '--star-b'].map((n) => read(css, n));
    const canFilter = 'filter' in ctx;

    let list = [];
    let bw = 0;
    let bh = 0;
    let raf = 0;
    let timer = 0;
    let running = false;
    let visible = true;
    let builtW = -1;
    let builtH = -1;

    function build() {
      bw = window.innerWidth;
      bh = window.innerHeight;
      builtW = bw;
      builtH = bh;
      beams.width = bw;
      beams.height = bh;
      const rnd = seeded(11);
      const count = Math.max(10, Math.round(bw / 84));
      const fadeTo = Math.round(bh * 0.86); // beams die out before the first screen ends
      list = [];
      for (let i = 0; i < count; i++) {
        const u = (i + 0.5) / count;
        const x = (u + (rnd() - 0.5) * (1 / count) * 1.6) * bw;
        const centre = 1 - Math.abs(u - 0.5) * 2; // 1 at the centre, 0 at the edges
        const haze = rnd() < 0.3; // a few wide soft beams carry the atmosphere
        const w = haze ? 140 + rnd() * 160 : 18 + rnd() * 72 * (0.6 + 0.4 * centre);
        const hue = HUES[Math.floor(rnd() * HUES.length)];
        const a = (haze ? 0.16 + rnd() * 0.12 : 0.3 + rnd() * 0.4) * (0.5 + 0.5 * centre);
        const blur = haze ? 26 + rnd() * 18 : 3 + rnd() * 9;
        const pad = Math.ceil(blur * 3);
        const c = document.createElement('canvas');
        c.width = Math.round(w + pad * 2);
        c.height = fadeTo;
        const g = c.getContext('2d');
        const grad = g.createLinearGradient(0, 0, 0, fadeTo);
        const rgb = `${hue[0]},${hue[1]},${hue[2]}`;
        grad.addColorStop(0, `rgba(${rgb},1)`);
        grad.addColorStop(0.28, `rgba(${rgb},0.7)`);
        grad.addColorStop(0.62, `rgba(${rgb},0.22)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = grad;
        if (canFilter) {
          g.filter = `blur(${blur.toFixed(0)}px)`;
          g.fillRect(pad, -pad, w, fadeTo + pad);
        } else {
          g.fillRect(pad, -pad, w, fadeTo + pad);
          const edge = g.createLinearGradient(0, 0, c.width, 0);
          edge.addColorStop(0, 'rgba(0,0,0,0)');
          edge.addColorStop(0.5, 'rgba(0,0,0,1)');
          edge.addColorStop(1, 'rgba(0,0,0,0)');
          g.globalCompositeOperation = 'destination-in';
          g.fillStyle = edge;
          g.fillRect(0, 0, c.width, fadeTo);
        }
        list.push({ x: x - w / 2 - pad, img: c, a, phase: rnd() * Math.PI * 2, speed: 0.2 + rnd() * 0.4 });
      }
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, bw, bh);
      ctx.globalCompositeOperation = 'lighter';
      const s = t / 1000;
      const still = rm.matches;
      for (const b of list) {
        ctx.globalAlpha = b.a * (still ? 1 : 0.78 + 0.22 * Math.sin(s * b.speed + b.phase));
        ctx.drawImage(b.img, b.x, 0);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function drawStars() {
      const d = Math.min(1.5, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      stars.width = Math.round(w * d);
      stars.height = Math.round(h * d);
      sctx.setTransform(d, 0, 0, d, 0, 0);
      const rnd = seeded(7);
      const count = Math.round(w * h * 0.00016);
      for (let i = 0; i < count; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const r = 0.4 + rnd() * 1.2;
        const a = 0.18 + rnd() * 0.6;
        const c = rnd() < 0.3 ? STAR_HUES[1] : STAR_HUES[0];
        sctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(2)})`;
        sctx.beginPath();
        sctx.arc(x, y, r, 0, Math.PI * 2);
        sctx.fill();
      }
    }

    // A frame is requested only when one is due, not every display refresh.
    function loop(now) {
      if (!running) return;
      draw(now);
      const wait = Math.max(0, FRAME_MS - (performance.now() - now));
      timer = window.setTimeout(() => {
        raf = requestAnimationFrame(loop);
      }, wait);
    }
    function start() {
      if (running || !visible || document.hidden || rm.matches) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    }

    const onScroll = () => {
      const v = beamFade(window.scrollY, window.innerHeight) > 0.01;
      if (v === visible) return;
      visible = v;
      if (v) start();
      else stop();
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onMotion = () => {
      stop();
      draw(0);
      start();
    };
    let rsz = 0;
    const onResize = () => {
      clearTimeout(rsz);
      rsz = window.setTimeout(() => {
        // Phone URL bars change the height on every scroll; only a real change rebuilds.
        if (window.innerWidth === builtW && Math.abs(window.innerHeight - builtH) < 150) return;
        build();
        drawStars();
      }, 120);
    };

    build();
    drawStars();
    visible = beamFade(window.scrollY, window.innerHeight) > 0.01;
    onReady?.();
    start();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    rm.addEventListener('change', onMotion);

    return () => {
      stop();
      clearTimeout(rsz);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      rm.removeEventListener('change', onMotion);
    };
  }, [onReady]);

  return (
    <>
      <canvas ref={beamsRef} className="bg-beams" />
      <canvas ref={starsRef} className="bg-stars" />
    </>
  );
}
