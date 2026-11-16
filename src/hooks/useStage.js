import { useEffect, useRef, useState } from 'react';

/** A flagship stage plays as numbered steps. `beats[i]` is how long step i holds
    before step i + 1; the last step is the finished picture, and it holds for
    `rest` before the stage starts again.

    The server, a reader without scripts and a reader who asked for reduced motion
    all get the last step: the finished picture, still. Otherwise it plays only
    while it is on screen and the tab is in front, and starts from the top each
    time it comes back into view. Returns [ref, step]. */
export function useStage(beats, rest = 7000) {
  const last = beats.length;
  const ref = useRef(null);
  const [step, setStep] = useState(last);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return undefined;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0;
    let at = last;
    let seen = false;

    const stop = () => {
      clearTimeout(timer);
      timer = 0;
    };
    const go = (n) => {
      at = n;
      setStep(n);
      timer = setTimeout(() => go(n < last ? n + 1 : 0), n < last ? beats[n] : rest);
    };
    const sync = () => {
      const play = seen && !document.hidden && !calm.matches;
      if (play && !timer) go(0);
      else if (!play && timer) {
        stop();
        // Off screen, in a hidden tab or calmed, it rests on the finished picture.
        if (at !== last) {
          at = last;
          setStep(last);
        }
      }
    };

    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting;
        sync();
      },
      { threshold: 0.4 }
    );
    io.observe(node);
    document.addEventListener('visibilitychange', sync);
    calm.addEventListener('change', sync);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      calm.removeEventListener('change', sync);
    };
  }, [beats, last, rest]);

  return [ref, step];
}
