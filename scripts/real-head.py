#!/usr/bin/env python3
"""Put his real head (hair, face, ears) on a figure-on-black, so it reads as him.

    python3 scripts/real-head.py <figure.png> <real-photo.jpg> <real-mask.png> <out.png> \\
        fx1 fy1 fx2 fy2  rx1 ry1 rx2 ry2  chin [preview.jpg]

The figure is doubled in size first (the real photo has more detail than the
figure's own head, and the matte script sizes the result down again), so <out>
is twice the figure's pixels. The eight numbers are the centres of his two eyes
(the eye on the picture's left first) in the figure, then in the real photo,
each in its own picture's pixels; `chin` is the row of the figure, in its own
pixels, just under its chin. <real-mask> is the person in the real photo, white
on black, the same size as the photo (rembg, as in matte-figure.py).

What it does: the figure's own head is taken off down to the chin row; the real
head is turned, scaled and moved so its eyes land on the figure's eyes (a
similarity, no stretching) and fades out over the neck, where the figure's own
neck takes over; its skin is brought to the figure's skin tone, and half of the
figure's light across the face (the blue from the crystal) is laid over it.
Needs Pillow, numpy and scipy.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

fig_path, real_path, mask_path, out_path = sys.argv[1:5]
fx1, fy1, fx2, fy2, rx1, ry1, rx2, ry2, chin = (float(v) for v in sys.argv[5:14])
preview = sys.argv[14] if len(sys.argv) > 14 else None
FACE_ONLY = len(sys.argv) > 15 and sys.argv[15] == 'face'  # keep the figure's hair, ears, jaw and neck: only brows to chin are his photo
UP = 2
LIGHT = 0.75  # how much of the figure's own light across the face is kept
CRISP = 0.5
HAIR = 1.7  # how far the hair's tones are spread

small = Image.open(fig_path).convert('RGB')
fig = np.asarray(small.resize((small.width * UP, small.height * UP), Image.LANCZOS)).astype(np.float32) / 255
real = np.asarray(Image.open(real_path).convert('RGB')).astype(np.float32) / 255
rmask = np.asarray(Image.open(mask_path).convert('L')).astype(np.float32) / 255
fx1, fy1, fx2, fy2, chin = (v * UP for v in (fx1, fy1, fx2, fy2, chin))
H, W, _ = fig.shape

f = complex(fx2 - fx1, fy2 - fy1)
r = complex(rx2 - rx1, ry2 - ry1)
k = r / f  # the figure's pixels to the real photo's: scale and turn
eye = abs(f)
cx, cy = (fx1 + fx2) / 2, (fy1 + fy2) / 2

x0, x1 = int(max(0, cx - eye * 2.6)), int(min(W, cx + eye * 2.6))
y0, y1 = int(max(0, cy - eye * 3.2)), int(min(H, chin + eye * 0.9))
yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
z = ((xx - fx1) + 1j * (yy - fy1)) * k
sx, sy = z.real + rx1, z.imag + ry1
scale = abs(k)
pre = max(0.0, scale * 0.4) if scale > 1 else 0.0
soft = lambda im: ndi.gaussian_filter(im, pre) if pre else im
head = np.stack([ndi.map_coordinates(soft(real[..., c]), [sy, sx], order=3, mode='nearest') for c in range(3)], -1)
alpha = ndi.map_coordinates(soft(rmask), [sy, sx], order=1, mode='constant')
head = np.clip(head, 0, 1)
# The mask's edge carries a line of the wall behind him: pull it in and feather it.
solid = alpha > 0.5
inside = ndi.distance_transform_edt(solid)
alpha = np.clip((inside - 1.5) / 3.0, 0, 1)

target = fig[y0:y1, x0:x1]
lum = lambda im: im @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

# Skin, in each picture: inside the face oval, neither hair nor highlight.
oval = np.hypot((xx - cx) / (eye * 0.95), (yy - (cy + eye * 0.45)) / (eye * 1.2)) < 1
skin_r = oval & (lum(head) > np.percentile(lum(head)[oval], 25))
skin_f = oval & (lum(target) > np.percentile(lum(target)[oval], 25))
for c in range(3):
    # A gain, not a shift: black hair stays black.
    head[..., c] *= np.median(target[..., c][skin_f]) / max(float(np.median(head[..., c][skin_r])), 1e-3)
head = np.clip(head, 0, 1)

# The figure's light across the face (its low frequencies over the real head's own), half strength, face only.
wide = eye * 0.45
face_w = ndi.gaussian_filter(oval.astype(np.float32), eye * 0.2)[..., None]
ratio = np.stack([(ndi.gaussian_filter(target[..., c], wide) + 0.03) / (ndi.gaussian_filter(head[..., c], wide) + 0.03) for c in range(3)], -1)
ratio = np.clip(ratio, 0.6, 1.7)
head = np.clip(head * (1 + (ratio - 1) * LIGHT * face_w), 0, 1)

# Hair: the photo's is a flat dark mass; spread its tones and cool them, as the figure's hair is lit.
hl = lum(head)
hair = (alpha > 0.5) & (hl < 0.2) & (yy < cy + eye * 0.6) & (not FACE_ONLY)
hw = ndi.gaussian_filter(hair.astype(np.float32), 1.2)[..., None]
lit = np.clip(hl * HAIR, 0, 1)[..., None] * np.array([0.8, 0.95, 1.25], dtype=np.float32)
head = np.clip(head * (1 - hw) + lit * hw, 0, 1)

blur = np.stack([ndi.gaussian_filter(head[..., c], 1.3) for c in range(3)], -1)
head = np.clip(head + CRISP * (head - blur), 0, 1)

if FACE_ONLY:
    d = np.hypot((xx - cx) / (eye * 1.02), (yy - (cy + eye * 0.36)) / (eye * 1.16))
    m = np.clip((1.0 - d) / 0.32, 0, 1)
    alpha = ndi.gaussian_filter(m * m * (3 - 2 * m), eye * 0.04) * (alpha > 0)
    keep_fig = np.ones_like(alpha)
else:
    # The figure's own head goes (down to the chin row); the real head fades out over the neck.
    keep_fig = np.clip((yy - (chin - 12 * UP)) / (8 * UP), 0, 1)
    alpha = alpha * np.clip(((chin + 8 * UP) - yy) / (12 * UP), 0, 1)

out = fig.copy()
base = target * keep_fig[..., None]
out[y0:y1, x0:x1] = base * (1 - alpha[..., None]) + head * alpha[..., None]
Image.fromarray((out * 255).round().astype(np.uint8)).save(out_path)
print(f'{out_path}: {W} x {H}; head scaled {1 / scale:.2f}x, turned {np.degrees(np.angle(k)):.1f} degrees')

if preview:
    box = (x0, y0, x1, y1)
    a = Image.fromarray((fig * 255).astype(np.uint8)).crop(box)
    b = Image.fromarray((out * 255).round().astype(np.uint8)).crop(box)
    full = np.stack([ndi.map_coordinates(real[..., c], [sy, sx], order=1, mode='nearest') for c in range(3)], -1)
    c = Image.fromarray((np.clip(full, 0, 1) * 255).astype(np.uint8))
    sheet = Image.new('RGB', (a.width * 3 + 16, a.height), (30, 30, 30))
    for i, im in enumerate([a, b, c]):
        sheet.paste(im, (i * (a.width + 8), 0))
    sheet.save(preview, quality=92)
