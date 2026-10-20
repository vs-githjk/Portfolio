/* Inline icons (lucide paths). Decorative: parents carry the accessible name. */
const base = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: 'false' };

export const StarIcon = () => (
  <svg {...base} className="ico ico-fill">
    <path d="M12 2l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 15.4 6.8 18.2l1-5.9L3.5 8.2l5.9-.9z" />
  </svg>
);
export const CheckIcon = () => (
  <svg {...base} className="ico">
    <path d="M5 12l5 5 9-10" />
  </svg>
);
export const PauseIcon = () => (
  <svg {...base} className="ico">
    <path d="M9 5v14M15 5v14" />
  </svg>
);
export const PlayIcon = () => (
  <svg {...base} className="ico">
    <path d="M7 4l12 8-12 8z" />
  </svg>
);
export const ChevronLeftIcon = () => (
  <svg {...base} className="ico">
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const ChevronRightIcon = () => (
  <svg {...base} className="ico">
    <path d="M9 5l7 7-7 7" />
  </svg>
);
