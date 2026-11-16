import { useRef } from 'react';
import { builds, worlds } from '../data/content';
import { useEqualRows } from '../hooks/useEqualRows';
import BuildCard from './BuildCard';
import CompactRows from './CompactRows';
import Flagship from './Flagship';
import NowBuilding from './NowBuilding';
import ResearchRow from './ResearchRow';
import Vista from './Vista';
import RingStage from './RingStage';
import { allBuilds, fill, total } from './counts';

/* Builds, paced: an opener with the depth chart, the flagships as chapters, the
   featured builds as a fleet of plates, the paper as an instrument and the rest
   as a manifest; all under water. Then the shore (a vista where the camera comes
   up into dusk) and, on land, the Now building panel: the crew's command post.
   The order is Vidyut's, and it is the ring's order. */

const GROUPS = ['flagships', 'items', 'research', 'more'];

/* The pairs of the fleet: two plates share a row, and their dossiers open under
   the whole row. */
const pairs = (list) => list.reduce((rows, b, i) => (i % 2 ? rows[rows.length - 1].push(b) : rows.push([b]), rows), []);

/* Cards are equal only when they sit side by side. */
const sideBySide = (grid) => {
  const [a, b] = grid.querySelectorAll('.plate');
  return Boolean(a && b && a.offsetTop === b.offsetTop);
};

export default function Builds() {
  const fleet = useRef(null);
  useEqualRows(fleet, 8, { auto: 2, when: sideBySide });
  /* A shaft of light finds the panel under the pointer (sections.css reads --lx
     and --ly). One listener for the whole section; mouse only. */
  const light = (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = e.target.closest('.ch-story, .paper, .plate');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--lx', `${Math.round(e.clientX - r.left)}px`);
    card.style.setProperty('--ly', `${Math.round(e.clientY - r.top)}px`);
  };
  const flagships = builds.flagships.length;
  const opener = (
    <header className="deep-open">
      <div className="deep-head reveal">
        <span className="eyebrow">
          {builds.eyebrow}
        </span>
        <h2>{builds.heading}</h2>
        <p>{fill(builds.intro, { total, flagships })}</p>
      </div>
      <div className="deep-window" data-world-anchor="giant" aria-hidden="true" />
      <nav className="depths reveal" aria-label={builds.chart.label}>
        <ol className="depths-groups">
          {GROUPS.map((g) => {
            const list = allBuilds.filter((b) => b.group === g);
            return (
              <li className="depths-group" data-group={g} key={g}>
                <span className="depths-name">
                  {builds.chart.groups[g]} <span className="num">{list.length}</span>
                </span>
                <ol className="depths-dots">
                  {list.map((b) => (
                    <li key={b.id}>
                      <a className="depths-dot" href={`#build-${b.id}`} aria-label={b.title} data-win={b.awards.length > 0 ? '' : undefined}>
                        <i aria-hidden="true" />
                        <span className="depths-tip" aria-hidden="true">
                          {b.title}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ol>
        <p className="depths-legend">
          <i aria-hidden="true" />
          {builds.chart.legend}
        </p>
      </nav>
    </header>
  );
  /* The ring of the strongest builds is the index here: the opener is its centre
     block and the front arc hangs under it. */
  return (
    <>
      <section className="sec builds" id="builds" data-realm="sea" onPointerMove={light}>
        <RingStage>
          <div className="wrap deep">{opener}</div>
        </RingStage>
        <div className="wrap deep">
          {builds.flagships.map((item, n) => (
            <Flagship item={item} index={n} key={item.id} />
          ))}
          <div className="fleet" ref={fleet} role="group" aria-label={builds.labels.fleet}>
            {pairs(builds.items).map((row) => (
              <div className="fleet-pair" key={row[0].id}>
                {row.map((item) => (
                  <BuildCard item={item} anchor={item.id === 'fishmarket' ? 'fleet-fishmarket' : undefined} key={item.id} />
                ))}
              </div>
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
