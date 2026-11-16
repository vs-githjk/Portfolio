/* The room the hologram stands in, the part drawn over the page (the sky behind
   him is WelcomeBackdrop, in the fixed background). Decoration (aria-hidden),
   SVG and CSS, and deliberately little: a first pass with circuit traces,
   numbered nodes, drifting glyphs and sparks read as unfinished.

     the floor   rings of light on the ground round the projector plate, with a
                 band of gold runes like the ones round his crystal; the
                 stylesheet puts it on the plate (--plate-x, --plate-y from
                 lib/face.js) and fades it out before it reaches the plaque
     the sky     four small constellations, high at the sides, faint

   Every position is written here, so the server and the browser draw the same
   picture. A phone gets the floor and two constellations. */

/* Runes: strokes in a 10 by 16 box, of no alphabet. */
const GLYPHS = ['M2 0V16M2 2l6 4-6 4', 'M5 0V16M1 4l8 6', 'M2 0V16M8 0V16M2 4l6 6', 'M5 0V16M1 5l4-4 4 4', 'M1 0l8 16M9 0l-8 16', 'M2 0V16M2 0l6 5-6 5', 'M5 0V16M1 12l4 4 4-4', 'M1 4l4-4 4 4M5 0V16'];

/* The floor, in a 1000 by 200 box with the plate at its middle. Rings are seen
   edge on: their height is LIE of their width. */
const LIE = 0.19;
const RINGS = [150, 215, 300, 395, 490];
const BAND = 258; // the runes stand between the second and third rings
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

/* The sky, in a 1600 by 900 box that covers the screen: two constellations a
   side, mirrored in placement, high up where nothing else is. */
const STARS = [
  { side: 'a', line: [[70, 80], [150, 50], [230, 100], [300, 60]], spur: [[150, 50], [170, 150]] },
  { side: 'b', line: [[440, 40], [520, 90], [600, 50]] },
  { side: 'a', line: [[1300, 60], [1370, 100], [1450, 50], [1530, 80]], spur: [[1450, 50], [1430, 150]] },
  { side: 'b', line: [[1000, 50], [1080, 90], [1160, 40]] },
];
const path = (pts) => pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');

export default function WelcomeScene() {
  return (
    <div className="obs" aria-hidden="true">
      <svg className="obs-sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMin slice" focusable="false">
        {STARS.map((c, k) => (
          <g className="obs-con" data-side={c.side} style={{ '--k': k }} key={k}>
            <path d={path(c.line) + (c.spur ? path(c.spur) : '')} />
            {[...c.line, ...(c.spur ? [c.spur[1]] : [])].map(([x, y], i) => (
              <circle cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.6} key={i} />
            ))}
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
