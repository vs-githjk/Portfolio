import { useMemo } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MONTHS } from '../lib/months';

const CELL = 11; // cell size
const PITCH = 13; // cell + gap
const TOP = 16; // header strip for month labels

/* The commit graph, drawn from the build-time snapshot. 53 x 7 cells in the
   brass ramp (c0 to c4, see sections.css), never GitHub green. Each cell has a
   <title>. On phones the SVG keeps 11px cells and crops to the most recent half
   year (right-aligned); wider, the whole year fits. No reveal animation. */
export default function Heatmap({ days, label }) {
  const phone = useMediaQuery('(max-width: 640px)');

  const { cells, labels, width } = useMemo(() => {
    const first = new Date(`${days[0].date}T00:00:00Z`);
    const startDow = first.getUTCDay();
    const weeks = Math.ceil((days.length + startDow) / 7);
    let lastMonth = first.getUTCMonth(); // the partial first month never gets a label
    const labels = [];
    const cells = days.map((d, n) => {
      const idx = n + startDow;
      const w = Math.floor(idx / 7);
      const r = idx % 7;
      const month = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
      if (r === 0 && month !== lastMonth) {
        labels.push({ x: w * PITCH, text: MONTHS[month] });
        lastMonth = month;
      }
      return {
        x: w * PITCH,
        y: TOP + r * PITCH,
        level: d.level,
        tip: `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}`,
      };
    });
    return { cells, labels, width: weeks * PITCH };
  }, [days]);

  return (
    <svg
      className="heat"
      viewBox={`0 0 ${width} ${TOP + 7 * PITCH}`}
      preserveAspectRatio={phone ? 'xMaxYMid slice' : 'xMidYMid meet'}
      role="img"
      aria-label={label}
    >
      {labels.map((l) => (
        <text key={l.x} x={l.x} y={10}>
          {l.text}
        </text>
      ))}
      {cells.map((c) => (
        <rect key={`${c.x}-${c.y}`} className={`c${c.level}`} x={c.x} y={c.y} width={CELL} height={CELL} rx="2">
          <title>{c.tip}</title>
        </rect>
      ))}
    </svg>
  );
}
