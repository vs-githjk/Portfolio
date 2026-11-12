/* How much of the beam field is still visible at a scroll offset: 1 through the
   first third of a screen, then a linear fade to 0 by 1.2 screens. Shared by the
   scroll controller (opacity, parallax) and the canvas loop (stop drawing). */
export function beamFade(scrollY, viewportH) {
  return Math.max(0, Math.min(1, 1 - (scrollY - viewportH * 0.35) / (viewportH * 0.85)));
}

/* How much of the depth field (the hall of light behind the later sections) is
   visible: it takes over as the hero beams fade, and hands back to the contact
   section's own beams over the last screen of the page. */
export function deepFade(scrollY, viewportH, maxScroll) {
  const end = Math.max(0, Math.min(1, (maxScroll - scrollY) / (viewportH * 0.8)));
  return (1 - beamFade(scrollY, viewportH)) * end;
}
