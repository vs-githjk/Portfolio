/* The room the hologram stands in: a quiet observatory drawn behind the first
   screen. All of it is decoration (aria-hidden), all of it SVG and CSS, in the
   hologram's own blue, and none of it touches the figure or sits on the greeting:

     the floor    rings of light on the ground round the projector plate, with a
                  band of glyphs like the ones round his crystal; the stylesheet
                  puts it on the plate (--plate-x, --plate-y from lib/face.js)
                  and fades it out before it reaches the greeting
     the sky      four small constellations at the sides, and a few glyphs that
                  drift slowly upward there
     the limb     the lit edge of a far world, low in one corner

   Every position is written here, so the server and the browser draw the same
   picture. A phone gets the floor and two constellations (see v4-opening.css). */

/* Glyphs: strokes in a 10 by 16 box, runes of no alphabet. */
const GLYPHS = ['M2 0V16M2 2l6 4-6 4', 'M5 0V16M1 4l8 6', 'M2 0V16M8 0V16M2 4l6 6', 'M5 0V16M1 5l4-4 4 4', 'M1 0l8 16M9 0l-8 16', 'M2 0V16M2 0l6 5-6 5', 'M5 0V16M1 12l4 4 4-4', 'M1 4l4-4 4 4M5 0V16'];

/* The floor, in a 1000 by 200 box with the plate at its middle. Rings are seen
   edge on: their height is LIE of their width. */
const LIE = 0.19;
const RINGS = [150, 215, 300, 395, 490];
const BAND = 258; // the glyphs stand between the second and third rings
const N_GLYPH = 28;
const N_SPOKE = 36;
const fix = (v) => v.toFixed(1);
const spokes = Array.from({ length: N_SPOKE }, (_, k) => {
  const a = (k / N_SPOKE) * 2 * Math.PI;
  const c = Math.cos(a);
  const s = Math.sin(a) * LIE;
  return [300 * c, 300 * s, (k % 3 === 0 ? 395 : 330) * c, (k % 3 === 0 ? 395 : 330) * s];
});
const band = Array.from({ length: N_GLYPH }, (_, k) => {
  const a = ((k + 0.5) / N_GLYPH) * 2 * Math.PI;
  return { x: BAND * Math.cos(a), y: BAND * Math.sin(a) * LIE, d: GLYPHS[(k * 5) % GLYPHS.length], near: Math.sin(a) };
});

/* The sky, in a 1600 by 900 box that covers the screen. Lines join the stars of
   each constellation; `side` lets a phone keep only two. */
const STARS = [
  { side: 'a', line: [[70, 90], [150, 60], [230, 110], [300, 70]], spur: [[150, 60], [170, 170]] },
  { side: 'b', line: [[40, 520], [120, 470], [200, 540], [160, 640], [60, 620], [40, 520]] },
  { side: 'a', line: [[1320, 60], [1400, 120], [1490, 80], [1560, 150]] },
  { side: 'b', line: [[1380, 560], [1460, 500], [1550, 560], [1500, 660]], spur: [[1460, 500], [1440, 420]] },
];
const DRIFT = [
  [96, 300, 0], [262, 380, 3], [58, 760, 5], [330, 250, 1], [214, 700, 6], [370, 560, 2],
  [1508, 310, 4], [1296, 250, 7], [1560, 740, 1], [1250, 610, 5], [1402, 330, 2], [1340, 790, 0],
];
const path = (pts) => pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');

export default function WelcomeScene() {
  return (
    <div className="obs" aria-hidden="true">
      <span className="obs-limb" />
      <svg className="obs-sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" focusable="false">
        {STARS.map((c, k) => (
          <g className="obs-con" data-side={c.side} style={{ '--k': k }} key={k}>
            <path d={path(c.line) + (c.spur ? path(c.spur) : '')} />
            {[...c.line, ...(c.spur ? [c.spur[1]] : [])].map(([x, y], i) => (
              <circle cx={x} cy={y} r={i % 3 === 0 ? 2.6 : 1.7} key={i} />
            ))}
          </g>
        ))}
        {DRIFT.map(([x, y, g], k) => (
          <g transform={`translate(${x} ${y})`} key={k}>
            <path className="obs-glyph" d={GLYPHS[g]} style={{ '--k': k }} />
          </g>
        ))}
      </svg>
      <svg className="obs-floor" viewBox="-500 -100 1000 200" focusable="false">
        {RINGS.map((r, k) => (
          <ellipse className="obs-ring" rx={r} ry={fix(r * LIE)} style={{ '--k': k }} key={r} />
        ))}
        {spokes.map((s, k) => (
          <line className="obs-spoke" x1={fix(s[0])} y1={fix(s[1])} x2={fix(s[2])} y2={fix(s[3])} key={k} />
        ))}
        {band.map((g, k) => (
          <g transform={`translate(${fix(g.x - 3)} ${fix(g.y - 2.4)}) scale(0.6 ${fix(0.3 + 0.08 * g.near)})`} key={k}>
            <path className="obs-rune" d={g.d} />
          </g>
        ))}
      </svg>
    </div>
  );
}
