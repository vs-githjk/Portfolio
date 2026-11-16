import { useEffect, useRef, useState } from 'react';
import { EV } from '../kit/contract';
import { fill } from './counts';

/* The run: one sentence in, a reviewed branch out, and it stops where he told it to.

   Untouched, it is the whole drawing: the sentence, the steps, the gates, the
   branch. Press "Run it" and the sentence types, a light walks the steps, and at
   a gate it stops and waits for the visitor's own Go. It never approves itself,
   because the real crew does not. Leaving the panel puts it back as it was.

   Where a run holds comes from the data: a gate may carry `before` (the name of
   the step it sits in front of). Until those positions are confirmed the gates
   carry none, and the run holds once, before the branch, with every gate named.

   Each change is sent to the world as `world:run`. Under reduced motion nothing
   types or walks: the run goes straight to the gate, then to the branch. */

const TYPE_MS = 34;
const STEP_MS = 560;

const send = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

export default function CrewRun({ prompt }) {
  const { steps, run } = prompt;
  const gates = prompt.gates.map((g) => (typeof g === 'string' ? { name: g } : g));
  const line = prompt.lines[0];

  /* The holds, in order: each is the step the light must stop in front of
     (steps.length is the branch) and the gates it waits at there. */
  const placed = gates.every((g) => steps.includes(g.before));
  const holds = placed
    ? steps.map((s, i) => ({ at: i, gates: gates.filter((g) => g.before === s) })).filter((h) => h.gates.length > 0)
    : [{ at: steps.length, gates }];

  /* phase: idle, typing, step, hold, done. `at` is the step the light is on
     (or about to enter, while it holds). `typed` counts characters of the sentence. */
  const [phase, setPhase] = useState('idle');
  const [at, setAt] = useState(0);
  const [typed, setTyped] = useState(line.length);
  const [passed, setPassed] = useState(0); // holds already answered
  const root = useRef(null);
  const go = useRef(null);
  const start = useRef(null);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const hold = holds[passed];
  const names = (hold ? hold.gates : gates).map((g) => g.name).join(', ');

  /* The clock: one timeout per phase, so there is nothing to clean up but it. */
  useEffect(() => {
    if (phase === 'typing') {
      if (typed >= line.length) {
        setPhase('step');
        return undefined;
      }
      const t = setTimeout(() => setTyped((n) => n + 1), TYPE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'step') {
      if (hold && hold.at === at) {
        setPhase('hold');
        return undefined;
      }
      if (at >= steps.length) {
        setPhase('done');
        return undefined;
      }
      const t = setTimeout(() => setAt((n) => n + 1), still.current ? 0 : STEP_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, typed, at, hold, line.length, steps.length]);

  /* Tell the world, and move focus to the control that matters next. */
  useEffect(() => {
    const state = phase === 'typing' ? 'step' : phase;
    send(EV.run, { state, step: Math.min(at, steps.length - 1), gate: phase === 'hold' ? passed : null });
    if (phase === 'hold') go.current?.focus();
    if (phase === 'done' && root.current?.contains(document.activeElement) === false && document.activeElement === document.body) start.current?.focus();
  }, [phase, at, passed, steps.length]);

  /* Leaving the panel resets it: a run never finishes behind the reader's back. */
  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) return;
      setPhase('idle');
      setAt(0);
      setPassed(0);
      setTyped(line.length);
    });
    io.observe(node);
    return () => io.disconnect();
  }, [line.length]);

  const begin = () => {
    setPassed(0);
    setAt(0);
    setTyped(still.current ? line.length : 0);
    setPhase(still.current ? 'step' : 'typing');
    send(EV.sound, { cue: 'tick' });
  };
  const give = () => {
    send(EV.sound, { cue: 'go' });
    setPassed((n) => n + 1);
    setPhase('step');
  };

  const live = phase !== 'idle';
  const status =
    phase === 'hold'
      ? fill(run.hold, { gates: names })
      : phase === 'done'
        ? run.done
        : phase === 'step' && at < steps.length
          ? fill(run.step, { step: steps[at] })
          : phase === 'typing'
            ? run.typing
            : run.rest;
  const stepState = (i) => {
    if (!live || phase === 'typing') return undefined;
    if (phase === 'done' || i < at) return 'done';
    if (i === at && phase === 'step') return 'now';
    return 'wait';
  };
  const gateState = (i) => {
    if (!live) return undefined;
    if (i < passed) return 'open';
    return phase === 'hold' && i === passed ? 'hold' : 'wait';
  };
  const gate = (h, i) => (
    <span className="nb-gate" data-state={gateState(i)} key={`gate-${h.at}`}>
      {gateState(i) === 'hold' ? (
        <button type="button" className="nb-go" ref={go} onClick={give}>
          {run.go}
        </button>
      ) : (
        <span className="nb-gate-mark">{gateState(i) === 'open' ? run.given : run.gate}</span>
      )}
    </span>
  );

  return (
    <div className="nb-run" ref={root} data-phase={phase}>
      <div className="nb-prompt">
        <span className="nb-tag">{prompt.label}</span>
        <p>
          <b aria-hidden="true">›</b>
          {phase === 'typing' ? (
            <>
              <span className="sr">{line}</span>
              <span aria-hidden="true">{line.slice(0, typed)}</span>
            </>
          ) : (
            line
          )}
          <i className="nb-caret" aria-hidden="true" />
        </p>
        <p className="nb-alt">
          <span>{prompt.or}</span> {prompt.lines[1]}
        </p>
      </div>
      <div className="nb-track">
        <span className="nb-tag">{prompt.stepsLabel}</span>
        <ol className="nb-steps" aria-label={prompt.stepsLabel}>
          {steps.map((s, i) => {
            const h = holds.findIndex((x) => x.at === i);
            return (
              <li key={s} data-state={stepState(i)}>
                {h >= 0 && gate(holds[h], h)}
                <i aria-hidden="true" />
                {s}
              </li>
            );
          })}
        </ol>
        {holds.map((h, i) => (h.at === steps.length ? gate(h, i) : null))}
      </div>
      <p className="nb-out" data-state={phase === 'done' ? 'done' : undefined}>
        <span className="nb-tag">{prompt.outLabel}</span>
        {prompt.out}
      </p>
      <div className="nb-console">
        <button type="button" className="btn nb-start" ref={start} onClick={begin} disabled={phase === 'typing' || phase === 'step' || phase === 'hold'}>
          {phase === 'done' ? run.again : run.start}
        </button>
        <p className="nb-status" role="status" aria-live="polite">
          {status}
        </p>
      </div>
      <p className="nb-gates">
        <span>{prompt.gatesLabel}</span>
        {gates.map((g) => (
          <b key={g.name}>{g.name}</b>
        ))}
      </p>
    </div>
  );
}
