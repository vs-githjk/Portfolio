import { useEffect, useRef, useState } from 'react';
import { pipeline } from '../data/content';

/* ============================================================================
   THE SIGNATURE ELEMENT — PrismAI's pipeline, running.
   ----------------------------------------------------------------------------
   Ingest fires, tier-1 agents run in parallel and land at slightly different
   times, tier-2 synthesis merges them, and the result streams out. An elapsed
   timer counts toward `pipeline.target` seconds.

   Same color rule as the rest of the site: amber = working, green = done.
   Timing knobs are right below and are the main thing worth playing with.
   ========================================================================== */

const TIMING = {
  ingest: 420, // ms for the ingest stage
  agentStagger: 90, // ms between agents starting
  agentMin: 520, // fastest an agent finishes
  agentJitter: 520, // random extra time per agent (feels like real parallelism)
  synthesis: 640, // ms for tier-2 merge
  output: 380, // ms for the stream to open
  hold: 2400, // ms to sit on the finished state before restarting
  tick: 40, // ms between elapsed-timer updates
};

const IDLE = 'idle';
const RUN = 'run';
const DONE = 'done';

export default function Pipeline() {
  const [ingest, setIngest] = useState(IDLE);
  const [agents, setAgents] = useState(() => pipeline.agents.map(() => IDLE));
  const [synthesis, setSynthesis] = useState(IDLE);
  const [output, setOutput] = useState(IDLE);
  const [elapsed, setElapsed] = useState(0);

  const rootRef = useRef(null);
  const timers = useRef([]);
  const intervals = useRef([]);
  const running = useRef(false);

  const doneCount = agents.filter((s) => s === DONE).length;
  const total = pipeline.agents.length;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: show the completed pipeline, don't animate.
    if (reduce) {
      setIngest(DONE);
      setAgents(pipeline.agents.map(() => DONE));
      setSynthesis(DONE);
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

    const setAgent = (i, state) =>
      setAgents((prev) => {
        const next = [...prev];
        next[i] = state;
        return next;
      });

    const cycle = () => {
      // reset
      setIngest(IDLE);
      setAgents(pipeline.agents.map(() => IDLE));
      setSynthesis(IDLE);
      setOutput(IDLE);
      setElapsed(0);

      let t = 0;

      // ---- stage 1: ingest
      setIngest(RUN);
      t += TIMING.ingest;
      after(t, () => setIngest(DONE));

      // ---- stage 2: tier-1 agents, genuinely parallel with jitter
      let lastAgentEnd = t;
      pipeline.agents.forEach((_, i) => {
        const start = t + i * TIMING.agentStagger;
        const end = start + TIMING.agentMin + Math.random() * TIMING.agentJitter;
        lastAgentEnd = Math.max(lastAgentEnd, end);
        after(start, () => setAgent(i, RUN));
        after(end, () => setAgent(i, DONE));
      });

      // ---- stage 3: tier-2 synthesis
      after(lastAgentEnd, () => setSynthesis(RUN));
      const synthEnd = lastAgentEnd + TIMING.synthesis;
      after(synthEnd, () => setSynthesis(DONE));

      // ---- stage 4: stream out
      after(synthEnd, () => setOutput(RUN));
      const finish = synthEnd + TIMING.output;
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
    <div className="pipe reveal" ref={rootRef} aria-label="Animated illustration of the PrismAI pipeline">
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
          {/* ---- ingest ---- */}
          <div className="pipe-col">
            <div className="pipe-col-h">ingest</div>
            <div className="node" data-state={ingest}>
              <i />
              <b>{pipeline.ingest.name}</b>
              <span>{pipeline.ingest.desc}</span>
            </div>
          </div>

          <div className="pipe-arrow" aria-hidden="true" />

          {/* ---- tier 1: parallel agents ---- */}
          <div className="pipe-col pipe-col-wide">
            <div className="pipe-col-h">
              tier 1 — parallel
              <em>
                {doneCount}/{total}
              </em>
            </div>
            <div className="agents">
              {pipeline.agents.map((name, i) => (
                <div className="chip" key={name} data-state={agents[i]}>
                  <i />
                  {name}
                </div>
              ))}
            </div>
          </div>

          <div className="pipe-arrow" aria-hidden="true" />

          {/* ---- tier 2 + output ---- */}
          <div className="pipe-col">
            <div className="pipe-col-h">tier 2 — out</div>
            <div className="node" data-state={synthesis}>
              <i />
              <b>{pipeline.synthesis.name}</b>
              <span>{pipeline.synthesis.desc}</span>
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
