import { useEffect, useState } from 'react';
import { EV } from '../kit/contract';
import { on } from '../kit/bus';

/* The load line: one quiet mono line that says what is arriving, driven by real
   events (EV.loaded, { stage }) and nothing else. `lines` maps a stage to its
   sentence; a line leaves `hold` ms after it was said unless the next has come.
   If the world cannot run, `lines.plain` is the last thing it says.
   Decoration: aria-hidden. */
export default function LoadLine({ lines, hold = 3200 }) {
  const [stage, setStage] = useState('');
  useEffect(() => {
    let timer = 0;
    const off = on(EV.loaded, ({ stage: next }) => {
      if (!next || !lines[next]) return;
      setStage(next);
      clearTimeout(timer);
      timer = setTimeout(() => setStage('done'), hold);
    });
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [lines, hold]);
  const text = lines[stage] ?? '';
  return (
    <p className="load-line" aria-hidden="true" data-stage={stage || undefined}>
      <i />
      <span key={stage}>{text}</span>
    </p>
  );
}
