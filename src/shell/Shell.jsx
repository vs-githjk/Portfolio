import { useEffect } from 'react';
import { startSignals } from '../kit/signals';
import { startTravel } from '../kit/travel';
import { heroOrigin } from '../lib/origin';
import { realmAt, waterlines } from '../data/world';

/* The shell: everything that sits over the page and the world and belongs to
   neither. It starts the kit's signals (the waterlines, the depth, the pointer,
   the realm under the bar) and travel (a far jump is a hop; the place reached is
   marked for a second). */
/* What gets the mark when a place is reached: a build's own title gets a ring of
   light, any other place a hairline under its heading. */
const mark = (el) => (el.id.startsWith('build-') ? { el: el.querySelector('h3') ?? el, kind: 'ring' } : { el: el.querySelector('h1, h2, h3') ?? el, kind: 'line' });

export default function Shell() {
  useEffect(() => {
    // The bar's height, read once and again on a resize (never per frame).
    const nav = document.querySelector('.nav');
    let barH = nav ? nav.offsetHeight : 64;
    const onResize = () => {
      barH = nav ? nav.offsetHeight : 64;
    };
    window.addEventListener('resize', onResize, { passive: true });
    const stop = startSignals({ lines: waterlines, origin: heroOrigin, bar: () => barH, realm: realmAt });
    const travel = startTravel({ mark });
    return () => {
      window.removeEventListener('resize', onResize);
      stop();
      travel.stop();
    };
  }, []);
  return null;
}
