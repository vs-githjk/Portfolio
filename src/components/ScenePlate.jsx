/* The engraved plate in a flagship's window: a hairline drawing of that build,
   made of its own counts (the `scene` object in content.js, which
   scripts/check-scenes.mjs ties to the build's metrics and story). Nothing here
   is typed: every dot, cell and photo is a loop over a number. Decoration for a
   reader who has the figures beside it, so it is aria-hidden. */

const TAU = Math.PI * 2;
const r2 = (n) => Math.round(n * 100) / 100;

/* PrismAI: one shaft (a call) enters a prism and leaves as strands that curve
   back and land on the shaft: every quote is matched against the call. Round it,
   one cell per workspace, each alone, none touching. */
function Prism({ cells }) {
  const cx = 200;
  const cy = 150;
  const lands = [132, 98, 64];
  return (
    <>
      <ellipse className="sp-orbit" cx={cx} cy={cy} rx="176" ry="124" />
      {Array.from({ length: cells }, (_, i) => {
        const a = (i / cells) * TAU - Math.PI / 2;
        return (
          <g className="sp-cell" style={{ '--i': i }} key={i} transform={`translate(${r2(cx + Math.cos(a) * 176)} ${r2(cy + Math.sin(a) * 124)})`}>
            <circle className="sp-ring" r="10" />
            <circle className="sp-lit" r="2.4" />
          </g>
        );
      })}
      <path className="sp-line sp-draw" pathLength="1" d="M36 150H176" />
      {lands.map((x, i) => (
        <g key={x} style={{ '--i': i }}>
          <path
            className="sp-strand sp-draw"
            pathLength="1"
            d={`M226 150A${(226 - x) / 2} ${62 + i * 16} 0 0 0 ${x} 150`}
          />
          <circle className="sp-lit sp-land" cx={x} cy="150" r="2.6" />
        </g>
      ))}
      <path className="sp-solid" d="M200 104 160 178H240Z" />
      <path className="sp-line" d="M200 104 200 178M160 178 200 150 240 178" />
    </>
  );
}

/* DuelWise: a board world with a ruled grid, one moon per game, and a band with
   one point of light per player. The band is a single path whose dash pattern
   has exactly `lights` dots (pathLength), so the count is the drawing. */
function Board({ moons, lights }) {
  const cx = 200;
  const cy = 150;
  const R = 56;
  const orbits = [
    { rx: 96, ry: 30 },
    { rx: 124, ry: 40 },
    { rx: 152, ry: 50 },
  ];
  const per = Math.ceil(moons / orbits.length);
  return (
    <g transform={`rotate(-14 ${cx} ${cy})`}>
      <ellipse className="sp-band" cx={cx} cy={cy} rx="186" ry="64" pathLength={lights} strokeDasharray="0 1" />
      {orbits.map((o) => (
        <ellipse className="sp-orbit" cx={cx} cy={cy} rx={o.rx} ry={o.ry} key={o.rx} />
      ))}
      <clipPath id="sp-board-clip">
        <circle cx={cx} cy={cy} r={R} />
      </clipPath>
      <circle className="sp-solid" cx={cx} cy={cy} r={R} />
      <g clipPath="url(#sp-board-clip)" className="sp-grid">
        {Array.from({ length: 7 }, (_, i) => {
          const d = ((i + 1) / 8) * 2 * R - R;
          return (
            <g key={i}>
              <path d={`M${cx + d} ${cy - R}V${cy + R}`} />
              <path d={`M${cx - R} ${cy + d}H${cx + R}`} />
            </g>
          );
        })}
      </g>
      <circle className="sp-line" cx={cx} cy={cy} r={R} />
      {Array.from({ length: moons }, (_, i) => {
        const o = orbits[Math.floor(i / per)];
        const a = ((i % per) / per) * TAU + Math.floor(i / per) * 0.9 + 0.5;
        return <circle className="sp-lit sp-moon" style={{ '--i': i }} key={i} cx={r2(cx + Math.cos(a) * o.rx)} cy={r2(cy + Math.sin(a) * o.ry)} r="4" />;
      })}
    </g>
  );
}

/* SNAPBACK: a building drawn in points. `placed` photos sit inside it, lit; the
   rest of the `photos` stay outside, unlit; the decoys wait at the edge and none
   goes in (`decoysPlaced` of them are drawn inside, which is none). */
function Scan({ photos, placed, decoys, decoysPlaced }) {
  const cols = 8;
  const w = 14;
  const h = 10;
  const gx = 5;
  const gy = 6;
  const x0 = 200 - (cols * w + (cols - 1) * gx) / 2;
  const y0 = 122;
  const slot = (i) => [x0 + (i % cols) * (w + gx), y0 + Math.floor(i / cols) * (h + gy)];
  const out = photos - placed;
  const waiting = decoys - decoysPlaced;
  return (
    <>
      <path className="sp-points" d="M118 262V104L200 44 282 104V262Z" />
      <path className="sp-points" d="M118 104H282" />
      {Array.from({ length: placed + decoysPlaced }, (_, i) => {
        const [x, y] = slot(i);
        return <rect className={i < placed ? 'sp-photo' : 'sp-photo sp-wrong'} style={{ '--i': i }} key={i} x={x} y={y} width={w} height={h} rx="1.5" />;
      })}
      {Array.from({ length: out }, (_, i) => (
        <rect
          className="sp-photo sp-out"
          key={i}
          x={316 + (i % 2) * 26}
          y={112 + i * 26}
          width={w}
          height={h}
          rx="1.5"
          transform={`rotate(${i % 2 ? 9 : -7} ${323 + (i % 2) * 26} ${117 + i * 26})`}
        />
      ))}
      {Array.from({ length: waiting }, (_, i) => (
        <path className="sp-decoy" key={i} d={`M${46 + (i % 3) * 18} ${96 + Math.floor(i / 3) * 16}l4 4-4 4-4-4z`} />
      ))}
    </>
  );
}

const KINDS = { prism: Prism, board: Board, scan: Scan };

export default function ScenePlate({ scene }) {
  const Kind = scene && KINDS[scene.kind];
  if (!Kind) return null;
  return (
    <svg className="sp" data-kind={scene.kind} viewBox="0 0 400 300" aria-hidden="true" focusable="false">
      <Kind {...scene} />
    </svg>
  );
}
