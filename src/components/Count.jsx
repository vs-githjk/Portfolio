import { useEffect, useRef } from 'react';

/* A figure that counts up once, the first time it is seen, then never again.
   The prerendered text is the final value, so the number is right with no script,
   under reduced motion and on phones (where it does not count). Only the leading number moves ("43" in "43 of 48",
   "100" in "100%"); the rest of the value stays put. */
export default function Count({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const m = String(value).match(/^(\d[\d,]*)(.*)$/);
    if (!el || !m || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Phones and touch screens: the figure is simply there. While it counted, its width
    // changed, the label beside it wrapped differently and the page under the reader moved
    // (48px at 360px wide).
    if (window.matchMedia('(max-width: 760px), (pointer: coarse)').matches) return undefined;
    const end = Number(m[1].replace(/,/g, ''));
    if (end < 2) return undefined;
    let frame = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / 600);
          const eased = 1 - (1 - k) ** 3;
          el.textContent = `${Math.round(end * eased).toLocaleString('en-US')}${m[2]}`;
          if (k < 1) frame = requestAnimationFrame(tick);
          else el.textContent = value;
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = value;
    };
  }, [value]);
  return <b ref={ref}>{value}</b>;
}
