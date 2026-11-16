import { fill } from './counts';

/* The paper's repair loop as a small machine, in line. The model writes C; GCC
   and CodeQL check it; their findings go back to the model, for at most
   `rounds` laps (one pip per round); KLEE is the final check on the way out.
   Under it, the result as two bars whose lengths are the two numbers of the
   paper's first metric ("15,088 → 2,463"), parsed, never typed again.
   One image with a text alternative; its labels are hidden from a screen reader
   because the alternative says the same thing in a sentence. */
export default function RepairLoop({ loop, metric }) {
  const [before, after] = metric.value.split('→').map((v) => v.trim());
  const ratio = Number(after.replace(/,/g, '')) / Number(before.replace(/,/g, ''));
  const cx = 178;
  const cy = 122;
  const R = 80;
  const at = (deg) => [cx + R * Math.cos((deg * Math.PI) / 180), cy + R * Math.sin((deg * Math.PI) / 180)];
  const stops = [
    { label: loop.model, deg: 180, side: 'end' },
    { label: loop.checks[0], deg: -60, side: 'start' },
    { label: loop.checks[1], deg: 60, side: 'start' },
  ];
  const barW = 432;
  return (
    <svg className="loop" viewBox="0 0 520 356" role="img" aria-label={fill(loop.alt, { before, after })}>
      <g aria-hidden="true">
        <circle className="loop-ring" cx={cx} cy={cy} r={R} />
        <path className="loop-arrow" d={`M${cx + 3} ${cy + R - 5}l-6 5 6 5`} />
        <text className="loop-note" x={cx} y={cy + R + 22} textAnchor="middle">
          {loop.back}
        </text>
        <g className="loop-spark" style={{ '--laps': loop.rounds }}>
          <circle r="5" cx={cx + R} cy={cy} />
        </g>
        {stops.map((s) => {
          const [x, y] = at(s.deg);
          return (
            <g key={s.label}>
              <circle className="loop-stop" cx={x} cy={y} r="7" />
              <text className="loop-label" x={x + (s.side === 'end' ? -14 : 14)} y={y + 4} textAnchor={s.side}>
                {s.label}
              </text>
            </g>
          );
        })}
        {Array.from({ length: loop.rounds }, (_, i) => (
          <g key={i} className="loop-pip" style={{ '--i': i }}>
            <circle cx={cx - 22 + i * 22} cy={cy} r="6" />
            <text x={cx - 22 + i * 22} y={cy + 24} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        ))}
        <text className="loop-note" x={cx} y={cy - 16} textAnchor="middle">
          {loop.lap}
        </text>
        <path className="loop-exit" d={`M${cx + R + 12} ${cy}H386`} />
        <path className="loop-arrow" d={`M380 ${cy - 5}l6 5-6 5`} />
        <rect className="loop-gate" x="392" y={cy - 19} width="96" height="38" rx="3" />
        <text className="loop-label" x="440" y={cy + 4} textAnchor="middle">
          {loop.final}
        </text>
        <g transform="translate(44 280)">
          <text className="loop-note" x="0" y="-9">
            {loop.before}
          </text>
          <text className="loop-fig" x={barW} y="-9" textAnchor="end">
            {before}
          </text>
          <rect className="loop-bar" width={barW} height="12" />
          <text className="loop-note" x="0" y="42">
            {loop.after}
          </text>
          <rect className="loop-bar loop-bar-ghost" y="51" width={barW} height="12" />
          <rect className="loop-bar loop-bar-after" y="51" width={barW} height="12" style={{ '--to': ratio.toFixed(4) }} />
          <text className="loop-fig" x={barW} y="42" textAnchor="end">
            {after}
          </text>
        </g>
      </g>
    </svg>
  );
}
