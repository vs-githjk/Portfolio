import { hero } from '../data/content';
import PlateArc from '../shell/PlateArc';

/* Below the ring's breakpoint the orbit gives way to this: the same eleven
   thumbnails as two rows drifting in opposite directions on a plane tilted back
   into the beams, dimmed and faded at the edges. It is atmosphere, not a second
   list of builds (Builds is the list), so it has no captions, no controls and no
   links, and is hidden from assistive tech. Each row is drawn three times and
   moves one third of its width per loop, so the seam never shows. Under reduced
   motion it holds still.

   Under the rows lies the near edge of the same plate the ring stands on at a
   wider window: two rims and a tick per ring build, the ring the reader came
   through, now underfoot. */
const { slides } = hero.carousel;
const ROWS = [slides.filter((_, k) => k % 2 === 0), slides.filter((_, k) => k % 2 === 1)];

export default function Drift() {
  return (
    <>
      <div className="drift" aria-hidden="true">
        <div className="drift-plane">
          {ROWS.map((row, r) => (
            <div className="drift-row" data-dir={r ? 'right' : 'left'} key={r}>
              {[0, 1, 2].flatMap((copy) =>
                row.map((s) => (
                  <img
                    key={`${copy}-${s.id}`}
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
      <PlateArc className="drift-plate" count={slides.length} far={false} />
    </>
  );
}
