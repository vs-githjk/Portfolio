import { useEffect } from 'react';

/**
 * Adds `.in` to every `.reveal` element once it scrolls into view.
 * Respects prefers-reduced-motion by revealing everything immediately, and does
 * the same on phones and touch screens, where nothing should pop in on scroll.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal');
    document.documentElement.dataset.reveal = 'on';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Phones and touch screens: everything is simply there (base.css shows it before this runs).
    const small = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

    if (reduce || small || !('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}
