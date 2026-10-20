import { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MONTHS } from '../lib/months';

const CELL = 11; // cell size
const PITCH = 13; // cell + gap
const TOP = 16; // header strip for month labels
const R = 1.5; // corner radius: each cell is an 8px square with a 3px rounded stroke

/* The commit graph, drawn from the build-time snapshot. 53 x 7 cells in the
   accent ramp (c0 to c4, see sections.css), never GitHub green.

   Cells are five <path>s (one per level), not 370 <rect>s, which keeps the page
   light: about 7 KB of markup instead of 50. A pointer over the graph reads the
   cell under it and shows "n contributions on date" in a small tooltip; the
   whole graph carries one aria-label with the year's total. On phones the SVG
   keeps 11px cells and crops to the most recent half year (right-aligned);
   wider, the whole year fits. No reveal animation. */
export default function Heatmap({ days, label }) {
  const phone = useMediaQuery('(max-width: 640px)');
  const svg = useRef(null);
  const [tip, setTip] = useState(null);
  const [seen, setSeen] = useState(Infinity); // graph units visible from the right edge

  const { paths, labels, width, at } = useMemo(() => {
    const first = new Date(`${days[0].date}T00:00:00Z`);
    const startDow = first.getUTCDay();
    const weeks = Math.ceil((days.length + startDow) / 7);
    let lastMonth = first.getUTCMonth(); // the partial first month never gets a label
    const labels = [];
    const levels = [[], [], [], [], []];
    days.forEach((d, n) => {
      const idx = n + startDow;
      const w = Math.floor(idx / 7);
      const r = idx % 7;
      const month = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
      if (r === 0 && month !== lastMonth) {
        labels.push({ x: w * PITCH, text: MONTHS[month] });
        lastMonth = month;
      }
      const x = w * PITCH + R;
      const y = TOP + r * PITCH + R;
      levels[d.level].push(`M${x} ${y}h${CELL - 2 * R}v${CELL - 2 * R}h-${CELL - 2 * R}z`);
    });
    return {
      paths: levels.map((l) => l.join('')),
      labels,
      width: weeks * PITCH,
      // The day under a point in graph coordinates, or null for a gap or a label.
      at: (x, y) => {
        const w = Math.floor(x / PITCH);
        const r = Math.floor((y - TOP) / PITCH);
        if (r < 0 || r > 6 || x - w * PITCH > CELL || (y - TOP) - r * PITCH > CELL) return null;
        return days[w * 7 + r - startDow] ?? null;
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
      setSeen(w / Math.max(w / width, h / (TOP + 7 * PITCH)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone, width]);

  const show = (e) => {
    const el = svg.current;
    const m = el.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const d = at(p.x, p.y);
    if (!d) {
      setTip(null);
      return;
    }
    const box = el.parentElement.getBoundingClientRect();
    setTip({
      left: e.clientX - box.left,
      top: e.clientY - box.top,
      text: `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`,
    });
  };

  return (
    <div className="heat-wrap" onPointerMove={show} onPointerDown={show} onPointerLeave={() => setTip(null)}>
      <svg
        ref={svg}
        className="heat"
        viewBox={`0 0 ${width} ${TOP + 7 * PITCH}`}
        preserveAspectRatio={phone ? 'xMaxYMid slice' : 'xMidYMid meet'}
        role="img"
        aria-label={label}
      >
        {labels
          .filter((l) => l.x >= width - seen + 4)
          .map((l) => (
            <text key={l.x} x={l.x} y={10}>
              {l.text}
            </text>
          ))}
        {paths.map((d, level) => (
          <path key={level} className={`c${level}`} d={d} />
        ))}
      </svg>
      {tip && (
        <span className="heat-tip" style={{ left: tip.left, top: tip.top }} aria-hidden="true">
          {tip.text}
        </span>
      )}
    </div>
  );
}
