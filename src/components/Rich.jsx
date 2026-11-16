import { receipts } from '../data/content';
import Receipt from './Receipt';

/**
 * Renders **double-asterisk** emphasis from content.js as <span class="em">.
 * Keeps the content file readable without pulling in a markdown dependency.
 * With `receipts`, a bold phrase that has an entry in content.js (`receipts.on`)
 * becomes a button that opens its receipt: what the figure measures and where to
 * check it. Only Highlights, Value and Experience ask for that.
 */
export default function Rich({ text, receipts: withReceipts = false }) {
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part;
        const id = withReceipts ? receipts.on[part] : null;
        return id ? (
          <Receipt id={id} key={i}>
            {part}
          </Receipt>
        ) : (
          <span className="em" key={i}>
            {part}
          </span>
        );
      })}
    </>
  );
}
