/* A window in the page: an empty stretch where one set piece of the world behind
   it (lib/worldScene.js) shows whole. The scene reads this element's place in
   the document and centres the piece on it. Decoration only. */
export default function Vista({ set }) {
  return <div className="vista" data-set={set} aria-hidden="true" />;
}
