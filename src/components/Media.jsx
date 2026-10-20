import Tile from './Tile';

/* A screenshot frame, flat and straight: build images never rotate, so a product
   frame always reads square to the page. `badges` float above the frame at one
   elevation step. When a build has no image the typographic tile stands in. */
/* A build image ships at several widths: <name>.webp at `width` and
   <name>-<w>.webp for each w in `steps`. srcSet lets a phone take a smaller one;
   `sizes` says how wide the slot is. */
export default function Media({ image, alt, tile, badges = null, className = '', ratio = '16 / 10', width = 1200, height = 750, steps = [640, 900], sizes, eager = false }) {
  return (
    <div className={`media ${className}`.trim()}>
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
      </div>
      {badges && <div className="media-awards">{badges}</div>}
    </div>
  );
}
