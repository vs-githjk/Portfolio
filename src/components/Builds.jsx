import { builds } from '../data/content';
import BuildCard from './BuildCard';
import Flagship from './Flagship';
import ResearchRow from './ResearchRow';
import CompactRows from './CompactRows';

/* PrismAI flagship, six featured cards, the paper, then the compact grid. The
   order is Vidyut's, and it is the ring's order. */
export default function Builds() {
  return (
    <section className="sec builds" id="builds">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{builds.eyebrow}</span>
          <h2>{builds.heading}</h2>
          <p>{builds.intro}</p>
        </div>
        <Flagship item={builds.flagship} />
        <div className="build-grid">
          {builds.items.map((item, n) => (
            <BuildCard item={item} delay={(n % 2) + 1} key={item.id} />
          ))}
        </div>
        <ResearchRow item={builds.research} />
        <CompactRows more={builds.more} />
      </div>
    </section>
  );
}
