import { useEffect, useRef } from 'react';
import { proof } from '../data/content';
import { useReducedMotion } from '../hooks/useMediaQuery';

/* One number counting up once, on first view: 700ms, ease-out. Prefix, suffix
   and decimals are preserved ("~", "+", "%"). Under reduced motion the final
   value is simply rendered. The real value is always in the DOM for assistive
   tech; the animated text is aria-hidden. */
function Count({ value }) {
  const el = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = el.current;
    const m = value.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (reduced || !m || !('IntersectionObserver' in window)) {
      node.textContent = value;
      return undefined;
    }
    const [, pre, num, suf] = m;
    const end = parseFloat(num);
    const dec = (num.split('.')[1] || '').length;
    let raf = 0;
    node.textContent = `${pre}${(0).toFixed(dec)}${suf}`;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (now) => {
          const p = Math.min(1, (now - t0) / 700);
          const e = 1 - Math.pow(1 - p, 3);
          node.textContent = `${pre}${(end * e).toFixed(dec)}${suf}`;
          if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.5 }
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, reduced]);

  return (
    <>
      <span className="sr">{value}</span>
      <span ref={el} aria-hidden="true">
        {value}
      </span>
    </>
  );
}

/* The one loud moment: a full-bleed brass band of six numbers directly under
   the hero. Nothing else on the page uses --fs-num or a brass fill. */
export default function Proof() {
  return (
    <section className="proof" id="numbers" aria-label="Proof">
      <div className="wrap">
        <ul className="proof-list">
          {proof.map((p) => (
            <li key={p.label}>
              <div className="proof-num">
                <Count value={p.value} />
              </div>
              <div className="proof-label">{p.label}</div>
              <div className="proof-sub">{p.sub}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
