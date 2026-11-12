import { useEffect, useRef } from 'react';
import { worldFade } from '../lib/beamFade';
import { heroOrigin } from '../lib/origin';
import { createWorld } from '../lib/worldScene';

/* The Deep: the 3D world behind every section below the hero (three.js, its own
   lazy chunk; the scene itself is lib/worldScene.js).

   This file is the lifecycle and the budget:
   - It draws only while the layer is visible (not on the first screen, not in a
     hidden tab). Idle, it runs at about 30 frames a second, which is plenty for
     slow drift; while the camera is catching up with a scroll it draws every
     frame, so the parallax stays smooth.
   - The camera eases toward the scroll position, so the dive feels like water.
   - Under prefers-reduced-motion it draws one still frame and never moves.
   - If WebGL is missing or the context is lost it marks <html data-world="off">
     and the page falls back to its plain ground (the vistas collapse in CSS). */

const IDLE_MS = 1000 / 30;

export default function World() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const root = document.documentElement;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let world;
    try {
      world = createWorld(canvas, { still: () => rm.matches });
    } catch {
      root.dataset.world = 'off';
      return undefined;
    }

    let raf = 0;
    let cam = window.scrollY;
    let last = 0;
    let drawn = false;
    const want = { x: 0, y: 0 };
    const eye = { x: 0, y: 0 };

    function frame(now) {
      raf = 0;
      if (document.hidden) return;
      const y = window.scrollY;
      const visible = worldFade(y - heroOrigin(), window.innerHeight) > 0.004;
      if (rm.matches) {
        if (!drawn) world.render(40, 0);
        drawn = true;
        root.dataset.world = 'on';
        return;
      }
      if (!visible) {
        cam = y; // nothing to see: keep the camera where the page is and sleep
        return;
      }
      const gap = y - cam;
      const moving = Math.abs(gap) > 0.4;
      cam = !moving || Math.abs(gap) > 5000 ? y : cam + gap * 0.2;
      eye.x += (want.x - eye.x) * 0.06;
      eye.y += (want.y - eye.y) * 0.06;
      if (moving || now - last >= IDLE_MS - 2) {
        world.render(now / 1000, cam, eye.x, eye.y);
        last = now;
        if (!drawn) {
          drawn = true;
          root.dataset.world = 'on';
        }
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    // The set pieces live at places in the page, so any change in its height
    // (a Read more opening, fonts arriving, a resize) lays them out again.
    let rsz = 0;
    const relayout = () => {
      clearTimeout(rsz);
      rsz = window.setTimeout(() => {
        world.layout();
        drawn = false;
        kick();
      }, 140);
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(document.body);
    const onPointer = (e) => {
      want.x = (e.clientX / window.innerWidth) * 2 - 1;
      want.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onLost = (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      root.dataset.world = 'off';
    };

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    document.addEventListener('visibilitychange', kick);
    canvas.addEventListener('webglcontextlost', onLost);
    rm.addEventListener('change', relayout);
    if (fine) window.addEventListener('pointermove', onPointer, { passive: true });
    kick();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rsz);
      ro.disconnect();
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('webglcontextlost', onLost);
      rm.removeEventListener('change', relayout);
      window.removeEventListener('pointermove', onPointer);
      world.dispose();
      delete root.dataset.world;
    };
  }, []);

  return <canvas ref={ref} className="bg-world" />;
}
