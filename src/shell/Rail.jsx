import { useEffect, useState } from 'react';
import { onRelay, pageSize, startAnchors } from '../kit/anchors';

/* The depth rail: a slim scale down the right edge of a wide window, one tick per
   place at its real depth and a mark that rides --w-depth (kit/signals.js). It is
   the Chart's cross-section, always in sight. Decoration: the Chart is the
   navigation, so the rail is aria-hidden and takes no pointer. */
export default function Rail({ places, origin }) {
  const [ticks, setTicks] = useState([]);
  useEffect(() => {
    startAnchors();
    const read = () => {
      const y = window.scrollY;
      const from = origin();
      const room = pageSize().h - window.innerHeight - from;
      if (room <= 0) return;
      const next = [];
      for (const p of places) {
        if (p.line) continue;
        const el = document.getElementById(p.id) ?? (p.find ? document.querySelector(p.find) : null);
        if (!el) continue;
        const at = (el.getBoundingClientRect().top + y - from) / room;
        if (at >= -0.001 && at <= 1) next.push({ id: p.id, at: Math.max(0, at), realm: p.realm });
      }
      setTicks((was) => (JSON.stringify(was) === JSON.stringify(next) ? was : next));
    };
    read();
    return onRelay(read);
  }, [places, origin]);
  return (
    <div className="rail" aria-hidden="true">
      {ticks.map((t) => (
        <i className="rail-tick" data-realm={t.realm} key={t.id} style={{ top: `${(t.at * 100).toFixed(2)}%` }} />
      ))}
      <b className="rail-mark" />
    </div>
  );
}
