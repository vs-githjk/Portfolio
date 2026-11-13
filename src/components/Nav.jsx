import { useEffect, useRef } from 'react';
import { nav } from '../data/content';
import { heroOrigin } from '../lib/origin';

/* Sticky, 60px, frosted. Section links collapse into a second row below 960px
   (the page is one scroll, no hamburger). On a phone that two-row bar slides away
   while the reader scrolls down and comes back on the first scroll up, so it never
   covers the cards being read; CSS applies `data-hide` only below 960px.

   The welcome is a pure first screen: until the reader is about half way through
   the hand-off to the hero, the bar is out of sight (CSS hides it while <html>
   has no data-nav). It is still in the DOM and in the tab order: focus inside it,
   the skip link included, brings it straight back. */
export default function Nav() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const root = document.documentElement;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const shown = y >= heroOrigin() * 0.5;
      if (shown !== (root.dataset.nav === 'on')) {
        if (shown) root.dataset.nav = 'on';
        else delete root.dataset.nav;
      }
      let hide = el.dataset.hide === 'true';
      if (y < 160) hide = false;
      else if (y > last + 8) hide = true;
      else if (y < last - 8) hide = false;
      else return;
      last = y;
      el.dataset.hide = hide ? 'true' : 'false';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      delete root.dataset.nav;
    };
  }, []);
  return (
    <nav className="nav" ref={ref} aria-label="Primary">
      <a className="skip" href="#main">
        {nav.skip}
      </a>
      <div className="wrap">
        <a className="brand" href="#top">
          <i aria-hidden="true" />
          {nav.brand}
        </a>
        <ul className="nav-links">
          {nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <a className="btn btn-pri nav-cta" href={nav.cta.href}>
          {nav.cta.label}
        </a>
      </div>
    </nav>
  );
}
