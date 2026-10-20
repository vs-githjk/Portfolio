import { hero } from '../data/content';
import Badge from './Badge';

const slides = hero.carousel.slides;

/* Badges on a build's media: its verified awards (gold), or, with none, the live
   receipt its ring card carries (mint) when there is one. */
export default function MediaBadges({ item }) {
  if (item.awards.length > 0) {
    return item.awards.map((a) => (
      <Badge kind="win" key={a}>
        {a}
      </Badge>
    ));
  }
  const slide = slides.find((s) => s.id === item.id);
  return slide && slide.badgeKind === 'live' ? <Badge kind="live">{slide.badge}</Badge> : null;
}
