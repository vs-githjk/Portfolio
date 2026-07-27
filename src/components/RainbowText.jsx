/* Splits text into per-letter spans so CSS can ripple color through them.
   Screen readers get the whole word via aria-label; letters are hidden. */
export default function RainbowText({ text }) {
  return (
    <span className="rainbow" aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="rl" aria-hidden="true" style={{ '--i': i }} key={i}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
