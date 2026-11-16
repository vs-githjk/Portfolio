import { builds } from '../data/content';
import { fill } from './counts';

/* A flagship's stills as one viewer: a large frame and a strip of picks under it.
   The picks are radio buttons and the swap is CSS (sections: STILLS), so it works
   before the script runs and with no script at all; arrow keys move between them
   as in any radio group. Every frame and every caption is in the HTML. */
export default function Stills({ id, title, frames }) {
  const name = `stills-${id}`;
  return (
    <fieldset className="stills">
      <legend className="sr">{fill(builds.labels.stills, { title })}</legend>
      {frames.map((f, i) => (
        <input
          className="stills-pick"
          type="radio"
          name={name}
          id={`${name}-${i}`}
          key={f.image}
          defaultChecked={i === 0}
          aria-label={`${fill(builds.labels.still, { n: i + 1, total: frames.length })}: ${f.caption}`}
        />
      ))}
      <div className="stills-stage">
        {frames.map((f, i) => (
          <figure className="stills-frame" key={f.image}>
            <div className="media-frame">
              <img
                src={f.image}
                srcSet={[...f.steps.map((w) => `${f.image.replace('.webp', `-${w}.webp`)} ${w}w`), `${f.image} ${f.width}w`].join(', ')}
                sizes="(min-width: 960px) 560px, 92vw"
                alt={f.alt}
                width={f.width}
                height={f.height}
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="media-cap">
              <span className="num" aria-hidden="true">
                {i + 1}/{frames.length}
              </span>{' '}
              {f.caption}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="stills-strip" aria-hidden="true">
        {frames.map((f, i) => (
          <label className="stills-tab" htmlFor={`${name}-${i}`} key={f.image}>
            <img src={f.image.replace('.webp', `-${f.steps[0]}.webp`)} alt="" width={f.steps[0]} height={Math.round((f.steps[0] * f.height) / f.width)} loading="lazy" decoding="async" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
