/* Where the hero starts. The welcome screen sits above it, so everything that
   used to count from the top of the page (the beams' fade, The Deep, the nav)
   counts from here instead: the scroll offset at which the hero is the first
   thing under the nav. Measured once and again after a resize. */
let origin = -1;
let listening = false;

export function heroOrigin() {
  if (origin < 0) {
    const hero = document.getElementById('top');
    const nav = document.querySelector('.nav');
    origin = hero ? Math.max(0, Math.round(hero.getBoundingClientRect().top + window.scrollY - (nav ? nav.offsetHeight : 0))) : 0;
    if (!listening) {
      listening = true;
      window.addEventListener(
        'resize',
        () => {
          origin = -1;
        },
        { passive: true }
      );
    }
  }
  return origin;
}
