#!/usr/bin/env python3
"""Bake the welcome hologram's point cloud from the studio headshot.

Run by hand when the portrait changes (it is not a build step, and the photo
itself is never shipped):

    python3 scripts/bake-hologram.py <portrait-1200.jpg> [preview.png]

The source is ~/Portfolio-notes/design/portrait-1200.jpg (a 1200 x 1200 crop of
the studio headshot). It writes two files into public/holo:

    face-a.bin   the base tier, all a phone downloads (about 18,000 points)
    face-b.bin   the fill-in a desktop adds after it (about 24,000 more)

What is kept of the photograph is structure, not the picture: for each point a
position, a real depth, a surface normal, a flattened tone and a kind. The light
is computed in the shader from the normals, so the face is relit, not printed.

  depth    Depth Anything V2 Small (Apache-2.0) run on the photo at 1036 px.
           Its output is relative nearness; it is re-levelled so the cheeks sit
           on the picture plane and the nose tip stands NOSE in front of them,
           and the body is set back behind the head.
  normals  from the smoothed depth (the slope is exaggerated by SLOPE so a
           shallow relief still catches the light like a full head).
  tone     luminance with the photo's own lighting divided out. Teeth and the
           whites of the eyes are capped at skin level; only the catchlights in
           the irises stay hot. Hair keeps its strands at a low level.
  points   weighted Voronoi stippling (Lloyd relaxation on a density map): blue
           noise with no rows or lattice, denser on the eyes, brows, lips and
           every edge, thin on the body. Tier B is relaxed around tier A, so A
           alone and A + B are both even.

File format "HOL2": a 16 byte header (magic, point count u32, aspect * 1000
u16, eye line x and y as u16 across the picture, eye depth u8, one spare byte)
then eight bytes per point (face-b.bin ends with one more byte for each point
of face-a.bin: that point's spacing once the fill-in stands between them):

    xy     3 bytes  x and y, 12 bits each, across the picture (y down)
    z      uint8    depth toward the viewer; 128 is the plane of the cheeks,
                    127 steps are Z_RANGE of the picture's height
    nx,ny  int8 x2  the normal's x and y (z is what is left; it always faces us)
    tone   uint8    the flattened tone
    meta   uint8    low 5 bits: spacing to the neighbours in thirds of a source
                    pixel (the splat's size); high 3 bits: kind (0 skin,
                    1 feature, 2 hair, 3 body, 4 catchlight)

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
SLOPE = 1.7  # how much steeper the light sees the relief than it is

# Measured on the 1200 x 1200 source (viewer's left and right).
EYE_L = dict(cx=510.0, cy=380.0, rx=50.0, ry=19.0, rot=-0.10)
EYE_R = dict(cx=676.0, cy=357.0, rx=54.0, ry=19.0, rot=-0.10)
BROW_L = [(438, 357), (480, 335), (525, 324), (562, 322)]
BROW_R = [(612, 306), (660, 298), (715, 303), (765, 322)]
MOUTH = dict(cx=604.0, cy=532.0, rx=112.0, ry=40.0, rot=-0.06)
NOSE_TIP = (604, 438)
CHEEKS = [(492, 452), (722, 432)]
HAIRLINE = 300.0  # above this row dark pixels are hair, not brow or lash
CHIN = 690.0
BUST_FADE = (800.0, 1030.0)  # the shoulders fade out between these rows
SIDE_FADE = (330.0, 560.0)  # and beyond this distance from the head's centre line
HEAD_CX = 612.0


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
lum = img @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32) / 255.0
sat = (img.max(2) - img.min(2)) / 255.0
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
alpha = smooth(inside, 0.0, 5.0)
bust = (1 - smooth(yy, *BUST_FADE)) * (1 - smooth(np.abs(xx - HEAD_CX) - (yy - 700).clip(0) * 0.25, *SIDE_FADE))
alpha = alpha * bust

# ---- 3. re-level the depth ------------------------------------------------------
# Fill the backdrop with the nearest subject depth first, so smoothing does not
# drag the silhouette back.
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
z_raw = z

gy, gx = np.gradient(ndi.gaussian_filter(z, 2.5) * H)  # slope in picture units per picture unit
gx, gy = gx * SLOPE, gy * SLOPE
steep = np.hypot(gx, gy)
limit = 2.4 / np.maximum(steep, 2.4)  # no normal lies flatter than about 67 degrees
gx, gy = gx * limit, gy * limit

# ---- 4. kinds --------------------------------------------------------------------
soft = ndi.gaussian_filter(lum, 1.3)
eye_l, eye_r, mouth = ellipse(xx, yy, EYE_L), ellipse(xx, yy, EYE_R), ellipse(xx, yy, MOUTH)
eyes = np.minimum(eye_l, eye_r)
brows = np.minimum(near_polyline(xx, yy, BROW_L), near_polyline(xx, yy, BROW_R))
skin_tone = fore & (sat > 0.11) & (soft > 0.2) & (yy < CHIN + 60) & (np.abs(xx - HEAD_CX) < 300)
dark = soft < 0.2
# Hair: dark, in front of the backdrop, above the brows or outside the face.
hair = fore & dark & (yy < CHIN - 60) & ((yy < HAIRLINE) | (np.abs(xx - HEAD_CX + 5) > 185)) & (brows > 26) & (eyes > 1.5)
hair = ndi.binary_closing(hair, iterations=6)
hair = ndi.binary_fill_holes(hair)
hair = ndi.binary_opening(hair, iterations=2)
hair_soft = ndi.gaussian_filter(hair.astype(np.float32), 3)
# The shirt is whatever below the chin is not warm like skin (its buttons and
# the collar's stripes included); the neck is skin.
warm = ndi.gaussian_filter(img[..., 0] - img[..., 2], 2.0) > 10
shirt = (fore & (yy > CHIN - 40) & ~warm) | (fore & (yy > 900))
shirt = ndi.binary_closing(ndi.binary_opening(shirt, iterations=2), iterations=4)
shirt = ndi.gaussian_filter(shirt.astype(np.float32), 2.0)
is_body = shirt > 0.5
# The quiff stands forward in the model's depth; the skull must not push out.
z = z_raw - 0.045 * hair_soft
# Around the eyes and the mouth the tone already draws every fold. Lit again
# from above, the sockets and the upper lip go black (a moustache of shadow), so
# the relief is flattened there and the light sees only the broad form.
calm = 1 - 0.8 * np.maximum(1 - smooth(eyes, 0.9, 1.9), 1 - smooth(ellipse(xx, yy, MOUTH, 1.0) - 0.25 * np.clip((MOUTH['cy'] - yy) / 60, 0, 1), 0.9, 1.7))
gx, gy = gx * calm, gy * calm
nz = 1 / np.sqrt(1 + gx * gx + gy * gy)
nx, ny = -gx * nz, gy * nz  # y up

# ---- 5. tone: the photo's light divided out -------------------------------------
wide = ndi.gaussian_filter(np.where(skin_tone, soft, 0), 55) / np.maximum(ndi.gaussian_filter(skin_tone.astype(np.float32), 55), 1e-3)
skin_level = float(np.median(soft[skin_tone]))
wide = np.where(ndi.gaussian_filter(skin_tone.astype(np.float32), 55) > 0.08, wide, skin_level)
# Half the big gradient goes: the form now comes from the normals, while the
# small shadows that draw a face (sockets, folds, the lip line) stay.
flat = soft / (0.4 * wide + 0.6 * skin_level)
tone = np.clip(flat * 0.6, 0, 1.4) ** 1.2
skin_cap = float(np.percentile(tone[skin_tone], 80))
# Teeth and the whites of the eyes: pale and unsaturated inside the mouth and
# the eyes. They come down to skin level so the grin is not the brightest thing.
pale = smooth(lum, 0.42, 0.6) * (1 - smooth(sat, 0.2, 0.34))
teeth = pale * (1 - smooth(mouth, 0.85, 1.1))
whites = (1 - smooth(sat, 0.16, 0.3)) * smooth(lum, 0.3, 0.5) * (1 - smooth(eyes, 0.8, 1.05))
tone = tone * (1 - teeth) + skin_cap * 1.02 * teeth
tone = tone * (1 - whites) + np.minimum(tone, skin_cap * 0.8) * whites
# Stubble reads as a moustache once the colour is gone: lift the upper lip most
# of the way to the skin around it, and the jaw a little.
lip_top = np.exp(-(((xx - 604) / 80) ** 2 + ((yy - 493) / 17) ** 2))
jawline = smooth(yy, 560, 610) * (1 - shirt) * (1 - hair_soft)
skin_mid = float(np.median(tone[skin_tone]))
tone = tone + (np.maximum(tone, skin_mid * 0.92) - tone) * 0.7 * lip_top
tone = tone + (np.maximum(tone, skin_mid * 0.8) - tone) * 0.45 * jawline
# The catchlights: the few brightest pixels inside each eye.
iris = np.minimum(np.hypot(xx - 515, yy - 380), np.hypot(xx - 682, yy - 357))
catch = (lum > 0.66) & (iris < 17)
# Hair: a low even level carrying its strands.
strands = np.clip((soft - ndi.gaussian_filter(soft, 6)) * 5.0, -0.12, 0.34)
hair_tone = 0.1 + strands + 0.5 * np.clip(soft - 0.08, 0, 0.3)
tone = tone * (1 - hair_soft) + hair_tone * hair_soft
# The shirt: one quiet level, its folds and placket carried by the normals.
shirt_tone = 0.26 + 0.5 * np.clip(soft - ndi.gaussian_filter(soft, 9), -0.2, 0.12)
tone = tone * (1 - shirt) + shirt_tone * shirt
tone = np.clip(tone, 0.03, 1.0) ** 0.88
tone = np.where(catch, 1.0, tone)

# ---- 6. where the points go ------------------------------------------------------
edge_l = ndi.gaussian_gradient_magnitude(soft, 1.6)
edge_l = np.clip(edge_l / np.percentile(edge_l[fore], 98), 0, 1)
edge_d = np.clip(steep / 2.4, 0, 1)
outline = np.exp(-inside / 5.0)  # the silhouette
feature = (
    0.95 * (1 - smooth(eyes, 0.7, 1.5))
    + 0.5 * (1 - smooth(brows, 9, 24))
    + 0.5 * (1 - smooth(mouth, 0.8, 1.35))
    + 0.35 * np.exp(-(((xx - NOSE_TIP[0]) / 75) ** 2 + ((yy - NOSE_TIP[1] - 18) / 45) ** 2))
)
face_zone = (1 - shirt) * (1 - hair_soft)
density = (
    face_zone * (0.62 + feature + 0.9 * edge_l + 0.25 * edge_d)
    + hair_soft * (1 - shirt) * (0.2 + 0.5 * edge_l + 0.5 * outline)
    + shirt * (0.05 + 0.5 * edge_l + 0.3 * edge_d + 0.3 * outline)
)
density = ndi.gaussian_filter(density, 1.0) * alpha
density[alpha < 0.05] = 0


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
# is left dark. Tier A is measured twice: on its own (what a phone draws) and in
# the full set (what a desktop draws; those values ride at the end of tier B).
dist, _ = cKDTree(pts_a).query(pts_a, k=7)
space_a = dist[:, 1:].mean(1)
dist, _ = cKDTree(every).query(every, k=7)
spacing = dist[:, 1:].mean(1)
space_b = spacing[N_A:]


def pack(pts, space, path, tail=None):
    xi = np.clip(pts[:, 0].astype(int), 0, W - 1)
    yi = np.clip(pts[:, 1].astype(int), 0, H - 1)
    kind = np.zeros(len(pts), dtype=np.uint8)
    kind[(feature[yi, xi] > 0.3) & ~is_body[yi, xi]] = 1
    kind[hair_soft[yi, xi] > 0.5] = 2
    kind[is_body[yi, xi]] = 3
    kind[catch[yi, xi]] = 4
    order = rng.permutation(len(pts))  # any prefix is still an even sample
    x12 = np.clip(pts[:, 0] / W * 4095, 0, 4095).astype(np.uint32)
    y12 = np.clip(pts[:, 1] / H * 4095, 0, 4095).astype(np.uint32)
    xy = (x12 << 12) | y12
    out = np.zeros((len(pts), 8), dtype=np.uint8)
    out[:, 0] = xy >> 16
    out[:, 1] = (xy >> 8) & 255
    out[:, 2] = xy & 255
    out[:, 3] = np.clip(128 + z[yi, xi] / Z_RANGE * 127, 0, 255)
    out[:, 4] = np.clip(nx[yi, xi] * 127, -127, 127).astype(np.int8).view(np.uint8)
    out[:, 5] = np.clip(ny[yi, xi] * 127, -127, 127).astype(np.int8).view(np.uint8)
    out[:, 6] = np.clip(tone[yi, xi] * 255, 0, 255)
    out[:, 7] = np.clip(np.round(space * 3), 1, 31).astype(np.uint8) | (kind << 5)
    out = out[order]
    eye_x = (EYE_L['cx'] + EYE_R['cx']) / 2 / W
    eye_y = (EYE_L['cy'] + EYE_R['cy']) / 2 / H
    eye_z = int(np.clip(128 + z[int(EYE_L['cy']), int(EYE_L['cx'])] / Z_RANGE * 127, 0, 255))
    head = b'HOL2' + struct.pack('<IHHHBB', len(pts), int(W / H * 1000), int(eye_x * 65535), int(eye_y * 65535), eye_z, 0)
    more = b'' if tail is None else np.clip(np.round(tail[order_a] * 3), 1, 31).astype(np.uint8).tobytes()
    path.write_bytes(head + out.tobytes() + more)
    print(f'{len(pts)} points, {path.stat().st_size / 1024:.1f} KB -> {path}')
    return order


OUT.mkdir(parents=True, exist_ok=True)
order_a = pack(pts_a, space_a, OUT / 'face-a.bin')
pack(pts_b, space_b, OUT / 'face-b.bin', tail=spacing[:N_A])
print('nose tip z', NOSE, 'ear z', float(z[440, 850]), 'hair top z', float(z[120, 600]), 'eye z', float(z[380, 510]))

if PREVIEW:
    # A rough picture of what the shader will draw: the tone lit by one key light.
    S = 900
    key = np.array([-0.5, 0.36, 0.78])
    key /= np.linalg.norm(key)

    def draw(pts, space):
        xi = np.clip(pts[:, 0].astype(int), 0, W - 1)
        yi = np.clip(pts[:, 1].astype(int), 0, H - 1)
        lamb = np.clip((nx[yi, xi] * key[0] + ny[yi, xi] * key[1] + nz[yi, xi] * key[2] + 0.35) / 1.35, 0, 1)
        lit = tone[yi, xi] * (0.25 + 0.75 * lamb) + 0.3 * (1 - nz[yi, xi]) ** 2.5
        canvas = np.zeros((S, S), dtype=np.float32)
        for lo, hi in [(0, 2.5), (2.5, 4), (4, 6), (6, 99)]:
            sel = (space >= lo) & (space < hi)
            if not sel.any():
                continue
            layer = np.zeros((S, S), dtype=np.float32)
            np.add.at(layer, ((pts[sel, 1] / H * S).astype(int).clip(0, S - 1), (pts[sel, 0] / W * S).astype(int).clip(0, S - 1)), lit[sel] * space[sel] ** 2)
            canvas += ndi.gaussian_filter(layer, max(0.5, space[sel].mean() * 0.55 * S / H))
        return canvas

    for tag, pts, space in [('', every, spacing), ('-a', pts_a, space_a)]:
        c = draw(pts, space) * 0.11
        rgb = np.stack([c * 0.45, c * 0.62, c], 2)
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + tag + '.png'))
    dots = np.zeros((S, S), dtype=np.float32)
    np.add.at(dots, ((every[:, 1] / H * S).astype(int).clip(0, S - 1), (every[:, 0] / W * S).astype(int).clip(0, S - 1)), 1)
    Image.fromarray((np.clip(dots, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + '-dots.png'))
    Image.fromarray((np.clip(tone, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + '-tone.png'))
    masks = np.stack([hair_soft, np.clip(feature / 1.5, 0, 1), np.maximum(teeth, whites)], 2)
    Image.fromarray((np.clip(masks, 0, 1) * 255).astype(np.uint8)).save(PREVIEW.with_name(PREVIEW.stem + '-masks.png'))
