import { builds } from '../data/content';

/* Typographic stand-in for a screenshot: the paper's headline number. Used by
   the research row and by the last deck slide. The arrow is a glyph, and
   renders in italic brass. */
export default function PaperTile({ className = 'paper-tile', children }) {
  const { eyebrow, number, line } = builds.research.tile;
  const [from, to] = number.split('→').map((x) => x.trim());
  return (
    <span className={className}>
      <span className="eyebrow">{eyebrow}</span>
      <span className="paper-num">
        {from} <em>→</em> {to}
      </span>
      <span className="paper-line">{line}</span>
      {children}
    </span>
  );
}
