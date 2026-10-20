import { CheckIcon, StarIcon } from './Icons';

/* variant "award": brass, with a star. variant "outcome": neutral pill with a
   mint check (the receipts under an Experience row). */
export default function Badge({ variant = 'award', children }) {
  return (
    <span className={`badge badge-${variant}`}>
      {variant === 'award' ? <StarIcon /> : <CheckIcon />}
      {children}
    </span>
  );
}
