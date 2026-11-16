import { useRef } from 'react';
import { builds, worlds } from '../data/content';
import { useEqualRows } from '../hooks/useEqualRows';
import BuildCard from './BuildCard';
import Flagship from './Flagship';
import ResearchRow from './ResearchRow';
import CompactRows from './CompactRows';
import NowBuilding from './NowBuilding';
import Vista from './Vista';

/* Two flagships (Prism, then DuelWise), the featured cards, the paper and the
   compact grid, all under water; then the shore (a vista where the camera comes
   up into dusk) and, on land, the Now building panel: the crew's command post. The order is Vidyut's, and it is
   the ring's order. */
export default function Builds() {
  const grid = useRef(null);
  useEqualRows(grid, 7);
  /* A shaft of light finds the card under the pointer (sections.css reads --lx
     and --ly). One listener for the whole section; mouse only. */
  const light = (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = e.target.closest('.flag, .paper, .build, .mini');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--lx', `${Math.round(e.clientX - r.left)}px`);
    card.style.setProperty('--ly', `${Math.round(e.clientY - r.top)}px`);
  };
  return (
    <>
    <section className="sec builds" id="builds" data-realm="sea" onPointerMove={light}>
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{builds.eyebrow}</span>
          <h2>{builds.heading}</h2>
          <p>{builds.intro}</p>
        </div>
        {builds.flagships.map((item) => (
          <Flagship item={item} key={item.id} />
        ))}
        <div className="build-grid" ref={grid}>
          {builds.items.map((item, n) => (
            <BuildCard item={item} delay={(n % 2) + 1} key={item.id} />
          ))}
        </div>
        <ResearchRow item={builds.research} />
        <CompactRows more={builds.more} />
      </div>
    </section>
    <Vista set="shore" line={worlds.shore} />
    <section className="sec crew" data-realm="earth">
      <div className="wrap">
        <NowBuilding item={builds.building} />
      </div>
    </section>
    </>
  );
}
