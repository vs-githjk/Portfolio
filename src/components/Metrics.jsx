/* Shared metric row. Labels may contain \n; CSS keeps the break. */
export default function Metrics({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="metrics">
      {items.map((m) => (
        <li key={m.label}>
          <b>{m.value}</b>
          <span>{m.label}</span>
        </li>
      ))}
    </ul>
  );
}
