import { useEffect, useRef, useState } from 'react';
import { nav } from '../data/content';
import { heroOrigin } from '../lib/origin';
import { shell } from '../data/world';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';
import { setSwitch, useSwitch } from '../shell/switches';

/* Sticky, 60px, frosted. Section links collapse into a second row below 960px
   (the page is one scroll, no hamburger). On a phone that two-row bar slides away
   while the reader scrolls down and comes back on the first scroll up, so it never
   covers the cards being read; CSS applies `data-hide` only below 960px.

   The welcome is a pure first screen: until the reader is all but inside (the
   hero is about to land), the bar is out of sight (CSS hides it while <html>
   has no data-nav). It is still in the DOM and in the tab order: focus inside it,
   the skip link included, brings it straight back.

   The waterlines cross the bar too. While one is inside it (<html data-split>,
   from kit/signals.js) the bar wears two palettes cut exactly at the line
   (--w-line or --w-shore): a second, inert copy of the bar's face in the other
   realm's palette is clipped to its side of the line. The copies mount after
   hydration, are aria-hidden and inert, and are display: none at any other time.

   The bar's tools (v3): a compass mark opens the Chart (key M), Receipts labels
   every living thing with its fact (key R). Sound lives in the Chart with the
   other switches (Nov 16: three toggles beside the one action a recruiter needs,
   Email, was one too many). Below 960px only the compass stays in the bar. */
function Tools({ tab }) {
  const receipts = useSwitch('receipts');
  const flip = (name, value) => () => {
    setSwitch(name, value);
    emit(EV.sound, { cue: 'tick' });
  };
  return (
    <div className="nav-tools">
      <button className="nav-tool" data-tool="chart" type="button" tabIndex={tab} aria-haspopup="dialog" aria-label={shell.chart.open} aria-keyshortcuts={shell.chart.key} onClick={flip('chart', true)}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8.2" />
          <path className="nav-needle" d="M10 3.4 12.2 10H7.8z" transform="rotate(38 10 10)" />
          <path d="M7.8 10 10 16.6 12.2 10" transform="rotate(38 10 10)" />
        </svg>
        <span className="nav-tool-label" aria-hidden="true">
          {shell.chart.open}
        </span>
      </button>
      <button className="nav-tool" data-tool="receipts" type="button" tabIndex={tab} aria-label={shell.receipts.label} aria-pressed={receipts} aria-keyshortcuts={shell.receipts.key} onClick={flip('receipts')}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <path d="M5 2.6h10v14.8l-2.5-1.6-2.5 1.6-2.5-1.6L5 17.4z" />
          <path d="M7.8 7h4.4M7.8 10.2h4.4" />
        </svg>
        <span className="nav-tool-label">{shell.receipts.label}</span>
      </button>
    </div>
  );
}

function Face({ tab }) {
  return (
    <div className="wrap">
      <a className="brand" href="#top" tabIndex={tab}>
        <i aria-hidden="true" />
        {nav.brand}
      </a>
      <ul className="nav-links">
        {nav.links.map((l) => (
          <li key={l.href}>
            <a href={l.href} tabIndex={tab}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <Tools tab={tab} />
      <a className="btn btn-pri nav-cta" href={nav.cta.href} tabIndex={tab}>
        {nav.cta.label}
      </a>
    </div>
  );
}

export default function Nav() {
  const ref = useRef(null);
  const [twin, setTwin] = useState(false);
  useEffect(() => setTwin(true), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const root = document.documentElement;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const shown = y >= heroOrigin() * 0.99;
      if (shown !== (root.dataset.nav === 'on')) {
        if (shown) root.dataset.nav = 'on';
        else delete root.dataset.nav;
      }
      let hide = el.dataset.hide === 'true';
      // The hero at rest is the top of the page proper: the bar never hides there,
      // so the entry's own glide (a scroll down) lands with the bar in place.
      if (y < heroOrigin() + 160) hide = false;
      else if (y > last + 8) hide = true;
      else if (y < last - 8) hide = false;
      else return;
      last = y;
      el.dataset.hide = hide ? 'true' : 'false';
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      delete root.dataset.nav;
    };
  }, []);
  return (
    <nav className="nav" ref={ref} aria-label="Primary">
      <a className="skip" href="#main">
        {nav.skip}
      </a>
      <Face />
      {twin && (
        <>
          <div className="nav-split" data-side="line" data-realm="sea" aria-hidden="true" inert>
            <Face tab={-1} />
          </div>
          <div className="nav-split" data-side="shore" data-realm="earth" aria-hidden="true" inert>
            <Face tab={-1} />
          </div>
        </>
      )}
    </nav>
  );
}
