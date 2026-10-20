import { useEffect, useRef } from 'react';
import { nav } from '../data/content';

/* Sticky, 60px, frosted. Section links collapse into a second row below 960px
   (the page is one scroll, no hamburger). On a phone that two-row bar slides away
   while the reader scrolls down and comes back on the first scroll up, so it never
   covers the cards being read; CSS applies `data-hide` only below 960px. */
export default function Nav() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      let hide = el.dataset.hide === 'true';
      if (y < 160) hide = false;
      else if (y > last + 8) hide = true;
      else if (y < last - 8) hide = false;
      else return;
      last = y;
      el.dataset.hide = hide ? 'true' : 'false';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
