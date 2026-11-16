/* Pictures are there before the reader reaches them. Every picture below the
   first screen is marked loading="lazy" so the first paint pays for none of them;
   but a lazy picture is fetched only as it nears the window, and on a phone that
   read as cards popping in during a scroll (one, FireSight, was measured arriving
   after its card had already passed). So once the reader has shown they are
   here (the first scroll, touch, key or pointer), the lazy pictures are promoted
   to eager in page order, a few at a time, each batch waiting for the last so
   the queue never competes with what is on screen. Pictures that are not
   displayed at this width (the ring on a phone, the drift on a desktop) are
   left alone. Nothing is asked for before that first sign, so the first paint
   and its measurements are untouched. */
const BATCH = 3;
const WAIT_MS = 2500;

export function startEagerImages() {
  const signs = ['scroll', 'touchstart', 'pointerdown', 'keydown'];
  let started = false;
  let stopped = false;

  const settle = (img) =>
    new Promise((resolve) => {
      if (img.complete) return resolve();
      const done = () => {
        img.removeEventListener('load', done);
        img.removeEventListener('error', done);
        resolve();
      };
      img.addEventListener('load', done);
      img.addEventListener('error', done);
      setTimeout(done, WAIT_MS);
    });

  async function run() {
    const queue = [...document.querySelectorAll('img[loading="lazy"]')];
    while (queue.length && !stopped) {
      const batch = [];
      while (queue.length && batch.length < BATCH) {
        const img = queue.shift();
        if (!img.isConnected || img.complete) continue;
        if (img.checkVisibility && !img.checkVisibility()) continue;
        img.loading = 'eager';
        batch.push(img);
      }
      await Promise.all(batch.map(settle));
    }
  }

  const go = () => {
    if (started) return;
    started = true;
    signs.forEach((type) => window.removeEventListener(type, go));
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200));
    idle(() => run(), { timeout: 1200 });
  };
  signs.forEach((type) => window.addEventListener(type, go, { passive: true }));

  return () => {
    stopped = true;
    signs.forEach((type) => window.removeEventListener(type, go));
  };
}
