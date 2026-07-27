import { useEffect, useState } from 'react';
import { nav, meta } from '../data/content';
import { useScrolled } from '../hooks/useScrolled';

export default function Nav() {
  const scrolled = useScrolled();
  const [prog, setProg] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setProg(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <nav className={`nav${scrolled ? ' stuck' : ''}`}>
      <i className="nav-progress" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
      <div className="nav-in">
        <a href="#top" className="brand">
          {meta.name} <span>/ fde</span>
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
