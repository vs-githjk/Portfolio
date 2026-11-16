import { useEffect, useRef } from 'react';

/* The far wall of the first screen: dusk over a mountain range. It lives in the
   fixed background stack, under the hologram's canvas, so the figure stands in
   front of it; it is moved with the scroll so it leaves with the welcome, and it
   fades as the greeting does.

     the dusk    warm light low on the horizon, ember red at the ground, gold
                 above it, giving way to the page's deep blue. It is strongest
                 toward the sides: the middle belongs to the blue of the figure.
     the range   two ridges in silhouette, the far one in dusk haze, the near one
                 ink with a gold rim where the light catches its peaks

   The horizon stands a little above the projector plate (--plate-y, lib/face.js),
   so the plate and the floor of light are on the ground in front of the range.
   Plain SVG and CSS, no canvas; an echo of the coastline in the world below. */

/* A ridge: a jagged line from a small seeded generator, so the server and the
   browser draw the same mountains. Heights are 0 to 1 of the box. */
function ridge(seed, peaks, low, high, rough) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  // Peaks and the saddles between them, then every slope broken twice, so no
  // side of a mountain is one straight line.
  let pts = [];
  const step = 1600 / (peaks * 2);
  for (let k = 0; k <= peaks * 2; k++) {
    const peak = k % 2 === 1;
    const h = peak ? low + (high - low) * (0.35 + 0.65 * rand()) : low * (0.45 + 0.55 * rand());
    pts.push([k * step + (k > 0 && k < peaks * 2 ? (rand() - 0.5) * step * 0.6 : 0), h]);
  }
  for (let pass = 0; pass < 2; pass++) {
    const next = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, h0] = pts[k];
      const [x1, h1] = pts[k + 1];
      const t = 0.35 + 0.3 * rand();
      next.push(pts[k], [x0 + (x1 - x0) * t, h0 + (h1 - h0) * t + (rand() - 0.5) * rough * Math.abs(h1 - h0)]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts.map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(0)} ${(220 - Math.max(0.02, p[1]) * 220).toFixed(0)}`).join('');
}
const FAR = ridge(11, 10, 0.3, 0.9, 0.5);
const NEAR = ridge(29, 7, 0.16, 0.58, 0.6);

export default function WelcomeBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    let raf = 0;
    const place = () => {
      raf = 0;
      const y = window.scrollY;
      const h = window.innerHeight;
      if (y > h * 1.5) {
        node.style.visibility = 'hidden';
        return;
      }
      node.style.visibility = '';
      node.style.transform = `translate3d(0, ${-y}px, 0)`;
      node.style.opacity = Math.max(0, 1 - y / (h * 0.55)).toFixed(3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="bg-room" ref={ref}>
      <span className="room-dusk" />
      <svg className="room-range" viewBox="0 0 1600 220" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path className="room-far" d={`${FAR}V220H0Z`} />
        <path className="room-near" d={`${NEAR}V220H0Z`} />
        <path className="room-rim" d={NEAR} />
      </svg>
      <span className="room-ground" />
    </div>
  );
}
