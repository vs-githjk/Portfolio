import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { principles } from '../data/content';

gsap.registerPlugin(ScrollTrigger);

/* Desktop: the section pins and the four cards scroll horizontally, scrubbed
   to the wheel. Below 900px or under prefers-reduced-motion, none of this
   runs and the cards render as the static grid from sections.css. */
export default function Principles() {
  const secRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    /* StrictMode double-mounts and Vite HMR can leave orphaned pins behind —
       each one renders as a ghost copy of this section. Kill any trigger that
       still points at this section (or a detached node) before creating ours. */
    ScrollTrigger.getAll().forEach((t) => {
      const trig = t.vars?.trigger;
      if (trig === secRef.current || (trig instanceof Element && !trig.isConnected)) {
        t.kill(true);
      }
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
