import { useEffect, useRef, useState } from 'react';
import { pipeline } from '../data/content';

/* ============================================================================
   THE SIGNATURE ELEMENT — PrismAI's analysis pipeline, running.
   ----------------------------------------------------------------------------
   Mirrors the real two-tier LangGraph: ingest → orchestrator (deterministic,
   no LLM) → five Tier-1 agents in parallel → tier-1 barrier (merge + decision
   linker) → four Tier-2 agents enriched with that context → SSE stream out.

   Same color rule as the rest of the site: amber = working, green = done.
   Timing knobs are right below and are the main thing worth playing with.
   ========================================================================== */

const TIMING = {
  ingest: 380, // ms for ingest
  orchestrator: 240, // ms for the routing pass
  agentStagger: 80, // ms between agents starting
  agentMin: 460, // fastest an agent finishes
  agentJitter: 480, // random extra time per agent (feels like real parallelism)
  barrier: 360, // ms for the tier-1 merge + decision linker
  output: 360, // ms for the stream to open
  hold: 2400, // ms to sit on the finished state before restarting
  tick: 40, // ms between elapsed-timer updates
};

const IDLE = 'idle';
const RUN = 'run';
const DONE = 'done';

export default function Pipeline() {
  const [ingest, setIngest] = useState(IDLE);
  const [orch, setOrch] = useState(IDLE);
  const [tier1, setTier1] = useState(() => pipeline.tier1.map(() => IDLE));
  const [barrier, setBarrier] = useState(IDLE);
  const [tier2, setTier2] = useState(() => pipeline.tier2.map(() => IDLE));
  const [output, setOutput] = useState(IDLE);
  const [elapsed, setElapsed] = useState(0);

  const rootRef = useRef(null);
  const timers = useRef([]);
  const intervals = useRef([]);
  const running = useRef(false);

  const done1 = tier1.filter((s) => s === DONE).length;
  const done2 = tier2.filter((s) => s === DONE).length;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: show the completed pipeline, don't animate.
    if (reduce) {
      setIngest(DONE);
      setOrch(DONE);
      setTier1(pipeline.tier1.map(() => DONE));
      setBarrier(DONE);
      setTier2(pipeline.tier2.map(() => DONE));
      setOutput(DONE);
      setElapsed(pipeline.target);
      return;
    }

    const after = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    const clearAll = () => {
      timers.current.forEach(clearTimeout);
      intervals.current.forEach(clearInterval);
      timers.current = [];
      intervals.current = [];
    };

    const setAt = (setter) => (i, state) =>
      setter((prev) => {
        const next = [...prev];
        next[i] = state;
        return next;
      });
    const setT1 = setAt(setTier1);
    const setT2 = setAt(setTier2);

    const cycle = () => {
      setIngest(IDLE);
      setOrch(IDLE);
      setTier1(pipeline.tier1.map(() => IDLE));
      setBarrier(IDLE);
      setTier2(pipeline.tier2.map(() => IDLE));
      setOutput(IDLE);
      setElapsed(0);

      let t = 0;

      // ---- ingest
      setIngest(RUN);
      t += TIMING.ingest;
      after(t, () => setIngest(DONE));

      // ---- orchestrator: deterministic routing
      after(t, () => setOrch(RUN));
      t += TIMING.orchestrator;
      after(t, () => setOrch(DONE));

      // ---- tier 1, genuinely parallel with jitter
      let lastT1 = t;
      pipeline.tier1.forEach((_, i) => {
        const start = t + i * TIMING.agentStagger;
        const end = start + TIMING.agentMin + Math.random() * TIMING.agentJitter;
        lastT1 = Math.max(lastT1, end);
        after(start, () => setT1(i, RUN));
        after(end, () => setT1(i, DONE));
      });

      // ---- tier-1 barrier: merge + decision linker
      after(lastT1, () => setBarrier(RUN));
      const barrierEnd = lastT1 + TIMING.barrier;
      after(barrierEnd, () => setBarrier(DONE));

      // ---- tier 2, parallel, enriched with tier-1 context
      let lastT2 = barrierEnd;
      pipeline.tier2.forEach((_, i) => {
        const start = barrierEnd + i * TIMING.agentStagger;
        const end = start + TIMING.agentMin + Math.random() * TIMING.agentJitter;
        lastT2 = Math.max(lastT2, end);
        after(start, () => setT2(i, RUN));
        after(end, () => setT2(i, DONE));
      });

      // ---- stream out
      after(lastT2, () => setOutput(RUN));
      const finish = lastT2 + TIMING.output;
      after(finish, () => setOutput(DONE));

      // ---- elapsed timer, scaled so it lands on `target` exactly at finish
      const started = performance.now();
      const id = setInterval(() => {
        const frac = Math.min((performance.now() - started) / finish, 1);
        setElapsed(frac * pipeline.target);
        if (frac >= 1) clearInterval(id);
      }, TIMING.tick);
      intervals.current.push(id);

      after(finish + TIMING.hold, cycle);
    };

    const begin = () => {
      if (running.current) return;
      running.current = true;
      cycle();
    };
    const stop = () => {
      clearAll();
      running.current = false;
    };

    // Only animate while on screen — saves battery, and makes the pipeline feel
    // like it fires because you looked at it.
    let io;
    if ('IntersectionObserver' in window && rootRef.current) {
      io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && begin()), {
        threshold: 0.2,
      });
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

  return (
    <div className="pipe reveal" ref={rootRef} aria-label="Animated illustration of the PrismAI analysis pipeline">
      <div className="pipe-bar">
        <div className="pipe-bar-l">
          <span className="lights">
            <i />
            <i />
            <i />
          </span>
          <span>{pipeline.label}</span>
        </div>
        <span className="pipe-bar-r">{pipeline.project}</span>
      </div>

      <div className="pipe-body">
        <div className="pipe-flow">
          {/* ---- ingest + orchestrator ---- */}
          <div className="pipe-col">
            <div className="pipe-col-h">{pipeline.cols.ingest}</div>
            <div className="node" data-state={ingest}>
              <i />
              <b>{pipeline.ingest.name}</b>
              <span>{pipeline.ingest.desc}</span>
            </div>
            <div className="node" data-state={orch}>
              <i />
              <b>{pipeline.orchestrator.name}</b>
              <span>{pipeline.orchestrator.desc}</span>
            </div>
          </div>

          <div className="pipe-arrow" aria-hidden="true" />

          {/* ---- tier 1 + barrier ---- */}
          <div className="pipe-col pipe-col-wide">
            <div className="pipe-col-h">
              {pipeline.cols.tier1}
              <em>
                {done1}/{pipeline.tier1.length}
              </em>
            </div>
            <div className="agents">
              {pipeline.tier1.map((name, i) => (
                <div className="chip" key={name} data-state={tier1[i]}>
                  <i />
                  {name}
                </div>
              ))}
            </div>
            <div className="node" data-state={barrier}>
              <i />
              <b>{pipeline.barrier.name}</b>
              <span>{pipeline.barrier.desc}</span>
            </div>
          </div>

          <div className="pipe-arrow" aria-hidden="true" />

          {/* ---- tier 2 + out ---- */}
          <div className="pipe-col">
            <div className="pipe-col-h">
              {pipeline.cols.tier2}
              <em>
                {done2}/{pipeline.tier2.length}
              </em>
            </div>
            <div className="agents agents-t2">
              {pipeline.tier2.map((name, i) => (
                <div className="chip" key={name} data-state={tier2[i]}>
                  <i />
                  {name}
                </div>
              ))}
            </div>
            <div className="node" data-state={output}>
              <i />
              <b>{pipeline.output.name}</b>
              <span>{pipeline.output.desc}</span>
            </div>
          </div>
        </div>

        <div className="pipe-meter">
          <div className="pipe-meter-top">
            <span className="gauge-label">{pipeline.timerLabel}</span>
            <span className={`gauge-val${output === DONE ? ' good' : ''}`}>
              {elapsed.toFixed(2)}s
            </span>
          </div>
          <div className="track">
            <div
              className={`fill${output === DONE ? ' good' : ''}`}
              style={{ width: `${Math.min((elapsed / pipeline.target) * 100, 100)}%` }}
            />
          </div>
          <div className="gauge-foot">
            {pipeline.foot.map((chunk, i) =>
              chunk.strong ? <b key={i}>{chunk.text}</b> : <span key={i}>{chunk.text}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
