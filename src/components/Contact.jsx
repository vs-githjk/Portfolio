import { useEffect, useRef } from 'react';
import { contact } from '../data/content';

export default function Contact() {
  const secRef = useRef(null);

  /* Re-arm the cyan reveal on every visit: .lit toggles with visibility. */
  useEffect(() => {
    const el = secRef.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('lit');
      return;
    }
    const io = new IntersectionObserver(([e]) => el.classList.toggle('lit', e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <section className="contact" id="contact" ref={secRef}>
        <div className="wrap reveal">
          <div className="eyebrow">{contact.eyebrow}</div>
          <h2>{contact.heading}</h2>
          <p className="contact-blurb">{contact.blurb}</p>

          <a className="big-mail" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>

          <div className="links">
            {contact.links
              .filter((l) => l.href)
              .map((l) => (
                <a
                  href={l.href}
                  key={l.kind}
                  target={l.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                >
                  <span className="l-k">{l.kind}</span>
                  <span className="l-v">{l.value} →</span>
                </a>
              ))}
          </div>
        </div>
      </section>

      <footer className="foot">
        <div className="wrap foot-in">
          <span>{contact.footerLeft}</span>
          <span>{contact.footerRight}</span>
        </div>
      </footer>
    </>
  );
}
