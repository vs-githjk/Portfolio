import { useEffect, useRef } from 'react';
import { worldFade } from '../lib/beamFade';
import { heroOrigin } from '../lib/origin';
import { createWorld } from '../lib/worldScene';
import { builds, proofOfWork } from '../data/content';
import { EV } from '../kit/contract';

/* The three worlds: the 3D scene behind every section below the hero (three.js, its own
   lazy chunk; the scene itself is lib/worldScene.js).

   This file is the lifecycle and the budget:
   - It draws only while the layer is visible (not on the first screen, not in a
     hidden tab). Idle, it runs at about 30 frames a second, which is plenty for
     slow drift; while the camera is catching up with a scroll it draws every
     frame, so the parallax stays smooth.
   - The camera eases toward the scroll position, so the dive feels like water.
   - Under prefers-reduced-motion it draws nothing: <html data-world="still">
     and every section paints a still ground in its own world's colours.
   - If WebGL is missing or the context is lost it marks <html data-world="off">
     and the page falls back to its plain ground (the vistas collapse in CSS).
   - Every shader is compiled while the page is idle, before the reader reaches
     the first transition.
   - Quality follows the frame time, with hysteresis: two slow windows in a row
     step it down (fewer pixels, then no fine detail), a long run of fast ones
     steps it back up, and a level that had to be left twice is not tried again.

   The page talks to the world through the kit's events (src/kit/contract.js):
   - 'world:week' { index }: the dragon on the roost looks at that week's column
     of the commit graph for a moment.
   - 'world:dawn': the sun comes over the limb at the foot.
   - 'world:focus' { kind, id }: a win's star flares, a build's piece answers.
   - 'world:run' { state, step, gate }: the camp's lamp follows the run.
   - 'world:travel' { dir, phase }: the snow streaks along a hop.
   - 'world:receipts' { on }: while on, the world says where each piece is
     ('world:bindings', at most ten times a second).
   It says 'world:loaded' { stage: 'chunk' } when this file runs and
   { stage: 'compiled' } when every program is built.
   - the crew's lamp takes the chosen character's colour, from a `--agent-hue`
     custom property on .crew or the root (a hue in degrees, or any CSS colour),
     or from a 'world:agent' event with { detail: { hue } }. */

const IDLE_MS = 1000 / 30;
const IDLE_PHONE_MS = 1000 / 15; // a phone at rest draws half as often: its drifting things are slow

export default function World() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const root = document.documentElement;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let world;
    try {
      if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('fixture')) {
        import('../world/fixture').then((m) => {
          m.mountFixture();
          relayout();
        });
      }
      // Dev: ?crew=n&wins=n&cells=n change the data, to prove the scene follows it.
      const q = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
      const cut = (list, key) => (q?.has(key) ? list.slice(0, Number(q.get(key))) : list);
      const scenesOf = Object.fromEntries(builds.flagships.filter((f) => f.scene).map((f) => [f.id, q?.has('cells') && f.scene.cells ? { ...f.scene, cells: Number(q.get('cells')) } : f.scene]));
      world = createWorld(canvas, {
        solo: import.meta.env.DEV ? (new URLSearchParams(window.location.search).get('solo') ?? '') : '',
        // Every count in the scene comes from the page's own data.
        scenes: scenesOf,
        counts: {
          flagships: builds.flagships.map((f) => f.id),
          rest: [...builds.items, ...(builds.research ? [builds.research] : []), ...builds.more.items].map((b) => b.id),
          crew: cut(builds.building.crew, 'crew').map((c) => c.id),
          winIds: cut(proofOfWork.wins.items, 'wins').map((x) => x.project),
        },
      });
    } catch {
      root.dataset.world = 'off';
      return undefined;
    }

    window.dispatchEvent(new CustomEvent(EV.loaded, { detail: { stage: 'chunk' } }));
    if (import.meta.env.DEV) window.__world = world;
    const phoneRest = window.matchMedia('(max-width: 760px)').matches;
    const idleMs = phoneRest ? IDLE_PHONE_MS : IDLE_MS;
    let nap = 0;
    let raf = 0;
    let cam = window.scrollY;
    let last = 0;
    let drawn = false;
    let busy = 0; // draw every frame until this time: something is easing
    let ran = false; // the last frame was drawn in every-frame mode
    const want = { x: 0, y: 0 };
    const eye = { x: 0, y: 0 };
    const q = { level: 0, n: 0, sum: 0, good: 0, bad: 0, lock: 0, floor: 0, left: [0, 0, 0] };
    function measure(now, dt) {
      q.sum += dt;
      if (++q.n < 40) return;
      const avg = q.sum / q.n;
      q.n = 0;
      q.sum = 0;
      q.bad = avg > 26 ? q.bad + 1 : 0;
      q.good = avg < 13 ? q.good + 1 : 0;
      if (q.bad >= 2 && q.level < 2) {
        if (++q.left[q.level] >= 2) q.floor = q.level + 1;
        q.level += 1;
      } else if (q.good >= 8 && q.level > q.floor && now > q.lock) {
        q.level -= 1;
      } else return;
      q.bad = 0;
      q.good = 0;
      q.lock = now + 10000;
      world.setQuality(q.level);
    }

    // The crew's lamp: the chosen character's colour, read from the page.
    const probe = document.createElement('span');
    probe.style.display = 'none';
    document.body.appendChild(probe);
    let hueSeen = '';
    let hueAt = 0;
    function setHue(v) {
      const s = String(v ?? '').trim();
      if (s === hueSeen) return;
      hueSeen = s;
      if (!s) return world.setHue(null);
      probe.style.color = '';
      probe.style.color = /^-?[\d.]+(deg)?$/.test(s) ? `hsl(${parseFloat(s)} 85% 62%)` : s;
      const m = probe.style.color ? getComputedStyle(probe).color.match(/[\d.]+/g) : null;
      return world.setHue(m && m.length >= 3 ? m.slice(0, 3).map(Number) : null);
    }
    function readHue(now) {
      if (now - hueAt < 400) return;
      hueAt = now;
      const crew = document.querySelector('[data-world-anchor="camp"]') ?? document.querySelector('.crew');
      if (!crew) return;
      const r = crew.getBoundingClientRect();
      if (r.bottom < -window.innerHeight || r.top > window.innerHeight * 2) return;
      setHue(getComputedStyle(crew).getPropertyValue('--agent-hue'));
    }

    function frame(now) {
      raf = 0;
      if (document.hidden) return;
      const y = window.scrollY;
      const visible = worldFade(y - heroOrigin(), window.innerHeight) > 0.004;
      if (rm.matches) {
        // No moving world: the sections paint their own still grounds (sections.css).
        drawn = false;
        root.dataset.world = 'still';
        return;
      }
      if (!visible) {
        cam = y; // nothing to see: keep the camera where the page is and sleep
        return;
      }
      const gap = y - cam;
      const moving = Math.abs(gap) > 0.4;
      cam = !moving || Math.abs(gap) > 5000 ? y : cam + gap * 0.2;
      eye.x += (want.x - eye.x) * 0.06;
      eye.y += (want.y - eye.y) * 0.06;
      const every = moving || now < busy;
      if (every || now - last >= idleMs - 2) {
        readHue(now);
        const t0 = import.meta.env.DEV ? performance.now() : 0;
        world.render(now / 1000, cam, eye.x, eye.y);
        if (import.meta.env.DEV) (window.__worldMs ??= []).push(performance.now() - t0);
        if (every && ran && now - last < 120) measure(now, now - last);
        ran = every;
        last = now;
        if (!drawn) {
          drawn = true;
          root.dataset.world = 'on';
          askDragon();
        }
      }
      // At rest a phone does not take a frame callback it will not draw in: it sleeps until
      // the next still is due (a scroll, or anything that calls kick, wakes it at once).
      if (phoneRest && !every) {
        clearTimeout(nap);
        nap = window.setTimeout(kick, Math.max(0, idleMs - 6));
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // The dragon is a chunk and a model of its own: asked for once, after the world
    // has drawn its first frame and the page is idle, never before.
    let asked = false;
    let gone = false;
    function askDragon() {
      if (asked) return;
      asked = true;
      const go = () => {
        if (gone) return;
        world
          .loadDragon()
          .then((ok) => {
            if (!ok || gone) return;
            root.dataset.dragon = 'on';
            hurry();
          })
          .catch(() => {
            root.dataset.dragon = 'off';
          });
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(go, { timeout: 2500 });
      else setTimeout(go, 600);
    }

    // The set pieces live at places in the page, so any change in its height
    // (a Read more opening, fonts arriving, a resize) lays them out again.
    let rsz = 0;
    const relayout = () => {
      clearTimeout(rsz);
      rsz = window.setTimeout(() => {
        world.layout();
        drawn = false;
        kick();
      }, 140);
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(document.body);
    let lamp = false;
    const onPointer = (e) => {
      // The lamp lights with the first move: before it there is no pointer to stand at.
      if (!lamp) {
        lamp = true;
        world.setLamp(true);
      }
      want.x = (e.clientX / window.innerWidth) * 2 - 1;
      want.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const hurry = () => {
      busy = performance.now() + 1600;
      kick();
    };
    const onWeek = (e) => {
      world.setWeek(e.detail?.index);
      hurry();
    };
    const onDawn = () => {
      world.breakDawn();
      hurry();
    };
    const onAgent = (e) => {
      setHue(e.detail?.hue ?? e.detail?.color);
      world.setAgent(e.detail?.id ?? null);
      hurry();
    };
    const onFocus = (e) => {
      world.setFocus(e.detail?.kind, e.detail?.id ?? null, e.detail?.builds);
      hurry();
    };
    const onTravel = (e) => {
      if (e.detail?.phase !== 'in') world.setTravel(e.detail?.dir ?? 1);
      hurry();
    };
    // Receipts: while on, say where each piece is, ten times a second at most.
    let tell = 0;
    const onReceipts = (e) => {
      clearInterval(tell);
      tell = 0;
      if (e.detail?.on) {
        tell = window.setInterval(() => {
          if (!document.hidden && drawn) window.dispatchEvent(new CustomEvent(EV.bindings, { detail: world.bindings() }));
        }, 100);
      }
    };
    const onRun = (e) => {
      world.setRun(e.detail?.state);
      hurry();
    };
    // Compile the programs once the page is idle, in a task of its own.
    const prewarm = () => world.prewarm().then(() => window.dispatchEvent(new CustomEvent(EV.loaded, { detail: { stage: 'compiled' } })));
    const warm = 'requestIdleCallback' in window ? window.requestIdleCallback(prewarm, { timeout: 1500 }) : setTimeout(prewarm, 300);
    const onLost = (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      clearTimeout(nap);
      root.dataset.world = 'off';
    };

    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', relayout, { passive: true });
    document.addEventListener('visibilitychange', kick);
    canvas.addEventListener('webglcontextlost', onLost);
    rm.addEventListener('change', relayout);
    if (fine) window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener(EV.week, onWeek);
    window.addEventListener(EV.dawn, onDawn);
    window.addEventListener(EV.agent, onAgent);
    window.addEventListener(EV.focus, onFocus);
    window.addEventListener(EV.run, onRun);
    window.addEventListener(EV.travel, onTravel);
    window.addEventListener(EV.receipts, onReceipts);
    // Receipts may already be on (?receipts, or restored for the session) before this chunk arrived.
    onReceipts({ detail: { on: root.dataset.receipts != null } });
    kick();

    return () => {
      gone = true;
      delete root.dataset.dragon;
      cancelAnimationFrame(raf);
      clearTimeout(nap);
      clearTimeout(rsz);
      ro.disconnect();
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', relayout);
      document.removeEventListener('visibilitychange', kick);
      canvas.removeEventListener('webglcontextlost', onLost);
      rm.removeEventListener('change', relayout);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener(EV.week, onWeek);
      window.removeEventListener(EV.dawn, onDawn);
      window.removeEventListener(EV.agent, onAgent);
      window.removeEventListener(EV.focus, onFocus);
      window.removeEventListener(EV.run, onRun);
      window.removeEventListener(EV.travel, onTravel);
      window.removeEventListener(EV.receipts, onReceipts);
      clearInterval(tell);
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(warm);
      else clearTimeout(warm);
      probe.remove();
      world.dispose();
      delete root.dataset.world;
    };
  }, []);

  return <canvas ref={ref} className="bg-world" />;
}
