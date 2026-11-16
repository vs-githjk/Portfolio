import { useEffect, useRef, useState } from 'react';
import { setSwitch, useSwitch } from './switches';

/* The Chart: navigation as a place. A native <dialog> holding a <nav>: on the left
   a cross-section of the whole descent, drawn to scale from where the sections
   really are (measured when it opens), with the waterlines across it and a mark
   where the reader is; beside it the same places as a list of real links, each
   joined to its depth by a hairline; then every build as a dot in its group, and
   the switches. The link for the place the reader is in carries
   aria-current="location". Closing it gives focus back to whatever opened it.

   Generic over its data: `places` ({ id, find, name, label, realm } or
   { line, name }), `groups` ({ label, items: [{ id, title }] }), `words`. A link
   is a plain link; kit/travel.js turns a far one into a hop. */
const ROW = 44;

export default function Chart({ places, groups, total, words, lineAt, openerSel = '[aria-haspopup="dialog"]' }) {
  const open = useSwitch('chart');
  const receipts = useSwitch('receipts');
  const sound = useSwitch('sound');
  const plain = useSwitch('plain');
  const ref = useRef(null);
  const [map, setMap] = useState(null);
  const [pick, setPick] = useState(null);
  const opener = useRef(null); // where focus goes back to when the chart closes
  const went = useRef(false); // a place was picked: the jump owns the focus

  // Measure the descent when the chart opens: one pass, never per frame.
  useEffect(() => {
    const dialog = ref.current;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight;
    const vh = window.innerHeight;
    const rows = places.map((p) => {
      if (p.line) return { ...p, at: lineAt(p.line) };
      const el = document.getElementById(p.id) ?? (p.find ? document.querySelector(p.find) : null);
      if (!el) return null;
      if (!el.id) el.id = p.id;
      const r = el.getBoundingClientRect();
      return { ...p, at: r.top + y, end: r.bottom + y };
    });
    const found = rows.filter((r) => r && r.at != null);
    const mid = y + vh * 0.4;
    let here = null;
    for (const r of found) if (!r.line && r.at <= mid) here = r.id;
    setMap({ rows: found, h, here, mark: Math.min(1, Math.max(0, (y + vh / 2) / h)) });
  }, [open, places, lineAt]);

  // Open once the cross-section is drawn, with focus on the place the reader is in.
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !map || dialog.open) return;
    /* Remember who opened it. The key can open it while focus is on the body or on
       something long scrolled away (the first screen's controls); a native dialog
       would hand focus back there, so the bar's own button stands in. */
    const from = document.activeElement;
    const box = from && from !== document.body ? from.getBoundingClientRect() : null;
    const seen = box && box.width > 0 && box.bottom > 0 && box.top < window.innerHeight && from.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) !== false && !from.closest('[aria-hidden="true"]');
    opener.current = seen ? from : document.querySelector(openerSel);
    went.current = false;
    dialog.showModal();
    (dialog.querySelector('[aria-current]') ?? dialog.querySelector('.chart-close'))?.focus();
  }, [open, map]);

  const close = () => setSwitch('chart', false);
  const leave = () => {
    close();
    if (!went.current) opener.current?.focus({ preventScroll: true });
  };
  const go = () => {
    went.current = true;
    close();
  };
  const stops = map ? map.rows.filter((r) => !r.line) : [];
  const lines = map ? map.rows.filter((r) => r.line) : [];
  const scaleH = stops.length * ROW;
  // Number the builds across their groups: 1 to `total`, in page order.
  let before = 0;
  const numbered = groups.map((g) => {
    const items = g.items.map((b, i) => ({ ...b, num: before + i + 1 }));
    before += g.items.length;
    return { ...g, items };
  });

  return (
    <dialog
      className="chart"
      ref={ref}
      aria-labelledby="chart-title"
      onClose={leave}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      {map && (
        <nav className="chart-body" aria-label={words.chart.title}>
          <header className="chart-head">
            <div>
              <h2 id="chart-title">{words.chart.title}</h2>
              <p>{words.chart.lede}</p>
            </div>
            <button className="chart-close" type="button" onClick={close} aria-label={words.chart.close}>
              <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true" focusable="false">
                <path d="M1 1l12 12M13 1 1 13" />
              </svg>
            </button>
          </header>

          <section className="chart-descent" aria-labelledby="chart-places">
            <h3 id="chart-places">{words.chart.places}</h3>
            <div className="chart-map" style={{ '--rows': stops.length }}>
              <svg className="chart-scale" viewBox={`0 0 100 ${scaleH}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                {stops.map((r) => (
                  <rect className="chart-band" data-realm={r.realm} key={r.id} x="0" width="34" y={(r.at / map.h) * scaleH} height={Math.max(1, ((r.end - r.at) / map.h) * scaleH)} />
                ))}
                {stops.map((r, k) => (
                  <polyline className="chart-lead" data-here={r.id === map.here ? '' : undefined} key={r.id} points={`34,${(r.at / map.h) * scaleH} 58,${(r.at / map.h) * scaleH} 82,${k * ROW + ROW / 2} 100,${k * ROW + ROW / 2}`} />
                ))}
                {lines.map((r) => (
                  <line className="chart-water" key={r.line} x1="0" x2="46" y1={(r.at / map.h) * scaleH} y2={(r.at / map.h) * scaleH} />
                ))}
                <rect className="chart-rod" x="0" y="0" width="34" height={scaleH} />
              </svg>
              <span className="chart-here" style={{ top: `${map.mark * 100}%` }}>
                <i aria-hidden="true" />
                <span className="sr">{words.chart.here}</span>
              </span>
              {lines.map((r) => (
                <span className="chart-line-name" aria-hidden="true" key={r.line} style={{ top: `${(r.at / map.h) * 100}%` }}>
                  {r.name}
                </span>
              ))}
              <ol className="chart-places">
                {stops.map((r, k) => (
                  <li key={r.id}>
                    <a href={`#${r.id}`} data-realm={r.realm} aria-current={r.id === map.here ? 'location' : undefined} onClick={go}>
                      <span className="chart-n" aria-hidden="true">
                        {String(k + 1).padStart(2, '0')}
                      </span>
                      <span className="chart-name">{r.name}</span>
                      <span className="chart-label">{r.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="chart-builds" aria-labelledby="chart-builds">
            <h3 id="chart-builds">
              {words.chart.builds} <span className="chart-count">{total}</span>
            </h3>
            {numbered.map((g) => (
              <div className="chart-group" key={g.id}>
                <span className="chart-group-label">{g.label}</span>
                <ul>
                  {g.items.map((b) => (
                    <li key={b.id}>
                      <a href={`#build-${b.id}`} aria-label={`${b.num} of ${total}: ${b.title}`} onClick={go} onPointerEnter={() => setPick(b)} onFocus={() => setPick(b)}>
                        <i aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="chart-pick" aria-hidden="true">
              {pick ? (
                <>
                  <span>
                    {String(pick.num).padStart(2, '0')} / {total}
                  </span>
                  {pick.title}
                </>
              ) : (
                ' '
              )}
            </p>
          </section>

          <section className="chart-switches" aria-labelledby="chart-switches">
            <h3 id="chart-switches">{words.chart.switches}</h3>
            <button type="button" role="switch" aria-checked={receipts} onClick={() => setSwitch('receipts')}>
              <span className="chart-sw-name">{words.receipts.label}</span>
              <span className="chart-sw-hint">{words.receipts.hint}</span>
              <i aria-hidden="true" />
            </button>
            <button type="button" role="switch" aria-checked={sound} onClick={() => setSwitch('sound')}>
              <span className="chart-sw-name">{words.sound.label}</span>
              <span className="chart-sw-hint">{words.sound.hint}</span>
              <i aria-hidden="true" />
            </button>
            <button type="button" role="switch" aria-checked={!plain} onClick={() => setSwitch('plain')}>
              <span className="chart-sw-name">{words.world.label}</span>
              <span className="chart-sw-hint">{words.world.hint}</span>
              <i aria-hidden="true" />
            </button>
          </section>
        </nav>
      )}
    </dialog>
  );
}
