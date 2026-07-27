import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { principles } from '../data/content';

gsap.registerPlugin(ScrollTrigger);

/* GSAP pinning re-parents this section's DOM, which Vite's hot-reload cannot
   reconcile — every hot swap of this module leaves a ghost copy of the section
   in the page. Force a full reload instead. Dev-only; stripped from builds. */
if (import.meta.hot) {
  import.meta.hot.accept(() => import.meta.hot.invalidate());
}

/* Desktop: the section pins and the four cards scroll horizontally, scrubbed
   to the wheel. Below 900px or under prefers-reduced-motion, none of this
   runs and the cards render as the static grid from sections.css. */
export default function Principles() {
  const secRef = useRef(null);
  const trackRef = useRef(null);

  /* Neon-green grid backdrop — static (no scan), lazy-loaded like Contact's. */
  const [Grid, setGrid] = useState(null);
  const [gridGreen, setGridGreen] = useState('#39d07e');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setGridGreen(
      getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim() ||
        '#2bff5e'
    );
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./GridScan').then((m) => setGrid(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(secRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    /* StrictMode double-mounts and Vite HMR can leave ghosts behind — GSAP
       re-parents the pinned section into a pin-spacer, so on hot reload React
       fails to remove the old node and the section renders twice. Kill stale
       triggers AND remove any leaked copy of this section before creating
       ours. No-ops in production (no HMR there). */
    ScrollTrigger.getAll().forEach((t) => {
      const trig = t.vars?.trigger;
      if (trig === secRef.current || (trig instanceof Element && !trig.isConnected)) {
        t.kill(true);
      }
    });
    document.querySelectorAll('.principles').forEach((el) => {
      if (el !== secRef.current) el.remove();
    });
    document.querySelectorAll('.pin-spacer').forEach((sp) => {
      if (!sp.contains(secRef.current) && !sp.children.length) sp.remove();
    });

    const mm = gsap.matchMedia();

    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const sec = secRef.current;
      const track = trackRef.current;
      if (!sec || !track) return;

      sec.classList.add('pin-h');
      const dist = () => Math.max(0, track.scrollWidth - track.parentElement.clientWidth);

      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${dist()}`,
          scrub: true,
          pin: true,
          invalidateOnRefresh: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        sec.classList.remove('pin-h');
        gsap.set(track, { clearProps: 'all' });
      };
    });

    /* Image loads shift layout after mount; re-measure the pin distances. */
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);

    return () => {
      window.removeEventListener('load', onLoad);
      mm.revert();
    };
  }, []);

  return (
    <section className="principles" id="principles" ref={secRef}>
      {Grid && (
        <div className="prin-fx" aria-hidden="true">
          <Grid
            sensitivity={0.4}
            lineThickness={1.6}
            linesColor={gridGreen}
            scanOpacity={0}
            gridScale={0.14}
            lineJitter={0}
            noiseIntensity={0.01}
            fadeStrength={1.0}
          />
        </div>
      )}
      <div className="wrap sec">
        <div className="sec-head reveal">
          <h2>{principles.heading}</h2>
          <p>{principles.intro}</p>
        </div>

        <div className="prin-grid reveal" ref={trackRef}>
          {principles.items.map((p) => (
            <div className="prin" key={p.title}>
              <h3 className="prin-title">{p.title}</h3>
              <p className="prin-body">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
