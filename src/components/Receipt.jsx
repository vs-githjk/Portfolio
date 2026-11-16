import { useEffect, useId, useRef, useState } from 'react';
import { receipts } from '../data/content';

/* A claim you can check. The bold figure is a real button; it opens a small stub
   that says what the figure measures and where to verify it (content.js,
   `receipts`). The stub is a popover: it sits in the top layer, so the cut corners
   of the panel around it never clip it, Escape and a click outside close it, and
   focus goes back to the figure. Before the script runs the button still works
   (popovertarget) and the stub opens in the middle of the window; once it runs
   the stub is placed under the figure. Without the Popover API the stub opens in
   place and Escape is handled here. */
export default function Receipt({ id, children }) {
  const item = receipts.items[id];
  const uid = useId();
  const btn = useRef(null);
  const card = useRef(null);
  const [open, setOpen] = useState(false);
  const [native, setNative] = useState(true); // the server and the first paint assume the Popover API

  useEffect(() => {
    setNative(typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype);
  }, []);

  /* Place the stub under the figure, inside the window. Page coordinates, so it
     scrolls with the text it belongs to. */
  const place = () => {
    const b = btn.current;
    const c = card.current;
    if (!b || !c) return;
    const r = b.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const w = c.offsetWidth;
    const h = c.offsetHeight;
    const left = Math.max(12, Math.min(r.left, vw - w - 12));
    const below = r.bottom + 10 + h < window.innerHeight || r.top - 10 - h < 0;
    c.style.left = `${Math.round(left + window.scrollX)}px`;
    c.style.top = `${Math.round((below ? r.bottom + 10 : r.top - 10 - h) + window.scrollY)}px`;
    c.dataset.placed = '';
  };

  useEffect(() => {
    const c = card.current;
    if (!c || !native) return undefined;
    const onToggle = (e) => {
      const now = e.newState === 'open';
      setOpen(now);
      if (now) place();
    };
    c.addEventListener('toggle', onToggle);
    return () => c.removeEventListener('toggle', onToggle);
  }, [native]);

  useEffect(() => {
    if (!open) return undefined;
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    if (native) return () => window.removeEventListener('resize', onResize);
    // Fallback only: Escape and a click outside close it.
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      btn.current?.focus();
    };
    const onDown = (e) => {
      if (!card.current?.contains(e.target) && !btn.current?.parentElement.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, native]);

  if (!item) return <span className="em">{children}</span>;

  const close = () => {
    if (native) card.current?.hidePopover?.();
    else setOpen(false);
    btn.current?.focus();
  };

  /* The phrase stays ordinary inline text, so the sentence wraps as a sentence;
     the control is the small stub after it (a button is an atomic box, and a
     whole phrase inside one breaks the line around it). The last word and the
     stub share a no-wrap box, so the stub never starts a line. A click on the
     phrase opens it too. */
  const text = typeof children === 'string' ? children : '';
  const cut = text.lastIndexOf(' ');
  const head = cut > 0 ? text.slice(0, cut + 1) : '';
  const tail = cut > 0 ? text.slice(cut + 1) : children;
  const toggle = () => {
    if (native) card.current?.togglePopover?.();
    else setOpen((v) => !v);
  };

  return (
    <span className="rcpt" data-open={open ? '' : undefined}>
      {head && (
        <span className="rcpt-p" onClick={toggle}>
          {head}
        </span>
      )}
      <span className="rcpt-n">
        <span className="rcpt-p" onClick={toggle}>
          {tail}
        </span>
        <button
          type="button"
          className="rcpt-t"
          ref={btn}
          aria-expanded={open}
          aria-controls={uid}
          aria-label={`${receipts.open} ${text}`.trim()}
          {...(native ? { popoverTarget: uid } : { onClick: toggle })}
        >
          <svg viewBox="0 0 12 14" width="12" height="14" aria-hidden="true">
            <path d="M1.5 1h9v8.5L7 13H1.5z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M4 4.6h4M4 7.4h2.6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </span>
      <span
        className="rcpt-card"
        id={uid}
        ref={card}
        role="group"
        aria-label={receipts.label}
        {...(native ? { popover: 'auto' } : { hidden: !open, 'data-inline': '' })}
      >
        <span className="rcpt-head">
          <span>{receipts.label}</span>
          <button type="button" className="rcpt-x" onClick={close} aria-label={receipts.close}>
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
              <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </span>
        <span className="rcpt-k">{receipts.measures}</span>
        <span className="rcpt-v">{item.measures}</span>
        <span className="rcpt-k">{receipts.check}</span>
        <span className="rcpt-links">
          {item.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(/^https?:/.test(l.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={l.href.startsWith('#') ? close : undefined}
            >
              {l.label}
              <span aria-hidden="true">{l.href.startsWith('#') ? ' ↓' : ' ↗'}</span>
            </a>
          ))}
        </span>
      </span>
    </span>
  );
}
