import { anchorRect, columnsOf } from './anchors';
import { neighbourText } from './piece';
import { MODEL } from './dragon';

/* Where the dragon is, and what it is doing there. It has three stations and is
   nowhere else: one lap round the giant under water, the breach at the shore
   with a long sweep across the low sun, and the roost on the commit card (it
   sits there on watch). Inside a station the scroll is the clock; on the roost
   it runs on time. Between stations it is not drawn. The page's last screen
   (Contact and the limb) has no dragon: a pass there read as out of place
   (Vidyut, Nov 16).

   Every place is written in window px from the middle of the window (y down)
   plus a depth, so it can be reasoned about against the page: each station is
   tied to an anchor in the document, its light is held inside that anchor's
   band, and the text boxes there are keep-out boxes. A station whose anchor is
   missing is off. */

const sm = (t) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const mix = (a, b, t) => a + (b - a) * t;
const GUTTER = 16;

/* A path through waypoints [x, y, z], Catmull-Rom, by parameter 0 to 1. */
function makePath(way) {
  const n = way.length;
  const get = (i) => way[Math.max(0, Math.min(n - 1, i))];
  return (u, out) => {
    const f = clamp01(u) * (n - 1);
    const i = Math.min(n - 2, Math.floor(f));
    const t = f - i;
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    for (let c = 0; c < 3; c++) out[c] = 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
    return out;
  };
}

export function createDragonStations({ live, phone, C }) {
  const env = { w: 1, h: 1 };
  const st = { pass: null, breach: null, roost: null };
  const cam = { x: 0, y: 0, z: 1 };
  const shown = { station: '', u: 0 };
  const a3 = [0, 0, 0];
  const b3 = [0, 0, 0];
  const fwd = [1, 0, 0];
  let landAt = -1; // seconds, when the roost first came into the window
  let lookWeek = null; // { x (window px), until (seconds) }
  let lastScroll = 0;
  let pace = 0;

  /* The light of each place, from the page's own palette. */
  const v = (name, k = 1) => [C[name].x * k, C[name].y * k, C[name].z * k];
  const LIGHT = {
    sea: { keyDir: [0.25, 0.9, 0.35], key: v('sea-ray', 0.95), lowDir: [0, -1, 0.2], low: v('sea-shallow', 0.5), amb: v('sea-shallow', 1.15), hide: v('dragon-hide', 1.25), belly: v('dragon-belly', 0.8), wing: v('dragon-wing', 0.9), rim: v('sea-ray', 0.9), glow: v('dragon-glow'), fogK: 0.0011, caust: 0.55, rimGain: 0.85, fire: 0.55, thin: 0.22, split: 0 },
    dusk: { keyDir: [0.5, 0.22, -0.7], key: v('sun', 1.5), lowDir: [-0.3, -0.8, 0.5], low: v('dusk-low', 0.4), amb: v('dusk-mid', 1.3), hide: v('dragon-hide', 1.6), belly: v('dragon-belly'), wing: v('dragon-wing'), rim: v('earth-rim', 1), glow: v('dragon-glow'), fog: v('dusk-low', 0.82), fogK: 0.0009, caust: 0, rimGain: 1.25, fire: 0.9, thin: 0.42, split: 1 },
    night: { keyDir: [-0.5, 0.62, 0.6], key: v('moon-rim', 1.1), lowDir: [0.25, -0.85, 0.45], low: v('ember', 0.6), amb: v('night-low', 3.2), hide: v('dragon-hide'), belly: v('dragon-belly'), wing: v('dragon-wing'), rim: v('ember', 1), glow: v('dragon-glow'), fog: v('night-low'), fogK: 0, caust: 0, rimGain: 1.1, fire: 1.4, thin: 0.22, split: 0 },
  };
  let lit = '';
  const light = (name) => {
    if (lit === name) return;
    lit = name;
    live.light(LIGHT[name]);
  };

  const boxesOf = (rect, band) => (rect ? neighbourText(rect.el, band ?? [rect.top - 40, rect.bottom + 40]) : []);

  /* Read the page. `env` is { w, h, camZ, giant: { x, doc, r, k } }. */
  function layout(e) {
    Object.assign(env, e);
    const { w, h } = env;

    // 1 The pass: it comes out from behind the giant, flies one lap across its face, and goes back behind it.
    const giant = anchorRect('giant');
    st.pass = null;
    if (giant && env.giant) {
      const g = env.giant;
      const R = g.r / g.k; // the giant's radius on the screen
      const size = phone ? Math.min(11, (w * 0.62) / MODEL.span) : Math.max(15, Math.min(24, w / 62));
      // Its sky is the whole row the window sits in, up through the clear space over that row.
      const up = giant.el.parentElement;
      const row = up && !up.matches('main, body, .page') ? up.getBoundingClientRect() : null;
      const sec = giant.el.closest('section')?.getBoundingClientRect();
      const y = window.scrollY;
      const top = Math.max(giant.top - h * 0.4, Math.min(giant.top, sec ? sec.top + y : giant.top, row ? row.top + y : giant.top));
      const bottom = Math.max(giant.bottom, row ? row.bottom + y : giant.bottom) + (phone ? 0 : h * 0.12);
      const sky = { el: giant.el, top, bottom, h: bottom - top };
      const clock = phone ? [giant.mid - h * 0.6, h * 1.05] : [giant.mid - h * 0.54, h * 1.1]; // across its face when the giant is in the middle of the window
      st.pass = { rect: sky, size, R, a: R * (phone ? 0.95 : 1.42), b: R * 0.46, clock, boxes: boxesOf(sky, [top, bottom]), band: [top, bottom] };
    }

    // 2 The breach: up out of the water as the reader comes up through the surface, and away into the low sun.
    const shore = anchorRect('shore');
    st.breach = null;
    if (shore && shore.h > 300) {
      const size = phone ? Math.min(17, (w * 0.8) / MODEL.span) : Math.max(24, Math.min(40, w / 36));
      // x in window widths, y in window heights (both from the middle), z in px
      const way = phone
        ? [
            [0.14, 0.95, 60],
            [0.16, 0.62, 40],
            [0.16, 0.3, 10],
            [0.06, 0.04, -40],
            [-0.1, -0.14, -160],
            [0.04, -0.2, -300],
            [0.2, -0.16, -520],
            [0.5, -0.2, -1200],
          ]
        : [
            [0.25, 1.1, 80],
            [0.24, 0.7, 60],
            [0.22, 0.36, 20],
            [0.17, 0.1, -40],
            [0.08, -0.08, -160],
            [0.12, -0.16, -320],
            [0.24, -0.12, -480],
            [0.38, -0.14, -800],
            [0.52, -0.2, -1500],
          ];
      st.breach = { rect: shore, size, path: makePath(way), boxes: boxesOf(shore), band: [shore.top, shore.bottom] };
    }

    // 3 The roost: it lands on the commit card and keeps watch over the graph.
    const roost = anchorRect('roost');
    const graph = anchorRect('graph');
    st.roost = null;
    if (roost) {
      const y0 = window.scrollY;
      /* Its sky is the band over the card. A note may stand over the band: where
         the note stops short of the creature, the band rises past it, up to a
         clear margin under whatever stands over the note. */
      let over = roost.el.previousElementSibling;
      let noteRight = -1;
      while (over && over.matches('p')) {
        const r = document.createRange();
        r.selectNodeContents(over);
        for (const b of r.getClientRects()) noteRight = Math.max(noteRight, b.right);
        over = over.previousElementSibling;
      }
      const ceiling = over ? over.getBoundingClientRect().bottom + y0 + 10 : roost.top;
      // Head to the left and toward the reader, tail away to the right: about 12 units wide, 8.4 tall.
      const wide = 14.5;
      const reach = 6.5; // from the feet to the snout, on the screen
      let size = Math.min((roost.h - 6) / (MODEL.tall + 2.4), (Math.min(roost.w, w - 2 * GUTTER) * (phone ? 0.98 : 0.6)) / wide);
      const xFeet = phone ? roost.left + reach * size + 6 : roost.right - (wide - reach) * size - roost.w * 0.04;
      const open = !phone && (noteRight < 0 || noteRight + 28 < xFeet - reach * size);
      const top = open ? Math.min(roost.top, Math.max(ceiling, roost.top - 150)) : roost.top;
      if (open) size = Math.min(size * 1.5, (roost.bottom - top - 6) / (MODEL.tall + 2.4));
      const band = [top - (open ? 40 : 6), roost.bottom + 8];
      const cols = graph ? columnsOf(graph.el, Number(graph.el.dataset?.weeks) || 53) : null;
      // The section's calm ground opens over the band (v3-sections.css reads these).
      const sec = roost.el.closest('section');
      if (sec) {
        const st0 = sec.getBoundingClientRect().top + y0;
        sec.style.setProperty('--roost-top', `${Math.round(top - st0)}px`);
        sec.style.setProperty('--roost-bottom', `${Math.round(roost.bottom - st0)}px`);
        sec.dataset.roost = '';
      }
      st.roost = { rect: roost, size, xFeet, ground: roost.bottom - 1, boxes: boxesOf(roost, [top, roost.bottom]), band, cols };
    }
  }

  function guard(s, f) {
    const band = s.band;
    live.guard(
      s.boxes.map((b) => [b[0], b[1] - f.scroll, b[2], b[3] - f.scroll]),
      [band[0] - f.scroll, band[1] - f.scroll]
    );
    live.water(f.top, f.exit);
  }

  /* The heading at `u` on a path: where it will be a moment later, as a world direction. */
  function heading(at, u, du, kz, sx = 1, sy = 1) {
    at(u, a3);
    at(u + du, b3);
    fwd[0] = (b3[0] - a3[0]) * sx * kz;
    fwd[1] = -(b3[1] - a3[1]) * sy * kz;
    fwd[2] = b3[2] - a3[2];
    return fwd;
  }

  /* f: { t, scroll, line, cam: { x, y, z }, top, exit, rise, dpr, resY }.
     Returns the name of the station drawn, or ''. */
  function update(f, still = false) {
    const { w, h } = env;
    cam.x = f.cam.x;
    cam.y = f.cam.y;
    cam.z = f.cam.z;
    const base = { t: f.t, cam, dpr: f.dpr, resY: f.resY, still };
    shown.station = '';
    // How fast the page is moving, eased: a gliding reader gets a gliding dragon.
    const ds = Math.abs(f.scroll - lastScroll);
    lastScroll = f.scroll;
    pace += (Math.min(1, ds / 14) - pace) * 0.08;

    // 3 The roost.
    if (st.roost) {
      const s = st.roost;
      const top = s.rect.top - f.scroll;
      if (top < h + 80 && s.rect.bottom - f.scroll > -80) {
        if (landAt < 0 && top < h * 0.9) landAt = f.t;
        // It is simply there, sitting on the card: it comes out of the dark as the band comes into the window.
        const L = still ? 1 : landAt < 0 ? 0 : clamp01((f.t - landAt) / 1.1);
        const x = s.xFeet - w / 2;
        const y = s.ground - f.line;
        const z = 0;
        const face = [-0.62, 0, 0.78];
        // Every so often it opens its wings, slowly, holds them, and folds them again.
        const tt = landAt < 0 ? -1 : (f.t - landAt - 1.6) % 16;
        const spread = still ? 0.85 : tt < 0 ? 0 : 0.92 * sm(tt / 3.6) * (1 - sm((tt - 8) / 3.6));
        // It looks out at the reader, slowly sweeps the ground, and glances at a chosen week.
        let yaw = -0.5 + 0.22 * Math.sin(f.t * 0.31) * (still ? 0 : 1);
        let pitch = 0.05;
        if (lookWeek && f.t < lookWeek.until) {
          const k = sm((lookWeek.until - f.t) / 0.5) * sm((f.t - lookWeek.from) / 0.35);
          const dx = (lookWeek.x - s.xFeet) / (s.size * 6);
          yaw = mix(yaw, Math.max(-1.1, Math.min(0.5, -0.5 - dx * 0.5)), k);
          pitch = mix(pitch, 0.62, k);
        }
        light('night');
        guard(s, f);
        live.update({ ...base, x, y, z, size: s.size, feet: true, fwd: face, up: [0, 1, -0.26], bank: 0, spread, clips: { perch: 1 }, look: [yaw, pitch], show: sm(L), phase: 0.2 });
        shown.station = 'roost';
        shown.u = L;
        return 'roost';
      }
    }

    // 2 The breach.
    if (st.breach) {
      const s = st.breach;
      const u = (f.scroll - (s.rect.top - h * 0.6)) / (h * 1.3);
      if (u > 0 && u < 1) {
        const e = sm(u * 1.04);
        s.path(e, a3);
        const z = a3[2];
        heading(s.path, e, 0.03, (cam.z - z) / cam.z, w, h);
        const climb = 1 - sm((e - 0.36) / 0.22); // 1 while it goes straight up
        light('dusk');
        guard(s, f);
        // Going up its back is to the reader's left; as it levels off toward the sun the reader sees it from behind and below.
        live.update({ ...base, x: a3[0] * w, y: a3[1] * h, z, size: s.size, fwd: [...fwd], up: [mix(-0.2, -0.62, climb), mix(1, 0.2, climb), mix(0.5, 0.76, climb)], bank: -0.3 * sm((e - 0.4) / 0.2) * (1 - sm((e - 0.8) / 0.2)), look: [0, -0.55], clips: { fly: 1 }, lean: mix(1.15, 1.5, climb), beat: mix(0.6, 0.85, climb), show: sm(u / 0.08) * (1 - sm((u - 0.86) / 0.12)), phase: 0.1 });
        shown.station = 'breach';
        shown.u = u;
        return 'breach';
      }
    }

    // 1 The pass.
    if (st.pass) {
      const s = st.pass;
      const u = (f.line - s.clock[0]) / s.clock[1];
      if (u > 0 && u < 1) {
        const g = env.giant;
        const gy = (g.doc - f.line) / g.k;
        // From behind the giant, down its left side, across its face and back behind it on the right.
        const at = (q, out) => {
          const th = Math.PI * (1.62 - 2.2 * q);
          out[0] = g.x / g.k + s.a * Math.cos(th);
          out[1] = gy + s.b * Math.sin(th) - s.R * 0.42;
          out[2] = -220 + (g.r * 1.75 + 60) * Math.sin(th);
          return out;
        };
        const e = clamp01((u - 0.06) / 0.88);
        at(e, a3);
        const z = a3[2];
        heading(at, e, 0.015, (cam.z - z) / cam.z);
        light('sea');
        guard(s, f);
        live.update({ ...base, x: a3[0], y: a3[1] + Math.sin(f.t * 0.6) * 4, z, size: s.size, fwd: [...fwd], up: [0, 0.8, 0.6], bank: 0.16, look: [0, -0.55], clips: { fly: 1 }, lean: 1.2, beat: 0.42 + 0.2 * pace, show: sm(e / 0.08) * (1 - sm((e - 0.93) / 0.07)), phase: 0.62 });
        shown.station = 'pass';
        shown.u = u;
        return 'pass';
      }
    }

    live.update({ ...base, show: 0 });
    return '';
  }

  return {
    layout,
    update,
    still: (f) => update(f, true),
    shown,
    /** A week of the graph was chosen (its column index), or none: it looks at it for a moment. */
    lookAt(index, t) {
      const c = st.roost?.cols;
      if (!c || !Number.isInteger(index) || index < 0 || index >= c.xs.length) lookWeek = null;
      else lookWeek = { x: c.xs[index], from: t, until: t + 2.6 };
    },
    get stations() {
      return st;
    },
  };
}
