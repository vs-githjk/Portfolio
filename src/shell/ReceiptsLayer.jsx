import { useEffect, useState } from 'react';
import { EV } from '../kit/contract';
import { on } from '../kit/bus';
import { add } from '../kit/director';
import { list } from '../kit/anchors';
import { localBindings } from '../kit/bindings';

/* Receipts: while the switch is on, every living thing in the window gets a small
   label saying what it is, the count it is drawn from and the file that count
   comes from. Positions come from the scene (EV.bindings, at most ten a second)
   and from pieces in the page (kit/bindings.js); the words come from `parts(id)`.

   A label never sits on the text. Inside a free window (`free`: selectors of the
   stretches with no text column) it stands beside its piece, joined by a
   hairline. Anywhere else it goes to the margin on its side if the margin is
   wide enough, and to the ledger (one line each, along the foot) if not.
   Decoration: the same facts are already in the page, so the layer is aria-hidden. */
const TAG = { w: 168, h: 64, gap: 18, edge: 10 };

function layout(items, parts, free, column, bar) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const y0 = window.scrollY;
  const zones = free.flatMap((sel) => list(sel)).map((z) => [z.top - y0, z.top + z.h - y0]);
  const margin = (w - column) / 2;
  const tags = [];
  const ledger = [];
  for (const it of items) {
    if (!it.visible) continue;
    const words = parts(it.id);
    if (!words) continue;
    const inFree = zones.some(([a, b]) => it.y >= a && it.y <= b);
    const side = it.side === 'left' ? 'left' : 'right';
    if (inFree && w >= TAG.w * 2) {
      const left = Math.max(TAG.edge, Math.min(w - TAG.w - TAG.edge, side === 'left' ? it.x - TAG.gap - TAG.w : it.x + TAG.gap));
      const top = Math.max(bar + TAG.edge, Math.min(h - TAG.h - TAG.edge, it.y - TAG.h / 2));
      tags.push({ ...it, words, side, where: 'beside', left, top });
    } else if (margin >= TAG.w + TAG.edge * 2 && it.y > bar && it.y < h) {
      const left = side === 'left' ? TAG.edge : w - TAG.w - TAG.edge;
      tags.push({ ...it, words, side, where: 'margin', left, top: Math.max(bar + TAG.edge, Math.min(h - TAG.h - TAG.edge, it.y - TAG.h / 2)) });
    } else if (it.y > 0 && it.y < h) ledger.push({ id: it.id, words });
  }
  // Labels on one side never stack on each other: the lower one steps down.
  for (const side of ['left', 'right']) {
    const col = tags.filter((t) => t.side === side).sort((a, b) => a.top - b.top);
    for (let i = 1; i < col.length; i++) if (col[i].top < col[i - 1].top + TAG.h + 8) col[i].top = col[i - 1].top + TAG.h + 8;
  }
  return { tags, ledger: ledger.slice(0, 3) };
}

export default function ReceiptsLayer({ parts, free = [], title }) {
  const [view, setView] = useState({ tags: [], ledger: [] });

  useEffect(() => {
    let remote = [];
    let last = 0;
    let key = '';
    const wrap = document.querySelector('main .wrap');
    const nav = document.querySelector('.nav');
    // The text column: the wrap without its gutters (read here and on a resize only).
    const inner = () => {
      if (!wrap) return window.innerWidth;
      const cs = getComputedStyle(wrap);
      return wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    };
    let column = inner();
    let bar = nav ? nav.offsetHeight : 0;
    const onResize = () => {
      column = inner();
      bar = nav ? nav.offsetHeight : 0;
    };
    const update = (now) => {
      if (now - last < 100) return true;
      last = now;
      const next = layout([...localBindings(), ...remote], parts, free, column, bar);
      const k = JSON.stringify(next.tags.map((t) => [t.id, Math.round(t.left), Math.round(t.top), Math.round(t.x), Math.round(t.y)])) + next.ledger.map((l) => l.id).join();
      if (k !== key) {
        key = k;
        setView(next);
      }
      return false;
    };
    const stop = add(update);
    const off = on(EV.bindings, (detail, e) => {
      remote = Array.isArray(e.detail) ? e.detail : [];
      update(performance.now() + 1000);
    });
    // Pieces that move without a scroll (the ring turning) are read ten times a second.
    const pulse = setInterval(() => update(performance.now() + 1000), 100);
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      stop();
      off();
      clearInterval(pulse);
      window.removeEventListener('resize', onResize);
    };
  }, [parts, free]);

  return (
    <div className="receipts-layer" aria-hidden="true">
      <svg className="receipts-leads" focusable="false">
        {view.tags
          .filter((t) => t.where === 'beside')
          .map((t) => (
            <line key={t.id} x1={t.x} y1={t.y} x2={t.side === 'left' ? t.left + TAG.w : t.left} y2={t.top + 12} />
          ))}
      </svg>
      {view.tags.map((t) => (
        <p className="receipt-tag" data-where={t.where} data-side={t.side} key={t.id} style={{ left: t.left, top: t.top, width: TAG.w }}>
          <b>{t.words.name}</b>
          <span>{t.words.fact}</span>
          <i>{t.words.source}</i>
        </p>
      ))}
      {view.ledger.length > 0 && (
        <ul className="receipts-ledger">
          <li className="receipts-ledger-title">{title}</li>
          {view.ledger.map((l) => (
            <li key={l.id}>
              <b>{l.words.name}</b>
              <span>{l.words.fact}</span>
              <i>{l.words.source}</i>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
