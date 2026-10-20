/* Typographic stand-in for a thumbnail, used only when a build has no image:
   one headline figure and the sentence that says what it measures. The arrow is
   a glyph, never a dash. */
export default function Tile({ tile, className = 'tile' }) {
  const [from, to] = tile.number.split('→').map((x) => x.trim());
  return (
    <span className={className}>
      <span className="eyebrow">{tile.eyebrow}</span>
      <span className="tile-num">
        {from}
        {to && (
          <>
            {' '}
            <em>→</em> {to}
          </>
        )}
      </span>
      <span className="tile-line">{tile.line}</span>
    </span>
  );
}
