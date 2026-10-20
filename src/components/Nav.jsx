import { useEffect, useRef } from 'react';
import { nav } from '../data/content';

/* Sticky, 60px. Section links collapse away at phone width; the brand and the
   Email pill remain (the page is one scroll, no hamburger). The 1px brass line
   under the bar is the scroll progress; it is set straight on the node so a
   scroll never re-renders React. */
export default function Nav() {
  const bar = useRef(null);

  useEffect(() => {
    const node = bar.current;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      node.style.width = `${max > 0 ? (100 * h.scrollTop) / max : 0}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <nav className="nav" aria-label="Primary">
      <div className="wrap nav-in">
        <a href="#top" className="nav-brand">
          <i aria-hidden="true" />
          {nav.brand}
        </a>
        <ul>
          {nav.links.map((l) => (
            <li className="nav-sec" key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
          <li>
            <a className="nav-cta" href={nav.cta.href}>
              {nav.cta.label}
            </a>
          </li>
        </ul>
      </div>
      <div className="nav-prog" ref={bar} aria-hidden="true" />
    </nav>
  );
}
