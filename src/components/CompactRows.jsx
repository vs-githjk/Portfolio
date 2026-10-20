import LinkRow from './LinkRow';

/* "More builds": four hairline index rows. An empty stack or year renders
   nothing (the cell collapses); the index continues the numbering from the
   cards above (09 to 12). */
export default function CompactRows({ compact, start }) {
  const last = start + compact.items.length - 1;
  const label = compact.indexLabel
    .replace('{from}', String(start).padStart(2, '0'))
    .replace('{to}', String(last).padStart(2, '0'));
  return (
    <div className="compact">
      <div className="compact-head reveal">
        <h3>{compact.heading}</h3>
        <span className="eyebrow">{label}</span>
      </div>
      <ul className="compact-list reveal">
        {compact.items.map((c, n) => (
          <li className="compact-row" id={`build-${c.id}`} key={c.id}>
            <span className="compact-title">
              <i>{String(start + n).padStart(2, '0')}</i>
              {c.title}
            </span>
            <span className="compact-what">{c.oneLiner}</span>
            <span className="compact-stack">{c.stack}</span>
            <span className="compact-year">{c.year}</span>
            <LinkRow links={c.links} className="links compact-links" />
          </li>
        ))}
      </ul>
    </div>
  );
}
