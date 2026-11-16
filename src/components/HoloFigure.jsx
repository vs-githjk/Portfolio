/* The hologram figure as part of the page: the same picture the first screen
   projects (welcome.figure), with the same look drawn in CSS (.holo in
   v4-opening.css): the picture's tones on the hologram's blue with a share of
   its own colour, scan lines, a slow band of light, a glow round its silhouette,
   and the plate and cone under its feet. The silhouette is the picture's own
   alpha, used as a mask (--fig), so there is no frame.

   The picture is drawn twice: once for its tones in the blue light, once for a
   share of its own colour. The second copy carries the alt text. */
export default function HoloFigure({ figure, className = '', sizes }) {
  const srcSet = figure.phone ? `${figure.phone} ${Math.round((figure.width * 720) / figure.height)}w, ${figure.src} ${figure.width}w` : undefined;
  const shared = { src: figure.src, srcSet, sizes, width: figure.width, height: figure.height, loading: 'lazy', decoding: 'async' };
  return (
    <div className={`holo ${className}`}>
      <span className="holo-cone" aria-hidden="true" />
      <span className="holo-fig" style={{ '--fig': `url(${figure.src})`, aspectRatio: `${figure.width} / ${figure.height}` }}>
        <img {...shared} alt="" />
        <img {...shared} alt={figure.alt} />
      </span>
    </div>
  );
}
