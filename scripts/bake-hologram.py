#!/usr/bin/env python3
"""Bake the welcome portrait's point cloud from the studio headshot.

Run by hand when the portrait changes (it is not a build step):

    python3 scripts/bake-hologram.py <portrait-1200.jpg> [preview.png]

The source is ~/Portfolio-notes/design/portrait-1200.jpg (a 1200 x 1200 crop of
the studio headshot). It writes two files into public/holo:

    face-a.bin   the base tier, all a phone downloads (about 18,000 points)
    face-b.bin   the fill-in a desktop adds after it (about 24,000 more)

The portrait is a round window of light with him in it, in his own colours
(Nov 15 2026: every version of his face drawn in blue light, grainy or smooth,
hooded, engraved or painted, was judged ghostly, and so was his real photo once
it floated on the dark ground; what read as friendly was his own colouring in a
lit, framed picture). So each point keeps a colour from the photograph, a real
depth (Depth Anything V2 Small, Apache-2.0) so the head can turn, and how solid
it is (the matte, feathered into the photo's own backdrop so the hair has a
natural edge). The photo file itself is still not shipped; the points are a
soft, lower-detail drawing of it.

  depth    Depth Anything V2 Small run on the photo at 1036 px, re-levelled so
           the cheeks sit on the picture plane and the nose tip stands NOSE in
           front of them; the body is set back behind the head.
  colour   the photo, graded a touch brighter and smoothed a little (more on
           plain skin, so pores and stubble do not come out as speckle).
  points   weighted Voronoi stippling (Lloyd relaxation on a density map): blue
           noise, denser on the eyes, brows, mouth and hair. Tier B is relaxed
           around tier A, so A alone and A + B are both even. Only what lies
           inside the round window (DISC) is kept.

File format "HOL3": a 28 byte header, then eight bytes per point. face-b.bin
ends with one more byte for each point of face-a.bin: that point's spacing once
the fill-in stands between them.

    header  magic "HOL3", point count u32, aspect * 1000 u16,
            eye line x and y as u16 across the picture,
            window centre x, y and radius as u16 across the picture's height,
            the wall's colour behind him (r, g, b), five spare bytes
    xy      3 bytes  x and y, 12 bits each, across the picture (y down)
    z       uint8    depth toward the viewer; 128 is the plane of the cheeks,
                     127 steps are Z_RANGE of the picture's height
    colour  uint16   5 bits red, 6 green, 5 blue
    solid   uint8    high seven bits: how solid the point is (it fades only at
                     the photo's top edge); low bit: 1 if it is him, 0 if it
                     is the backdrop (the backdrop is painted first)
    space   uint8    spacing to the neighbours in thirds of a source pixel

Needs Pillow, numpy, scipy, torch and transformers (the depth model downloads
once into the Hugging Face cache, about 100 MB).
"""
import hashlib
import struct
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from scipy.spatial import cKDTree

SRC = Path(sys.argv[1])
PREVIEW = Path(sys.argv[2]) if len(sys.argv) > 2 else None
OUT = Path(__file__).resolve().parent.parent / 'public' / 'holo'

N_A = 18000  # the phone tier
N_B = 24000  # the desktop fill-in
SEED = 7
Z_RANGE = 0.30  # picture heights covered by 127 depth steps
NOSE = 0.062  # how far the nose tip stands in front of the cheeks, in picture heights

# Measured on the 1200 x 1200 source (viewer's left and right).
EYE_L = dict(cx=510.0, cy=380.0, rx=50.0, ry=19.0, rot=-0.10)
EYE_R = dict(cx=676.0, cy=357.0, rx=54.0, ry=19.0, rot=-0.10)
BROW_L = [(438, 357), (480, 335), (525, 324), (562, 322)]
BROW_R = [(612, 306), (660, 298), (715, 303), (765, 322)]
MOUTH = dict(cx=604.0, cy=532.0, rx=112.0, ry=40.0, rot=-0.06)
NOSE_TIP = (604, 438)
CHEEKS = [(492, 452), (722, 432)]
CHIN = 690.0
HEAD_CX = 612.0
# The round window: its centre and radius in source pixels. Its top stands a
# little above the photo's own top edge, where only the wall is.
DISC = dict(cx=616.0, cy=470.0, r=505.0)
FEATHER = 14.0  # px of the photo's own backdrop kept round the figure, fading out
WALL = (56, 50, 54)  # the photo's backdrop along its top edge (measured): the wall behind the window matches it


def smooth(a, lo, hi):
    t = np.clip((a - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def ellipse(xx, yy, e, grow=1.0):
    c, s = np.cos(e['rot']), np.sin(e['rot'])
    u = (xx - e['cx']) * c + (yy - e['cy']) * s
    v = -(xx - e['cx']) * s + (yy - e['cy']) * c
    return np.sqrt((u / (e['rx'] * grow)) ** 2 + (v / (e['ry'] * grow)) ** 2)


def near_polyline(xx, yy, pts):
    """Distance in px from every pixel to a polyline."""
    best = np.full(xx.shape, 1e9, dtype=np.float32)
    for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
        dx, dy = bx - ax, by - ay
        t = np.clip(((xx - ax) * dx + (yy - ay) * dy) / (dx * dx + dy * dy), 0, 1)
        best = np.minimum(best, np.hypot(xx - (ax + t * dx), yy - (ay + t * dy)))
    return best


img = np.asarray(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = img.shape[:2]
assert (H, W) == (1200, 1200), 'the measurements above are for the 1200 px source'
rgb = img / 255.0
lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# ---- 1. depth -----------------------------------------------------------------
cache = Path(tempfile.gettempdir()) / 'holo-depth-1036.npy'  # the model's output, kept between runs
if cache.exists() and cache.stat().st_mtime > SRC.stat().st_mtime:
    near = np.load(cache)
else:
    import torch
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation

    name = 'depth-anything/Depth-Anything-V2-Small-hf'
    proc = AutoImageProcessor.from_pretrained(name)
    model = AutoModelForDepthEstimation.from_pretrained(name).eval()
    with torch.no_grad():
        d = model(**proc(images=Image.open(SRC).convert('RGB'), return_tensors='pt', size={'height': 1036, 'width': 1036})).predicted_depth
    near = torch.nn.functional.interpolate(d[None], size=(H, W), mode='bicubic', align_corners=False)[0, 0].numpy()
    np.save(cache, near)

# ---- 2. the matte: whatever stands in front of the backdrop --------------------
hist, edges = np.histogram(near, 128)
mid = (edges[:-1] + edges[1:]) / 2
w0 = np.cumsum(hist)
w1 = w0[-1] - w0
m0 = np.cumsum(hist * mid) / np.maximum(w0, 1)
m1 = (np.sum(hist * mid) - np.cumsum(hist * mid)) / np.maximum(w1, 1)
cut = mid[np.argmax(w0 * w1 * (m0 - m1) ** 2)]  # Otsu
fore = ndi.binary_fill_holes(near > cut)
fore = ndi.binary_opening(fore, iterations=2)
labels, n = ndi.label(fore)
if n > 1:
    fore = labels == (1 + int(np.argmax(ndi.sum(fore, labels, range(1, n + 1)))))
inside = ndi.distance_transform_edt(fore)
outside = ndi.distance_transform_edt(~fore)
# Nothing is cut out. The whole of the photo inside the round window is drawn,
# its own studio backdrop included, so hair and shoulders end the way they do
# in the photograph (a cut-out figure on a flat disc was judged sloppy and
# floating). Only at the photo's top edge, where the window reaches a little
# past it, do the points fade into the wall, which has the backdrop's colour.
figure_w = smooth(inside - outside, -FEATHER, 2.0)  # 1 on him, 0 on the backdrop, feathered
solid = smooth(np.minimum(np.mgrid[0:H, 0:W][0], 60).astype(np.float32), 2.0, 44.0)
disc_r = np.hypot(xx - DISC['cx'], yy - DISC['cy'])
window = disc_r < DISC['r'] + 8  # a little past the rim, for the turn of the head

# ---- 3. re-level the depth ------------------------------------------------------
idx = ndi.distance_transform_edt(~fore, return_distances=False, return_indices=True)
filled = near[idx[0], idx[1]]
soft_d = ndi.gaussian_filter(filled, 2.5)
cheek = float(np.mean([soft_d[y, x] for x, y in CHEEKS]))
tip = float(soft_d[NOSE_TIP[1] - 6:NOSE_TIP[1] + 7, NOSE_TIP[0] - 6:NOSE_TIP[0] + 7].max())
z = (soft_d - cheek) / (tip - cheek) * NOSE
# The body: the model puts the crossed arms nearest of all. Flatten it and set it
# back, so the head is the thing in front.
body = smooth(yy, CHIN - 30, CHIN + 110)
z = z * (1 - body) + (z * 0.3 - 0.11) * body
z = np.clip(z, -Z_RANGE, Z_RANGE)
# The backdrop stands on the axis the head turns about (0.13 behind the face),
# so it stays where it is while he turns.
z_figure = z

# ---- 4. where the features are ---------------------------------------------------
soft = ndi.gaussian_filter(lum, 1.3)
eyes = np.minimum(ellipse(xx, yy, EYE_L), ellipse(xx, yy, EYE_R))
mouth = ellipse(xx, yy, MOUTH)
brows = np.minimum(near_polyline(xx, yy, BROW_L), near_polyline(xx, yy, BROW_R))
warm = ndi.gaussian_filter(img[..., 0] - img[..., 2], 2.0) > 10
shirt = (fore & (yy > CHIN - 40) & ~warm) | (fore & (yy > 900))
shirt = ndi.gaussian_filter(ndi.binary_closing(ndi.binary_opening(shirt, iterations=2), iterations=4).astype(np.float32), 2.0)
hair = fore & (soft < 0.2) & (yy < CHIN - 60) & ((yy < 300) | (np.abs(xx - HEAD_CX + 5) > 185)) & (brows > 26) & (eyes > 1.5)
hair_soft = ndi.gaussian_filter(ndi.binary_fill_holes(ndi.binary_closing(hair, iterations=6)).astype(np.float32), 3)
near_feature = np.maximum.reduce([
    1 - smooth(eyes, 1.0, 2.0),
    1 - smooth(brows, 12, 28),
    1 - smooth(mouth, 0.9, 1.4),
    np.exp(-(((xx - NOSE_TIP[0]) / 70) ** 2 + ((yy - NOSE_TIP[1] - 18) / 42) ** 2)),
])

# ---- 5. colour: his own, a touch brighter, without the speckle -------------------
graded = np.clip(rgb * 1.06, 0, 1) ** 0.96
crisp = np.stack([ndi.gaussian_filter(graded[..., c], 1.0) for c in range(3)], 2)
calm = np.stack([ndi.gaussian_filter(graded[..., c], 2.4) for c in range(3)], 2)
# Plain skin and cloth come from the calmer picture; eyes, brows, mouth and hair
# keep their detail.
keep = np.clip(np.maximum(near_feature, hair_soft), 0, 1)[..., None]
colour = crisp * keep + calm * (1 - keep)

# ---- 6. where the points go ------------------------------------------------------
edge_l = ndi.gaussian_gradient_magnitude(soft, 1.6)
edge_l = np.clip(edge_l / np.percentile(edge_l[fore], 98), 0, 1)
feature = (
    0.95 * (1 - smooth(eyes, 0.7, 1.5))
    + 0.5 * (1 - smooth(brows, 9, 24))
    + 0.7 * (1 - smooth(mouth, 0.8, 1.35))
    + 0.35 * np.exp(-(((xx - NOSE_TIP[0]) / 75) ** 2 + ((yy - NOSE_TIP[1] - 18) / 45) ** 2))
)
z = z_figure * figure_w + (-0.13) * (1 - figure_w)
figure = fore.astype(np.float32)
face_zone = figure * (1 - shirt) * (1 - hair_soft)
density = (
    face_zone * (1.0 + 1.3 * feature + 1.0 * edge_l)
    + figure * hair_soft * (1 - shirt) * (0.55 + 0.8 * edge_l)
    + figure * shirt * (0.3 + 1.1 * edge_l)
    + (1 - figure) * (0.09 + 0.55 * smooth(inside - outside, -10.0, 0.0))  # the backdrop: plain, so a few wide points; denser at his edge
)
density = ndi.gaussian_filter(density, 1.0)
density[~window] = 0


def stipple(n_new, fixed, rng, rounds=14):
    """Weighted Voronoi stippling: n_new sites relaxed over the density map,
    around the sites already fixed. Returns (n_new, 2) x, y in source pixels."""
    ys, xs = np.nonzero(density > 0)
    wts = density[ys, xs].astype(np.float64)
    # Four sub-samples a pixel, so a small cell still has something to average.
    sub = np.array([(0.25, 0.25), (0.75, 0.25), (0.25, 0.75), (0.75, 0.75)])
    px = np.concatenate([xs + dx for dx, _ in sub])
    py = np.concatenate([ys + dy for _, dy in sub])
    pw = np.tile(wts, 4)
    pick = rng.choice(len(pw), size=n_new, replace=False, p=pw / pw.sum())
    sites = np.stack([px[pick], py[pick]], 1) + rng.uniform(-0.2, 0.2, (n_new, 2))
    samples = np.stack([px, py], 1)
    nf = len(fixed)
    for _ in range(rounds):
        every = np.concatenate([fixed, sites]) if nf else sites
        _, owner = cKDTree(every).query(samples, workers=-1)
        mass = np.bincount(owner, weights=pw, minlength=len(every))[nf:]
        sx = np.bincount(owner, weights=pw * px, minlength=len(every))[nf:]
        sy = np.bincount(owner, weights=pw * py, minlength=len(every))[nf:]
        ok = mass > 0
        sites[ok] = np.stack([sx[ok] / mass[ok], sy[ok] / mass[ok]], 1)
    return sites


rng = np.random.default_rng(SEED)
stamp = hashlib.sha1(np.round(density, 3).tobytes() + bytes(str((N_A, N_B, SEED)), 'ascii')).hexdigest()[:12]
kept = Path(tempfile.gettempdir()) / f'holo-stipple-{stamp}.npy'  # the relaxation is the slow part
if kept.exists():
    pts_a, pts_b = np.split(np.load(kept), [N_A])
else:
    pts_a = stipple(N_A, np.zeros((0, 2)), rng)
    pts_b = stipple(N_B, pts_a, rng)
    np.save(kept, np.concatenate([pts_a, pts_b]))
every = np.concatenate([pts_a, pts_b])
# The spacing to the neighbours sets the splat's size: the mean distance to the
# nearest six, so a splat reaches across the widest gap beside it and no hole
# is left. Tier A is measured twice: on its own (what a phone draws) and in the
# full set (what a desktop draws; those values ride at the end of tier B).
dist, _ = cKDTree(pts_a).query(pts_a, k=7)
space_a = dist[:, 1:].mean(1)
dist, _ = cKDTree(every).query(every, k=7)
spacing = dist[:, 1:].mean(1)
space_b = spacing[N_A:]


def pack(pts, space, path, tail=None):
    xi = np.clip(pts[:, 0].astype(int), 0, W - 1)
    yi = np.clip(pts[:, 1].astype(int), 0, H - 1)
    order = rng.permutation(len(pts))  # any prefix is still an even sample
    x12 = np.clip(pts[:, 0] / W * 4095, 0, 4095).astype(np.uint32)
    y12 = np.clip(pts[:, 1] / H * 4095, 0, 4095).astype(np.uint32)
    xy = (x12 << 12) | y12
    c = colour[yi, xi]
    c565 = (np.clip(np.round(c[:, 0] * 31), 0, 31).astype(np.uint16) << 11) | (np.clip(np.round(c[:, 1] * 63), 0, 63).astype(np.uint16) << 5) | np.clip(np.round(c[:, 2] * 31), 0, 31).astype(np.uint16)
    out = np.zeros((len(pts), 8), dtype=np.uint8)
    out[:, 0] = xy >> 16
    out[:, 1] = (xy >> 8) & 255
    out[:, 2] = xy & 255
    out[:, 3] = np.clip(128 + z[yi, xi] / Z_RANGE * 127, 0, 255)
    out[:, 4] = c565 & 255
    out[:, 5] = c565 >> 8
    # seven bits of how solid it is, and one that says it is him and not the backdrop
    out[:, 6] = (np.clip(solid[yi, xi] * 127, 0, 127).astype(np.uint8) << 1) | (figure_w[yi, xi] > 0.5)
    out[:, 7] = np.clip(np.round(space * 3), 1, 255)
    out = out[order]
    eye_x = (EYE_L['cx'] + EYE_R['cx']) / 2 / W
    eye_y = (EYE_L['cy'] + EYE_R['cy']) / 2 / H
    head = b'HOL3' + struct.pack(
        '<IHHHHHHBBBBBBBB',
        len(pts), int(W / H * 1000), int(eye_x * 65535), int(eye_y * 65535),
        int(DISC['cx'] / H * 65535 / 2), int(DISC['cy'] / H * 65535 / 2), int(DISC['r'] / H * 65535 / 2),
        WALL[0], WALL[1], WALL[2], 0, 0, 0, 0, 0,
    )
    assert len(head) == 28
    more = b'' if tail is None else np.clip(np.round(tail[order_a] * 3), 1, 255).astype(np.uint8).tobytes()
    path.write_bytes(head + out.tobytes() + more)
    print(f'{len(pts)} points, {path.stat().st_size / 1024:.1f} KB -> {path}')
    return order


OUT.mkdir(parents=True, exist_ok=True)
order_a = pack(pts_a, space_a, OUT / 'face-a.bin')
pack(pts_b, space_b, OUT / 'face-b.bin', tail=spacing[:N_A])

if PREVIEW:
    # A rough picture of what the shader draws at rest: the points as soft
    # splats, composited over the wall inside the round window.
    S = 900
    k = S / H
    for tag, pts, space in [('', every, spacing), ('-a', pts_a, space_a)]:
        acc = np.zeros((S, S, 3), dtype=np.float32)
        wgt = np.zeros((S, S), dtype=np.float32)
        xi = np.clip(pts[:, 0].astype(int), 0, W - 1)
        yi = np.clip(pts[:, 1].astype(int), 0, H - 1)
        for lo, hi in [(0, 2.5), (2.5, 4), (4, 6), (6, 9), (9, 99)]:
            sel = (space >= lo) & (space < hi)
            if not sel.any():
                continue
            layer = np.zeros((S, S, 4), dtype=np.float32)
            a = solid[yi[sel], xi[sel]] * space[sel] ** 2
            py, px = (pts[sel, 1] * k).astype(int).clip(0, S - 1), (pts[sel, 0] * k).astype(int).clip(0, S - 1)
            for c in range(3):
                np.add.at(layer[..., c], (py, px), colour[yi[sel], xi[sel], c] * a)
            np.add.at(layer[..., 3], (py, px), a)
            sig = max(0.6, space[sel].mean() * 0.75 * k)
            acc += np.stack([ndi.gaussian_filter(layer[..., c], sig) for c in range(3)], 2)
            wgt += ndi.gaussian_filter(layer[..., 3], sig)
        cover = 1 - np.exp(-wgt * 2.2)
        col = acc / np.maximum(wgt, 1e-6)[..., None]
        ys_, xs_ = np.mgrid[0:S, 0:S]
        r = np.hypot(xs_ - DISC['cx'] * k, ys_ - DISC['cy'] * k)
        wall = np.array(WALL, dtype=np.float32) / 255.0
        pic = wall[None, None] * (1 - cover[..., None]) + col * cover[..., None]
        pic = np.where((r < DISC['r'] * k)[..., None], pic, np.array([7, 9, 26], dtype=np.float32)[None, None] / 255.0)
        Image.fromarray((np.clip(pic, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + tag + '.png'))
