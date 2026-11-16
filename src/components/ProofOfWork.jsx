import { proofOfWork } from '../data/content';
import { EV } from '../kit/contract';
import Heatmap from './Heatmap';
import { put } from './counts';

/* The build writes a fresh snapshot to github.local.json (gitignored); the
   committed github.json is the fallback, so a plain build never dirties git. */
const snaps = import.meta.glob('../data/github*.json', { eager: true, import: 'default' });
const github = snaps['../data/github.local.json'] ?? snaps['../data/github.json'];

/* Verify him in one click. Three parts, three shapes:
   - the wins: gold plaques in order of placing, first, because they are the
     strongest proof (the one place gold is used; the plaque under the pointer or
     the focus is announced to the scene, `world:focus`, kind "win", id its place
     in the list, so its star can flare);
   - the record: the commit graph (a build-time snapshot, no runtime calls) as a
     ridge of weekly buttes over the day calendar; the same weeks stand on the
     night horizon behind the section, and the week under the pointer lights there;
   - the roost: an empty band over the card, the width of the graph, where the
     scene lays its creature along the weeks (data-world-anchor="roost");
   - the checks: one row per public trail, showing the address it goes to.
   No totals are shown (Vidyut, Nov 16: commit totals are vanity). The graph is the
   evidence; a week's or a day's exact count is in its tooltip, read from github.json. */

/* Counted from the plaques, never typed: the prizes whose link is a Devpost page,
   and the distinct projects behind them. */
const onDevpost = proofOfWork.wins.items.filter((w) => w.href.includes('devpost.com'));
const devpost = { prizes: onDevpost.length, projects: new Set(onDevpost.map((w) => w.project)).size };

const TZ = 'America/New_York'; // fixed, so the date reads the same for every viewer
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
  const t = when(github.fetchedAt);
  return { updated: `${t.month} ${t.day}, ${t.year}` };
}

export default function ProofOfWork() {
  const g = proofOfWork.github;
  const { wins } = proofOfWork;
  const { updated } = build();

  return (
    <section className="sec" id="verify" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">
            {proofOfWork.eyebrow}
          </span>
          <h2>
            {proofOfWork.heading} <em>{proofOfWork.headingEm}</em>
          </h2>
          <p>{proofOfWork.intro}</p>
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

        <div className="pow-roost" data-world-anchor="roost" aria-hidden="true" />
        <div className="pow-card reveal">
          <div className="pow-top">
            <span className="eyebrow">
              <span className="pow-wide">{g.eyebrow}</span>
              <span className="pow-phone">{g.eyebrowPhone}</span>
            </span>
            <a href={g.href} target="_blank" rel="noopener noreferrer">
              {g.handle}
            </a>
          </div>
          <Heatmap days={github.days} label={g.graphLabel} copy={g} />
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

        <h3 className="eyebrow pow-check-head reveal">{proofOfWork.checkLabel}</h3>
        <ul className="pow-checks reveal">
          {proofOfWork.tiles
            .filter((x) => x.href)
            .map((x) => (
              <li key={x.kind}>
                <a href={x.href} target="_blank" rel="noopener noreferrer">
                  <span className="pow-k">{x.kind}</span>
                  <span className="pow-v">{x.value}</span>
                  <span className="pow-d">{put(x.detail, devpost)}</span>
                  <span className="pow-u">{bare(x.href)}</span>
                </a>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
