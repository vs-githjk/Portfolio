import { useEffect, useRef, useState } from 'react';
import { contact } from '../data/content';

/* Copy-to-clipboard beside the email. "Copied" shows for 2s in --ok with a tick,
   and is announced to assistive tech through a polite status line. A successful
   copy also tells the page (onDone) so first light can break over the horizon. */
export default function CopyEmail({ onDone }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(contact.email);
      ok = true;
    } catch {
      // No async clipboard (an insecure origin, or permission refused): the old way.
      const box = document.createElement('textarea');
      box.value = contact.email;
      box.setAttribute('readonly', '');
      box.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(box);
      box.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      box.remove();
    }
    if (!ok) return; // still blocked: the mailto link beside it works
    setDone(true);
    onDone?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 2000);
  };

  return (
    <>
      <button type="button" className="btn copy" data-state={done ? 'done' : 'idle'} onClick={copy}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          {done ? (
            <path className="copy-tick" d="M3 8.5l3.2 3.2L13 4.8" pathLength="1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M5.5 5.5V3h7.5v7.5h-2.5M3 5.5h7.5V13H3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          )}
        </svg>
        {done ? contact.copiedLabel : contact.copyLabel}
      </button>
      <span className="sr" role="status">
        {done ? contact.copiedSay : ''}
      </span>
    </>
  );
}
