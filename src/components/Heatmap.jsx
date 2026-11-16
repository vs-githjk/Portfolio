import { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MONTHS } from '../lib/months';

const CELL = 11; // cell size
const PITCH = 13; // cell + gap
const RIDGE = 64; // the tallest butte
const TOP = RIDGE + 22; // the ridge, then a strip for month labels
const R = 1.5; // corner radius: each cell is an 8px square with a 3px rounded stroke
const H = TOP + 7 * PITCH;

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

/* The commit record, drawn flat from the build-time snapshot: it is the accessible
   image of the record (the world scene behind this section stands the same weeks up
   as buttes on the night horizon). Two readings on one scale, in one SVG:

   - the ridge: one butte per week, its height the week's total to the power 0.4
     (so a quiet week still shows), its colour the week's rank within the year;
   - the calendar under it: 53 x 7 day cells in the accent ramp (c0 to c4, see
     sections.css), never GitHub green. Five <path>s, one per level, not 370
     <rect>s: about 7 KB of markup instead of 50.

   A pointer over a day shows "n contributions on date"; over a butte, the week's
   total. The exact counts stay in the tooltip, never typed elsewhere. Whatever
   week is under the pointer, or chosen with the keyboard on the range control
   below the graph, is announced to the world scene as a `world:week` event
   ({ detail: { index } }, index null when nothing is chosen) so the matching
   butte can light. On phones the SVG crops to the most recent half year
   (right-aligned); wider, the whole year fits. */
export default function Heatmap({ days, label, copy }) {
  const phone = useMediaQuery('(max-width: 640px)');
  const svg = useRef(null);
  const [tip, setTip] = useState(null);
  const [week, setWeek] = useState(null);
  const [seen, setSeen] = useState(Infinity); // graph units visible from the right edge

  const { paths, buttes, labels, width, weeks, at } = useMemo(() => {
    const first = new Date(`${days[0].date}T00:00:00Z`);
    const startDow = first.getUTCDay();
    const count = Math.ceil((days.length + startDow) / 7);
    let lastMonth = first.getUTCMonth(); // the partial first month never gets a label
    const labels = [];
    const levels = [[], [], [], [], []];
    const weeks = Array.from({ length: count }, () => ({ total: 0, from: null }));
    days.forEach((d, n) => {
      const idx = n + startDow;
      const w = Math.floor(idx / 7);
      const r = idx % 7;
      const month = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
      if (r === 0 && month !== lastMonth) {
        labels.push({ x: w * PITCH, text: MONTHS[month] });
        lastMonth = month;
      }
      weeks[w].total += d.count;
      weeks[w].from ??= d.date;
      const x = w * PITCH + R;
      const y = TOP + r * PITCH + R;
      levels[d.level].push(`M${x} ${y}h${CELL - 2 * R}v${CELL - 2 * R}h-${CELL - 2 * R}z`);
    });
    // Buttes: flat tops, sides that lean in a little. Colour by rank within the year.
    const sorted = weeks.map((w) => w.total).filter(Boolean).sort((a, b) => a - b);
    const peak = Math.max(1, ...sorted) ** 0.4;
    const buttes = [[], [], [], [], []];
    weeks.forEach((w, i) => {
      const h = w.total ? Math.max(3, (w.total ** 0.4 / peak) * RIDGE) : 1.5;
      const rank = w.total ? sorted.indexOf(w.total) / Math.max(1, sorted.length - 1) : 0;
      const level = w.total ? 1 + Math.min(3, Math.floor(rank * 4)) : 0;
      const x = i * PITCH;
      const lean = Math.min(2.2, h * 0.12);
      buttes[level].push(`M${x} ${RIDGE}L${x + lean} ${(RIDGE - h).toFixed(1)}H${x + CELL - lean}L${x + CELL} ${RIDGE}z`);
    });
    return {
      paths: levels.map((l) => l.join('')),
      buttes: buttes.map((l) => l.join('')),
      labels,
      width: count * PITCH,
      weeks,
      // What is under a point in graph coordinates: the week, and the day if it is a cell.
      at: (x, y) => {
        const w = Math.floor(x / PITCH);
        if (w < 0 || w >= count || x - w * PITCH > CELL) return null;
        if (y <= RIDGE + 2) return { w, day: null };
        const r = Math.floor((y - TOP) / PITCH);
        if (r < 0 || r > 6 || y - TOP - r * PITCH > CELL) return null;
        const day = days[w * 7 + r - startDow] ?? null;
        return day ? { w, day } : null;
      },
    };
  }, [days]);

  // The phone crop (slice) hides the oldest weeks, and a month label that straddles the
  // cut would read as a stray letter pair, so a label is drawn only when it fits whole.
  useEffect(() => {
    const el = svg.current;
    if (!el || !phone) {
      setSeen(Infinity);
      return undefined;
    }
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setSeen(w / Math.max(w / width, h / H));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone, width]);

  // Tell the world which week is chosen, so its butte on the horizon can light.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('world:week', { detail: { index: week } }));
  }, [week]);

  const weekText = (w) => fill(copy.weekTip, { date: weeks[w].from, n: weeks[w].total });

  const show = (e) => {
    const el = svg.current;
    const m = el.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const hit = at(p.x, p.y);
    if (!hit) {
      setTip(null);
      setWeek(null);
      return;
    }
    const box = el.parentElement.getBoundingClientRect();
    setWeek(hit.w);
    setTip({
      left: e.clientX - box.left,
      top: e.clientY - box.top,
      text: hit.day ? fill(copy.dayTip, { n: hit.day.count, date: hit.day.date }) : weekText(hit.w),
    });
  };

  // Keyboard: the range control steps through the weeks; the tooltip sits on the butte.
  const step = (w) => {
    const el = svg.current;
    const m = el.getScreenCTM();
    const box = el.parentElement.getBoundingClientRect();
    setWeek(w);
    if (!m) return;
    const p = new DOMPoint(w * PITCH + CELL / 2, 0).matrixTransform(m);
    setTip({ left: p.x - box.left, top: p.y - box.top + 10, text: weekText(w) });
  };

  const clear = () => {
    setTip(null);
    setWeek(null);
  };

  return (
    <div className="heat-wrap">
      <div className="heat-stage" onPointerMove={show} onPointerDown={show} onPointerLeave={clear}>
        <svg
          ref={svg}
          className="heat"
          viewBox={`0 0 ${width} ${H}`}
          preserveAspectRatio={phone ? 'xMaxYMid slice' : 'xMidYMid meet'}
          role="img"
          aria-label={label}
        >
          {week !== null && <rect className="heat-week" x={week * PITCH - 1} y="0" width={CELL + 2} height={H} />}
          {buttes.map((d, level) => (
            <path key={level} className={`butte c${level}`} d={d} />
          ))}
          <path className="heat-ground" d={`M0 ${RIDGE}H${width}`} />
          {labels
            .filter((l) => l.x >= width - seen + 4)
            .map((l) => (
              <text key={l.x} x={l.x} y={RIDGE + 15}>
                {l.text}
              </text>
            ))}
          {paths.map((d, level) => (
            <path key={level} className={`cell c${level}`} d={d} />
          ))}
        </svg>
        {tip && (
          <span className="heat-tip" style={{ left: tip.left, top: tip.top }} aria-hidden="true">
            {tip.text}
          </span>
        )}
      </div>
      <label className="heat-scrub">
        <span className="sr">{copy.scrub}</span>
        <input
          type="range"
          min="0"
          max={weeks.length - 1}
          step="1"
          value={week ?? weeks.length - 1}
          aria-valuetext={weekText(week ?? weeks.length - 1)}
          onChange={(e) => step(Number(e.target.value))}
          onFocus={(e) => step(Number(e.target.value))}
          onBlur={clear}
        />
      </label>
    </div>
  );
}
