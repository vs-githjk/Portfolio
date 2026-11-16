import { anchorRect, columnsOf } from './anchors';
import { neighbourText } from './piece';

/* Where the wyrm is, and what it is doing there. It has five stations and is
   nowhere else: a glimpse far under the first waterline, one pass round the
   giant, the breach at the shore, the roost over the commit graph (one vertebra
   over each week's column), and the flight into the dawn. Inside a station the
   scroll is the clock (the flight alone runs on time, once, when the dawn is
   asked for). Between stations it is not drawn.

   Every pose is written in window px (x and y from the middle of the window, y
   down) so it can be reasoned about against the page: each station is tied to an
   anchor in the document, the light is held inside that anchor's band, and the
   text boxes inside it are keep-out boxes. A station whose anchor is missing is
   off. */

const sm = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const GUTTER = 16; // px the creature keeps from a window edge where it is laid out whole
const TAIL_REACH = 7 * 0.96; // body units the tail runs on past the oldest week at the roost
/* The roost pose, in body units. */
const NECK_WEEKS = 9; // the newest weeks rise as the neck
const NECK_LIFT = 7.2; // how high the newest week is carried
const REACH = 8.6; // how far the snout stands out past the newest week
const FADE = 40; // px: the soft edge at the top of the band
const POSE_H = 13.2; // ground to the top of the horns and the raised wings
const ROOST_WINGS = [
  { sweep: 0.82, len: 0.5, fan: 0.9 },
  { sweep: 0.08, len: 0.4, fan: 0.8 },
]; // near side, far side: sweep toward the tail (rad), length and how far the fingers open (0 to 1)
const WING_BACK = 13; // how far behind the wing root a raised wing reaches

/* A path through waypoints [x, y, z, size], sampled densely (Catmull-Rom), then
   walked by distance along it in the window plane. Past either end it runs on
   straight, so a body can trail in from off screen and leave the same way. */
function makePath(way, per = 14) {
  const pts = [];
  const n = way.length;
  const get = (i) => way[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      pts.push([0, 1, 2, 3].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  pts.push(way[n - 1].slice());
  const len = new Float32Array(pts.length);
  for (let i = 1; i < pts.length; i++) len[i] = len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const total = len[pts.length - 1];
  let hint = 1;
  /* out = [x, y, z, size], tan = [tx, ty] (unit, in the window plane) */
  function at(s, out, tan) {
    const last = pts.length - 1;
    if (s <= 0 || s >= total) {
      const [a, b] = s <= 0 ? [pts[0], pts[1]] : [pts[last - 1], pts[last]];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tx = (b[0] - a[0]) / d;
      const ty = (b[1] - a[1]) / d;
      const from = s <= 0 ? pts[0] : pts[last];
      const run = s <= 0 ? s : s - total;
      out[0] = from[0] + tx * run;
      out[1] = from[1] + ty * run;
      out[2] = from[2];
      out[3] = from[3];
      tan[0] = tx;
      tan[1] = ty;
      return;
    }
    if (hint > last) hint = last;
    while (hint > 1 && len[hint - 1] > s) hint--;
    while (hint < last && len[hint] < s) hint++;
    const a = pts[hint - 1];
    const b = pts[hint];
    const seg = len[hint] - len[hint - 1] || 1;
    const t = (s - len[hint - 1]) / seg;
    for (let c = 0; c < 4; c++) out[c] = a[c] + (b[c] - a[c]) * t;
    tan[0] = (b[0] - a[0]) / seg;
    tan[1] = (b[1] - a[1]) / seg;
  }
  return { at, total, lengthAt: (wayIndex) => len[Math.min(pts.length - 1, wayIndex * per)] };
}

export function createWyrmStations({ live, phone }) {
  const L = live.length; // body units, snout to tail tip
  const head = live.head; // how many nodes are head
  const N = live.count();
  const wingRoot = Math.min(9, N * 0.18);
  const env = { w: 1, h: 1 };
  const st = { glimpse: null, pass: null, breach: null, roost: null, flight: null };
  const out4 = [0, 0, 0, 1];
  const tan = [1, 0];
  const cam = { x: 0, y: 0, z: 1 };
  const shown = { station: '', u: 0 };
  let flightAt = -1; // seconds, when the dawn was asked for
  let flown = false;

  // Every text box in the station's band: inside the anchor, and beside it in its row.
  const boxesOf = (rect, band) => (rect ? neighbourText(rect.el, band ?? [rect.top - 40, rect.bottom + 40]) : []);

  /* Read the page. `env` is { w, h, camZ, giant: { x, doc, r, k }, surf (the first
     waterline, document px), sun: { x, doc } }. */
  function layout(e) {
    Object.assign(env, e);
    const { w } = env;

    // 1 The glimpse: under the first waterline, inside the surface anchor.
    const surface = anchorRect('surface');
    st.glimpse = null;
    if (surface && surface.bottom - env.surf > 110) {
      const room = surface.bottom - env.surf;
      const scale = Math.min(phone ? 3.4 : 5, room / 44);
      st.glimpse = { rect: surface, scale, boxes: boxesOf(surface), y: env.surf + room * 0.56, band: [env.surf + 14, surface.bottom] };
    }

    // 2 The pass: once round the giant, in the plane of its ring, behind it over the top.
    const giant = anchorRect('giant');
    st.pass = null;
    if (giant && env.giant) {
      const g = env.giant;
      // A phone's creature is small enough to be seen whole: snout to tail in about two thirds of the window.
      const scale = phone ? Math.min(4.2, (w * 0.7) / L) : Math.max(9, Math.min(14.5, w / 100));
      const a = g.r * 1.95;
      const b = g.r * 0.66;
      const rot = 0.36;
      const cr = Math.cos(rot);
      const sr = Math.sin(rot);
      const E = (th, size = 1) => {
        const x = a * Math.cos(th);
        const y = b * Math.sin(th);
        return [x * cr - y * sr, x * sr + y * cr, -220 + 2.5 * g.r * Math.sin(th), size];
      };
      const left = -w / 2 - g.x - 80;
      let way;
      let lap; // the waypoint where the lap ends and the leaving begins
      if (phone) {
        /* A phone's window is one giant wide: wound round it the creature was a
           tangle of wing and disc. Here it comes in over the open water left of
           the giant, whole and side on, then climbs away behind the giant's
           shoulder (the disc hides it) and is gone. */
        const r = g.r;
        way = [
          [left - 200, r * 0.62, 60, 1],
          [left, r * 0.56, 60, 1],
          [-r * 3.3, r * 0.4, 60, 1],
          [-r * 2.45, r * 0.1, 40, 1],
          [-r * 1.62, -r * 0.3, 0, 1],
          [-r * 0.7, -r * 0.92, -160, 0.9],
          [r * 0.4, -r * 1.05, -420, 0.72],
          [r * 1.9, -r * 0.86, -760, 0.52],
          [r * 3.6, -r * 0.8, -1000, 0.4],
        ];
        lap = 4;
      } else {
        way = [
          [left - 200, -g.r * 0.5, 60, 1],
          [left, -g.r * 0.34, 60, 1],
        ];
        for (let th = 0.78 * Math.PI; th > -0.76 * Math.PI; th -= Math.PI / 9) way.push(E(th));
        way.push(E(-0.78 * Math.PI, 0.92));
        way.push([Math.min(left * 0.72, -a * 1.25), -g.r * 0.92, -520, 0.7]);
        way.push([left - 60, -g.r * 1.2, -900, 0.42]);
        way.push([left - 400, -g.r * 1.32, -1100, 0.36]);
        lap = way.length - 3;
      }
      const path = makePath(way);
      // Its sky is the whole row the window sits in (a heading may share it: the text
      // there is kept out box by box), up through the clear space over that row.
      const up = giant.el.parentElement;
      const row = up && !up.matches('main, body, .page') ? up.getBoundingClientRect() : null;
      const sec = giant.el.closest('section')?.getBoundingClientRect();
      const y = window.scrollY;
      const top = Math.max(giant.top - env.h * 0.4, Math.min(giant.top, sec ? sec.top + y : giant.top, row ? row.top + y : giant.top));
      const bottom = Math.max(giant.bottom, row ? row.bottom + y : giant.bottom);
      const sky = { el: giant.el, top, bottom, h: bottom - top };
      // The clock. On a phone the row under the window is long (the heading and the
      // chart stack under it), so the pass is timed on the window itself: it is at
      // its turn, whole, when the giant is in the middle of the screen.
      const clock = phone ? [giant.mid - env.h * 0.74, env.h] : [sky.top - env.h * 0.42, sky.h + env.h * 0.84];
      st.pass = { rect: sky, scale, path, clock, lapEnd: path.lengthAt(lap), boxes: boxesOf(sky, [top, bottom]), band: [top, bottom] };
    }

    // 3 The breach: up out of the water through the second waterline, into the dusk.
    const shore = anchorRect('shore');
    st.breach = null;
    if (shore && shore.h > 300) {
      const H = shore.h;
      const scale = phone ? Math.min(4.6, (w * 0.78) / L) : Math.max(9, Math.min(13.5, w / 112));
      // Low and to the left the vista carries its line of text: the climb keeps right of it.
      // On a phone the line stands in the sky at the top of the vista (it is as wide
      // as the window), and the climb is an S under it: up out of the water on the
      // left, over the camp, and back across the low sun.
      const way = phone
        ? [
            [-w * 0.8, H * 1.2, 40, 1],
            [-w * 0.46, H * 1.0, 40, 1],
            [-w * 0.14, H * 0.82, 20, 1],
            [w * 0.14, H * 0.64, 0, 1],
            [w * 0.2, H * 0.47, -10, 1],
            [w * 0.04, H * 0.37, -30, 1],
            [-w * 0.3, H * 0.34, -80, 0.94],
            [-w * 0.78, H * 0.36, -320, 0.74],
            [-w * 1.3, H * 0.36, -640, 0.5],
          ]
        : [
            [-w * 0.3, H * 1.5, 40, 1],
            [-w * 0.16, H * 1.2, 40, 1],
            [-w * 0.02, H * 0.9, 20, 1],
            [w * 0.1, H * 0.58, 0, 1],
            [w * 0.2, H * 0.3, -20, 1],
            [w * 0.33, H * 0.16, -60, 0.94],
            [w * 0.5, H * 0.14, -200, 0.8],
            [w * 0.7, H * 0.17, -500, 0.6],
            [w * 0.95, H * 0.16, -800, 0.42],
          ];
      st.breach = { rect: shore, scale, path: makePath(way), boxes: boxesOf(shore), band: [shore.top, shore.bottom] };
    }

    // 4 The roost: on watch over the graph, one vertebra over each week's column,
    // the newest weeks rising as its neck, the head held high and looking out.
    const roost = anchorRect('roost');
    const graph = anchorRect('graph');
    st.roost = null;
    if (roost && graph) {
      const cols = columnsOf(graph.el, N);
      if (cols) {
        const y0 = window.scrollY;
        /* Its sky. A note may stand over the anchor: where the note stops short of
           the creature's tall half (wings, neck, head), the band rises past it, up
           to a clear margin under whatever stands over the note. Where the note
           runs the whole width (a phone) the band is the anchor alone. No light
           ever depends on a keep-out box to stay off the note. */
        let over = roost.el.previousElementSibling;
        let noteRight = -1;
        let noteBottom = -1;
        while (over && over.matches('p')) {
          const r = document.createRange();
          r.selectNodeContents(over);
          for (const b of r.getClientRects()) {
            noteRight = Math.max(noteRight, b.right);
            noteBottom = Math.max(noteBottom, b.bottom + y0);
          }
          over = over.previousElementSibling;
        }
        const ceiling = over ? over.getBoundingClientRect().bottom + y0 + 8 : roost.top;
        const tallLeft = cols.xs[N - 1] - (wingRoot + WING_BACK) * cols.pitch;
        const open = noteRight < 0 || noteRight + 28 < tallLeft;
        // Shut in under a full-width note, it still has the gap between the note and the anchor.
        const shut = noteBottom < 0 ? roost.top : Math.min(roost.top, Math.max(noteBottom + 4, roost.top - 40));
        let top = open ? Math.min(roost.top, Math.max(ceiling, roost.top - 170)) : shut;
        const fitH = () => (roost.bottom - top - FADE) / POSE_H; // the band's edge is a soft fade: nothing is posed inside it
        let scale = Math.min(cols.pitch, fitH());
        let fit = false;
        // Room for the head past the newest week: a little smaller before it is cut.
        const room = env.w - GUTTER - cols.xs[N - 1];
        if (REACH * scale > room) {
          if (room / REACH >= cols.pitch * 0.7) scale = room / REACH;
          else fit = true;
        }
        // The tail curls up tighter where the oldest week is near the window's edge.
        let tailRoom = (cols.xs[0] - GUTTER) / scale - 0.6;
        if (tailRoom < 2.4) fit = true;
        /* A window too narrow for the columns plus its head and tail (a phone, whose
           graph shows the latest months; a narrow laptop by a little): it is drawn
           whole, snout to tail tip inside the gutters, one vertebra a week as
           ever, each as near the next as it takes, so the body is as large as the
           band allows. */
        if (fit) {
          tailRoom = 3.4;
          const wide = env.w - 2 * GUTTER;
          const ends = tailRoom + 0.6 + REACH;
          scale = Math.min(cols.pitch, fitH());
          let gap = (wide - ends * scale) / (N - 1);
          if (gap < 0.5 * scale) {
            scale = wide / ((N - 1) * 0.5 + ends);
            gap = 0.5 * scale;
          }
          gap = Math.min(gap, cols.pitch);
          // Laid out from the snout's side, so on a narrow laptop the weeks stay close to their columns.
          const xEnd = env.w - GUTTER - REACH * scale;
          const xs = new Float32Array(N);
          for (let i = 0; i < N; i++) xs[i] = xEnd - (N - 1 - i) * gap;
          cols.xs = xs;
        }
        // The tail's curl: an arc of its own length whose reach is the room it has.
        const tailLen = TAIL_REACH;
        let lo = 0.02;
        let hi = 2.6 / tailLen;
        for (let i = 0; i < 18; i++) {
          const m = (lo + hi) / 2;
          if (Math.sin(m * tailLen) / m > tailRoom) lo = m;
          else hi = m;
        }
        const band = [top, roost.bottom + 2];
        st.roost = { rect: roost, cols, scale, fit, small: scale < 12, curl: Math.max(lo, 0.16), ground: roost.bottom - 8, boxes: boxesOf(roost, band), band };
      }
    }

    // 5 The flight: off into the dawn along the limb, inside the horizon's band.
    const horizon = anchorRect('horizon');
    st.flight = null;
    if (horizon && env.sun) {
      const contact = anchorRect('contact');
      const scale = phone ? 4.6 : Math.max(6.5, Math.min(9.5, w / 150));
      // The whole section the contact anchor sits in is the flight's sky.
      const sec = contact?.el.closest('section')?.getBoundingClientRect();
      const top = sec ? sec.top + window.scrollY : contact ? contact.top : horizon.top;
      const h = env.h;
      const sx = env.sun.x;
      const S = env.sun.doc; // the sun's place on the limb, document px
      // The limb is highest in the middle of the window and falls away to the sides.
      const limb = (x) => S - (sx * sx - x * x) / (2 * env.sun.r);
      // With margins it comes down out of the night on the right, where the section
      // has no text, and dives into the sun. On a phone it keeps to the horizon's own
      // band: in from the left, low over the night side of the world (light on dark,
      // where it reads), then up into the sun on the limb.
      const way = phone
        ? [
            [-w / 2 - 220, limb(-w / 2) - 22, 0, 1],
            [-w / 2 - 20, limb(-w / 2) - 20, 0, 1],
            [-w * 0.2, limb(-w * 0.2) - 20, -40, 0.96],
            [sx - w * 0.22, S - 26, -140, 0.82],
            [sx - w * 0.06, S - 46, -240, 0.58],
            [sx + 4, S - 66, -289, 0.34],
          ]
        : [
            [w * 0.6, S - h * 0.6, 0, 1],
            [w * 0.51, S - h * 0.555, 0, 1],
            [w * 0.38, S - h * 0.43, -40, 1],
            [w * 0.28, S - h * 0.27, -110, 0.9],
            [w * 0.225, S - h * 0.14, -200, 0.68],
            [sx + w * 0.022, S - h * 0.055, -260, 0.42],
            [sx + 5, S - 12, -289, 0.16],
          ];
      // On a phone it is gone into the light while it is still whole: wings, not a trailing thread.
      st.flight = { rect: horizon, scale, gone: phone ? [0.56, 0.16] : [0.86, 0.14], path: makePath(way), boxes: boxesOf(contact, [top - 40, horizon.bottom]), band: [phone ? horizon.top : top, horizon.bottom] };
    }
  }

  function guard(s, f) {
    live.guard(
      s.boxes.map((b) => [b[0], b[1] - f.scroll, b[2], b[3] - f.scroll]),
      [s.band[0] - f.scroll, s.band[1] - f.scroll]
    );
    live.water(f.top, f.exit);
  }

  // A body following a path: the snout at `sHead`, every node behind it along the
  // path, swimming (a wave that grows toward the tail, across the path).
  function follow(s, sHead, f, { oy = 0, swim = 1, x0 = 0 } = {}) {
    return (k, d, out) => {
      s.path.at(sHead - d * s.scale, out4, tan);
      const u = d / L;
      const wave = Math.sin(f.t * 1.5 - d * 0.24) * (0.25 + 2.3 * u) * s.scale * swim * out4[3];
      out[0] = x0 + out4[0] - tan[1] * wave;
      out[1] = oy + out4[1] + tan[0] * wave;
      out[2] = out4[2];
      out[3] = out4[3];
    };
  }

  /* f: { t, scroll, line, cam: { x, y, z }, top, exit, rise, dawn, dpr, resY }.
     Returns the name of the station drawn, or ''. */
  function update(f, still = false) {
    const h = env.h;
    cam.x = f.cam.x;
    cam.y = f.cam.y;
    cam.z = f.cam.z;
    const base = { t: still ? 0 : f.t, cam, dpr: f.dpr, resY: f.resY };
    const draw = still ? live.still : live.update;
    shown.station = '';

    // 5 first: once the dawn is asked for, the flight owns the creature for its length.
    if (st.flight && flightAt >= 0 && !flown) {
      const s = st.flight;
      const T = 6.2;
      const u = still ? 0.82 : clamp01((f.t - flightAt) / T);
      if (u >= 1) flown = true;
      const on = s.rect.top - f.scroll < h + 200 && s.rect.bottom - f.scroll > -200;
      if (on && !flown) {
        const e = 1 - Math.pow(1 - u, 1.8); // off at once, slower as it nears the sun
        const sHead = e * (s.path.total + L * s.scale * 0.5);
        guard(s, f);
        draw({ ...base, scale: s.scale, at: follow(s, sHead, f, { oy: -f.line, swim: 0.7 }), beat: 1, show: sm(u / 0.08) * (1 - sm((u - s.gone[0]) / s.gone[1])), solid: 0.6, air: 1.8 });
        shown.station = 'flight';
        shown.u = u;
        return 'flight';
      }
    }

    // 4 The roost.
    if (st.roost && !(flightAt >= 0 && !still)) {
      const s = st.roost;
      const top = s.rect.top - f.scroll;
      if (top < h + 60 && s.rect.bottom - f.scroll > -60) {
        const sc = s.scale;
        const xs = s.cols.xs;
        const hw = env.w / 2;
        const ground = s.ground - f.line;
        const xLast = xs[N - 1] - hw;
        const neck = live.neck;
        const lift = NECK_LIFT * sc;
        const thin = (j) => 0.5 + 0.5 * sm(j / NECK_WEEKS); // a neck, not a second chest
        // The neck's slope where it meets the head, and the head's line from there:
        // it carries the climb on, levels, then dips, so the snout looks out and a
        // little down over the ground in front of it.
        const dx = xs[N - 1] - xs[N - 2];
        const a0 = -Math.atan2((lift * 1.7) / NECK_WEEKS, dx);
        const a1 = 0.46;
        const yTop = ground - live.radius(head) * sc * thin(0) - lift;
        const at = (k, d, out) => {
          const wk = live.weekOf(k);
          out[3] = 1;
          out[2] = 0;
          if (wk >= 0) {
            const j = N - 1 - wk;
            const up = j < NECK_WEEKS ? Math.pow(1 - j / NECK_WEEKS, 1.7) : 0;
            out[3] = thin(j);
            out[0] = xs[wk] - hw;
            out[1] = ground - live.radius(k) * sc * out[3] - lift * up;
          } else if (k < head) {
            const q = neck - d; // body units from the newest vertebra toward the snout
            let x = 0;
            let y = 0;
            const steps = 14;
            for (let i = 0; i < steps; i++) {
              const u = ((i + 0.5) / steps) * q;
              const a = a0 + (a1 - a0) * sm(u / 5.2);
              x += Math.cos(a);
              y += Math.sin(a);
            }
            out[0] = xLast + (x * q * sc) / steps;
            out[1] = yTop + (y * q * sc) / steps;
          } else {
            // The tail runs on past the oldest week and curls up and over at its tip.
            const i = (k - head - N + 1) * 0.96;
            const c = s.curl;
            out[0] = xs[0] - hw - (Math.sin(c * i) / c) * sc;
            out[1] = ground - live.radius(k) * sc - ((1 - Math.cos(c * i)) / c) * sc;
          }
        };
        guard(s, f);
        // Awake at rest: eye open, spikes up, the near wing swept back and the far
        // wing raised behind it, so the pair stand as a V over the shoulders.
        // Drawn small (a phone) it is drawn fuller, or it is a brown smudge on the dark.
        draw({ ...base, scale: sc, at, sleep: 0.42, wings: ROOST_WINGS, beat: 0, show: 1, solid: s.small ? 0.55 : 0.4, air: s.small ? 4.6 : 3, up: [0, 1, 0.22] });
        shown.station = 'roost';
        return 'roost';
      }
    }

    // 3 The breach.
    if (st.breach) {
      const s = st.breach;
      const u = (f.scroll - (s.rect.top - h * 0.82)) / (s.rect.h * 0.62 + h * 0.82);
      if (u > 0 && u < 1) {
        const sHead = u * (s.path.total + L * s.scale * 0.9);
        guard(s, f);
        draw({ ...base, scale: s.scale, at: follow(s, sHead, f, { oy: s.rect.top - f.line, swim: 0.8 }), beat: 0.3 + 0.7 * f.rise, show: sm(u / 0.05) * (1 - sm((u - 0.9) / 0.1)), solid: 0.9, air: 2.2 });
        shown.station = 'breach';
        shown.u = u;
        return 'breach';
      }
    }

    // 2 The pass.
    if (st.pass) {
      const s = st.pass;
      const u = (f.line - s.clock[0]) / s.clock[1];
      if (u > 0 && u < 1) {
        const g = env.giant;
        // With the anchor in the middle of the window the body is wound round the
        // giant: the head coming out from behind it, the tail still in front.
        const wound = s.lapEnd - 60;
        const end = s.path.total + L * s.scale * 0.6;
        const sHead = u < 0.56 ? wound * clamp01((u - 0.1) / 0.46) : wound + (end - wound) * ((u - 0.56) / 0.4);
        guard(s, f);
        draw({ ...base, scale: s.scale, at: follow(s, sHead, f, { x0: g.x, oy: (g.doc - f.line) / g.k, swim: 0.9 }), beat: 0.36, show: sm((u - 0.08) / 0.05) * (1 - sm((u - 0.9) / 0.07)), solid: 0 });
        shown.station = 'pass';
        shown.u = u;
        return 'pass';
      }
    }

    // 1 The glimpse.
    if (st.glimpse) {
      const s = st.glimpse;
      const lineY = env.surf - f.scroll; // where the waterline is in the window
      const u = (h * 0.78 - lineY) / (h * 0.7);
      if (u > 0 && u < 1) {
        const span = env.w + L * s.scale + 120;
        const x = env.w / 2 + 60 - u * span;
        const at = (k, d, out) => {
          const q = d / L;
          out[0] = x + d * s.scale;
          out[1] = s.y - f.line + Math.sin(d * 0.2 - f.t * 1.2) * (0.6 + 2.6 * q) * s.scale + Math.sin(u * 5 + d * 0.05) * 10;
          out[2] = -700;
          out[3] = 1;
        };
        guard(s, f);
        draw({ ...base, scale: s.scale, at, beat: 0.3, show: 0.5 * sm(u / 0.12) * (1 - sm((u - 0.85) / 0.15)), solid: 0 });
        shown.station = 'glimpse';
        shown.u = u;
        return 'glimpse';
      }
    }

    live.update({ ...base, scale: 1, at: () => {}, show: 0 });
    return '';
  }

  return {
    layout,
    update,
    still: (f) => update(f, true),
    shown,
    /** The dawn was asked for at time t (seconds): the flight plays once. */
    fly(t) {
      if (flightAt < 0) flightAt = t;
    },
    get stations() {
      return st;
    },
  };
}
