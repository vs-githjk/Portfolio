#!/usr/bin/env python3
"""Cut the hologram's figure out of a picture on pure black.

Run by hand when the figure changes (it is not a build step):

    uvx --from "rembg[cpu,cli]" --with scipy python scripts/matte-figure.py <figure-on-black.png> [name] [preview-dir]

It writes public/holo/<name>.webp (1200 px tall, the desktop figure) and
public/holo/<name>-phone.webp (720 px tall); `name` is "wizard-1" unless given.
With a preview dir it also writes the figure on an indigo and on a grey ground,
and the matte itself, so the edge can be checked by eye.

The matte is two things added together:

  the body   whatever a segmentation model (rembg with birefnet-portrait; MIT)
             says is solid, specks dropped, so a dark robe on a black ground
             stays whole, the gap between an arm and the body stays open, and a
             ring of light is not taken for a disc. Its edge is pulled in a pixel
             and feathered, so no black rim comes with it.
  the light  outside the body, anything that glows on the black (a crystal's
             halo, a ring of glyphs): its alpha is its own brightness, so the
             lines are solid, the black inside a ring is clear, and a halo fades
             out. Its colour is divided by that alpha, so the glow keeps its
             strength once it is drawn over another ground.

Needs rembg, Pillow, numpy and scipy (the model downloads once, under 1 GB).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage as ndi

SIZES = {'': 1200, '-phone': 720}  # heights, px
MODEL = 'birefnet-portrait'  # of the rembg models tried, the one that keeps a ring of light as lines, not a disc
LIGHT_FLOOR, LIGHT_FULL = 0.07, 0.6  # brightness where a glow starts to show, and where it is solid
LIGHT_REACH = 150  # px: a glow counts only this near the body (stray specks on the black further out do not)

src_path = Path(sys.argv[1])
name = sys.argv[2] if len(sys.argv) > 2 else 'wizard-1'
preview = Path(sys.argv[3]) if len(sys.argv) > 3 else None
out_dir = Path(__file__).resolve().parent.parent / 'public' / 'holo'

src = Image.open(src_path).convert('RGB')
rgb = np.asarray(src).astype(np.float32) / 255
H, W, _ = rgb.shape

# ---- the body -----------------------------------------------------------------
bright = rgb.max(-1)
mask = np.asarray(remove(src, session=new_session(MODEL), only_mask=True).convert('L')).astype(np.float32) / 255
solid = ndi.binary_closing(mask > 0.5, iterations=2)
# Keep the figure and anything of size it holds; thin lines of light the model
# half caught are dropped here and come back, properly, as light.
solid = ndi.binary_opening(solid, iterations=2)
labels, n = ndi.label(solid)
if n > 1:
    sizes = ndi.sum(solid, labels, range(1, n + 1))
    solid = np.isin(labels, [i + 1 for i, size in enumerate(sizes) if size > 0.002 * H * W])
signed = ndi.distance_transform_edt(solid) - ndi.distance_transform_edt(~solid)
body = ndi.gaussian_filter(np.clip((signed - 0.6) / 1.6, 0, 1), 0.6)

# ---- the light ----------------------------------------------------------------
light = np.clip((bright - LIGHT_FLOOR) / (LIGHT_FULL - LIGHT_FLOOR), 0, 1)
near = ndi.distance_transform_edt(~solid) < LIGHT_REACH
# Only light that belongs to a real glow: a patch with a bright heart, not a lone grey pixel.
patch, m = ndi.label((light > 0.02) & near & ~solid)
if m:
    peak = ndi.maximum(bright, patch, range(1, m + 1))
    area = ndi.sum(np.ones_like(bright), patch, range(1, m + 1))
    keep = np.isin(patch, [i + 1 for i in range(m) if peak[i] > 0.45 and area[i] > 40])
else:
    keep = np.zeros_like(solid)
light = ndi.gaussian_filter(light * keep, 0.5)

alpha = np.maximum(body, light * (1 - body))
# A glow's colour is what it would be at full strength; the body keeps its own.
glow_rgb = np.clip(rgb / np.maximum(light, 0.08)[..., None], 0, 1)
colour = rgb * body[..., None] + glow_rgb * (1 - body[..., None])
figure = Image.fromarray((np.dstack([colour, alpha]) * 255).round().astype(np.uint8), 'RGBA')

# Trim to what is there, with a little air, so the figure fills its box.
box = figure.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
pad = 12
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(W, box[2] + pad), min(H, box[3]))
figure = figure.crop(box)

out_dir.mkdir(parents=True, exist_ok=True)
for suffix, tall in SIZES.items():
    wide = round(figure.width * tall / figure.height)
    sized = figure.resize((wide, tall), Image.LANCZOS)
    path = out_dir / f'{name}{suffix}.webp'
    sized.save(path, quality=86, method=6, exact=True)
    print(f'{path.name}: {wide} x {tall}, {path.stat().st_size // 1024} KB')

if preview:
    preview.mkdir(parents=True, exist_ok=True)
    grounds = {'indigo': (8, 12, 44), 'grey': (128, 128, 128)}
    sheet = Image.new('RGB', (figure.width * 3, figure.height), (0, 0, 0))
    for k, (label, ground) in enumerate(grounds.items()):
        on = Image.new('RGB', figure.size, ground)
        on.paste(figure, (0, 0), figure)
        sheet.paste(on, (k * figure.width, 0))
    sheet.paste(figure.getchannel('A').convert('RGB'), (2 * figure.width, 0))
    sheet.save(preview / f'{name}-check.jpg', quality=86)
    print(f'preview: {preview / (name + "-check.jpg")}')
