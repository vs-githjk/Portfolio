import { useEffect } from 'react';

/** Gives every row of cards in a subgrid lane the same track sizes, so the cards are
    one height across rows, not only within a row. Each card spans `span` grid rows;
    this reads the natural size of every track, takes the tallest of each of the first
    `span - 1` across the rows of cards, and writes them to `--tracks` (CSS reads it as
    `grid-auto-rows`). The last track, "Read more", stays auto, so an open story grows
    only its own row of cards. In one column it writes nothing. Runs after hydration
    only, and again whenever the lane changes size. */
export function useEqualRows(ref, span) {
  useEffect(() => {
    const grid = ref.current;
    if (!grid || typeof ResizeObserver === 'undefined') return undefined;
    let frame = 0;
    const fit = () => {
      frame = 0;
      grid.style.removeProperty('--tracks');
      const [a, b] = grid.children;
      if (!a || !b || a.offsetTop !== b.offsetTop) return;
      const sizes = getComputedStyle(grid).gridTemplateRows.split(' ').map(parseFloat);
      const top = Array(span - 1).fill(0);
      sizes.forEach((px, i) => {
        if (i % span < span - 1) top[i % span] = Math.max(top[i % span], px);
      });
      grid.style.setProperty('--tracks', `${top.map((px) => `${Math.ceil(px)}px`).join(' ')} auto`);
    };
    const ro = new ResizeObserver(() => {
      if (!frame) frame = requestAnimationFrame(fit);
    });
    ro.observe(grid);
    document.fonts?.ready.then(() => requestAnimationFrame(fit));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ref, span]);
}
