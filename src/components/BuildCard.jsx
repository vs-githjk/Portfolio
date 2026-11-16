import { useId, useState } from 'react';
import { builds } from '../data/content';
import { EV } from '../kit/contract';
import LinkRow from './LinkRow';
import Media from './Media';
import MediaBadges from './MediaBadges';
import Rich from './Rich';
import Stack from './Stack';
import { fill, place } from './counts';

const tell = (id) => window.dispatchEvent(new CustomEvent(EV.focus, { detail: { kind: 'build', id } }));

/* One featured build, as a plate: the thumbnail edge to edge with any award on
   it, then the kind line over the name, the one-liner, the
   results as sentences (a figure never stands alone) and the links.

   The dates and the event, the role line, the story and the stack are its
   dossier. The plate's foot has the button; the dossier itself is the NEXT element, which the fleet's grid
   lays out under the whole row. So opening one never changes a plate's height:
   the cards in a row stay one height by construction. Without the script every
   dossier is simply open (the `.js` class is what folds them).

   On a phone a plate is a row: a small thumbnail beside the name, the one-liner
   and the links; its results open with the dossier.

   A plate tells the world which build has the reader's attention (world:focus). */
export default function BuildCard({ item, anchor }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <>
      <article
        className="plate reveal"
        id={`build-${item.id}`}
        data-build={item.id}
        data-world-anchor={anchor}
        onPointerEnter={() => tell(item.id)}
        onPointerLeave={() => tell(null)}
        onFocus={() => tell(item.id)}
        onBlur={() => tell(null)}
      >
        <div className="plate-media">
          <Media image={item.media?.image} alt={item.media?.alt} tile={item.tile} ratio="var(--plate-ratio)" sizes="(min-width: 1100px) 300px, (min-width: 561px) 46vw, 120px" badges={<MediaBadges item={item} />} />
        </div>
        <div className="plate-name">
          <span className="eyebrow">
            <span className="num">{place(item.id)}</span> {item.kind}
          </span>
          <h3 className="plate-title">
            {item.title} <span>{item.descriptor}</span>
          </h3>
        </div>
        <p className="one">{item.oneLiner}</p>
        <ul className="plate-results">
          {(item.metrics || []).map((m) => (
            <li key={m.label}>
              <b>{m.value}</b> {m.label.replace(/\n/g, ' ')}
            </li>
          ))}
        </ul>
        <div className="plate-foot">
          <LinkRow links={item.links} />
        </div>
        <div className="plate-handle">
          <button type="button" className="fold-btn" aria-expanded={open} aria-controls={panel} onClick={() => setOpen((v) => !v)}>
            {builds.labels.dossier}
            <span className="sr">{fill(builds.labels.dossierSr, { title: item.title })}</span>
          </button>
        </div>
      </article>
      <div className="dossier" id={panel} data-open={open ? '' : undefined} role="region" aria-label={`${item.title} ${builds.labels.dossier.toLowerCase()}`}>
        <p className="dossier-name" aria-hidden="true">
          <span className="num">{place(item.id)}</span> {item.title}
        </p>
        <div className="dossier-body">
          <p className="eyebrow">{item.when}</p>
          {item.role && <p className="role">{item.role}</p>}
          {item.body.map((p) => (
            <p className="text" key={p.slice(0, 24)}>
              <Rich text={p} />
            </p>
          ))}
          {/* On a phone the plate keeps no result line: every result opens here.
              On a wide window the first one is on the plate, so it is not repeated. */}
          {(item.metrics || []).length > 0 && (
            <ul className="plate-results dossier-results">
              {item.metrics.map((m, n) => (
                <li key={m.label} data-first={n === 0 ? '' : undefined}>
                  <b>{m.value}</b> {m.label.replace(/\n/g, ' ')}
                </li>
              ))}
            </ul>
          )}
          <Stack text={item.stack} />
        </div>
      </div>
    </>
  );
}
