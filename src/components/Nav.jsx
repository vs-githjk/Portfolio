import { nav } from '../data/content';

/* Sticky, 60px, frosted. Section links collapse away below 960px; the brand and
   the Email pill remain (the page is one scroll, no hamburger). */
export default function Nav() {
  return (
    <nav className="nav" aria-label="Primary">
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
