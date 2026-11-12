#!/usr/bin/env python3
"""Bake the welcome hologram's point cloud from the studio headshot.

Run by hand when the portrait changes (it is not a build step, and the photo
itself is never shipped):

    python3 scripts/bake-hologram.py <portrait-1200.jpg> [preview.png]

It writes public/holo/face.bin: a 12 byte header ("HOLO", point count, row
count, aspect as width / height * 1000) and five bytes per point:

    x     uint16  0..65535 across the picture's width
    row   uint8   the scan row (y = (row + 0.5) / rows)
    z     uint8   depth toward the viewer, 128 is the picture plane
    lum   uint8   how bright the point burns

The points sit on horizontal scan rows, so the face is drawn in lines of light.
They are shuffled, so any prefix of the file is an even sample of the whole (a
phone draws the first part). Depth is a soft ellipsoid for the head, a set-back
slab for the shoulders, a bump for the nose and a little of the photo's own
light. The backdrop is cut by growing its flat grey in from the sides.

Needs Pillow, numpy and scipy.
"""
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = Path(sys.argv[1])
PREVIEW = Path(sys.argv[2]) if len(sys.argv) > 2 else None
OUT = Path(__file__).resolve().parent.parent / 'public' / 'holo' / 'face.bin'

ROW = 5.0  # px between scan rows in the 1200px source
STEP = 2.7  # px between points along a row
SEED = 7

# Where the head sits in the 1200 x 1200 source (measured on the photo).
HEAD = dict(cx=612.0, cy=392.0, rx=262.0, ry=356.0)
NOSE = dict(cx=602.0, cy=448.0, r=58.0)
BUST_FADE = (800.0, 1040.0)  # the shoulders fade out between these rows
SIDE_FADE = (330.0, 560.0)  # and beyond this distance from the head's centre line


def smooth(a, lo, hi):
    t = np.clip((a - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = img.shape[:2]
lum = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
sat = img.max(2) - img.min(2)

# ---- 1. cut the backdrop: flat mid grey, connected to the left or right edge --
flat = (ndi.gaussian_filter(lum, 3) > 27) & (ndi.gaussian_filter(lum, 3) < 84) & (ndi.gaussian_filter(sat, 3) < 20)
labels, _ = ndi.label(flat)
edge = np.unique(np.concatenate([labels[:, 0], labels[:, -1], labels[0, :80], labels[0, -80:]]))
back = np.isin(labels, edge[edge > 0])
fore = ndi.binary_fill_holes(~back)
fore = ndi.binary_opening(fore, iterations=3)
labels, n = ndi.label(fore)
if n > 1:
    sizes = ndi.sum(fore, labels, range(1, n + 1))
    fore = labels == (1 + int(np.argmax(sizes)))
alpha = ndi.gaussian_filter(fore.astype(np.float32), 2.5)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
yy_i = yy
bust = (1 - smooth(yy, *BUST_FADE)) * (1 - smooth(np.abs(xx - HEAD['cx']) - (yy - 700).clip(0) * 0.25, *SIDE_FADE))
alpha *= bust

# ---- 2. how bright each point burns ------------------------------------------
soft = ndi.gaussian_filter(lum, 1.4) / 255.0
# Local contrast first (the features of a face are small steps in light), then a
# steep tone curve between the darkest and brightest skin, so eyes, brows, the
# nose shadow and the mouth read as gaps in the light.
sharp = soft + 0.9 * (soft - ndi.gaussian_filter(soft, 14))
skin = fore & (sat > 28) & (yy_i < 720)
lo, hi = np.percentile(sharp[skin], [4, 97])
tone = np.clip((sharp - lo) / (hi - lo), 0, 1) ** 1.35
detail = np.abs(lum - ndi.gaussian_filter(lum, 5)) / 255.0
# A thin rim of light just inside the outline draws the hair and the shoulders,
# which are too dark or too flat to draw themselves.
rim = np.exp(-ndi.distance_transform_edt(fore) / 9.0)
glow = 0.07 + 0.93 * tone + 1.8 * detail + 0.5 * rim
glow *= 1 - 0.5 * smooth(yy_i.astype(np.float32), 700, 820)  # the shirt sits back
glow = np.clip(glow, 0, 1) * alpha

# ---- 3. depth -----------------------------------------------------------------
dx = (xx - HEAD['cx']) / HEAD['rx']
dy = (yy - HEAD['cy']) / HEAD['ry']
dome = np.sqrt(np.clip(1 - dx * dx - dy * dy, 0, 1))
slab = -0.42 + 0.36 * np.sqrt(np.clip(1 - ((xx - HEAD['cx']) / 640) ** 2, 0, 1))
neck = smooth(yy, 640, 800)
depth = dome * (1 - neck) + slab * neck
depth = np.maximum(depth, slab * 0.6 - 0.1)
nose = np.exp(-(((xx - NOSE['cx']) / NOSE['r']) ** 2 + ((yy - NOSE['cy']) / (NOSE['r'] * 1.25)) ** 2))
relief = ndi.gaussian_filter(lum, 6) / 255.0 - 0.5
depth = depth + 0.16 * nose + 0.07 * relief * dome
depth = ndi.gaussian_filter(depth, 4)

# ---- 4. sample along scan rows ------------------------------------------------
rng = np.random.default_rng(SEED)
rows = int(H / ROW)
pts = []
for r in range(rows):
    y = (r + 0.5) * ROW
    xs = np.arange((r % 2) * STEP / 2, W, STEP) + rng.uniform(-0.6, 0.6, int(np.ceil((W - (r % 2) * STEP / 2) / STEP)))
    xs = xs[(xs >= 0) & (xs < W - 1)]
    yi = int(y)
    xi = xs.astype(int)
    a = alpha[yi, xi]
    g = glow[yi, xi]
    # Dim places (hair, the fading shoulders) keep fewer points, so they thin out
    # instead of turning into a grey sheet.
    keep = rng.uniform(0, 1, len(xs)) < np.clip(0.2 + 1.1 * g, 0, 1) * (a > 0.06)
    for x, gv, zv in zip(xs[keep], g[keep], depth[yi, xi][keep]):
        pts.append((x / W, r, zv, gv))

pts = np.array(pts, dtype=np.float32)
rng.shuffle(pts)
n = len(pts)
x16 = np.clip(pts[:, 0] * 65535, 0, 65535).astype('<u2')
row8 = pts[:, 1].astype(np.uint8)
z8 = np.clip(128 + pts[:, 2] * 100, 0, 255).astype(np.uint8)
l8 = np.clip(pts[:, 3] * 255, 0, 255).astype(np.uint8)
assert rows < 256, 'row index must fit one byte'

OUT.parent.mkdir(parents=True, exist_ok=True)
body = np.zeros(n, dtype=[('x', '<u2'), ('r', 'u1'), ('z', 'u1'), ('l', 'u1')])
body['x'], body['r'], body['z'], body['l'] = x16, row8, z8, l8
OUT.write_bytes(b'HOLO' + struct.pack('<IHH', n, rows, int(W / H * 1000)) + body.tobytes())
print(f'{n} points, {rows} rows, {OUT.stat().st_size / 1024:.1f} KB -> {OUT}')

if PREVIEW:
    S = 900
    canvas = np.zeros((S, S), dtype=np.float32)
    px = (pts[:, 0] * S).astype(int).clip(0, S - 1)
    py = ((pts[:, 1] + 0.5) / rows * S).astype(int).clip(0, S - 1)
    np.add.at(canvas, (py, px), pts[:, 3])
    canvas = ndi.gaussian_filter(canvas, 0.8) * 3.2
    rgb = np.stack([canvas * 0.45, canvas * 0.62, canvas], 2)
    Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(PREVIEW)
    Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + '-mask.png'))
