import { useEffect, useRef } from 'react';
import { welcome } from '../data/content';
import { face } from '../lib/face';

/* The room the hologram stands in: an engineer's workshop that happens to be
   magical. This is the part of it drawn over the page (the dusk and the mountain
   range behind him are WelcomeBackdrop, in the fixed background). All of it is
   decoration (aria-hidden), all of it SVG and CSS, and none of it touches the
   figure or sits on the greeting:

     the floor    rings of light on the ground round the projector plate, with a
                  band of gold glyphs like the ones round his crystal; the
                  stylesheet puts it on the plate (--plate-x, --plate-y from
                  lib/face.js) and fades it out before it reaches the greeting
     the traces   the runes resolve into circuit: fine traces run from the plate
                  to the base of each panel (a wide window only), turning at 45
                  degrees like a board, with a node where one branches and a
                  pulse of light travelling along each. They are laid out from
                  the panels' real places (below), each numbered in mono.
     the sky      four small constellations at the sides, a few gold glyphs that
                  drift slowly upward there, and a few ember sparks low down

   Every position but the traces is written here, so the server and the browser
   draw the same picture. A phone gets the floor and two constellations. */

/* Which panel a trace comes from: the plate, or the panel it branches off. */
const FEED = { l1: null, l3: null, r1: null, r3: null, l2: 'l1', l4: 'l3', r2: 'r1', r4: 'r3' };
const SEATS = welcome.hub.map((item) => item.at);

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
const EMBERS = [
  [120, 640, 0], [300, 700, 2], [210, 590, 4], [420, 720, 1], [1480, 650, 3], [1300, 710, 5], [1390, 600, 1], [1180, 730, 4],
];
const path = (pts) => pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');
const pad2 = (k) => String(k).padStart(2, '0');

export default function WelcomeScene() {
  const host = useRef(null);

  /* The traces are laid out from where the panels really are: layout offsets (never
     transforms, so a floating panel does not move its trace), on mount and on resize. */
  useEffect(() => {
    const obs = host.current;
    const wide = window.matchMedia('(min-width: 761px)');
    const lay = () => {
      const hub = obs.parentElement.querySelector('.hub');
      if (!wide.matches || !face.emit || !hub) return;
      const origin = obs.getBoundingClientRect();
      const plate = { x: face.emit.x - (origin.left + window.scrollX), y: face.emit.y - (origin.top + window.scrollY), w: face.emit.w };
      const base = {};
      for (const panel of hub.querySelectorAll('.hub-panel')) {
        const pic = panel.querySelector('.hub-pic');
        const left = panel.dataset.at[0] === 'l';
        base[panel.dataset.at] = {
          foot: [panel.offsetLeft + panel.offsetWidth / 2, panel.offsetTop + panel.offsetHeight + 7],
          side: [panel.offsetLeft + (left ? panel.offsetWidth + 8 : -8), panel.offsetTop + pic.offsetHeight / 2],
        };
      }
      SEATS.forEach((at, k) => {
        const line = obs.querySelector(`[data-trace="${at}"]`);
        if (!line || !base[at]) return;
        const left = at[0] === 'l';
        const from = FEED[at] ? base[FEED[at]].foot : [plate.x + (left ? -1 : 1) * plate.w * (at[1] === '1' ? 1.75 : 2.45), plate.y];
        // A panel fed from one above it is met at its side, not through its picture.
        const to = FEED[at] && base[at].foot[1] > from[1] + 24 ? base[at].side : base[at].foot;
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const d = Math.min(Math.abs(dy), Math.abs(dx) * 0.5);
        const elbow = [to[0] - Math.sign(dx) * d, from[1]];
        const turn = [to[0], from[1] + Math.sign(dy) * d];
        const route = `M${from[0].toFixed(1)} ${from[1].toFixed(1)}H${elbow[0].toFixed(1)}L${turn[0].toFixed(1)} ${turn[1].toFixed(1)}V${to[1].toFixed(1)}`;
        for (const part of line.querySelectorAll('path')) part.setAttribute('d', route);
        const [a, b] = line.querySelectorAll('circle');
        a.setAttribute('cx', elbow[0].toFixed(1));
        a.setAttribute('cy', elbow[1].toFixed(1));
        b.setAttribute('cx', to[0].toFixed(1));
        b.setAttribute('cy', to[1].toFixed(1));
        const label = line.querySelector('text');
        label.setAttribute('x', (elbow[0] + (left ? 8 : -8)).toFixed(1));
        // A branch's number sits over its line, clear of the caption beside it.
        label.setAttribute('y', (elbow[1] + (FEED[at] ? -7 : 14)).toFixed(1));
        label.textContent = pad2(k + 1);
      });
      obs.dataset.traced = '';
    };
    lay();
    const ro = new ResizeObserver(lay);
    ro.observe(obs);
    // The plate's place is known a moment after the figure's picture has loaded.
    const mo = new MutationObserver(lay);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <div className="obs" aria-hidden="true" ref={host}>
      <svg className="obs-traces" focusable="false">
        {SEATS.map((at, k) => (
          <g className="obs-trace" data-trace={at} data-side={at[0]} style={{ '--k': k }} key={at}>
            <path className="obs-wire" />
            <path className="obs-pulse" pathLength="100" />
            <circle className="obs-node" r="2" />
            <circle className="obs-node" data-end="" r="2.6" />
            <text className="obs-tag" textAnchor={at[0] === 'l' ? 'start' : 'end'} />
          </g>
        ))}
      </svg>
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
        {EMBERS.map(([x, y, k], i) => (
          <g transform={`translate(${x} ${y})`} key={i}>
            <circle className="obs-ember" r={1.4 + (i % 3) * 0.5} style={{ '--k': k }} />
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
