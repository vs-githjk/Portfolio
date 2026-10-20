/* Link row for a build. Links with an empty href are filtered out, so a link
   that is not ready simply does not appear (and an empty row renders nothing). */
export default function LinkRow({ links, className = 'links' }) {
  const live = (links || []).filter((l) => l.href);
  if (live.length === 0) return null;
  return (
    <div className={className}>
      {live.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">
          {l.label}
        </a>
      ))}
    </div>
  );
}
