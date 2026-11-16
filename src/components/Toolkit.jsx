import { useState } from 'react';
import { builds, toolkit } from '../data/content';
import { EV } from '../kit/contract';
import PlaceName from './PlaceName';

/* A reverse index, not an inventory. Every tool that a build on this page lists
   in its stack line is a toggle; picking one makes those builds answer in a
   sentence, with their thumbnails as links to the entries. The index is computed
   here from content.js (stack lines split on " · ", a bracketed list counted as
   its own tools, names matched exactly or through `toolkit.aliases`), so it can
   only say what the stack lines say. A tool with no stack line stays plain text.
   No levels: nobody is 87% at Python. */
const ALL = [...builds.flagships, ...builds.items, builds.research, ...builds.more.items].map((b) => ({
  id: b.id,
  title: b.title,
  image: (b.media.lead?.image ?? b.media.image).replace('.webp', '-640.webp'),
  tools: new Set(
    b.stack.split(' · ').flatMap((t) => {
      const m = t.match(/^(.*?)\s*\((.*)\)$/);
      return (m ? [m[1], ...m[2].split(',')] : [t]).map((x) => x.trim().toLowerCase());
    })
  ),
}));

const INDEX = Object.fromEntries(
  toolkit.groups
    .flatMap((g) => g.items)
    .map((tool) => {
      const names = [tool, ...(toolkit.aliases[tool] ?? [])].map((x) => x.toLowerCase());
      return [tool, ALL.filter((b) => names.some((n) => b.tools.has(n)))];
    })
);

const list = (names) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${toolkit.and} ${names[names.length - 1]}`;

export default function Toolkit() {
  const [tool, setTool] = useState(toolkit.first);
  const hits = INDEX[tool] ?? [];
  /* Picking a tool tells the shell and the scene which builds answer
     (`world:focus`, kind "tool"; `builds` is the list of their ids). */
  const pick = (it) => {
    setTool(it);
    window.dispatchEvent(new CustomEvent(EV.focus, { detail: { kind: 'tool', id: it, builds: (INDEX[it] ?? []).map((b) => b.id) } }));
  };
  const sentence = toolkit.answer.replace('{tool}', tool).replace('{builds}', list(hits.map((b) => b.title)));

  return (
    <section className="sec" id="toolkit" data-realm="earth">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow">
            {toolkit.eyebrow}
            <PlaceName section="toolkit" />
          </span>
          <h2>
            {toolkit.heading} <em>{toolkit.headingEm}</em>
          </h2>
          <p>{toolkit.hint}</p>
        </div>
        <div className="tk">
          {toolkit.groups.map((g) => (
            <div className="tk-row reveal" key={g.name}>
              <h3>{g.name}</h3>
              <div className="tk-body">
                <ul>
                  {g.items.map((it) => (
                    <li key={it}>
                      {INDEX[it].length ? (
                        <button type="button" className="tk-tool" aria-pressed={it === tool} onClick={() => pick(it)}>
                          {it}
                        </button>
                      ) : (
                        <span className="tk-plain">{it}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {g.items.includes(tool) && hits.length > 0 && (
                  <div className="tk-answer" key={tool}>
                    <p>{sentence}</p>
                    <ul className="tk-plates">
                      {hits.map((b) => (
                        <li key={b.id}>
                          <a href={`#build-${b.id}`}>
                            <img src={b.image} alt="" width="640" height="400" loading="lazy" decoding="async" />
                            <span>{b.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="sr" role="status">
          {sentence}
        </p>
      </div>
    </section>
  );
}
