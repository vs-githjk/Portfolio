/* How much of the beam field is still visible at a scroll offset: 1 through the
   first third of a screen, then a linear fade to 0 by 1.2 screens. Shared by the
   scroll controller (opacity, parallax) and the canvas loop (stop drawing). */
export function beamFade(scrollY, viewportH) {
  return Math.max(0, Math.min(1, 1 - (scrollY - viewportH * 0.35) / (viewportH * 0.85)));
}

/* How much of the world below the hero (World.jsx) is visible: it comes up in the
   first fifth of a screen after the hero starts to leave (the canvas is clear
   above the sea's surface, so the beams still show there) and stays to the foot. */
export function worldFade(scrollY, viewportH) {
  return Math.max(0, Math.min(1, scrollY / (viewportH * 0.22)));
}
