import { proofOfWork } from '../data/content';
import { EV } from '../kit/contract';
import Heatmap from './Heatmap';
import PlaceName from './PlaceName';

/* The build writes a fresh snapshot to github.local.json (gitignored); the
   committed github.json is the fallback, so a plain build never dirties git. */
const snaps = import.meta.glob('../data/github*.json', { eager: true, import: 'default' });
const github = snaps['../data/github.local.json'] ?? snaps['../data/github.json'];

/* Verify him in one click. Three parts, three shapes:
   - the record: the commit graph (a build-time snapshot, no runtime calls) as a
     ridge of weekly buttes over the day calendar; the same weeks stand on the
     night horizon behind the section, and the week under the pointer lights there;
   - the roost: an empty band over the card, the width of the graph, where the
     scene lays its creature along the weeks (data-world-anchor="roost");
   - the wins: gold plaques in order of placing, the one place gold is used; the
     plaque under the pointer or the focus is announced to the scene
     (`world:focus`, kind "win", id its place in the list) so its star can flare;
   - the checks: one row per public trail, showing the address it goes to.
   Every GitHub number is computed here from github.json, never typed. */

const TZ = 'America/New_York'; // fixed, so the date reads the same for every viewer
const fmt = (n) => n.toLocaleString('en-US');
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
const bare = (href) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const tell = (id) => window.dispatchEvent(new CustomEvent(EV.focus, { detail: { kind: 'win', id } }));

function when(iso) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t).value;
  return { month: get('month'), day: Number(get('day')), year: get('year') };
}

function build() {
  const { days } = github;
  const t = when(github.fetchedAt);
  const totals = {};
  days.forEach((d) => {
    const key = d.date.slice(0, 7);
    totals[key] = (totals[key] || 0) + d.count;
  });
  const key = Object.keys(totals).sort().pop();
  return {
    t,
    current: { key, count: totals[key] },
    updated: `${t.month} ${t.day}, ${t.year}`,
  };
}

export default function ProofOfWork() {
  const g = proofOfWork.github;
  const { wins } = proofOfWork;
  const { t, current, updated } = build();

  return (
    <section className="sec" id="verify" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">
            {proofOfWork.eyebrow}
            <PlaceName section="verify" />
          </span>
          <h2>
            {proofOfWork.heading} <em>{proofOfWork.headingEm}</em>
          </h2>
          <p>{proofOfWork.intro}</p>
        </div>

        <div className="pow-roost" data-world-anchor="roost" aria-hidden="true" />
        <div className="pow-card reveal">
          <div className="pow-top">
            <span className="eyebrow">{g.eyebrow}</span>
            <a href={g.href} target="_blank" rel="noopener noreferrer">
              {g.handle}
            </a>
          </div>
          <div className="pow-stats">
            <div>
              <b>{fmt(github.total)}</b>
              <span>{g.stats.total}</span>
            </div>
            <div>
              <b>
                {github.longestStreak}
                <em>{g.stats.streakUnit}</em>
              </b>
              <span>{g.stats.streak}</span>
            </div>
            <div>
              <b>{fmt(current.count)}</b>
              <span>{fill(g.stats.month, { month: t.month, day: t.day })}</span>
            </div>
          </div>
          <Heatmap days={github.days} label={fill(g.graphLabel, { n: fmt(github.total) })} copy={g} />
          <p className="pow-phone-note">{g.phoneNote}</p>
          <div className="pow-foot">
            <span>
              {g.ridge} {g.note ? `${g.note} ` : ''}
              {g.updated} {updated}
            </span>
            <span>
              {g.keyLess}{' '}
              <span className="pow-key" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((n) => (
                  <i key={n} className={`heat-sw-${n}`} />
                ))}
              </span>{' '}
              {g.keyMore}
            </span>
          </div>
        </div>

        <div className="pow-wins-head reveal" id="wins">
          <h3 className="eyebrow">{wins.eyebrow}</h3>
          <a href={wins.link.href} target="_blank" rel="noopener noreferrer">
            {wins.link.label}
          </a>
        </div>
        <ol className="plaques reveal" data-world-anchor="wins">
          {wins.items.map((w, i) => {
            const body = (
              <>
                <b className="plaque-place" data-word={/^\d/.test(w.place) ? undefined : ''}>
                  {w.place}
                </b>
                <span className="plaque-project">{w.project}</span>
                <span className="plaque-prize">{w.prize}</span>
                <span className="plaque-event">{w.event}</span>
              </>
            );
            return (
              <li key={`${w.project}${w.prize}`} onPointerEnter={() => tell(i)} onPointerLeave={() => tell(null)} onFocus={() => tell(i)} onBlur={() => tell(null)}>
                {w.href ? (
                  <a className="plaque" href={w.href} target="_blank" rel="noopener noreferrer">
                    {body}
                  </a>
                ) : (
                  <div className="plaque">{body}</div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="pow-prov reveal">{wins.provenance}</p>

        <h3 className="eyebrow pow-check-head reveal">{proofOfWork.checkLabel}</h3>
        <ul className="pow-checks reveal">
          {proofOfWork.tiles
            .filter((x) => x.href)
            .map((x) => (
              <li key={x.kind}>
                <a href={x.href} target="_blank" rel="noopener noreferrer">
                  <span className="pow-k">{x.kind}</span>
                  <span className="pow-v">{x.value}</span>
                  <span className="pow-d">{x.detail}</span>
                  <span className="pow-u">{bare(x.href)}</span>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
