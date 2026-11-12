import { useEffect } from 'react';

/**
 * A raised surface leans a few degrees toward the pointer. One delegated
 * listener sets --tilt-x and --tilt-y (each -1 to 1) and --tilt-mx / --tilt-my
 * (the pointer, in percent) on the hovered element that matches `selector`, and
 * marks it data-tilt="on" (then "off" when the pointer leaves); CSS does the rest.
 * Mouse only, and never under prefers-reduced-motion.
 */
export function useTilt(selector) {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cur = null;
    let raf = 0;
    let last = null;

    const apply = () => {
      raf = 0;
      const el = last.target.closest?.(selector) ?? null;
      if (el !== cur) {
        if (cur) cur.dataset.tilt = 'off';
        cur = el;
      }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const fx = (last.clientX - r.left) / r.width;
      const fy = (last.clientY - r.top) / r.height;
      el.dataset.tilt = 'on';
      el.style.setProperty('--tilt-x', ((0.5 - fy) * 2).toFixed(3));
      el.style.setProperty('--tilt-y', ((fx - 0.5) * 2).toFixed(3));
      el.style.setProperty('--tilt-mx', `${(fx * 100).toFixed(1)}%`);
      el.style.setProperty('--tilt-my', `${(fy * 100).toFixed(1)}%`);
    };
    const onMove = (e) => {
      if (e.pointerType !== 'mouse' || !fine.matches || rm.matches) return;
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      if (cur) cur.dataset.tilt = 'off';
    };
  }, [selector]);
}
