import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { EV } from '../kit/contract';
import { emit } from '../kit/bus';
import { anchor } from '../kit/anchors';
import { startSignals } from '../kit/signals';
import { startTravel } from '../kit/travel';
import { heroOrigin } from '../lib/origin';
import { buildCount, buildGroups, places, realmAt, receiptParts, shell, waterlines } from '../data/world';
import { configureSound, getSwitch, setSwitch, startSwitches, useSwitch } from './switches';
import Rail from './Rail';

/* The shell: everything that sits over the page and the world and belongs to
   neither. It starts the kit's signals (the waterlines, the depth, the pointer,
   the realm under the bar), travel (a far jump is a hop; the place reached is
   marked for a second) and the switches, and it mounts the depth rail, the Chart
   and the Receipts layer. The Chart, the Receipts layer and the synth are lazy
   chunks: nothing of them is requested until the reader asks for it. Keys: M
   opens the Chart, R switches Receipts. */
const Chart = lazy(() => import('./Chart'));
const ReceiptsLayer = lazy(() => import('./ReceiptsLayer'));

/* What gets the mark when a place is reached: a build's own title gets a ring of
   light, any other place a hairline under its heading. */
const mark = (el) => (el.id.startsWith('build-') ? { el: el.querySelector('h3') ?? el, kind: 'ring' } : { el: el.querySelector('h1, h2, h3') ?? el, kind: 'line' });
/* The stretches of the page with no text column: a label may stand beside its piece there. */
const FREE = ['.vista', '.hero-stage'];
/* Which bed plays in which realm ('' is orbit). */
const BEDS = { '': 'fifth', sea: 'water', earth: 'wind' };

export default function Shell() {
  const chart = useSwitch('chart');
  const receipts = useSwitch('receipts');
  const [everChart, setEverChart] = useState(false);
  const [everReceipts, setEverReceipts] = useState(false);
  if (chart && !everChart) setEverChart(true);
  if (receipts && !everReceipts) setEverReceipts(true);

  useEffect(() => {
    // The bar's height, read once and again on a resize (never per frame).
    const nav = document.querySelector('.nav');
    let barH = nav ? nav.offsetHeight : 64;
    const onResize = () => {
      barH = nav ? nav.offsetHeight : 64;
    };
    window.addEventListener('resize', onResize, { passive: true });
    const stop = startSignals({ lines: waterlines, origin: heroOrigin, bar: () => barH, realm: realmAt, scope: { lines: '.nav', depth: '.rail' } });
    const travel = startTravel({ mark });
    configureSound({ beds: BEDS });
    startSwitches();
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      if (key === shell.chart.key.toLowerCase()) setSwitch('chart', !getSwitch('chart'));
      else if (key === shell.receipts.key.toLowerCase()) setSwitch('receipts');
      else return;
      emit(EV.sound, { cue: 'tick' });
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      stop();
      travel.stop();
    };
  }, []);

  /* Where a waterline is in the document, for the Chart's cross-section. */
  const lineAt = useCallback((name) => {
    const a = anchor(name);
    if (!a) return null;
    return name === 'surface' ? a.top + a.h * 0.36 : a.top;
  }, []);

  return (
    <>
      <Rail places={places} origin={heroOrigin} />
      {everChart && (
        <Suspense fallback={null}>
          <Chart places={places} groups={buildGroups} total={buildCount} words={shell} lineAt={lineAt} />
        </Suspense>
      )}
      {everReceipts && receipts && (
        <Suspense fallback={null}>
          <ReceiptsLayer parts={receiptParts} free={FREE} title={shell.receipts.ledger} />
        </Suspense>
      )}
    </>
  );
}
