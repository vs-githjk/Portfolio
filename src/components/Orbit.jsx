import { useEffect, useRef, useState } from 'react';
import { hero } from '../data/content';
import { useReducedMotion } from '../hooks/useMediaQuery';
import Badge from './Badge';
import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from './Icons';

/* "What I've built": the orbit ring. Eleven glass cards on an elliptical CSS 3D
   ring around the name. The front card is large and readable, the rest recede
   and dim, and the ring turns one card every few seconds.

   Behavior:
   - the ring is one rAF loop that writes transforms straight to the nodes (no
     React state per frame, no layout reads); it asks for frames only while
     something moves, and stops when paused, hidden or offscreen;
   - hover on the ring pauses it, hover on a back card lifts that card;
   - focus inside the ring stops it for good (it is a keyboard user's ring now)
     and only the front card is tabbable; ArrowLeft/Right step, Home/End jump;
   - every card is one link to its Builds entry (#build-<id>);
   - prefers-reduced-motion: a static pose, no rAF, no pause button;
   - below 960px wide or 640px tall the ring becomes a swipeable snap row.

   Geometry comes from the --orbit-* tokens; measure() fits the radius to the
   scene width and the ring centre to the hero copy above it. */

const { carousel } = hero;
const slides = carousel.slides;
const N = slides.length;
const STEP = (2 * Math.PI) / N;
const RING_MQ = '(min-width: 960px) and (min-height: 640px)';

const pad2 = (k) => String(k).padStart(2, '0');
const easeOut = (p) => 1 - Math.pow(1 - p, 3);

function Shot({ slide, k }) {
  return (
    <img
      src={slide.image.src}
      alt={slide.image.alt}
      width="640"
      height="400"
      {...(k === 0 ? { fetchPriority: 'high' } : { loading: 'lazy', decoding: 'async' })}
    />
  );
}

export default function Orbit({ stageRef, centreRef }) {
  const reducedHook = useReducedMotion();
  const regionRef = useRef(null);
  const sceneRef = useRef(null);
  const counterRef = useRef(null);
  const api = useRef({ step: () => {}, toggle: () => {} });
  const [userPaused, setUserPaused] = useState(false);
  const state = reducedHook ? 'static' : userPaused ? 'paused' : 'running';

  useEffect(() => {
    const region = regionRef.current;
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const centre = centreRef.current;
    const counter = counterRef.current;
    const cards = [...scene.querySelectorAll('.card')];
    const links = cards.map((c) => c.querySelector('.card-link'));
    const shades = cards.map((c) => c.querySelector('.card-shade'));
    const parts = cards.map((c) => ({
      cap: c.querySelector('.card-cap'),
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
    };
    const geo = { rx: CFG.rx, rz: CFG.rz, sinT: Math.sin(CFG.tilt), cosT: Math.cos(CFG.tilt), cardW: 248, copyHalf: 340, front: CFG.front };
    const reasons = { user: false, hover: false, hidden: document.hidden, offscreen: false };
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

    const paused = () => reasons.user || reasons.hover || reasons.hidden || reasons.offscreen;

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

    function measure() {
      // Layout size, never getBoundingClientRect: that one includes the ring's own transforms.
      geo.cardW = cards[0].offsetWidth || 248;
      const stageH = stage.clientHeight;
      geo.rz = Math.min(CFG.rz, Math.round(stageH * 0.46));
      // The widest the ring may be: the outermost card keeps 16px to spare on each side.
      const room = scene.clientWidth / 2 - 16;
      let rx = scene.clientWidth >= 1400 ? CFG.rx + 40 : CFG.rx;
      for (let i = 0; i < 8; i++) {
        let e = 0;
        for (let w = 0.5; w <= Math.PI / 2 + 0.01; w += 0.04) e = Math.max(e, edgeAt(rx, w));
        if (e <= room) break;
        rx = Math.max(200, rx - (e - room) / 0.85);
      }
      geo.rx = rx;
      scene.style.setProperty('--rx', geo.rx.toFixed(0));
      scene.style.setProperty('--rz', geo.rz.toFixed(0));
      const cardH = cards[0].offsetHeight || 240;
      const frontTop = geo.rz * geo.sinT - cardH / 2; // front card top, relative to the ring centre
      // The ring centre sits at 47% of the stage, but never so high that the
      // centre block (which ends 18px above the front card) touches the nav.
      const blockH = centre.offsetHeight || 360;
      const minO = 14 + blockH + 18 - frontTop;
      const O = Math.max(Math.round(stageH * 0.47), Math.round(minO));
      stage.style.setProperty('--oy', `${O}px`);
      stage.style.setProperty('--centre-off', `${(frontTop - 18).toFixed(0)}px`);
      // The lifted front card is nearer the camera, so it grows about the ring centre.
      // On a short window the lift gives way first, so the control bar stays on screen.
      const barAt = (front) => {
        const grow = CFG.persp / (CFG.persp - front) - 1;
        return frontTop + cardH + grow * (geo.rz * geo.sinT + cardH / 2) + 18;
      };
      geo.front = CFG.front;
      while (geo.front > 0 && O + barAt(geo.front) + 44 + 8 > stageH) geo.front = Math.max(0, geo.front - 10);
      stage.style.setProperty('--bar-y', `${barAt(geo.front).toFixed(0)}px`);
    }

    function pose() {
      const th = theta(vt);
      const ranks = [];
      for (let k = 0; k < N; k++) {
        const w = k * STEP + th;
        const s = Math.sin(w);
        const c = Math.cos(w);
        const x = geo.rx * s;
        const y = geo.rz * c * geo.sinT;
        // The front card is pushed toward the camera so it clearly leads the ring.
        const lead = Math.pow(Math.max(0, (c - 0.7) / 0.3), 2);
        const z = geo.rz * geo.cosT * (c - 1) + hov[k] * 14 + geo.front * lead;
        cards[k].style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${(-CFG.yaw * s).toFixed(2)}deg) rotateZ(${(CFG.lean * s).toFixed(2)}deg) scale(${(1 - CFG.side * s * s).toFixed(3)})`;
        // Dim with depth. A back card that sits behind the hero copy goes almost
        // fully dark, so nothing on it competes with the text in front.
        let shade = CFG.shade * Math.pow((1 - c) / 2, 1.2);
        let hidden = 0;
        if (c < 0) {
          const cover = Math.max(0, Math.min(1, (geo.copyHalf + 90 - Math.abs(x)) / 90));
          hidden = cover * Math.min(1, -c * 2);
          shade += (CFG.behind - shade) * hidden;
        }
        // A card behind the hero copy fades out whole, so the beams show through
        // where a dark slab would otherwise sit behind the name.
        const vis = 1 - CFG.ghost * hidden;
        if (Math.abs(vis - lastVis[k]) > 0.004) {
          lastVis[k] = vis;
          cards[k].style.setProperty('--vis', vis.toFixed(3));
        }
        shades[k].style.opacity = (shade * (1 - hov[k])).toFixed(3);
        // Text on the back half is faded out completely: the cards there sit
        // behind the hero copy, and their captions must never show through it.
        const cap = Math.max(0, Math.min(1, (c + 0.1) / 0.5));
        if (Math.abs(cap - lastCap[k]) > 0.004) {
          lastCap[k] = cap;
          parts[k].cap.style.opacity = cap.toFixed(3);
        }
        // Only the front card shows its call to action and its progress line.
        const near = Math.max(0, Math.min(1, ((1 + c) / 2 - 0.9) / 0.1));
        if (Math.abs(near - lastNear[k]) > 0.004) {
          lastNear[k] = near;
          parts[k].cta.style.opacity = near.toFixed(3);
          parts[k].prog.style.opacity = near.toFixed(3);
        }
        ranks.push([c, k]);
      }
      ranks.sort((a, b) => b[0] - a[0]);
      const key = ranks.map((r) => r[1]).join();
      if (key !== order) {
        order = key;
        ranks.forEach((r, i) => {
          cards[r[1]].style.zIndex = N - i;
        });
      }
      const f = ((Math.round(-th / STEP) % N) + N) % N;
      if (f !== front) {
        front = f;
        links.forEach((l, i) => {
          l.tabIndex = i === f ? 0 : -1;
        });
        cards.forEach((c, i) => c.classList.toggle('is-front', i === f));
        counter.textContent = `${pad2(f + 1)} / ${pad2(N)}`;
      }
      // Thin electric-blue progress line on the front card: time until the ring moves on.
      const p = vt / CFG.stepMs - Math.floor(vt / CFG.stepMs);
      parts[f].bar.style.transform = `scaleX(${(paused() && !anim ? 0 : p).toFixed(3)})`;
    }

    function needsFrames() {
      if (anim) return true;
      if (!paused() || speed > 0.001) return true;
      return hov.some((v, i) => Math.abs(v - hovT[i]) > 0.002);
    }

    function frame(t) {
      raf = 0;
      const dt = Math.min(50, t - (last || t));
      last = t;
      if (anim) {
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
      pose();
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

    function step(dir) {
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
      kick();
    };
    const onLeave = () => {
      reasons.hover = false;
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
        hovT[k] = k === front ? 0 : 1;
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
    const onVis = () => {
      reasons.hidden = document.hidden;
      kick();
    };
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
          p.cap.style.opacity = '';
          p.cta.style.opacity = '';
          p.prog.style.opacity = '';
          p.bar.style.transform = '';
        });
        lastCap.fill(-1);
        lastNear.fill(-1);
        lastVis.fill(-1);
        cards.forEach((c) => c.style.removeProperty('--vis'));
        shades.forEach((s) => {
          s.style.opacity = '';
        });
        links.forEach((l) => {
          l.tabIndex = 0;
        });
        stage.style.removeProperty('--oy');
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
      }
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
      ro.disconnect();
      io?.disconnect();
      region.removeEventListener('keydown', onKey);
      region.removeEventListener('mouseenter', onEnter);
      region.removeEventListener('mouseleave', onLeave);
      region.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('visibilitychange', onVis);
      ringMq.removeEventListener('change', applyMode);
      reducedMq.removeEventListener('change', applyMode);
      cards.forEach((c, k) => {
        c.removeEventListener('mouseenter', cardHandlers[k][0]);
        c.removeEventListener('mouseleave', cardHandlers[k][1]);
      });
    };
  }, [stageRef, centreRef]);

  return (
    <section
      className="orbit"
      ref={regionRef}
      aria-roledescription="carousel"
      aria-label={carousel.label}
      data-state={state}
    >
      <div className="orbit-scene" ref={sceneRef}>
        <div className="cards">
          <div className="track" aria-hidden="true" />
          {slides.map((s, k) => (
            <div
              key={s.id}
              className={`card${k === 0 ? ' is-front' : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${k + 1} of ${N}: ${s.title}`}
            >
              <a className="card-link" href={`#build-${s.id}`} tabIndex={k === 0 ? 0 : -1}>
                <span className="card-media">
                  <Shot slide={s} k={k} />
                  <span className="card-prog" aria-hidden="true">
                    <i />
                  </span>
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
                    <span>{carousel.slideCta} →</span>
                    <span className="card-idx" aria-hidden="true">
                      {pad2(k + 1)} / {pad2(N)}
                    </span>
                  </span>
                </span>
              </a>
              <span className="card-shade" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
      <div className="orbit-bar">
        <span className="eyebrow">{carousel.label}</span>
        <div className="orbit-controls">
          <button
            className="ctl ctl-pause"
            type="button"
            aria-label={userPaused ? carousel.controls.play : carousel.controls.pause}
            onClick={() => api.current.toggle()}
          >
            {userPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button className="ctl" type="button" aria-label={carousel.controls.prev} onClick={() => api.current.step(-1)}>
            <ChevronLeftIcon />
          </button>
          <button className="ctl" type="button" aria-label={carousel.controls.next} onClick={() => api.current.step(1)}>
            <ChevronRightIcon />
          </button>
          <span className="counter" ref={counterRef} aria-live="off">
            {pad2(1)} / {pad2(N)}
          </span>
        </div>
      </div>
    </section>
  );
}
