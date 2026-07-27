/**
 * Renders **double-asterisk** emphasis from content.js as <span class="em">.
 * Keeps the content file readable without pulling in a markdown dependency.
 */
export default function Rich({ text }) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span className="em" key={i}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
