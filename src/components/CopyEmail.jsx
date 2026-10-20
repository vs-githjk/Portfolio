import { useEffect, useRef, useState } from 'react';
import { contact } from '../data/content';

/* Copy-to-clipboard beside the email. "Copied" shows for 1.5s in --ok. */
export default function CopyEmail() {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1500);
    } catch {
      /* Clipboard blocked: the mailto link still works. */
    }
  };

  return (
    <>
      <button type="button" className="btn copy" data-state={done ? 'done' : 'idle'} onClick={copy}>
        {done ? contact.copiedLabel : contact.copyLabel}
      </button>
      <span className="sr" role="status">
        {done ? contact.copiedLabel : ''}
      </span>
    </>
  );
}
