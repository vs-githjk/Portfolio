import { useRef } from 'react';
import { hero } from '../data/content';
import Orbit from './Orbit';
import Drift from './Drift';

/* Where the ring stands. A stage holds a centre block (the children: a heading,
   whatever the ring is the index of) and the ring itself; below the ring's
   breakpoint the drifting rows stand in for it.

   `home` names the section it is in (the stylesheet lays each home out); `mode`
   is how the ring stands there (Orbit.jsx): "under" the block as a front arc, or
   "around" it as a whole ring. Which home is live is one line: RING_HOME in
   data/world.js. */
export default function RingStage({ home, mode = 'under', slides = hero.carousel.slides, words = hero.carousel, hrefFor, anchor, children }) {
  const stage = useRef(null);
  const centre = useRef(null);
  return (
    <div className="ring-stage" data-home={home} data-ring={mode} data-world-anchor={anchor} ref={stage}>
      {mode === 'around' && <div className="shield" aria-hidden="true" />}
      <div className="ring-centre" ref={centre}>
        {children}
      </div>
      <Orbit stageRef={stage} centreRef={centre} slides={slides} words={words} mode={mode} hrefFor={hrefFor} />
      <Drift slides={slides} />
    </div>
  );
}
