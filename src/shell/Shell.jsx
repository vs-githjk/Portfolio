import { useEffect } from 'react';
import { startSignals } from '../kit/signals';
import { heroOrigin } from '../lib/origin';
import { waterlines } from '../data/world';

/* The shell: everything that sits over the page and the world and belongs to
   neither. It starts the kit's signals (the waterlines, the depth, the pointer,
   the realm under the bar) and renders nothing of its own. */
export default function Shell() {
  useEffect(() => startSignals({ lines: waterlines, origin: heroOrigin }), []);
  return null;
}
