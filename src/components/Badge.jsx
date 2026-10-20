import { StarIcon } from './Icons';

/* kind "win": gold, with a star (an award). kind "live": mint, with a dot
   (live or in beta). kind "out": a sentence-case outcome pill (Experience).
   Anything else is the plain indigo pill. */
export default function Badge({ kind = '', className = '', dot = false, children }) {
  const cls = ['badge', kind && `badge-${kind}`, className].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {kind === 'win' && <StarIcon />}
      {(kind === 'live' || dot) && <i aria-hidden="true" />}
      {children}
    </span>
  );
}
