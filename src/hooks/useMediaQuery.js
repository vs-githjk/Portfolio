import { useCallback, useSyncExternalStore } from 'react';

/** Live `matchMedia` match. The server (and the hydration pass) always read
    `false`, so the prerendered HTML and the first client render agree; React then
    re-renders with the real value. */
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (notify) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    [query]
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
