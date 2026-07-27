import { useEffect, useRef, useState } from 'react';
import { repairLoop } from '../data/content';

/* ============================================================================
   THE SIGNATURE ELEMENT
   ----------------------------------------------------------------------------
   A live illustration of the repair loop from the paper: four tools report in,
   defects fall, the pass counter advances, then it starts over.

   Timing knobs are right below — they're the main thing worth playing with.
   Everything else is driven by `repairLoop` in src/data/content.js.
   ========================================================================== */

const TIMING = {
  stagger: 620, // ms between one tool starting and the next
  settle: 460, // ms a tool spends "running" before it reports
  gaugeDelay: 500, // ms after the last tool before the gauge moves
  holdPass: 1900, // ms to sit on a completed pass
  holdFinal: 2600, // ms to sit on the final result before restarting
};

const LABEL = { idle: 'queued', run: 'running', pass: 'pass', fail: 'fail', warn: 'warn' };

const IDLE_STATES = Object.fromEntries(repairLoop.tools.map((t) => [t.key, 'idle']));
const FINAL_PASS = repairLoop.passes[repairLoop.passes.length - 1];
const FIRST_RATE = repairLoop.passes[0].rate;

export default function RepairLoop() {
  const [passIndex, setPassIndex] = useState(0);
  const [states, setStates] = useState(IDLE_STATES);
  const [rate, setRate] = useState(FIRST_RATE);

  const rootRef = useRef(null);
  const timers = useRef([]);
  const running = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: show the finished state and stop.
    if (reduce) {
      setPassIndex(repairLoop.passes.length - 1);
      setStates(FINAL_PASS.states);
      setRate(FINAL_PASS.rate);
      return;
    }

    const after = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const runPass = (i) => {
      const pass = repairLoop.passes[i];
      setPassIndex(i);
      setStates(IDLE_STATES);

      repairLoop.tools.forEach((tool, idx) => {
        const start = idx * TIMING.stagger;
        after(start, () => setStates((s) => ({ ...s, [tool.key]: 'run' })));
        after(start + TIMING.settle, () =>
          setStates((s) => ({ ...s, [tool.key]: pass.states[tool.key] }))
        );
      });

      const done = repairLoop.tools.length * TIMING.stagger + TIMING.gaugeDelay;
      after(done, () => setRate(pass.rate));

      after(done + TIMING.holdPass, () => {
        if (i < repairLoop.passes.length - 1) {
          runPass(i + 1);
        } else {
          after(TIMING.holdFinal, () => {
            setRate(FIRST_RATE);
            runPass(0);
          });
        }
      });
    };

    const begin = () => {
      if (running.current) return;
      running.current = true;
      setRate(FIRST_RATE);
      runPass(0);
    };

    const stop = () => {
      clearAll();
      running.current = false;
    };

    // Only animate while visible — saves battery and makes the loop feel
    // like it's responding to you rather than grinding in the background.
    let io;
    if ('IntersectionObserver' in window && rootRef.current) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? begin() : null)),
        { threshold: 0.25 }
      );
      io.observe(rootRef.current);
    } else {
      begin();
    }

    const onVisibility = () => (document.hidden ? stop() : begin());
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const good = rate < 30;
  const pass = repairLoop.passes[passIndex];

  return (
    <div
      className="loop reveal"
      ref={rootRef}
      aria-label="Animated illustration of the multi-tool repair loop from the paper"
    >
      <div className="loop-bar">
        <div className="loop-bar-l">
          <span className="lights">
            <i />
            <i />
            <i />
          </span>
          <span>{repairLoop.label}</span>
        </div>
        <a href={repairLoop.source.href} target="_blank" rel="noopener noreferrer">
          {repairLoop.source.text} ↗
        </a>
      </div>

      <div className="loop-body">
        <div className="loop-pass">
          Pass <b>{pass.n}</b> / {String(repairLoop.passes.length).padStart(2, '0')} —{' '}
          {repairLoop.subject}
        </div>

        {repairLoop.tools.map((tool) => (
          <div className="tool" key={tool.key} data-state={states[tool.key]}>
            <div className="t-name">{tool.name}</div>
            <div className="t-desc">{tool.desc}</div>
            <div className="t-state">
              <i />
              <span>{LABEL[states[tool.key]]}</span>
            </div>
          </div>
        ))}

        <div className="gauge">
          <div className="gauge-top">
            <span className="gauge-label">{repairLoop.gaugeLabel}</span>
            <span className={`gauge-val${good ? ' good' : ''}`}>{rate.toFixed(2)}%</span>
          </div>
          <div className="track">
            <div className={`fill${good ? ' good' : ''}`} style={{ width: `${rate}%` }} />
          </div>
          <div className="gauge-foot">
            {repairLoop.gaugeFoot.map((chunk, i) =>
              chunk.strong ? <b key={i}>{chunk.text}</b> : <span key={i}>{chunk.text}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
