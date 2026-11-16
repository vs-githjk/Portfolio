/* Where the reader is in the entry. Three states, one writer (shell/Entry.jsx):

     pre    the first screen is up and the place below it is waiting, unlit
     land   the reader has just come through: everything is arriving
     rest   the place as it stands (also the state without scripts)

   It is mirrored on <html data-entry> for the stylesheet ("rest" is no attribute,
   so a page whose scripts never ran is whole) and handed to subscribers. */
let state = 'rest';
const subs = new Set();

export const entryState = () => state;

export function setEntry(next) {
  if (next === state) return;
  state = next;
  const root = document.documentElement;
  if (next === 'rest') delete root.dataset.entry;
  else root.dataset.entry = next;
  for (const fn of subs) fn(next);
}

export function onEntry(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
