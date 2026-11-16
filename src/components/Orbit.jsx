import { useEffect, useRef, useState } from 'react';
import { hero } from '../data/content';
import { useReducedMotion } from '../hooks/useMediaQuery';
import Badge from './Badge';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from './Icons';
import { registerBinding } from '../kit/bindings';

/* The orbit ring: glass cards on an elliptical CSS 3D ring, standing on an
   engraved plate. The front card is large and readable, the rest recede and dim,
   and the ring turns one card every few seconds. It is an index: every card is
   one link (to its Builds entry, or wherever `hrefFor` says).

   Two ways to stand (`mode`, set by RingStage):
     under   the front arc of the ring hangs under the centre block (the Builds
             opener). The back half is not shown: a card fades out as it passes
             the side, so nothing ever crosses the heading. The ring sets the
             stage's height (--stage-h).
     around  the whole ring turns around the centre block in a window-tall stage;
             a card behind the copy fades whole.

   Behavior:
   - the ring is one rAF loop that writes transforms straight to the nodes (no
     React state per frame, no layout reads); it asks for frames only while
     something moves, and stops when paused, hidden or offscreen;
   - hover on the ring pauses it, hover on a back card lifts that card;
   - focus inside the ring stops it for good (it is a keyboard user's ring now)
     and only the front card is tabbable; ArrowLeft/Right step, Home/End jump;
   - prefers-reduced-motion: a static pose, no rAF, no pause button;
   - below 960px wide or 640px tall the ring is not shown (Drift.jsx stands in).

   Geometry comes from the --orbit-* tokens; measure() fits the radius to the
   scene width and the ring centre to the centre block above it.

   The plate: two hairline rims and one tick per card, drawn in the scene's own
   SVG from the same projection that poses the cards (foot()), so a resting
   card's foot sits on its tick by construction. Pads and ticks are stations and
   do not turn; the front one is lit, and the counter under it reads which card
   stands there. The ring can be thrown: a drag on a card turns it under the
   hand, and on release it keeps its speed, slows, and settles on the nearest
   station. The first time the ring comes into view the cards land on their
   ticks front first, 40 ms apart; the ring then holds for 600 ms before it turns. */

const RING_MQ = '(min-width: 960px) and (min-height: 640px)';

const pad2 = (k) => String(k).padStart(2, '0');
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const LAND = { gap: 40, dur: 420, hold: 600, from: 0.6 };
/* Under a block: the cosine of the ring angle where a card is gone, and where it is whole. */
const ARC = [0.3, 0.48];

/* Two widths per ring card: 320 for the desktop ring (cards are about 220px wide),
   640 for a phone's row (cards up to 320px wide at 2x or more). */
/* alt is empty on purpose: the card is one link whose visible text (title, badge,
   one-liner) already names it, and the descriptive alt lives on the Builds image. */
/* Every card is lazy: the ring is below the welcome screen, and on a phone it is
   not shown at all (a lazy image in a hidden ring is never requested; the first
   card used to be fetched at high priority there, beside the greeting). */
function Shot({ slide }) {
  const src = slide.image.src;
  return (
    <img
      src={src}
      srcSet={`${src.replace('.webp', '-320.webp')} 320w, ${src} 640w`}
      sizes="(min-width: 960px) 240px, min(78vw, 320px)"
      alt=""
      width="640"
      height="400"
      loading="lazy"
      decoding="async"
    />
  );
}

export default function Orbit({ stageRef, centreRef, slides = hero.carousel.slides, words = hero.carousel, mode = 'around', hrefFor = (s) => `#build-${s.id}` }) {
  const N = slides.length;
  const STEP = (2 * Math.PI) / N;
  const NAME_CH = Math.max(...slides.map((s) => s.title.length));
  const under = mode === 'under';
  const reducedHook = useReducedMotion();
  const regionRef = useRef(null);
  const sceneRef = useRef(null);
  const counterRef = useRef(null);
  const nameRef = useRef(null);
  const api = useRef({ step: () => {}, toggle: () => {} });
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  // data-state reports what the ring is doing: a hover stops it as surely as the button.
  const state = reducedHook ? 'static' : userPaused || hovering ? 'paused' : 'running';

  useEffect(() => {
    const region = regionRef.current;
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const centre = centreRef.current;
    const counter = counterRef.current;
    const nameOut = nameRef.current;
    const plate = scene.querySelector('.ring-plate');
    const rim = plate.querySelector('.ring-plate-rim');
    const pads = [...plate.querySelectorAll('.ring-plate-pad')];
    const ticks = [...plate.querySelectorAll('.ring-plate-tick')];
    const fade = plate.querySelector('linearGradient');
    const cards = [...scene.querySelectorAll('.card')];
    const links = cards.map((c) => c.querySelector('.card-link'));
    const shades = cards.map((c) => [...c.querySelectorAll('.card-shade')]);
    const parts = cards.map((c) => ({
      cta: c.querySelector('.card-cta'),
      prog: c.querySelector('.card-prog'),
      bar: c.querySelector('.card-prog i'),
    }));
    // Last written opacities: a style is only touched when its value really moves.
    const lastCap = cards.map(() => -1);
    const lastNear = cards.map(() => -1);
    const lastVis = cards.map(() => -1);
    const css = getComputedStyle(document.documentElement);
    const num = (name, fb) => parseFloat(css.getPropertyValue(name)) || fb;
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ringMq = window.matchMedia(RING_MQ);
    const reduced = () => reducedMq.matches;

    const CFG = {
      persp: num('--orbit-persp', 1500),
      rx: num('--orbit-rx', 640),
      rz: num('--orbit-rz', 400),
      tilt: (num('--orbit-tilt', 24) * Math.PI) / 180,
      yaw: num('--orbit-yaw', 14),
      lean: num('--orbit-lean', 4),
      shade: num('--orbit-shade', 0.7),
      front: num('--orbit-front', 0),
      behind: num('--orbit-behind', 0.95),
      ghost: num('--orbit-ghost', 0.78),
      side: num('--orbit-side', 0.1),
      stepMs: num('--orbit-step-ms', 5200),
      linger: num('--orbit-linger', 0.85),
      rim: num('--plate-rim', 0.06),
      pad: num('--plate-pad', 0.44),
    };
    const geo = { rx: CFG.rx, rz: CFG.rz, sinT: Math.sin(CFG.tilt), cosT: Math.cos(CFG.tilt), cardW: 248, cardH: 240, copyL: -340, copyR: 340, front: CFG.front };
    const reasons = { user: false, hover: false, hidden: document.hidden, offscreen: false, landing: false, drag: false };
    const hov = cards.map(() => 0);
    const hovT = cards.map(() => 0);

    let vt = 0; // virtual time: how far the ring has turned, in ms of rotation
    let speed = 0;
    let last = 0;
    let raf = 0;
    let front = -1;
    let order = '';
    let anim = null;
    let ringMode = false;
    let focusAfter = false;
    let liveT = 0;
    let free = null; // the ring's angle while a hand or a throw has it; null when the clock does
    let spin = null; // a throw settling: { from, to, t0, dur }
    let landAt = -1; // when the cards began to land; Infinity while they wait to; -1 when they stand
    let arrived = false; // the ring has been seen once
    let landT = 0;
    const landed = cards.map(() => -1);
    const lit = cards.map(() => null);

    const paused = () => reasons.user || reasons.hover || reasons.hidden || reasons.offscreen || reasons.landing || reasons.drag;

    // One card per step: ease in, linger on the front card, ease out.
    function theta(t) {
      const k = Math.floor(t / CFG.stepMs);
      const p = t / CFG.stepMs - k;
      return -STEP * (k + p - (CFG.linger / (2 * Math.PI)) * Math.sin(2 * Math.PI * p));
    }

    // How far right of the ring centre the outer edge of a card reaches, on screen,
    // at ring angle w: its position, half its width turned by the yaw (the outer edge
    // swings toward the camera and so looks larger), then the perspective scale.
    function edgeAt(rx, w) {
      const s = Math.sin(w);
      const c = Math.cos(w);
      const a = (CFG.yaw * s * Math.PI) / 180;
      const half = geo.cardW / 2;
      const z = geo.rz * geo.cosT * (c - 1) + half * Math.sin(a);
      return (rx * s + half * Math.cos(a)) * (CFG.persp / (CFG.persp - z)) + 4;
    }

    // Where the foot of a card resting at ring angle w lands on screen, relative to
    // the ring centre: the card's own transform (pose) applied to its bottom centre,
    // then the perspective. `grow` widens the ring: the plate's outer rim.
    function foot(w, grow = 1) {
      const s = Math.sin(w);
      const c = Math.cos(w);
      const half = (geo.cardH / 2) * (1 - CFG.side * s * s);
      const lean = (CFG.lean * s * Math.PI) / 180;
      const yaw = (-CFG.yaw * s * Math.PI) / 180;
      const lx = -Math.sin(lean) * half;
      const lead = Math.pow(Math.max(0, (c - 0.7) / 0.3), 2);
      const z = geo.rz * geo.cosT * (grow * c - 1) + geo.front * lead - lx * Math.sin(yaw);
      const ps = CFG.persp / (CFG.persp - z);
      return [(geo.rx * grow * s + lx * Math.cos(yaw)) * ps, (geo.rz * grow * c * geo.sinT + Math.cos(lean) * half) * ps];
    }

    // The plate: the outer rim as one closed path; the inner rim as one pad per
    // station (the seat a card stands on, so the rim itself counts the builds),
    // and a tick from each pad to the outer rim. It fades out toward the back,
    // where it would run behind the hero copy.
    function drawPlate() {
      const arc = (from, to, steps, grow) => {
        let d = '';
        for (let i = 0; i <= steps; i++) {
          const [x, y] = foot(from + ((to - from) * i) / steps, grow);
          d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        return d;
      };
      rim.setAttribute('d', `${arc(0, 2 * Math.PI, 240, 1 + CFG.rim)}Z`);
      const y1 = foot(Math.PI * 0.62)[1];
      const y2 = foot(Math.PI * 0.36)[1];
      fade.setAttribute('y1', y1.toFixed(1));
      fade.setAttribute('y2', y2.toFixed(1));
      pads.forEach((pad, k) => {
        pad.setAttribute('d', arc((k - CFG.pad) * STEP, (k + CFG.pad) * STEP, 14, 1));
        pad.style.opacity = Math.max(0, Math.min(1, (foot(k * STEP)[1] - y1) / (y2 - y1))).toFixed(2);
      });
      ticks.forEach((tick, k) => {
        const a = foot(k * STEP);
        const b = foot(k * STEP, 1 + CFG.rim);
        tick.setAttribute('x1', a[0].toFixed(1));
        tick.setAttribute('y1', a[1].toFixed(1));
        tick.setAttribute('x2', b[0].toFixed(1));
        tick.setAttribute('y2', b[1].toFixed(1));
        tick.style.opacity = Math.max(0, Math.min(1, (a[1] - y1) / (y2 - y1))).toFixed(2);
      });
    }

    function measure() {
      // Layout size, never getBoundingClientRect: that one includes the ring's own transforms.
      geo.cardW = cards[0].offsetWidth || 248;
      // Every card is as tall as the tallest, so every foot stands on the plate.
      scene.style.removeProperty('--card-h');
      geo.cardH = Math.max(...cards.map((c) => c.offsetHeight)) || 240;
      scene.style.setProperty('--card-h', `${geo.cardH}px`);
      // Where the copy really stands, relative to the ring centre: the left and right
      // ends of the centre block's own children (the block is centred on the stage).
      const half = centre.offsetWidth / 2;
      const kids = Array.from(centre.children).filter((c) => c.offsetWidth > 0);
      if (kids.length) {
        geo.copyL = Math.min(...kids.map((c) => c.offsetLeft)) - half;
        geo.copyR = Math.max(...kids.map((c) => c.offsetLeft + c.offsetWidth)) - half;
      }
      const stageH = stage.clientHeight;
      // Under the block the ring keeps its own depth; around it, the stage's height sets it.
      geo.rz = under ? CFG.rz : Math.min(CFG.rz, Math.round(stageH * 0.46));
      // The widest the ring may be: the outermost card keeps 16px to spare on each side.
      const room = scene.clientWidth / 2 - 16;
      const wide = scene.clientWidth;
      let rx = wide >= 1800 ? CFG.rx + 130 : wide >= 1500 ? CFG.rx + 80 : wide >= 1400 ? CFG.rx + 40 : CFG.rx;
      for (let i = 0; i < 8; i++) {
        let e = 0;
        for (let w = 0.5; w <= Math.PI / 2 + 0.01; w += 0.04) e = Math.max(e, edgeAt(rx, w));
        if (e <= room) break;
        rx = Math.max(200, rx - (e - room) / 0.85);
      }
      geo.rx = rx;
      scene.style.setProperty('--rx', geo.rx.toFixed(0));
      scene.style.setProperty('--rz', geo.rz.toFixed(0));
      const cardH = geo.cardH;
      const frontTop = geo.rz * geo.sinT - cardH / 2; // front card top, relative to the ring centre
      // The ring centre sits at 47% of the stage, but never so high that the
      // centre block (which ends 18px above the front card) touches the nav.
      const blockH = centre.offsetHeight || 360;
      const minO = 14 + blockH + 18 - frontTop;
      const O = under ? Math.round(minO) : Math.max(Math.round(stageH * 0.47), Math.round(minO));
      stage.style.setProperty('--oy', `${O}px`);
      stage.style.setProperty('--centre-off', `${(frontTop - 18).toFixed(0)}px`);
      // The lifted front card is nearer the camera, so it grows about the ring centre.
      // On a short window the lift gives way first, so the control bar stays on screen.
      const barAt = (front) => {
        const grow = CFG.persp / (CFG.persp - front) - 1;
        return frontTop + cardH + grow * (geo.rz * geo.sinT + cardH / 2) + 18;
      };
      geo.front = CFG.front;
      while (!under && geo.front > 0 && O + barAt(geo.front) + 44 + 8 > stageH) geo.front = Math.max(0, geo.front - 10);
      stage.style.setProperty('--bar-y', `${barAt(geo.front).toFixed(0)}px`);
      // Under the block the ring is what makes the stage tall: down to the control bar.
      if (under) stage.style.setProperty('--stage-h', `${Math.round(O + barAt(geo.front) + 44 + 12)}px`);
      drawPlate();
      // Where the plate is in the document, for its receipt (kit/bindings.js).
      const box = stage.getBoundingClientRect();
      geo.docX = box.left + box.width / 2;
      geo.docY = box.top + window.scrollY + O;
    }

    function pose(now = performance.now()) {
      const th = free ?? theta(vt);
      const f0 = ((Math.round(-th / STEP) % N) + N) % N;
      const want = cards.map(() => '');
      const ranks = [];
      for (let k = 0; k < N; k++) {
        const w = k * STEP + th;
        const s = Math.sin(w);
        const c = Math.cos(w);
        const x = geo.rx * s;
        const y = geo.rz * c * geo.sinT;
        // The front card is pushed toward the camera so it clearly leads the ring.
        const lead = Math.pow(Math.max(0, (c - 0.7) / 0.3), 2);
        const z = geo.rz * geo.cosT * (c - 1) + (k === f0 ? 0 : hov[k] * 14) + geo.front * lead;
        // Landing: front first, then outward both ways, each card growing onto its tick.
        let land = 1;
        if (landAt >= 0) {
          const d = (k - f0 + N) % N;
          const rank = d === 0 ? 0 : d <= N / 2 ? d * 2 - 1 : (N - d) * 2;
          land = easeOut(Math.max(0, Math.min(1, (now - landAt - rank * LAND.gap) / LAND.dur)));
        }
        if (Math.abs(land - landed[k]) > 0.002) {
          landed[k] = land;
          cards[k].style.setProperty('--land', land.toFixed(3));
        }
        const grow = (1 - CFG.side * s * s) * (LAND.from + (1 - LAND.from) * land);
        // A card under the pointer lifts 6px off the plate.
        cards[k].style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${(y - hov[k] * 6).toFixed(1)}px,${z.toFixed(1)}px) rotateY(${(-CFG.yaw * s).toFixed(2)}deg) rotateZ(${(CFG.lean * s).toFixed(2)}deg) scale(${grow.toFixed(3)})`;
        // The tick under the front card is lit; the one under a lifted card brightens.
        // Stations do not turn: a card's station is where it rests when the ring is still.
        // The one under the front card is lit; one under a lifted card, or one a card is
        // landing on, brightens.
        const st = (((k + Math.round(th / STEP)) % N) + N) % N;
        if (k === f0) want[st] = 'front';
        else if (!want[st] && (hovT[k] || (land > 0.02 && land < 0.98))) want[st] = 'near';
        // Dim with depth. A back card that sits behind the hero copy goes almost
        // fully dark, so nothing on it competes with the text in front.
        // The caption is either shown or gone, never half there: the side cards of the ring
        // rest at c = 0.42 (two steps from the front), where a gradual fade would leave a
        // bright thumbnail over text at 20 to 30%. They rest as logos instead.
        const cap = Math.max(0, Math.min(1, (c - 0.5) / 0.2));
        let shade = CFG.shade * Math.pow((1 - c) / 2, 1.2);
        // A pale thumbnail (tone: 'light') would stay the brightest thing at the back of
        // the ring, so it dims further as it leaves the front.
        if (slides[k].tone === 'light') shade += (1 - shade) * 0.62 * (1 - cap);
        let hidden = 0;
        if (c < 0) {
          // How far the card's near edge is from the copy on its side (negative while
          // it overlaps the copy), on screen: position and half-width both shrink with depth.
          const ps = CFG.persp / (CFG.persp - z);
          const hw = (geo.cardW / 2) * ps * 0.92;
          const gap = x >= 0 ? x * ps - hw - geo.copyR : geo.copyL - (x * ps + hw);
          const cover = Math.max(0, Math.min(1, 1 - gap / 80));
          hidden = cover * Math.min(1, -c * 2);
          shade += (CFG.behind - shade) * hidden;
        }
        // A card behind the hero copy fades out whole, so the beams show through
        // where a dark slab would otherwise sit behind the name.
        // It leaves a little early (full cover is not needed), so no faint outline of a
        // card lingers beside the hero copy while it turns.
        // Under the block only the front arc shows: a card is whole two steps from the
        // front and gone before it reaches the side, where the heading is.
        const vis = under ? Math.max(0, Math.min(1, (c - ARC[0]) / (ARC[1] - ARC[0]))) : Math.max(0, 1 - CFG.ghost * Math.min(1, hidden * 1.35));
        if (Math.abs(vis - lastVis[k]) > 0.004) {
          lastVis[k] = vis;
          cards[k].style.setProperty('--vis', vis.toFixed(3));
          cards[k].style.pointerEvents = vis < 0.5 ? 'none' : '';
        }
        const sh = (shade * (1 - hov[k])).toFixed(3);
        shades[k][0].style.opacity = sh;
        shades[k][1].style.opacity = sh;
        // The caption is wiped away from its foot as the card leaves the front, and its
        // text fades ahead of the wipe (both read --cap in CSS). The panel never sits
        // at a different opacity from the thumbnail above it, so a card in motion is
        // a shorter card, not a ghost. The back half reads as thumbnails, and the
        // captions never show through the hero copy.
        if (Math.abs(cap - lastCap[k]) > 0.004) {
          lastCap[k] = cap;
          cards[k].style.setProperty('--cap', cap.toFixed(3));
        }
        // Only the front card shows its call to action and its progress line: a card one
        // step round is already at 0 (at a third of full it read as a disabled link).
        const near = Math.max(0, Math.min(1, ((1 + c) / 2 - 0.955) / 0.045));
        if (Math.abs(near - lastNear[k]) > 0.004) {
          lastNear[k] = near;
          parts[k].cta.style.opacity = near.toFixed(3);
          parts[k].prog.style.opacity = near.toFixed(3);
        }
        ranks.push([c, k]);
      }
      for (let st = 0; st < N; st++) {
        if (want[st] === lit[st]) continue;
        lit[st] = want[st];
        ticks[st].dataset.lit = want[st];
        pads[st].dataset.lit = want[st];
      }
      ranks.sort((a, b) => b[0] - a[0]);
      const key = ranks.map((r) => r[1]).join();
      if (key !== order) {
        order = key;
        ranks.forEach((r, i) => {
          cards[r[1]].style.zIndex = N - i;
        });
      }
      const f = f0;
      if (f !== front) {
        front = f;
        links.forEach((l, i) => {
          l.tabIndex = i === f ? 0 : -1;
        });
        cards.forEach((c, i) => c.classList.toggle('is-front', i === f));
        counter.textContent = `${pad2(f + 1)} / ${pad2(N)}`;
        nameOut.textContent = slides[f].title;
      }
      // Thin electric-blue progress line on the front card: time until the ring moves on.
      const p = vt / CFG.stepMs - Math.floor(vt / CFG.stepMs);
      parts[f].bar.style.transform = `scaleX(${((paused() && !anim) || free != null ? 0 : p).toFixed(3)})`;
    }

    function needsFrames() {
      if (anim || spin || (landAt >= 0 && landAt !== Infinity)) return true;
      if (!paused() || speed > 0.001) return true;
      return hov.some((v, i) => Math.abs(v - hovT[i]) > 0.002);
    }

    function frame(t) {
      raf = 0;
      const dt = Math.min(50, t - (last || t));
      last = t;
      if (landAt >= 0 && landAt !== Infinity && t - landAt > (N - 1) * LAND.gap + LAND.dur) landAt = -1;
      if (spin) {
        // A throw: the ring runs on at the speed it was let go with and settles on a station.
        const p = Math.min(1, (t - spin.t0) / spin.dur);
        free = spin.from + (spin.to - spin.from) * (1 - Math.pow(1 - p, 4));
        if (p >= 1) {
          vt = Math.round(-spin.to / STEP) * CFG.stepMs;
          spin = null;
          free = null;
          speed = 0;
        }
      } else if (free != null) {
        speed = 0; // under the hand: the pointer writes the angle
      } else if (anim) {
        const p = Math.min(1, (t - anim.t0) / anim.dur);
        vt = anim.from + (anim.to - anim.from) * easeOut(p);
        if (p >= 1) {
          anim = null;
          focusAfter = region.contains(document.activeElement);
        }
      } else {
        const target = paused() ? 0 : 1;
        speed += (target - speed) * (1 - Math.exp(-dt / 100));
        if (Math.abs(target - speed) < 0.001) speed = target;
        vt += dt * speed;
      }
      for (let k = 0; k < N; k++) hov[k] += (hovT[k] - hov[k]) * (1 - Math.exp(-dt / 90));
      pose(t);
      if (focusAfter) {
        focusAfter = false;
        links[front].focus({ preventScroll: true });
      }
      if (needsFrames()) raf = requestAnimationFrame(frame);
      else last = 0;
    }

    function kick() {
      if (ringMode && !reduced() && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }

    function settle() {
      if (free == null) return;
      vt = Math.round(-free / STEP) * CFG.stepMs;
      free = null;
      spin = null;
    }

    function step(dir) {
      settle();
      // Step relative to the card that is visibly in front (the front flips at
      // the half step), so Next always moves on and Prev always moves back.
      const to = (Math.round(vt / CFG.stepMs) + dir) * CFG.stepMs;
      if (!ringMode) {
        scene.querySelector('.cards').scrollBy({
          left: dir * (geo.cardW + 14),
          behavior: reduced() ? 'instant' : 'smooth',
        });
        return;
      }
      if (reduced()) {
        vt = to;
        pose();
        links[front].focus({ preventScroll: true });
        return;
      }
      anim = { from: vt, to, t0: performance.now(), dur: 500 };
      kick();
    }

    function jump(k) {
      if (!ringMode) return;
      settle();
      const to = k * CFG.stepMs;
      if (reduced()) {
        vt = to;
        pose();
        return;
      }
      anim = { from: vt, to, t0: performance.now(), dur: 500 };
      kick();
    }

    function toggle() {
      reasons.user = !reasons.user;
      setUserPaused(reasons.user);
      counter.setAttribute('aria-live', reasons.user ? 'polite' : 'off');
      kick();
    }
    api.current = { step, toggle };

    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        jump(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        jump(N - 1);
      }
    };
    const onEnter = () => {
      reasons.hover = true;
      setHovering(true);
      kick();
    };
    const onLeave = () => {
      reasons.hover = false;
      setHovering(false);
      kick();
    };
    const onFocusIn = (e) => {
      if (e.target.closest('.card-link') && !reasons.user) {
        reasons.user = true;
        setUserPaused(true);
        counter.setAttribute('aria-live', 'polite');
      }
    };
    const cardHandlers = cards.map((c, k) => {
      const enter = () => {
        hovT[k] = 1;
        kick();
      };
      const leave = () => {
        hovT[k] = 0;
        kick();
      };
      c.addEventListener('mouseenter', enter);
      c.addEventListener('mouseleave', leave);
      return [enter, leave];
    });
    /* The throw. A press on a card that travels more than 6px sideways takes the ring
       in hand: the front arc follows the pointer. On release it keeps the speed of
       the last 80 ms, slows, and settles on the nearest station. The click that
       would follow a drag is swallowed, so a throw never opens a build. */
    const hand = { id: -1, x0: 0, th0: 0, on: false, trail: [], moved: false };
    const onMove = (e) => {
      if (e.pointerId !== hand.id) return;
      if (!hand.on) {
        if (Math.abs(e.clientX - hand.x0) < 6) return;
        hand.on = true;
        hand.moved = true;
        hand.x0 = e.clientX;
        hand.th0 = free ?? theta(vt);
        hand.trail = [];
        anim = null;
        spin = null;
        reasons.drag = true;
        region.dataset.hand = '';
      }
      free = hand.th0 + (e.clientX - hand.x0) / geo.rx;
      hand.trail.push([e.timeStamp, free]);
      if (hand.trail.length > 8) hand.trail.shift();
      kick();
    };
    const onUp = (e) => {
      if (e.pointerId !== hand.id) return;
      hand.id = -1;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!hand.on) return;
      hand.on = false;
      reasons.drag = false;
      delete region.dataset.hand;
      const first = hand.trail.find((p) => e.timeStamp - p[0] <= 80) ?? hand.trail[hand.trail.length - 1];
      const dt = Math.max(1, e.timeStamp - first[0]);
      const v = Math.max(-0.012, Math.min(0.012, (free - first[1]) / dt)); // rad per ms
      // Where it would coast to with a 320 ms time constant, on the nearest station.
      const to = Math.round((free + v * 320) / STEP) * STEP;
      spin = { from: free, to, t0: performance.now(), dur: Math.min(1400, 520 + Math.abs(to - free) * 520) };
      kick();
    };
    const onDown = (e) => {
      if (!ringMode || reduced() || e.button > 0 || !e.target.closest('.card')) return;
      hand.id = e.pointerId;
      hand.x0 = e.clientX;
      hand.on = false;
      hand.moved = false;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    };
    const onClickCapture = (e) => {
      if (!hand.moved) return;
      hand.moved = false;
      e.preventDefault();
      e.stopPropagation();
    };
    const noDrag = (e) => e.preventDefault();
    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('click', onClickCapture, true);
    scene.addEventListener('dragstart', noDrag);

    // The arrival: the cards wait unlit while the welcome is up, then land.
    const land = (state) => {
      clearTimeout(landT);
      if (state === 'pre') {
        landAt = Infinity;
        reasons.landing = true;
        settle();
        vt = 0;
        anim = null;
        delete region.dataset.land;
      } else if (state === 'land' && ringMode && !reduced()) {
        landAt = performance.now();
        reasons.landing = true;
        region.dataset.land = '';
        landT = setTimeout(
          () => {
            reasons.landing = false;
            kick();
          },
          (N - 1) * LAND.gap + LAND.dur + LAND.hold
        );
      } else {
        landAt = -1;
        reasons.landing = false;
        region.dataset.land = '';
      }
      if (ringMode) {
        pose();
        kick();
      }
    };
    // The plate's receipt hangs off its outer rim, a step and a half round from the front.
    const offBinding = registerBinding({
      id: 'orrery',
      project: () => {
        // Below the ring's breakpoint the plate's near rim lies under the drifting rows: the same ticks, the same fact.
        if (!ringMode) return row.docY == null ? null : { x: row.x, y: row.docY - window.scrollY, side: 'right', visible: row.docY - window.scrollY > 0 && row.docY - window.scrollY < window.innerHeight };
        if (geo.docY == null) return null;
        const [x, y] = foot(STEP * 1.5, 1 + CFG.rim);
        const at = { x: geo.docX + x, y: geo.docY - window.scrollY + y };
        return { ...at, side: 'right', visible: at.y > 0 && at.y < window.innerHeight };
      },
    });
    region.dataset.land = '';

    const onVis = () => {
      reasons.hidden = document.hidden;
      kick();
    };
    // A ring card jumps to its build; focus follows, so a screen reader announces
    // where the reader landed (the browser scrolls, preventScroll avoids a second jump).
    const onHash = () => {
      const target = location.hash.startsWith('#build-') && document.getElementById(location.hash.slice(1));
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', onHash);
    let io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => {
          reasons.offscreen = !es[0].isIntersecting;
          kick();
        },
        { threshold: 0.05 }
      );
      io.observe(region);
    }
    // The arrival: until the ring has been seen the cards wait unlit; they land the
    // first time a third of it is in the window.
    let seenIo = null;
    if ('IntersectionObserver' in window && !reduced()) {
      land('pre');
      seenIo = new IntersectionObserver(
        (es) => {
          if (arrived || !es.some((e) => e.isIntersecting)) return;
          arrived = true;
          seenIo.disconnect();
          land('land');
        },
        { threshold: 0.3 }
      );
      seenIo.observe(region);
    }

    // Where the plate's rim is while the rows stand in for the ring (read on a resize, never per frame).
    const row = { x: 0, docY: null };
    function measureRow() {
      const plate = stage.querySelector('.drift');
      const box = plate?.getBoundingClientRect();
      if (!box || box.height < 2) {
        row.docY = null;
        return;
      }
      row.x = box.left + box.width / 2;
      row.docY = box.top + window.scrollY + box.height / 2;
    }

    function applyMode() {
      const wasRing = ringMode;
      ringMode = ringMq.matches;
      region.dataset.mode = ringMode ? 'ring' : 'row';
      if (!ringMode) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        cards.forEach((c) => {
          c.style.transform = '';
          c.style.zIndex = '';
        });
        parts.forEach((p) => {
          p.cta.style.opacity = '';
          p.prog.style.opacity = '';
          p.bar.style.transform = '';
        });
        lastCap.fill(-1);
        lastNear.fill(-1);
        lastVis.fill(-1);
        landed.fill(-1);
        cards.forEach((c) => c.style.removeProperty('--land'));
        cards.forEach((c) => {
          c.style.removeProperty('--vis');
          c.style.removeProperty('--cap');
        });
        shades.forEach((pair) => {
          pair.forEach((s) => {
            s.style.opacity = '';
          });
        });
        links.forEach((l) => {
          l.tabIndex = 0;
        });
        stage.style.removeProperty('--oy');
        scene.style.removeProperty('--card-h');
        front = -1;
        clearTimeout(liveT);
        delete region.dataset.live;
        region.dataset.ready = '';
        return;
      }
      measure();
      if (!wasRing) {
        order = '';
        front = -1;
      }
      pose();
      region.dataset.ready = '';
      // After the first fade-in, per-frame opacity changes must not be eased.
      clearTimeout(liveT);
      liveT = setTimeout(() => {
        region.dataset.live = '';
      }, 900);
      if (reduced()) return;
      speed = paused() ? 0 : 1;
      kick();
    }

    const ro = new ResizeObserver(() => {
      if (ringMode) {
        measure();
        pose();
      } else measureRow();
    });
    ro.observe(stage);
    ro.observe(centre);
    region.addEventListener('keydown', onKey);
    region.addEventListener('mouseenter', onEnter);
    region.addEventListener('mouseleave', onLeave);
    region.addEventListener('focusin', onFocusIn);
    document.addEventListener('visibilitychange', onVis);
    ringMq.addEventListener('change', applyMode);
    reducedMq.addEventListener('change', applyMode);
    applyMode();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (ringMode) {
          measure();
          pose();
        }
      });
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(liveT);
      clearTimeout(landT);
      offBinding();
      scene.removeEventListener('pointerdown', onDown);
      scene.removeEventListener('click', onClickCapture, true);
      scene.removeEventListener('dragstart', noDrag);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      ro.disconnect();
      io?.disconnect();
      seenIo?.disconnect();
      region.removeEventListener('keydown', onKey);
      region.removeEventListener('mouseenter', onEnter);
      region.removeEventListener('mouseleave', onLeave);
      region.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('hashchange', onHash);
      ringMq.removeEventListener('change', applyMode);
      reducedMq.removeEventListener('change', applyMode);
      cards.forEach((c, k) => {
        c.removeEventListener('mouseenter', cardHandlers[k][0]);
        c.removeEventListener('mouseleave', cardHandlers[k][1]);
      });
    };
  }, [stageRef, centreRef, slides, N, STEP, under]);

  return (
    <section
      className="orbit"
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label={words.label}
      data-state={state}
      data-ring={mode}
    >
      <div className="orbit-scene" ref={sceneRef}>
        <svg className="ring-plate" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="plate-fade" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="-60" y2="60">
              <stop offset="0" className="ring-plate-stop" data-end="far" />
              <stop offset="1" className="ring-plate-stop" />
            </linearGradient>
          </defs>
          <path className="ring-plate-rim" />
          {slides.map((s) => (
            <path className="ring-plate-pad" key={s.id} />
          ))}
          {slides.map((s) => (
            <line className="ring-plate-tick" key={s.id} />
          ))}
        </svg>
        <div className="cards">
          {slides.map((s, k) => (
            <div
              key={s.id}
              className={`card${k === 0 ? ' is-front' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${N}: ${s.title}`}
            >
              <a className="card-link" href={hrefFor(s)} tabIndex={k === 0 ? 0 : -1} {...(/^https?:/.test(hrefFor(s)) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                <span className="card-media">
                  <Shot slide={s} />
                  <span className="card-prog" aria-hidden="true">
                    <i />
                  </span>
                  <span className="card-shade" aria-hidden="true" />
                </span>
                <span className="card-cap">
                  <b className="card-title">{s.title}</b>
                  {s.badge && (
                    <span className="card-status">
                      <Badge kind={s.badgeKind} className="card-badge">
                        {s.badge}
                      </Badge>
                    </span>
                  )}
                  <span className="card-one">{s.oneLiner}</span>
                  <span className="card-cta">
                    <span>{s.cta ?? words.slideCta} →</span>
                    <span className="card-idx" aria-hidden="true">
                      {pad2(k + 1)} / {pad2(N)}
                    </span>
                  </span>
                  <span className="card-shade" aria-hidden="true" />
                </span>
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className="orbit-bar">
        <div className="orbit-side" data-side="left">
          <span className="eyebrow">{words.label}</span>
          <button
            className="ctl ctl-pause"
            type="button"
            aria-label={userPaused ? words.controls.play : words.controls.pause}
            onClick={() => api.current.toggle()}
          >
            {userPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button className="ctl" type="button" aria-label={words.controls.prev} onClick={() => api.current.step(-1)}>
            <ChevronLeftIcon />
          </button>
        </div>
        <span className="counter" ref={counterRef} aria-live="off">
          {pad2(1)} / {pad2(N)}
        </span>
        <div className="orbit-side" data-side="right">
          <button className="ctl" type="button" aria-label={words.controls.next} onClick={() => api.current.step(1)}>
            <ChevronRightIcon />
          </button>
          <span className="readout-name" ref={nameRef} aria-hidden="true" style={{ '--name-ch': NAME_CH }}>
            {slides[0].title}
          </span>
        </div>
      </div>
    </section>
  );
}
