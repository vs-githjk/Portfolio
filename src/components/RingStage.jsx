import { useRef } from 'react';
import { hero } from '../data/content';
import Orbit from './Orbit';
import Drift from './Drift';

/* Where the ring stands: at the top of Builds, as its index. The stage holds a
   centre block (the children: the Builds opener) and, hanging under it, the
   front arc of the ring; below the ring's breakpoint the drifting rows stand in
   for it. The stage is as wide as the window, so the ring has its full radius. */
export default function RingStage({ slides = hero.carousel.slides, words = hero.carousel, children }) {
  const stage = useRef(null);
  const centre = useRef(null);
  return (
    <div className="ring-stage" ref={stage}>
      <div className="ring-centre" ref={centre}>
        {children}
      </div>
      <Orbit stageRef={stage} centreRef={centre} slides={slides} words={words} />
      <Drift slides={slides} />
    </div>
  );
}
