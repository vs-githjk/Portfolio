import { highlights } from '../data/content';
import Rich from './Rich';

/* Four complete statements, each naming what changed, by how much, for whom and
   where. Never directly under the hero: a figure means nothing before the story
   it measures. */
export default function Highlights() {
  return (
    <section className="hl" aria-label={highlights.eyebrow}>
      <div className="wrap">
        <span className="eyebrow reveal">{highlights.eyebrow}</span>
        <ul className="hl-slab reveal" data-delay="1">
          {highlights.items.map((t) => (
            <li className="hl-cell" key={t.slice(0, 28)}>
              <i aria-hidden="true" />
              <span>
                <Rich text={t} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
