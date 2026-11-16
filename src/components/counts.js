import { builds, numberWords } from '../data/content';

/* Counts that sentences and labels need, computed once from the lists in
   content.js, so no number on the page is typed twice. */
export const word = (n) => numberWords[n] ?? String(n);
export const Word = (n) => {
  const w = word(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

/* Fills {name} and {Name} slots in a line of copy. A capitalised slot is the
   count as a capitalised word, a lower-case slot the plain word or value. */
export const fill = (text, slots) =>
  String(text).replace(/\{(\w+)\}/g, (m, k) => {
    const lower = k.charAt(0).toLowerCase() + k.slice(1);
    if (!(lower in slots)) return m;
    const v = slots[lower];
    if (typeof v !== 'number') return v;
    return k === lower ? word(v) : Word(v);
  });

/* Every build in page order, with its group and its place in the list. */
export const allBuilds = [
  ...builds.flagships.map((b) => ({ ...b, group: 'flagships' })),
  ...builds.items.map((b) => ({ ...b, group: 'items' })),
  { ...builds.research, group: 'research' },
  ...builds.more.items.map((b) => ({ ...b, group: 'more' })),
];
export const total = allBuilds.length;
export const place = (id) => {
  const i = allBuilds.findIndex((b) => b.id === id);
  return `${String(i + 1).padStart(2, '0')}/${total}`;
};
export const pad2 = (n) => String(n).padStart(2, '0');
