import { highlights } from '../data/content';
import Rich from './Rich';

/* Four complete statements, each naming what changed, by how much, for whom and
   where. Never directly under the hero: a figure means nothing before the story
   it measures. They are cut as four strata: full-width beds of the ground the
   page now stands on, the newest on top, each dated on its edge like a bed in a
   rock face, each figure a button that opens its receipt. */
export default function Highlights() {
  return (
    <section className="hl" aria-labelledby="hl-h" data-realm="earth">
      <div className="wrap">
        <h2 className="sr" id="hl-h">
          {highlights.eyebrow}
        </h2>
        <span className="eyebrow reveal" aria-hidden="true">
          {highlights.eyebrow}
        </span>
      </div>
      <ol className="hl-strata">
        {highlights.items.map((it) => (
          <li className="hl-bed" key={it.bed}>
            <div className="wrap">
              <span className="hl-age">{it.bed}</span>
              <p>
                <Rich text={it.text} receipts />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
