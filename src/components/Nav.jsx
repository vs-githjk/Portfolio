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
   every living thing with its fact (key R), Sound switches the synth. Below 960px
   only the compass stays in the bar; the other two live in the Chart. */
function Tools({ tab }) {
  const receipts = useSwitch('receipts');
  const sound = useSwitch('sound');
  const flip = (name, value) => () => {
    setSwitch(name, value);
    emit(EV.sound, { cue: 'tick' });
  };
  return (
    <div className="nav-tools">
      <button className="nav-tool" data-tool="chart" type="button" tabIndex={tab} aria-haspopup="dialog" aria-label={shell.chart.open} title={shell.chart.open} aria-keyshortcuts={shell.chart.key} onClick={flip('chart', true)}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8.2" />
          <path d="M10 3.6 12 10l-2 6.4L8 10z" />
          <path d="M10 1.8v1.4M10 16.8v1.4M1.8 10h1.4M16.8 10h1.4" />
        </svg>
      </button>
      <button className="nav-tool" data-tool="receipts" type="button" tabIndex={tab} aria-pressed={receipts} aria-keyshortcuts={shell.receipts.key} onClick={flip('receipts')}>
        <i aria-hidden="true" />
        {shell.receipts.label}
      </button>
      <button className="nav-tool" data-tool="sound" type="button" tabIndex={tab} aria-pressed={sound} onClick={flip('sound')}>
        {shell.sound.label}: {sound ? shell.sound.on : shell.sound.off}
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
      if (y < 160) hide = false;
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
