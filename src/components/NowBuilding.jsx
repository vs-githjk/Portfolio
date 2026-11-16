import { useEffect, useRef, useState } from 'react';
import { EV } from '../kit/contract';
import CrewRun from './CrewRun';
import Metrics from './Metrics';
import Rich from './Rich';
import Stack from './Stack';
import { fill } from './counts';

/* The Now building panel (Master Agents), built like a character select screen.

   - Head: the title at display size, and beside it the one sentence and the lead.
   - Stage: one character large (their art lights the wall behind them, and the
     next and previous stand in the wings), a plate that says who they are, and
     the roster of fourteen. The roster is a tablist: arrow keys move, hover and
     click choose. Until someone touches it, the stage walks the roster by itself
     while it is on screen; it never does under prefers-reduced-motion.
   - The run (CrewRun.jsx): the one sentence drawn as a prompt that runs through
     the crew to a reviewed branch, and can be pressed.
   - System: how the crew is run (routing, the council, the loop), then the facts.

   Art is /agents/<id>.webp (294px) and /agents/<id>-148.webp. */
const STEP_MS = 3200;

const HUES = new Map(); // character id -> dominant hue of their art, in degrees
const art = (id, small) => `/agents/${id}${small ? '-148' : ''}.webp`;

export default function NowBuilding({ item }) {
  const [sel, setSel] = useState(0);
  const root = useRef(null);
  const tabs = useRef([]);
  const auto = useRef(true);
  const count = item ? item.crew.length : 0;

  useEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer = 0;
    const stop = () => {
      clearInterval(timer);
      timer = 0;
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        stop();
        if (entry.isIntersecting && auto.current) {
          timer = setInterval(() => {
            if (!auto.current) stop();
            else if (!document.hidden) setSel((s) => (s + 1) % count);
          }, STEP_MS);
        }
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return () => {
      stop();
      io.disconnect();
    };
  }, [count]);

  /* The chosen character tints the world: the dominant hue of their art (read
     once per character from the small file, saturated pixels only) is written to
     :root as --agent-hue (degrees) and sent as a `world:agent` event, so the
     scene can lean the nearby sand toward it. */
  const whoId = item ? item.crew[sel].id : null;
  useEffect(() => {
    if (!whoId) return undefined;
    let live = true;
    const send = (hue) => {
      if (!live) return;
      document.documentElement.style.setProperty('--agent-hue', String(hue));
      window.dispatchEvent(new CustomEvent(EV.agent, { detail: { hue, id: whoId } }));
    };
    if (HUES.has(whoId)) {
      send(HUES.get(whoId));
      return () => {
        live = false;
      };
    }
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 16;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, 16, 16);
        const d = g.getImageData(0, 0, 16, 16).data;
        let x = 0;
        let y = 0;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i] / 255;
          const gr = d[i + 1] / 255;
          const b = d[i + 2] / 255;
          const max = Math.max(r, gr, b);
          const min = Math.min(r, gr, b);
          const sat = max - min;
          if (sat < 0.12) continue;
          const h = max === r ? ((gr - b) / sat) % 6 : max === gr ? (b - r) / sat + 2 : (r - gr) / sat + 4;
          x += Math.cos((h * Math.PI) / 3) * sat * max;
          y += Math.sin((h * Math.PI) / 3) * sat * max;
        }
        const hue = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
        HUES.set(whoId, hue);
        send(hue);
      } catch {
        /* no canvas: the world keeps its own colour */
      }
    };
    img.src = art(whoId, true);
    return () => {
      live = false;
    };
  }, [whoId]);

  if (!item) return null;
  const n = count;
  const who = item.crew[sel];
  const prev = item.crew[(sel + n - 1) % n];
  const next = item.crew[(sel + 1) % n];
  const pick = (i) => {
    auto.current = false;
    setSel(i);
  };
  const onKey = (e) => {
    const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let to = -1;
    if (move) to = (sel + move + n) % n;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    pick(to);
    tabs.current[to]?.focus();
  };
  const pad = (v) => String(v).padStart(2, '0');

  return (
    <article className="nb reveal" id="build-master-agents" ref={root} data-world-anchor="camp" data-own-ground="">
      <div className="nb-in">
        <div className="nb-bar">
          <span className="now">
            <i aria-hidden="true" />
            {item.eyebrow}
          </span>
          <span className="eyebrow">{item.when}</span>
        </div>

        <div className="nb-head">
          <h3 className="nb-title">
            {item.title} <span>{item.descriptor}</span>
          </h3>
          <div className="nb-lede">
            <p className="nb-one">{item.oneLiner}</p>
            <p className="text">
              <Rich text={item.lead} />
            </p>
          </div>
        </div>

        <div className="nb-stage">
          <div className="nb-feature" aria-hidden="true">
            <img className="nb-wing" data-side="prev" key={`p-${prev.id}`} src={art(prev.id, true)} alt="" width="148" height="148" loading="lazy" decoding="async" />
            <img className="nb-wing" data-side="next" key={`n-${next.id}`} src={art(next.id, true)} alt="" width="148" height="148" loading="lazy" decoding="async" />
            <img className="nb-aura" key={`a-${who.id}`} src={art(who.id, true)} alt="" width="148" height="148" loading="lazy" decoding="async" />
            <div className="nb-card" key={who.id}>
              <img src={art(who.id)} alt="" width="294" height="294" loading="lazy" decoding="async" />
            </div>
          </div>

          <div className="nb-plate" role="tabpanel" id="nb-plate" aria-labelledby={`nb-tab-${who.id}`}>
            <p className="nb-count">
              {pad(sel + 1)} <span>{item.of}</span> {pad(n)}
            </p>
            <p className="nb-name" key={who.id}>
              {who.name}
            </p>
            <p className="nb-job">{who.job}</p>
            <p className="nb-does">{who.does}</p>
          </div>

          <div className="nb-roster">
            <p className="nb-hint">{fill(item.rosterHint, { crew: count })}</p>
            <div className="nb-grid" role="tablist" aria-label={item.rosterLabel} onKeyDown={onKey}>
              {item.crew.map((c, i) => (
                <button
                  type="button"
                  role="tab"
                  className="nb-tab"
                  id={`nb-tab-${c.id}`}
                  key={c.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  aria-selected={i === sel}
                  aria-controls="nb-plate"
                  aria-label={`${c.name}, ${c.job}`}
                  tabIndex={i === sel ? 0 : -1}
                  onClick={() => pick(i)}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') pick(i);
                  }}
                >
                  <img src={art(c.id, true)} alt="" width="148" height="148" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <CrewRun prompt={item.prompt} />

        <div className="nb-sys">
          {item.system.map((s, i) => (
            <section className="nb-cell" key={s.label}>
              <p className="nb-label">
                <span>{pad(i + 1)}</span> {s.label}
              </p>
              <h4>{s.title}</h4>
              {s.rows && (
                <dl className="nb-rows">
                  {s.rows.map((r) => (
                    <div key={r.k}>
                      <dt>{r.k}</dt>
                      <dd>{r.v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.seats && (
                <ul className="nb-seats">
                  {s.seats.map((seat) => (
                    <li key={seat}>{seat}</li>
                  ))}
                </ul>
              )}
              {s.text && (
                <p className="text">
                  <Rich text={s.text} />
                </p>
              )}
              {s.foot && <p className="nb-note">{s.foot}</p>}
            </section>
          ))}
        </div>

        <div className="nb-foot">
          <Metrics items={item.facts} />
          <div className="nb-end">
            <p className="text">{item.close}</p>
            <Stack text={item.stack} />
          </div>
        </div>
      </div>
    </article>
  );
}
