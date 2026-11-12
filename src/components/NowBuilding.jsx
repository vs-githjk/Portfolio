import Rich from './Rich';
import Stack from './Stack';

/* The Now building panel (Master Agents). The story on one side, and on the
   other the crew: thirteen badges seated on a tilted ring that turns slowly
   around the one sentence you give it. The ring is CSS 3D (one rotating plane,
   each badge counter-turned so it always faces the reader); under reduced
   motion it holds still. The ring is decoration (aria-hidden); the caption
   under it names the whole crew in text. */
export default function NowBuilding({ item }) {
  if (!item) return null;
  const n = item.crew.length;
  return (
    <article className="nb reveal" id="build-master-agents">
      <div className="nb-body">
        <span className="now">
          <i aria-hidden="true" />
          {item.eyebrow}
        </span>
        <div className="kind">
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="flag-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        <Stack text={item.stack} />
      </div>
      <div className="nb-stage">
        <div className="nb-scene" aria-hidden="true">
          <div className="nb-core">{item.core}</div>
          <div className="nb-ring">
            {item.crew.map((c, k) => (
              <div className="nb-seat" style={{ '--a': `${(360 / n) * k}deg`, '--k': (k / n).toFixed(4) }} key={c.icon}>
                <div className="nb-face">
                  <img src={c.icon} alt="" width="56" height="56" loading="lazy" decoding="async" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="nb-cap">{item.crewLabel}: {item.crew.map((c) => c.name.replace(/^The /, '')).join(' · ')}</p>
      </div>
    </article>
  );
}
