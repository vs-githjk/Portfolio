/* Shared metric row. Each label says what the value measures; \n is kept. */
export default function Metrics({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="metrics">
      {items.map((m) => (
        <li className="metric" key={m.label}>
          <b>{m.value}</b>
          <span>{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
