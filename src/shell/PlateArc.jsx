/* One arc of an engraved plate, seen edge on: two rims and `count` ticks between
   them. `far` draws the far edge (a crest, as it shows over a horizon), otherwise
   the near edge (a bowl). The drawing is a 1000 by 100 box stretched to whatever
   the stylesheet makes it; hairlines keep their width (non-scaling strokes).
   Each tick carries its place in the row as --k, so a stylesheet can count them in.
   Decoration: the count it draws is always stated in the page beside it. */
const RIM = 1.06;
const ARC = { cx: 500, cy: 118, rx: 452, ry: 96, sweep: 62, reach: 84 };
const fix = (v) => v.toFixed(1);

export default function PlateArc({ count, far = true, className = '' }) {
  // The near edge is the far edge mirrored top to bottom.
  const at = (grow, deg) => {
    const a = (deg * Math.PI) / 180;
    const y = ARC.cy - ARC.ry * grow * Math.cos(a);
    return [ARC.cx + ARC.rx * grow * Math.sin(a), far ? y : 100 - y];
  };
  const rim = (grow) => {
    const [x0, y0] = at(grow, -ARC.reach);
    const [x1, y1] = at(grow, ARC.reach);
    return `M${fix(x0)} ${fix(y0)}A${fix(ARC.rx * grow)} ${fix(ARC.ry * grow)} 0 0 ${far ? 1 : 0} ${fix(x1)} ${fix(y1)}`;
  };
  const ticks = Array.from({ length: count }, (_, k) => {
    const deg = -ARC.sweep + ((k + 0.5) / count) * 2 * ARC.sweep;
    return [at(1, deg), at(RIM, deg)];
  });
  return (
    <svg className={`plate-arc ${className}`} viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="plate-arc-rim" d={rim(1)} />
      <path className="plate-arc-rim" data-rim="outer" d={rim(RIM)} />
      {ticks.map(([a, b], k) => (
        <line className="plate-arc-tick" key={k} style={{ '--k': k }} x1={fix(a[0])} y1={fix(a[1])} x2={fix(b[0])} y2={fix(b[1])} />
      ))}
    </svg>
  );
}
