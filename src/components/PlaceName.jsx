import { worlds } from '../data/content';
import { places } from '../data/world';

/* The name of the place a section is, beside its eyebrow ("WHAT I'VE BUILT · THE
   DEEP"). The shell's chart (data/world.js) is the source when it lists the
   section; until then the names in content.js stand in, so the two can never
   show at once. */
export default function PlaceName({ section }) {
  const listed = places.find((p) => (p.section ?? p.sectionId ?? p.id) === section);
  const name = listed?.name ?? worlds.places?.[section];
  if (!name) return null;
  return (
    <span className="place">
      <span aria-hidden="true"> · </span>
      {name}
    </span>
  );
}
