import { useMemo } from 'react';
import '../styles/v4-flagships.css';
import { useStage } from '../hooks/useStage';
import SnapHouse from './SnapHouse';
import { fill, put } from './counts';

/* A flagship's stage: the product itself, in its own type and colours, inside the
   page's cut-corner frame. Each is drawn from that product's live site (the
   sources are beside each `stage` object in content.js) and plays a short sample
   of what the product does. The words are in content.js; the counts come from the
   build's `scene`, which scripts/check-scenes.mjs ties to its metrics and story.

   A stage is one picture to a screen reader (role="img" with the `alt` from the
   content file); the facts it shows are in the text beside it. It plays as steps
   (hooks/useStage.js) and rests on the last one, which is also what the server
   renders and what a reader who asked for reduced motion sees. */

const on = (step, n) => (step >= n ? '' : undefined);

/* ---- PrismAI: the record ---------------------------------------------------- */

/* The mark from its site: three prisms round a fourth, upside down. */
function PrismMark() {
  return (
    <svg className="rec-mark" viewBox="60 40 1266 1100" aria-hidden="true" focusable="false">
      <path d="M632 105c27-47 94-47 121 0l158 273c27 47-7 105-61 105H535c-54 0-88-58-61-105z" />
      <path d="M1003 747c27-47 94-47 121 0l158 273c27 47-7 105-61 105H906c-54 0-88-58-61-105z" />
      <path d="M261 747c27-47 95-47 122 0l157 273c27 47-6 105-60 105H164c-54 0-87-58-60-105z" />
      <path className="ctr" d="M662 998c14 23 47 23 61 0l199-345c14-24-3-53-30-53H493c-27 0-43 29-30 53z" />
    </svg>
  );
}

/* The three glass prisms that stand on its desk. */
function Prisms() {
  const d = 'M50 9c4-7 14-7 18 0l39 68c4 7-1 16-9 16H20c-8 0-13-9-9-16z';
  return (
    <svg className="rec-prisms" viewBox="0 0 236 196" aria-hidden="true" focusable="false">
      <defs>
        {['a', 'b', 'c'].map((k) => (
          <linearGradient id={`rec-glass-${k}`} key={k} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={`rec-glass-${k}-0`} />
            <stop offset="1" className={`rec-glass-${k}-1`} />
          </linearGradient>
        ))}
      </defs>
      <ellipse className="rec-prism-shade" cx="118" cy="186" rx="104" ry="8" />
      {[
        ['b', 0, 92],
        ['c', 118, 92],
        ['a', 59, 0],
      ].map(([k, x, y]) => (
        <g key={k} transform={`translate(${x} ${y})`}>
          <path d={d} fill={`url(#rec-glass-${k})`} />
          <path className="rec-prism-edge" d={d} />
          <path className="rec-prism-shine" d="M56 18 28 68" />
        </g>
      ))}
    </svg>
  );
}

const RECORD_BEATS = [600, 1100, 900, 1100, 900, 1400, 1700];

function Record({ stage }) {
  const [ref, step] = useStage(RECORD_BEATS);
  const after = step >= 6;
  const { order, clause } = stage;
  return (
    <div className="rec" ref={ref}>
      <header className="rec-top">
        <p className="rec-h">
          <PrismMark />
          {stage.headline}
        </p>
        <Prisms />
      </header>
      <div className="rec-page">
        <p className="rec-bar">
          <b>{stage.label}</b>
          <span className="rec-phase" data-after={after ? '' : undefined}>
            <i />
            {stage.phases[after ? 1 : 0]}
          </span>
        </p>
        <ol className="rec-lines">
          {stage.lines.map((l, i) => (
            <li key={l.who} data-on={on(step, 1 + i * 2)} data-caught={on(step, l.flag ? 6 : 2 + i * 2)} data-flag={l.flag ? '' : undefined}>
              <span className="rec-who">{l.who}</span>
              <p className="rec-say">
                <span>
                  {l.say}
                  {l.mark && <mark>{l.mark}</mark>}
                </span>
              </p>
              {l.due && (
                <span className="rec-due">
                  <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                    <path d="M2.5 6.4 5 8.8l4.6-5.4" />
                  </svg>
                  {l.due} <b>{l.day}</b>
                </span>
              )}
              {l.flag && (
                <div className="rec-scope">
                  <span className="rec-flag">{l.flag}</span>
                  <i className="rec-thread" />
                  <p className="rec-clause">
                    <span>{clause.ref}</span>
                    {clause.text}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      <div className="rec-slip" data-on={on(step, 7)}>
        <p className="rec-slip-k">
          {order.label}
          <span>{order.state}</span>
        </p>
        <p className="rec-slip-t">{order.item}</p>
        <p className="rec-slip-b">{order.basis}</p>
        <p className="rec-slip-go">
          <span className="rec-wait">{order.wait}</span>
          <span className="rec-ap">{order.action}</span>
        </p>
      </div>
    </div>
  );
}

/* ---- DuelWise: the clubhouse and one match ---------------------------------- */

const COLS = 7;
const ROWS = 6;
const CELL = 12;

/* Play the columns out: where each disc lands, and the four that win (if any).
   The line is found here, so the stage cannot crown a winner the moves did not make. */
function playOut(moves) {
  const heights = Array(COLS).fill(0);
  const grid = {};
  const discs = moves.map((col, i) => {
    const row = heights[col]++;
    const who = i % 2 ? 'ai' : 'you';
    grid[`${col},${row}`] = who;
    return { col, row, who };
  });
  const lastDisc = discs[discs.length - 1];
  let line = [];
  if (lastDisc) {
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]) {
      const run = [[lastDisc.col, lastDisc.row]];
      for (const dir of [1, -1]) {
        for (let k = 1; k < 4; k++) {
          const c = lastDisc.col + dx * k * dir;
          const r = lastDisc.row + dy * k * dir;
          if (grid[`${c},${r}`] !== lastDisc.who) break;
          run.push([c, r]);
        }
      }
      if (run.length >= 4) line = run;
    }
  }
  return { discs, line, winner: line.length ? lastDisc.who : null };
}

function Match({ stage, scene }) {
  const { match, shelf } = stage;
  // Worked out once: the hook restarts whenever its beats change.
  const { discs, line, winner, beats } = useMemo(() => {
    const game = playOut(match.moves);
    return { ...game, beats: game.discs.map((d) => (d.who === 'you' ? 1000 : 700)) };
  }, [match.moves]);
  const [ref, step] = useStage(beats, 6500);
  const opponents = stage.opponents.slice(0, scene.opponents);
  const champion = opponents.find((o) => o.champion) ?? opponents[opponents.length - 1];
  const done = step >= discs.length;
  const turn = done ? 'done' : step % 2 ? 'ai' : 'you';
  const status = done && winner === 'ai' ? put(match.win, { name: champion.name }) : turn === 'ai' ? put(match.thinking, { name: champion.name }) : match.yourMove;
  const cx = (c) => 4 + c * CELL + CELL / 2;
  const cy = (r) => 10 + (ROWS - 1 - r) * CELL + CELL / 2;
  const won = new Set(line.map(([c, r]) => `${c},${r}`));
  return (
    <div className="duel" ref={ref}>
      <p className="duel-kicker">{stage.kicker}</p>
      <p className="duel-h">
        {stage.headline[0]}
        <em>{stage.headline[1]}</em>
      </p>
      <ul className="duel-cards">
        {opponents.map((o) => (
          <li key={o.id} data-champion={o.champion ? '' : undefined}>
            {o.champion && <span className="duel-chip">{o.level}</span>}
            <img src={`/flagships/duelwise-${o.id}.svg`} alt="" width="56" height="56" loading="lazy" decoding="async" />
            <b>{o.name}</b>
            <span className="duel-level">{o.level}</span>
          </li>
        ))}
      </ul>
      <div className="duel-table">
        <svg className="duel-board" viewBox={`0 0 ${COLS * CELL + 8} ${ROWS * CELL + 14}`} aria-hidden="true" focusable="false">
          <rect className="duel-frame" x="0" y="6" width={COLS * CELL + 8} height={ROWS * CELL + 8} rx="5" />
          {Array.from({ length: COLS * ROWS }, (_, i) => (
            <circle className="duel-hole" key={i} cx={cx(i % COLS)} cy={cy(Math.floor(i / COLS))} r="4.4" />
          ))}
          {discs.map((d, i) => (
            <circle
              className="duel-disc"
              key={i}
              data-who={d.who}
              data-on={on(step, i + 1)}
              data-won={done && won.has(`${d.col},${d.row}`) ? '' : undefined}
              style={{ '--fall': `${-(cy(d.row) - 1)}px` }}
              cx={cx(d.col)}
              cy={cy(d.row)}
              r="4.4"
            />
          ))}
        </svg>
        <div className="duel-side">
          <p className="duel-game">
            <b>{match.game}</b>
            <span>{match.chip}</span>
          </p>
          <p className="duel-vs">
            <i data-who="you" />
            {match.you}
            <span>{match.versus}</span>
            <i data-who="ai" />
            {champion.name}
          </p>
          <p className="duel-status" data-turn={turn}>
            {status}
            {turn === 'ai' && <span className="duel-dots" />}
          </p>
          <p className="duel-record">
            <b>{put(stage.record.value, scene)}</b>
            <span>{put(stage.record.label, scene)}</span>
          </p>
        </div>
        <p className="duel-shelf">
          <span>{fill(shelf.label, { games: scene.games })}</span>
          {shelf.games.slice(0, scene.games).map((g, i) => (
            <i key={g} data-game={i} data-playing={i === shelf.playing ? '' : undefined} title={g} />
          ))}
        </p>
      </div>
    </div>
  );
}

/* ---- SNAPBACK: the check ----------------------------------------------------- */

const CHECK_BEATS = [900, 700, 1100, 800, 800, 1000, 1300];

function Check({ stage, scene }) {
  const [ref, step] = useStage(CHECK_BEATS);
  const { card, tally } = stage;
  // The place is settled when the last photo locks; the record brings the other two.
  const shown = [5, 6, 6];
  const done = step >= 7;
  return (
    <div className="chk" ref={ref}>
      <div className="chk-copy">
        <p className="chk-kicker">{stage.kicker}</p>
        <p className="chk-h">{stage.headline}</p>
      </div>
      <div className="chk-ad" data-on={on(step, 1)}>
        <span className="chk-ad-k">{stage.ad.label}</span>
        <span className="chk-ad-photos">
          {[3, 4, 5].map((n, i) => (
            <i key={n} data-photo={i} data-gone={on(step, n)} />
          ))}
        </span>
        <p className="chk-ad-q">{stage.ad.quote}</p>
        <span className="chk-ad-btn">{stage.ad.action}</span>
      </div>
      <SnapHouse stage={stage} step={step} />
      <div className="chk-card">
        <div className="chk-band">
          <span className="chk-meta">{card.meta}</span>
          <p className="chk-verdict" data-done={done ? '' : undefined}>
            {done ? card.verdict : card.checking}
          </p>
        </div>
        <ul className="chk-rows">
          {card.rows.map((r, i) => (
            <li key={r.k} data-on={on(step, shown[i])}>
              <span className="chk-k">{r.k}</span>
              <span className="chk-t">{r.t}</span>
              <span className="chk-state" data-state={r.state}>
                <i />
                {r.chip}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="chk-tally" data-on={on(step, 7)}>
        <span className="chk-tally-k">{tally.label}</span>
        <p>
          <span className="chk-ticks">
            {Array.from({ length: scene.photos }, (_, i) => (
              <i key={i} data-placed={i < scene.placed ? '' : undefined} />
            ))}
          </span>
          {put(tally.real, scene)}
        </p>
        <p>
          <span className="chk-ticks" data-decoy="">
            {Array.from({ length: scene.decoys }, (_, i) => (
              <i key={i} data-placed={i < scene.decoysPlaced ? '' : undefined} />
            ))}
          </span>
          {put(tally.decoy, scene)}
        </p>
      </div>
    </div>
  );
}

const KINDS = { record: Record, match: Match, check: Check };

export default function Stage({ item }) {
  const Kind = item.scene && KINDS[item.scene.kind];
  if (!Kind || !item.stage) return null;
  return (
    <figure className="pstage" data-kind={item.scene.kind}>
      <div className="pstage-in" role="img" aria-label={item.stage.alt}>
        <Kind stage={item.stage} scene={item.scene} />
      </div>
      <figcaption className="pstage-cap">
        <span>{item.stage.site}</span>
        {item.stage.caption}
      </figcaption>
    </figure>
  );
}
