import { useEffect, useRef } from 'react';
import Tile from './Tile';

/* A screenshot frame with real depth: on a fine pointer it tilts toward the
   cursor (transform only, one rAF per move) and a soft glare follows the light.
   `badges` float above the frame at one elevation step. Touch devices and
   prefers-reduced-motion get the flat frame. When a build has no image the
   typographic tile stands in. */
/* A build image ships at several widths: <name>.webp at `width` and
   <name>-<w>.webp for each w in `steps`. srcSet lets a phone take a smaller one;
   `sizes` says how wide the slot is. */
export default function Media({ image, alt, tile, tilt = 0, badges = null, className = '', ratio = '16 / 10', width = 1200, height = 750, steps = [640, 900], sizes, eager = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const m = ref.current;
    if (!tilt || !m || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = 0;
    let ev = null;
    const enter = () => {
      if (!reduced.matches) m.classList.add('tilting');
    };
    const move = (e) => {
      if (reduced.matches) return;
      ev = e;
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const r = m.getBoundingClientRect();
        const px = (ev.clientX - r.left) / r.width;
        const py = (ev.clientY - r.top) / r.height;
        m.style.setProperty('--ry', `${((px - 0.5) * 2 * tilt).toFixed(2)}deg`);
        m.style.setProperty('--rx', `${((0.5 - py) * 2 * tilt).toFixed(2)}deg`);
        m.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        m.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      m.classList.remove('tilting');
      m.style.setProperty('--rx', '0deg');
      m.style.setProperty('--ry', '0deg');
    };
    m.addEventListener('pointerenter', enter);
    m.addEventListener('pointermove', move);
    m.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(pending);
      m.removeEventListener('pointerenter', enter);
      m.removeEventListener('pointermove', move);
      m.removeEventListener('pointerleave', leave);
    };
  }, [tilt]);

  return (
    <div className={`media ${className}`.trim()} ref={ref}>
      <div className="media-frame" style={{ aspectRatio: ratio }}>
        {image ? (
          <img
            src={image}
            srcSet={[...steps.map((w) => `${image.replace('.webp', `-${w}.webp`)} ${w}w`), `${image} ${width}w`].join(', ')}
            sizes={sizes}
            alt={alt}
            width={width}
            height={height}
            {...(eager ? {} : { loading: 'lazy' })}
            decoding="async"
          />
        ) : (
          tile && <Tile tile={tile} />
        )}
        {tilt > 0 && <span className="glare" aria-hidden="true" />}
      </div>
      {badges && <div className="media-awards">{badges}</div>}
    </div>
  );
}
