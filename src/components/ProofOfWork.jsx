import { proofOfWork } from '../data/content';
import Heatmap from './Heatmap';
import { StarIcon } from './Icons';

/* The build writes a fresh snapshot to github.local.json (gitignored); the
   committed github.json is the fallback, so a plain build never dirties git. */
const snaps = import.meta.glob('../data/github*.json', { eager: true, import: 'default' });
const github = snaps['../data/github.local.json'] ?? snaps['../data/github.json'];

/* Verify him in one click: the commit graph (a build-time snapshot, no runtime
   calls), the six wins, and four links to where each claim can be checked.
   Every GitHub number is computed here from github.json, never typed. */

const TZ = 'America/New_York'; // fixed, so the date reads the same for every viewer
const fmt = (n) => n.toLocaleString('en-US');
const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

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
  const { t, current, updated } = build();

  return (
    <section className="sec" id="verify">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">{proofOfWork.eyebrow}</span>
          <h2>
            {proofOfWork.heading} <em>{proofOfWork.headingEm}</em>
          </h2>
          <p>{proofOfWork.intro}</p>
        </div>

        <div className="pow-grid">
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
                <b>{github.activeDays}</b>
                <span>{g.stats.active}</span>
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
                <span>{fill(g.stats.month, { month: t.month })}</span>
              </div>
            </div>
            <Heatmap days={github.days} label={fill(g.graphLabel, { n: fmt(github.total) })} />
            <div className="pow-foot">
              <span>
                {g.note ? `${g.note} ` : ''}{g.updated} {updated}
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

          <div className="pow-card reveal">
            <div className="pow-top">
              <span className="eyebrow">
                {proofOfWork.wins.eyebrow} · {proofOfWork.wins.items.length}
              </span>
              <a href={proofOfWork.wins.link.href} target="_blank" rel="noopener noreferrer">
                {proofOfWork.wins.link.label}
              </a>
            </div>
            <ul className="pow-wins">
              {proofOfWork.wins.items.map((w) => (
                <li key={w.title}>
                  <StarIcon />
                  {w.href ? (
                    <a href={w.href} target="_blank" rel="noopener noreferrer">
                      <b>{w.title}</b>
                      <span>{w.event}</span>
                    </a>
                  ) : (
                    <div>
                      <b>{w.title}</b>
                      <span>{w.event}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pow-tiles reveal">
          {proofOfWork.tiles
            .filter((x) => x.href)
            .map((x) => (
              <a key={x.kind} href={x.href} target="_blank" rel="noopener noreferrer">
                <span className="pow-k">{x.kind}</span>
                <span className="pow-v">{x.value}</span>
                <span className="pow-d">{x.detail}</span>
              </a>
            ))}
        </div>
      </div>
    </section>
  );
}
