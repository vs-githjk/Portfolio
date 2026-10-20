import { builds } from '../data/content';
import BuildCard from './BuildCard';
import Flagship from './Flagship';
import ResearchRow from './ResearchRow';
import CompactRows from './CompactRows';

/* PrismAI flagship, six featured cards, the paper, then the compact tier.
   The order is Vidyut's. */
export default function Builds() {
  const compactStart = 1 + builds.items.length + 1 + 1; // flagship + cards + paper, then the next number
  return (
    <section className="sec" id="builds">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{builds.eyebrow}</span>
            <h2>{builds.heading}</h2>
          </div>
          <p>{builds.intro}</p>
        </div>
        <Flagship item={builds.flagship} />
        <div className="builds-grid">
          {builds.items.map((item) => (
            <BuildCard item={item} key={item.id} />
          ))}
        </div>
        <ResearchRow item={builds.research} />
        <CompactRows compact={builds.compact} start={compactStart} />
      </div>
    </section>
  );
}
