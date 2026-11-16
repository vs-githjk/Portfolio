/* SNAPBACK's cutaway house, redrawn for its stage: a drawing in the spirit of the
   one on its home page (three floors, a lifted roof, a For sale sign, a pale city
   round it), not a copy of that model and not a real home. Everything is a box
   projected by `iso`, so the drawing is a list of boxes, not a list of paths.

   Steps (Stage.jsx passes `step`): 2 opens the home, 3 to 5 fly the ad's three
   photos to the walls they were taken at, 6 brings the record, 7 is the verdict.
   The ad itself is a card in the page (Stage.jsx); a photo starts beside it, where
   the stylesheet says (--x0, --y0), and lands on its wall here. */

const S = 26; // one unit of the house, in drawing units
const CX = S * 0.866;
const CY = S * 0.5;
const OX = 192;
const OY = 368;
const r1 = (n) => Math.round(n * 10) / 10;
const iso = (x, y, z = 0) => [r1(OX + (x - y) * CX), r1(OY + (x + y) * CY - z * S)];
const pts = (...p) => p.map((q) => iso(...q).join(',')).join(' ');

const W = 5; // footprint
const D = 4;
const H = 2; // a storey
const LIFT = 34; // how far each floor parts from the one under it, opened

/* A box: its top, the face toward the reader's left (+y) and the one toward the right (+x). */
function Box({ at: [x, y, z], size: [w, d, h], tone, className }) {
  return (
    <g className={className} style={tone ? { '--c': `var(--sb-${tone})` } : undefined}>
      <polygon className="sh-l" points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} />
      <polygon className="sh-r" points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} />
      <polygon className="sh-t" points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} />
    </g>
  );
}

/* A block of the city: a pale box with rows of windows on both faces. */
function Block({ at: [x, y], size: [w, d, h] }) {
  const rows = Math.max(1, Math.floor(h / 0.9));
  const win = [];
  for (let r = 0; r < rows; r++) {
    const z = 0.35 + r * 0.9;
    for (let i = 0; i + 0.7 < w; i += 0.9) win.push(pts([x + i + 0.25, y + d, z], [x + i + 0.7, y + d, z], [x + i + 0.7, y + d, z + 0.5], [x + i + 0.25, y + d, z + 0.5]));
    for (let i = 0; i + 0.7 < d; i += 0.9) win.push(pts([x + w, y + i + 0.25, z], [x + w, y + i + 0.7, z], [x + w, y + i + 0.7, z + 0.5], [x + w, y + i + 0.25, z + 0.5]));
  }
  return (
    <g className="sh-block">
      <Box at={[x, y, 0]} size={[w, d, h]} tone="block" />
      {win.map((p) => (
        <polygon className="sh-win" points={p} key={p} />
      ))}
    </g>
  );
}

/* One storey: the slab, the two back walls with a window each, what stands in the
   room, and three posts. `n` is the floor, 0 at the ground; `lit` rings it in the
   scan colour once its photo has locked. */
function Floor({ n, lit, children }) {
  const z = n * H;
  return (
    <g className="sh-floor" data-floor={n} data-lit={lit}>
      <Box at={[0, 0, z - 0.18]} size={[W, D, 0.18]} tone="slab" />
      <polygon className="sh-ground" points={pts([0, 0, z], [W, 0, z], [W, D, z], [0, D, z])} />
      <polygon className="sh-wall-a" points={pts([0, 0, z], [0, D, z], [0, D, z + H], [0, 0, z + H])} />
      <polygon className="sh-wall-b" points={pts([0, 0, z], [W, 0, z], [W, 0, z + H], [0, 0, z + H])} />
      <polygon className="sh-pane" points={pts([0, 2.3, z + 0.8], [0, 3.4, z + 0.8], [0, 3.4, z + 1.6], [0, 2.3, z + 1.6])} />
      <polygon className="sh-pane" points={pts([3.3, 0, z + 0.8], [4.4, 0, z + 0.8], [4.4, 0, z + 1.6], [3.3, 0, z + 1.6])} />
      {children(z)}
      {[
        [W, 0],
        [0, D],
        [W, D],
      ].map(([x, y]) => (
        <line className="sh-post" key={`${x}${y}`} x1={iso(x, y, z)[0]} y1={iso(x, y, z)[1]} x2={iso(x, y, z + H)[0]} y2={iso(x, y, z + H)[1]} />
      ))}
      <polygon className="sh-scan" points={pts([0, 0, z], [W, 0, z], [W, D, z], [0, D, z])} />
    </g>
  );
}

const PW = 38; // a photo, in drawing units
const PH = 26;

/* Where each of the ad's photos starts (a slot in the ad card) and where it lands:
   a wall of the opened home. `k` is the wall's slope on the page; on the left wall
   a photo's left edge is its far end, so that is the corner it is placed by. */
const wall = (n, x, y, zz) => {
  const [px, py] = iso(x, y, n * H + zz);
  return [px, r1(py - n * LIFT)];
};
const PHOTOS = [
  { to: wall(2, 0.4, 0, 1.5), k: 30, tone: 'photo-a' },
  { to: wall(1, 0, 0.3 + PW / CX, 1.6), k: -30, tone: 'photo-b' },
  { to: wall(0, 0.7, 0, 1.6), k: 30, tone: 'photo-c' },
];
const SIGN = iso(W - 0.4, D + 1.5);
const PIN_Y = [2, 1, 0].map((n) => r1(iso(W, 0, n * H + 0.9)[1] - n * LIFT));
const PIN_X = r1(iso(W, 0)[0] + 14);

export default function SnapHouse({ stage, step }) {
  const on = (n) => (step >= n ? '' : undefined);
  const states = [step >= 5 ? 'ok' : 'wait', step >= 6 ? 'unconfirmed' : 'wait', step >= 6 ? 'warn' : 'wait'];
  const roofZ = 3 * H;
  const ridge = roofZ + 1.9;
  const o = 0.45;
  return (
    <svg className="sh" viewBox="0 0 400 520" data-open={on(2)} style={{ '--lift': `${LIFT}px` }} aria-hidden="true" focusable="false">
      <g className="sh-city">
        <Block at={[-4.6, -6.4]} size={[3.2, 2.6, 2.6]} />
        <Block at={[-0.2, -7.2]} size={[3, 2.4, 3.6]} />
        <Block at={[4.4, -6.2]} size={[3.2, 2.6, 2.2]} />
        <Block at={[8.6, -4.8]} size={[3, 2.8, 3]} />
        <Block at={[-8.4, -1.6]} size={[3, 3, 2]} />
        <Block at={[9.4, 0.4]} size={[2.8, 3, 1.8]} />
        <Block at={[-7.6, 4.6]} size={[3.2, 2.8, 2.4]} />
        <Block at={[-3.4, 8.4]} size={[3.4, 3, 1.6]} />
        <Block at={[8.2, 5.4]} size={[3, 3, 2.2]} />
        <Block at={[3.4, 9.2]} size={[3.2, 3, 1.4]} />
      </g>
      <polygon className="sh-lawn" points={pts([-1.6, -0.8], [W + 1.2, -0.8], [W + 1.2, D + 2.2], [-1.6, D + 2.2])} />
      <g className="sh-tree">
        <Box at={[-1.2, D + 0.7, 0]} size={[0.3, 0.3, 0.7]} tone="trunk" />
        <Box at={[-1.65, D + 0.25, 0.7]} size={[1.2, 1.2, 0.8]} tone="leaf" />
        <Box at={[-1.45, D + 0.45, 1.5]} size={[0.8, 0.8, 0.7]} tone="leaf" />
        <Box at={[-1.25, D + 0.65, 2.2]} size={[0.4, 0.4, 0.5]} tone="leaf" />
      </g>
      <Floor n={0} lit={on(5)}>
        {(z) => (
          <>
            <Box at={[0.5, 0.5, z]} size={[2.2, 0.7, 0.9]} tone="wood" />
            <Box at={[3, 2.2, z]} size={[1.3, 0.9, 0.55]} tone="cream" />
            <Box at={[0.6, 2.6, z]} size={[0.5, 0.5, 0.5]} tone="ink" />
            <Box at={[1.5, 2.6, z]} size={[0.5, 0.5, 0.5]} tone="ink" />
          </>
        )}
      </Floor>
      <Floor n={1} lit={on(4)}>
        {(z) => (
          <>
            <Box at={[3.4, 0.4, z]} size={[0.6, 0.6, 1.4]} tone="teal" />
            <Box at={[0.5, 0.6, z]} size={[0.9, 2.2, 0.7]} tone="slate" />
            <Box at={[2.2, 2.4, z]} size={[1.4, 0.8, 0.45]} tone="wood" />
          </>
        )}
      </Floor>
      <Floor n={2} lit={on(3)}>
        {(z) => (
          <>
            <Box at={[2.6, 0.5, z]} size={[1.9, 1.5, 0.45]} tone="slate" />
            <Box at={[2.7, 0.55, z + 0.45]} size={[0.6, 1.4, 0.14]} tone="cream" />
            <Box at={[0.5, 2.7, z]} size={[1.2, 0.6, 0.9]} tone="wood" />
          </>
        )}
      </Floor>
      <g className="sh-roof">
        <Box at={[0.9, 0.9, roofZ + 0.6]} size={[0.6, 0.6, 1.9]} tone="chimney" />
        <polygon className="sh-gable" points={pts([W, -o, roofZ], [W, D + o, roofZ], [W, D / 2, ridge])} />
        <polygon className="sh-roof-front" points={pts([-o, D / 2, ridge], [W + o, D / 2, ridge], [W + o, D + o, roofZ], [-o, D + o, roofZ])} />
        <polygon className="sh-roof-end" points={pts([W + o, D / 2, ridge], [W + o, D + o, roofZ], [W, D + o, roofZ], [W, D / 2, ridge])} />
        <polygon className="sh-roof-end" points={pts([W + o, D / 2, ridge], [W + o, -o, roofZ], [W, -o, roofZ], [W, D / 2, ridge])} />
      </g>
      <g className="sh-sign" transform={`translate(${SIGN[0]} ${SIGN[1]})`}>
        <path className="sh-sign-post" d="M0 0v-30" />
        <rect className="sh-sign-board" x="-27" y="-52" width="54" height="27" rx="2" />
        <path className="sh-sign-band" d="M-27 -50a2 2 0 0 1 2-2h50a2 2 0 0 1 2 2v11h-54z" />
        <text className="sh-sign-text" x="0" y="-42.4">
          {stage.sign}
        </text>
        <path className="sh-sign-rule" d="M-17 -34h34M-12 -30h24" />
      </g>
      <g className="sh-record" data-on={on(6)} transform={`translate(${SIGN[0] - 66} ${SIGN[1] + 8})`}>
        <rect x="0" y="0" width="132" height="24" rx="12" />
        <text x="66" y="16">
          {stage.record}
        </text>
      </g>
      {stage.pins.map((label, i) => (
        <g className="sh-pin" data-state={states[i]} key={label} transform={`translate(${PIN_X} ${PIN_Y[i]})`}>
          <path d="M-14 0h14" />
          <rect x="0" y="-12" width="92" height="24" rx="12" />
          <circle cx="13" cy="0" r="3.8" />
          <text x="23" y="4.2">
            {label}
          </text>
        </g>
      ))}
      {PHOTOS.map((p, i) => (
        <g
          className="sh-photo"
          key={p.tone}
          data-on={on(3 + i)}
          data-photo={i}
          style={{ '--x1': `${p.to[0]}px`, '--y1': `${p.to[1]}px`, '--k': `${p.k}deg`, '--c': `var(--sb-${p.tone})` }}
        >
          <rect className="sh-photo-img" width={PW} height={PH} rx="1.5" />
          <path className="sh-photo-art" d={`M0 ${PH - 7}h${PW}v7H0zM5 ${PH - 13}h13v6H5zM${PW - 14} 5h9v9h-9z`} />
          <path className="sh-photo-lock" d={`M-3 3v-6h6M${PW - 3} -3h6v6M${PW + 3} ${PH - 3}v6h-6M3 ${PH + 3}h-6v-6`} />
        </g>
      ))}
    </svg>
  );
}
