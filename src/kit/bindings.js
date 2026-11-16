/* The registry of things that can be labelled. A piece registers
   { id, project() }: `project` says where it is in the window right now
   ({ x, y, side, visible }, CSS px) from numbers it already holds, never a fresh
   measurement. The scene's own pieces report theirs through EV.bindings; this is
   the same shape for a piece that lives in the page. The Receipts layer reads
   both, and anything that lists the cast reads the ids. */
const pieces = new Map();

export function registerBinding(piece) {
  pieces.set(piece.id, piece);
  return () => {
    if (pieces.get(piece.id) === piece) pieces.delete(piece.id);
  };
}

export function localBindings() {
  const out = [];
  for (const piece of pieces.values()) {
    const at = piece.project();
    if (at) out.push({ id: piece.id, ...at });
  }
  return out;
}

export const bindingIds = () => [...pieces.keys()];
