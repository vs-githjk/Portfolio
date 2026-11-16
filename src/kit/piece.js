/* The shape every world piece is born in. A piece is a plain description: a name,
   the tokens it reads, what each quality tier gets, and a `create` that returns
   the live thing. The live thing must be able to lay itself out, draw a moving
   frame, hold a still pose, clean up, and say what it counts (its binding, which
   feeds Receipts and any cast list).

   No site words and no typed counts here or in any piece: a piece receives its
   data and its colours. */
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
