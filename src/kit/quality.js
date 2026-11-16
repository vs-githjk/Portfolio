/* A guess at what the device can afford, made once from media queries (no layout
   read): the tier, the pixel ratio cap that goes with it, and the two questions
   every moving thing asks first. */
const mq = (q) => typeof window !== 'undefined' && window.matchMedia(q).matches;

export function tier() {
  if (mq('(max-width: 760px)')) return 'phone';
  if (mq('(max-width: 1199px)')) return 'laptop';
  return 'desktop';
}

export const dprCap = () => Math.min(window.devicePixelRatio || 1, tier() === 'phone' ? 1.5 : 1.75);
export const reduced = () => mq('(prefers-reduced-motion: reduce)');
export const fine = () => mq('(hover: hover) and (pointer: fine)');
