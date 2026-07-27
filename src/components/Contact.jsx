import { useEffect, useRef, useState } from 'react';
import { contact } from '../data/content';

/* Colors for the scan grid come from the token layer, read once at mount. */
function useTokenColors() {
  const [colors, setColors] = useState(null);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    setColors({
      lines: css.getPropertyValue('--on-accent-dark').trim() || '#0c0e13',
      scan: css.getPropertyValue('--accent-2').trim() || '#ff2e4d',
    });
  }, []);
  return colors;
}

export default function Contact() {
  const secRef = useRef(null);
  const tokenColors = useTokenColors();
  const [motionOk, setMotionOk] = useState(false);

  useEffect(() => {
    setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  /* three.js is heavy; fetch the scan-grid chunk only when Contact draws near. */
  const [Grid, setGrid] = useState(null);
  useEffect(() => {
    if (!motionOk) return;
    const el = secRef.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          import('./GridScan').then((m) => setGrid(() => m.default));
          io.disconnect();
        }
      },
      { rootMargin: '1200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [motionOk]);

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
        {motionOk && tokenColors && Grid && (
          <div className="contact-fx" aria-hidden="true">
            {/* Static: scan pulses off (scanOpacity 0), no line jitter — the
                grid only tilts gently with the mouse. */}
            <Grid
              sensitivity={0.4}
              lineThickness={1}
              linesColor={tokenColors.lines}
              scanColor={tokenColors.scan}
              scanOpacity={0}
              gridScale={0.1}
              lineJitter={0}
              noiseIntensity={0.01}
            />
          </div>
        )}
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
                  <span className="l-v">{l.value} ↗</span>
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
