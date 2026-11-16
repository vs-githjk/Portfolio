/* The shape every world piece is born in (spec section 6). A piece is a plain
   description: a name, the tokens it reads, what each quality tier gets, and a
   `create` that returns the live thing. The live thing must be able to lay itself
   out, draw a moving frame, hold a still pose, clean up, and say what it counts
   (its binding, which feeds Receipts and the credits).

   No site words and no typed counts here or in any piece: a piece receives its
   data and its colours. When the engine's own definePiece lands this file can
   re-export it; the contract is the same. */
const LIVE = ['layout', 'update', 'still', 'dispose', 'binding'];

export function definePiece(spec) {
  const { name, tokens = [], tiers = {}, create } = spec;
  if (!name || typeof create !== 'function') throw new Error('a piece needs a name and a create()');
  return {
    name,
    tokens,
    tiers,
    create(ctx) {
      const live = create(ctx);
      for (const key of LIVE) {
        if (!(key in live)) throw new Error(`piece "${name}" is missing ${key}`);
      }
      return live;
    },
  };
}

/* A token set for a piece: every name in `tokens` read from CSS as "r, g, b",
   with a fallback, as 0 to 1 triples. `read` is getComputedStyle(root). */
export function readTokens(read, tokens, fallback = [128, 128, 128]) {
  const out = {};
  for (const name of tokens) {
    const v = read
      .getPropertyValue(`--${name}`)
      .split(',')
      .map((n) => parseInt(n, 10));
    const ok = v.length === 3 && v.every((n) => n >= 0 && n <= 255);
    out[name] = (ok ? v : fallback).map((n) => n / 255);
  }
  return out;
}

/* Keep-out boxes for anything made of light: the text boxes inside an element,
   in document px, merged down to at most `max` rectangles and padded. A piece's
   shader gives no light inside them (see GUARD in wyrm.js). */
export function neighbourText(el, band) {
  // An anchor is often one cell of a row whose other cells hold text (a heading
  // beside a window). The row is the anchor's parent, unless that is the page itself.
  const up = el?.parentElement;
  const root = up && !up.matches('main, body, .page') ? up : el;
  return textBoxes(root, { within: band });
}

export function textBoxes(root, { max = 6, pad = 8, within = null } = {}) {
  if (!root) return [];
  const boxes = [];
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    if (!node.nodeValue.trim()) continue;
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      // `within` is a band [top, bottom] in document px: text outside it is not this piece's concern.
      if (within && (r.bottom + window.scrollY < within[0] || r.top + window.scrollY > within[1])) continue;
      boxes.push([r.left - pad, r.top + window.scrollY - pad, r.right + pad, r.bottom + window.scrollY + pad]);
    }
  }
  // Many lines first fold into rows of text (cheap), then the greedy merge below.
  boxes.sort((p, q) => p[1] - q[1]);
  for (let i = 0; boxes.length > 24 && i < boxes.length - 1; ) {
    const [p, q] = [boxes[i], boxes[i + 1]];
    if (q[1] - p[3] < 28) {
      boxes.splice(i, 2, [Math.min(p[0], q[0]), p[1], Math.max(p[2], q[2]), Math.max(p[3], q[3])]);
    } else i++;
  }
  // Greedy merge: join the pair whose union wastes the least area until few enough.
  const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
  const join = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
  while (boxes.length > max) {
    let best = [0, 1];
    let cost = Infinity;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const c = area(join(boxes[i], boxes[j])) - area(boxes[i]) - area(boxes[j]);
        if (c < cost) {
          cost = c;
          best = [i, j];
        }
      }
    }
    const [i, j] = best;
    boxes[i] = join(boxes[i], boxes[j]);
    boxes.splice(j, 1);
  }
  return boxes;
}
