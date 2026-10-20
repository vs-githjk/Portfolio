import { Fragment } from 'react';

/* A tech-stack line. Each item stays whole and the separator trails its item,
   so a wrapped line never starts with a dot and never splits a name. The space
   between items sits outside the nowrap span, so it is where the line may break. */
export default function Stack({ text }) {
  if (!text) return null;
  const items = text.split(' · ');
  return (
    <p className="stack">
      {items.map((t, i) => (
        <Fragment key={t}>
          <span>{i < items.length - 1 ? `${t} ·` : t}</span>{' '}
        </Fragment>
      ))}
    </p>
  );
}
