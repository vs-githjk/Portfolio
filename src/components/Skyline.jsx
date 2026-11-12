import { useEffect, useRef, useState } from 'react';
import { clamp01, lerp, smooth } from '../lib/field';
import { MONTHS } from '../lib/months';

/* The commit skyline: the year of contributions as towers of light.

   The same build-time snapshot as the flat graph, drawn in 3D on one 2D canvas
   (no WebGL, no dependency): every day is a box on a 53 x 7 floor. Height is
   the day's count on a compressed scale (count to the power 0.4, so one
   300-contribution day does not flatten the rest of the year). Colour is the
   same five-step accent ramp as the flat graph, but ranked within this year
   (the busiest tenth of active days is the brightest step) instead of GitHub's
   own levels, which collapse to one step when a single day is an outlier. The
   busiest days carry a short beam of light, the hero's beams turned into data.
   The exact count of any day is in its tooltip.

   It is scroll-linked and otherwise still. As the card comes up the screen the
   camera drops from a plan view (the flat graph) to a low angle and the towers
   rise in a wave from the oldest week to the newest; and the model comes to
   rest square to the reader (Vidyut, Nov 12: "why is it not straight"). The
   camera stands far back, so the towers are upright from edge to edge; a mouse
   still turns it a few degrees.
   A pointer over a tower shows "n contributions on date".

   Cost control: the chunk loads only when the section is near (SkyStage), a
   frame is asked for only while the pose is still catching up with its target,
   and nothing runs while the canvas is off screen. A frame is about a thousand
   small quads. Phones draw the latest 26 weeks, the same crop as the flat
   graph. Under prefers-reduced-motion the model is drawn once in its final
   pose. The flat SVG stays in the DOM underneath as the accessible image and
   as the fallback when canvas is missing. */

const RAD = Math.PI / 180;
const PITCH_FLAT = 78; // degrees: the plan view the rise starts from
const PITCH_LOW = 30; // degrees: the resting camera
const YAW_IN = 8; // degrees of turn as the card enters; it comes to rest square to the reader
const FAR = 7; // camera distance in graph widths: far enough that every tower stands upright
const YAW_MOUSE = 5;
const CURVE = 0.4; // height = (count / busiest day) ^ CURVE
const RANKS = [0.4, 0.7, 0.9]; // share of active days below steps 2, 3 and 4
const INSET = 0.09; // gap around a box, in cells
const LABEL = 22; // px under the floor for the month labels

export default function Skyline({ days, onReady }) {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phone = window.matchMedia('(max-width: 640px)');
    const css = getComputedStyle(document.documentElement);
    const rgb = (name) => {
      ctx.fillStyle = css.getPropertyValue(name).trim();
      const s = ctx.fillStyle;
      return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
    };
    const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
    const str = (c) => `rgb(${c.join(',')})`;
    const surface = rgb('--surface');
    const acc = rgb('--acc');
    const tops = [rgb('--hair'), mix(surface, acc, 0.3), mix(surface, acc, 0.58), acc, rgb('--acc-2')];
    const TOP = tops.map(str);
    const FRONT = tops.map((c) => str(mix(c, surface, 0.42)));
    const SIDE = tops.map((c) => str(mix(c, surface, 0.66)));
    const GLOW = tops.map((c) => c.join(','));
    const INK = str(rgb('--text'));
    const FLOOR = `rgba(${acc.join(',')},0.05)`;
    const EDGE = `rgba(${acc.join(',')},0.55)`;
    const LABEL_INK = str(rgb('--text-3'));
    const font = `10px ${css.getPropertyValue('--font-mono')}`;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cells = [];
    let labels = [];
    let weeks = 0;
    let unit = 0;
    let dist = 0;
    let focal = 0;
    let top = 0; // tallest tower, in cells
    let near = false;
    let raf = 0;
    let hover = null;
    let mouse = 0;
    let first = true;
    const pose = { pitch: PITCH_LOW, yaw: 0, grow: 1 };
    const goal = { pitch: PITCH_LOW, yaw: 0, grow: 1 };

    function layout() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const start = new Date(`${days[0].date}T00:00:00Z`);
      const dow = start.getUTCDay();
      const all = Math.ceil((days.length + dow) / 7);
      weeks = phone.matches ? Math.min(26, all) : all;
      const skip = all - weeks;
      unit = (w * 0.95) / weeks;
      dist = weeks * FAR;
      focal = unit * dist;
      const floor = 7 * unit * Math.sin(PITCH_LOW * RAD);
      top = Math.max(2.5, Math.min(13, (h - LABEL - floor - 14) / (unit * Math.cos(PITCH_LOW * RAD))));
      const max = days.reduce((m, d) => Math.max(m, d.count), 1);
      const active = days.map((d) => d.count).filter(Boolean).sort((a, b) => a - b);
      const cuts = RANKS.map((r) => active[Math.min(active.length - 1, Math.floor(r * active.length))] ?? 0);
      const step = (n) => (n ? 1 + cuts.filter((c) => n > c).length : 0);
      let month = start.getUTCMonth(); // the partial first month never gets a label
      cells = [];
      labels = [];
      days.forEach((d, n) => {
        const idx = n + dow;
        const wk = Math.floor(idx / 7) - skip;
        const row = idx % 7;
        const m = new Date(`${d.date}T00:00:00Z`).getUTCMonth();
        if (row === 0 && m !== month) {
          month = m;
          if (wk >= 0 && wk < weeks - 1) labels.push({ x: wk - weeks / 2, text: MONTHS[m] });
        }
        if (wk < 0) return;
        const x = wk - weeks / 2;
        const z = row - 7; // Sunday at the back, Saturday on the front edge (z = 0)
        cells.push({
          d,
          wk,
          x0: x + INSET,
          x1: x + 1 - INSET,
          z0: z + INSET,
          z1: z + 1 - INSET,
          lv: step(d.count),
          tall: d.count ? 0.22 + Math.pow(d.count / max, CURVE) * (top - 0.22) : 0,
          quads: [],
          order: 0,
        });
      });
      first = true;
      kick();
    }

    function aim() {
      if (rm.matches) {
        goal.pitch = PITCH_LOW;
        goal.yaw = 0;
        goal.grow = 1;
        return;
      }
      const r = canvas.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh - r.top) / (vh * 0.3 + r.height)); // 1 once the stage sits in the lower part of the screen
      goal.pitch = lerp(PITCH_FLAT, PITCH_LOW, smooth(p));
      goal.grow = clamp01((p - 0.1) / 0.9);
      goal.yaw = lerp(YAW_IN, 0, smooth(clamp01(p * 1.6))) + mouse * YAW_MOUSE;
    }

    function draw() {
      const cp = Math.cos(pose.pitch * RAD);
      const sp = Math.sin(pose.pitch * RAD);
      const cy = Math.cos(pose.yaw * RAD);
      const sy = Math.sin(pose.yaw * RAD);
      const ox = w / 2;
      const oy = h - LABEL;
      // Yaw about the vertical axis through the middle of the floor, then pitch
      // about the front edge, so that edge never leaves its place on the stage.
      const pt = (x, y, z, out, i) => {
        const zc = z + 3.5;
        const xr = x * cy - zc * sy;
        const zr = x * sy + zc * cy - 3.5;
        const k = focal / (dist - (zr * cp + y * sp));
        out[i] = ox + xr * k;
        out[i + 1] = oy - (y * cp - zr * sp) * k;
      };
      // The camera in floor coordinates, for the draw order and the visible side.
      const back = dist * cp + 3.5;
      const camX = back * sy;
      const camZ = back * cy - 3.5;
      for (const c of cells) {
        const dx = (c.x0 + c.x1) / 2 - camX;
        const dz = (c.z0 + c.z1) / 2 - camZ;
        c.order = dx * dx + dz * dz;
      }
      cells.sort((a, b) => b.order - a.order);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const quad = (q, fill) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(q[0], q[1]);
        ctx.lineTo(q[2], q[3]);
        ctx.lineTo(q[4], q[5]);
        ctx.lineTo(q[6], q[7]);
        ctx.closePath();
        ctx.fill();
      };
      // The floor: a faint plate under the year, with a lit front edge.
      const plate = [];
      pt(-weeks / 2, 0, -7, plate, 0);
      pt(weeks / 2, 0, -7, plate, 2);
      pt(weeks / 2, 0, 0, plate, 4);
      pt(-weeks / 2, 0, 0, plate, 6);
      quad(plate, FLOOR);
      ctx.strokeStyle = EDGE;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plate[6], plate[7] + 0.5);
      ctx.lineTo(plate[4], plate[5] + 0.5);
      ctx.stroke();
      for (const c of cells) {
        // The rise is a wave: the oldest weeks stand first, the newest last.
        const wave = clamp01(pose.grow * 1.7 - (c.wk / weeks) * 0.7);
        const y = c.tall * smooth(wave);
        const lv = c.lv;
        const q = c.quads;
        q.length = 0;
        if (y > 0.01) {
          const side = camX > c.x1 ? c.x1 : camX < c.x0 ? c.x0 : null;
          if (side !== null) {
            const s = [];
            pt(side, 0, c.z0, s, 0);
            pt(side, 0, c.z1, s, 2);
            pt(side, y, c.z1, s, 4);
            pt(side, y, c.z0, s, 6);
            quad(s, SIDE[lv]);
            q.push(s);
          }
          const f = [];
          pt(c.x0, 0, c.z1, f, 0);
          pt(c.x1, 0, c.z1, f, 2);
          pt(c.x1, y, c.z1, f, 4);
          pt(c.x0, y, c.z1, f, 6);
          quad(f, FRONT[lv]);
          q.push(f);
        }
        const t = [];
        pt(c.x0, y, c.z0, t, 0);
        pt(c.x1, y, c.z0, t, 2);
        pt(c.x1, y, c.z1, t, 4);
        pt(c.x0, y, c.z1, t, 6);
        quad(t, TOP[lv]);
        q.push(t);
        if (c === hover) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        // The busiest days throw a short beam of light.
        if (lv >= 3 && y > 0.5) {
          const reach = (lv === 4 ? 4.6 : 2.2) * unit * smooth(wave);
          const x0 = Math.min(t[0], t[6]);
          const x1 = Math.max(t[2], t[4]);
          const yb = (t[1] + t[5]) / 2;
          const g = ctx.createLinearGradient(0, yb, 0, yb - reach);
          g.addColorStop(0, `rgba(${GLOW[lv]},${lv === 4 ? 0.42 : 0.24})`);
          g.addColorStop(1, `rgba(${GLOW[lv]},0)`);
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = g;
          ctx.fillRect(x0, yb - reach, x1 - x0, reach);
          ctx.globalCompositeOperation = 'source-over';
        }
      }
      ctx.font = font;
      ctx.fillStyle = LABEL_INK;
      ctx.textBaseline = 'top';
      const at = [];
      let edge = -Infinity;
      for (const l of labels) {
        pt(l.x + INSET, 0, 0, at, 0);
        if (at[0] < edge || at[0] > w - 24) continue; // never two labels on top of each other
        const text = l.text.toUpperCase();
        ctx.fillText(text, at[0], oy + 9);
        edge = at[0] + ctx.measureText(text).width + 8;
      }
    }

    function frame() {
      raf = 0;
      if (!w || !near) return;
      aim();
      let moving = false;
      for (const k of ['pitch', 'yaw', 'grow']) {
        const gap = goal[k] - pose[k];
        if (first || Math.abs(gap) < 0.002) pose[k] = goal[k];
        else {
          pose[k] += gap * 0.2;
          moving = true;
        }
      }
      draw();
      if (first) {
        first = false;
        onReady?.();
      }
      if (moving) raf = requestAnimationFrame(frame);
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    const inside = (q, x, y) => {
      let sign = 0;
      for (let i = 0; i < 8; i += 2) {
        const j = (i + 2) % 8;
        const cross = (q[j] - q[i]) * (y - q[i + 1]) - (q[j + 1] - q[i + 1]) * (x - q[i]);
        if (Math.abs(cross) < 1e-9) continue;
        if (sign && Math.sign(cross) !== sign) return false;
        sign = Math.sign(cross);
      }
      return true;
    };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (e.pointerType === 'mouse' && !rm.matches) mouse = (x / r.width - 0.5) * -2;
      let hit = null;
      for (let i = cells.length - 1; i >= 0 && !hit; i--) {
        if (cells[i].quads.some((q) => inside(q, x, y))) hit = cells[i];
      }
      hover = hit;
      setTip(
        hit
          ? {
              left: Math.max(96, Math.min(r.width - 96, x)),
              top: y,
              text: `${hit.d.count} contribution${hit.d.count === 1 ? '' : 's'} on ${hit.d.date}`,
            }
          : null
      );
      kick();
    };
    const onLeave = () => {
      hover = null;
      mouse = 0;
      setTip(null);
      kick();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        near = e.isIntersecting;
        if (near) kick();
      },
      { rootMargin: '120px 0px' }
    );
    io.observe(canvas);
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    window.addEventListener('scroll', kick, { passive: true });
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    rm.addEventListener('change', kick);
    phone.addEventListener('change', layout);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', kick);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      rm.removeEventListener('change', kick);
      phone.removeEventListener('change', layout);
    };
  }, [days, onReady]);

  return (
    <>
      <canvas ref={ref} className="sky-canvas" aria-hidden="true" />
      {tip && (
        <span className="heat-tip" style={{ left: tip.left, top: tip.top }} aria-hidden="true">
          {tip.text}
        </span>
      )}
    </>
  );
}
