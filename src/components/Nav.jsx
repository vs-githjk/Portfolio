import { nav, meta } from '../data/content';
import { useScrolled } from '../hooks/useScrolled';

export default function Nav() {
  const scrolled = useScrolled();

  return (
    <nav className={`nav${scrolled ? ' stuck' : ''}`}>
      <div className="nav-in">
        <a href="#top" className="brand">
          {meta.name} <span>/ swe</span>
        </a>
        <div className="nav-links">
          {nav.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
