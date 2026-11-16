import { useEffect, useRef } from 'react';

/* The sky behind the first screen: deep space with one soft band of aurora where
   gold and ember red melt into the page's blue. It lives in the fixed background
   stack, under the hologram's canvas, so the figure stands in front of it; it is
   moved with the scroll so it leaves with the welcome, and fades as the greeting
   does.

   No shapes: the band is a few large, soft gradients (clouds of ember low at the
   sides, gold above them, a violet haze joining them to the blue) blurred as one
   layer, with a fine grain over it so it reads as painted light and not as a
   gradient. It is strongest toward the sides: the middle belongs to the blue of
   the figure. (A mountain range and a sun stood here for an hour: "that doesn't
   make sense ... seems like a work in progress". Do not bring back hard shapes.)
   Plain CSS, no canvas. */
export default function WelcomeBackdrop() {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    let raf = 0;
    const place = () => {
      raf = 0;
      const y = window.scrollY;
      const h = window.innerHeight;
      if (y > h * 1.5) {
        node.style.visibility = 'hidden';
        return;
      }
      node.style.visibility = '';
      node.style.transform = `translate3d(0, ${-y}px, 0)`;
      node.style.opacity = Math.max(0, 1 - y / (h * 0.55)).toFixed(3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="bg-room" ref={ref}>
      <span className="room-aurora" />
      <span className="room-grain" />
    </div>
  );
}
