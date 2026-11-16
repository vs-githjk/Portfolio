/* A window in the page: an empty stretch where one set piece of the world behind
   it (lib/worldScene.js) shows whole. The scene reads this element's place in
   the document and centres the piece on it. The two waterlines (surface, shore)
   carry one short line that names the world the reader is entering (its text sits
   in a span, which paints a feathered shade behind it over the lit scene). Decoration only. */
const REALM = { giant: 'sea', shore: 'earth', galaxy: 'earth', horizon: 'earth' };

export default function Vista({ set, line }) {
  return (
    <div className="vista" data-set={set} data-realm={REALM[set]} aria-hidden="true">
      {line && (
        <p className="vista-line">
          <span className="vista-text">{line}</span>
        </p>
      )}
    </div>
  );
}
