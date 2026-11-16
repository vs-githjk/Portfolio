#!/usr/bin/env python3
"""A gentle cleanup of the hair on a figure-on-black, before scripts/matte-figure.py.

    python3 scripts/tidy-hair.py <figure-on-black.png> <out.png> [x0 y0 x1 y1]

In blue light a mass of black hair with no detail reads as a fur hat. This does
two small things inside the head box (x0 y0 x1 y1 in the picture's pixels; the
default suits a 768 x 1376 standing figure) and touches nothing else:

  trims    the hair's outer edge is pulled in a few pixels, a little more at the
           crown than at the sides, so the shape is less of a dome
  lifts    the tones inside the hair are spread out, so the strands that are
           there catch the light instead of sinking to one flat dark
  crisps   a gentle unsharp mask over the whole head box, face included

Not used for the current figures (Nov 16): its trim cut the crown flat, and
scripts/matte-figure.py now keys the hair from its own edge. Kept for a figure
whose hair really is one dark dome.

Needs Pillow, numpy and scipy.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = (int(v) for v in sys.argv[3:7]) if len(sys.argv) > 6 else (230, 40, 520, 330)
TRIM_TOP, TRIM_SIDE = 15, 6  # px pulled in at the crown and at the sides
CRISP = 0.9  # how much fine detail is added back over the whole head (an unsharp mask)
LIFT = 1.7  # how far the hair's tones are spread

im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
box = im[y0:y1, x0:x1].copy()
lum = box @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
soft = ndi.gaussian_filter(lum, 1.2)
# Hair: dark, not the black ground (which is darker still and flat), joined in one mass.
ground = soft < 0.022
hair = (soft < 0.2) & ~ground
hair = ndi.binary_opening(ndi.binary_closing(hair, iterations=2), iterations=2)
labels, n = ndi.label(hair)
if n:
    sizes = ndi.sum(hair, labels, range(1, n + 1))
    hair = labels == (1 + int(np.argmax(sizes)))
hair = ndi.binary_fill_holes(hair)

# Trim: how deep inside the hair each pixel is, measured from the ground only (the
# face's edge of the hair is left alone).
outside = ndi.binary_dilation(ground, iterations=2) & ~hair
depth = ndi.distance_transform_edt(~outside)
rows = np.linspace(0, 1, box.shape[0])[:, None]
limit = TRIM_TOP + (TRIM_SIDE - TRIM_TOP) * np.clip(rows * 1.6, 0, 1)
# A ragged edge, not a clean arc: the limit wanders a pixel or two along the outline.
rng = np.random.default_rng(7)
limit = limit + ndi.gaussian_filter(rng.normal(0, 1, lum.shape), 3) * 9
keep = np.clip((depth - limit) / 2.5, 0, 1)
keep = np.where(hair, keep, 1.0)

# Lift: spread the hair's tones about their median.
inner = hair & (keep > 0.5)
med = float(np.median(lum[inner])) if inner.any() else 0.05
gain = np.clip(1 + (LIFT - 1) * np.clip((lum - med * 0.6) / max(med, 1e-3), 0, 2.5) / 2.5, 1, LIFT)
weight = ndi.gaussian_filter(hair.astype(np.float32), 1.5)[..., None]
lifted = np.clip(box * (1 + (gain[..., None] - 1) * weight) + 0.012 * weight, 0, 1)

# Crisp: the whole head (face and hair) gets its fine detail back, gently.
blur = np.stack([ndi.gaussian_filter(lifted[..., c], 1.6) for c in range(3)], -1)
lifted = np.clip(lifted + CRISP * (lifted - blur), 0, 1)

im[y0:y1, x0:x1] = lifted * ndi.gaussian_filter(keep, 0.7)[..., None]
Image.fromarray((im * 255).round().astype(np.uint8)).save(out)
print(f'{out}: hair {int(hair.sum())} px, trimmed {int((hair & (keep < 0.5)).sum())} px')
