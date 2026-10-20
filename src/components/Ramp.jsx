/* Monthly contribution totals as brass bars scaled to the busiest month. Zero
   months render a flat hairline bar. The best story in the data: a handful a
   month in early 2026, then hundreds. */
import { MONTHS } from '../lib/months';

const BAR_MAX = 58; // px, the busiest month

export default function Ramp({ totals, cellLabel }) {
  const max = Math.max(...totals.map((t) => t.count));
  return (
    <div className="ramp">
      {totals.map((t) => {
        const month = MONTHS[Number(t.key.slice(5, 7)) - 1];
        const tip = cellLabel
          .replace('{n}', t.count)
          .replace('{month}', month)
          .replace('{year}', t.key.slice(0, 4));
        return (
          <div key={t.key} data-zero={t.count ? undefined : ''} title={tip}>
            <b>{t.count}</b>
            <i style={{ '--h': `${Math.max(2, Math.round((t.count / max) * BAR_MAX))}px` }} />
            <span>{month[0]}</span>
          </div>
        );
      })}
    </div>
  );
}
