/* The one place that listens and speaks on the window: every name comes from
   contract.js (EV), every payload rides in `detail`. `on` returns its own undo. */
export function on(name, fn) {
  const handler = (e) => fn(e.detail ?? {}, e);
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}

export function emit(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
