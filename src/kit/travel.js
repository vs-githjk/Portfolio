import { EV } from './contract';
import { emit } from './bus';
import { reduced } from './quality';

/* Travel: an in-page jump is a hop, not a long smooth scroll. A click on a link to
   a place more than `far` screens away dips the page (<html data-travel="out">,
   `out` ms), lands the scroll in one step, lets the world draw where it now is,
   and brings the page back (<html data-travel="in">, `back` ms). EV.travel tells
   the scene which way it went, so it can streak. A near link scrolls as it always
   did. Either way the place that was reached is marked for a second
   (data-arrive on the element `mark` picks), and focus follows the reader there.
   Under reduced motion it is an instant jump with no dip.

   Links stay links: this only listens to clicks that nobody else has handled. */
export function startTravel({ far = 1.2, out = 160, back = 200, hold = 1100, mark = (el) => ({ el: el.querySelector('h1, h2, h3') ?? el, kind: 'line' }) } = {}) {
  const root = document.documentElement;
  let hopping = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  function arrive(target) {
    const { el, kind } = mark(target);
    if (!el) return;
    delete el.dataset.arrive;
    // A fresh frame, so the mark plays again when the same place is reached twice.
    requestAnimationFrame(() => {
      el.dataset.arrive = kind;
      later(() => delete el.dataset.arrive, hold);
    });
  }

  function follow(target) {
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  // Put the scroll on the place in one step. The hash goes first so :target and the
  // history follow; the page's own smooth scrolling is held off (`quiet`) until
  // the caller hands it back, because the browser may run that scroll a task later.
  function land(target, id, quiet) {
    if (quiet) root.style.scrollBehavior = 'auto';
    if (window.location.hash.slice(1) !== id) window.location.hash = id;
    if (quiet) target.scrollIntoView({ block: 'start', behavior: 'instant' });
    else if (window.location.hash.slice(1) === id) target.scrollIntoView({ block: 'start' });
    follow(target);
  }

  function hop(target, id) {
    if (hopping) return;
    hopping = true;
    const dir = target.getBoundingClientRect().top > 0 ? 1 : -1;
    root.dataset.travel = 'out';
    emit(EV.travel, { dir, phase: 'out' });
    later(() => {
      land(target, id, true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          root.dataset.travel = 'in';
          emit(EV.travel, { dir, phase: 'in' });
          arrive(target);
          later(() => {
            delete root.dataset.travel;
            root.style.scrollBehavior = '';
            hopping = false;
          }, back);
        })
      );
    }, out);
  }

  /* Go to a place by id, as a link to it would. Returns false if there is none. */
  function go(id) {
    const target = document.getElementById(id);
    if (!target) return false;
    if (reduced() || Math.abs(target.getBoundingClientRect().top) < window.innerHeight * far) {
      land(target, id, reduced());
      arrive(target);
      if (reduced()) root.style.scrollBehavior = '';
    } else hop(target, id);
    return true;
  }

  const onClick = (e) => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest?.('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target || reduced()) return;
    if (Math.abs(target.getBoundingClientRect().top) < window.innerHeight * far) return;
    e.preventDefault();
    hop(target, id);
  };
  const onHash = () => {
    if (hopping) return;
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) arrive(target);
  };
  document.addEventListener('click', onClick);
  window.addEventListener('hashchange', onHash);

  return {
    go,
    stop() {
      document.removeEventListener('click', onClick);
      window.removeEventListener('hashchange', onHash);
      for (const id of timers) clearTimeout(id);
      delete root.dataset.travel;
      root.style.scrollBehavior = '';
    },
  };
}
