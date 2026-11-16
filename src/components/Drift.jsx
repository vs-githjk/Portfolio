/* Below the ring's breakpoint the orbit gives way to this: the same thumbnails
   as two rows drifting in opposite directions on a plane tilted back, dimmed and
   faded at the edges. It is atmosphere, not a second list (the section it stands
   in has the list), so it has no captions, no controls and no links, and is
   hidden from assistive tech. Each row is drawn three times and moves one third
   of its width per loop, so the seam never shows. Under reduced motion it holds
   still. */
export default function Drift({ slides }) {
  const rows = [slides.filter((_, k) => k % 2 === 0), slides.filter((_, k) => k % 2 === 1)];
  return (
    <div className="drift" aria-hidden="true">
      <div className="drift-plane">
        {rows.map((row, r) => (
          <div className="drift-row" data-dir={r ? 'right' : 'left'} key={r}>
            {[0, 1, 2].flatMap((copy) =>
              row.map((s, k) => (
                <img
                  key={`${copy}-${k}`}
                  src={s.image.src.replace('.webp', '-320.webp')}
                  alt=""
                  data-tone={s.tone}
                  width="320"
                  height="200"
                  loading="lazy"
                  decoding="async"
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
