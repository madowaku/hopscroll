"""Cut Michiru's pose sprites out of the generated reference sheet.

Reads art/generated/michiru/michiru-sheet.png (flat navy background), keys out only the
background region connected to the image border, un-mixes the navy from soft edges and
writes one transparent atlas: assets/img/michiru-sprites.png (+ the frame table printed
for src/game.mjs). Requires Pillow and numpy; run from anywhere.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

base = Path(__file__).resolve().parent.parent
sheet = Image.open(base/'art/generated/michiru/michiru-sheet.png').convert('RGB')
rgb = np.asarray(sheet).astype(np.float32)
bg = np.median(np.concatenate([rgb[:8].reshape(-1, 3), rgb[-8:].reshape(-1, 3)]), axis=0)
dist = np.sqrt(((rgb-bg)**2).sum(axis=2))
SOFT, HARD = 10.0, 46.0

# Background = near-navy pixels reachable from the border. The navy sleeve linings sit
# inside light outlines, so they are not reachable and stay opaque.
near = Image.fromarray(np.where(dist < HARD, 255, 0).astype(np.uint8)).copy()
for seed in [(0, 0), (sheet.width-1, 0), (0, sheet.height-1), (sheet.width-1, sheet.height-1)]:
    ImageDraw.floodfill(near, seed, 128)
outside = np.asarray(near) == 128
alpha = np.ones(dist.shape, np.float32)
alpha[outside] = np.clip((dist[outside]-SOFT)/(HARD-SOFT), 0, 1)
# Un-premultiply the navy out of anti-aliased edges so they do not halo on other skies.
a = np.maximum(alpha, 1e-3)[..., None]
color = np.clip((rgb-(1-a)*bg)/a, 0, 255)
rgba = np.dstack([color, alpha*255]).astype(np.uint8)

# Split poses at empty columns.
cols = (alpha > .5).any(axis=0)
spans, start = [], None
for x, on in enumerate(list(cols)+[False]):
    if on and start is None: start = x
    if not on and start is not None:
        if x-start > 40: spans.append((start, x))
        start = None
NAMES = ['front', 'profile', 'slow', 'fast', 'land']
assert len(spans) == len(NAMES), spans

def happy_face(im, x0, y0):
    """Clear card face: paint the front pose's open eyes over with skin, then draw closed
    smiling eyes and a small mouth. Coordinates are in sheet pixels (front pose only)."""
    from PIL import ImageFilter
    skin = (255, 229, 216, 255)
    lid = (92, 58, 50, 255)
    mask = Image.new('L', im.size, 0)
    md = ImageDraw.Draw(mask)
    for cx in (146, 231):
        md.ellipse((cx-26-x0, 378-y0, cx+26-x0, 428-y0), fill=255)
    patch = Image.new('RGBA', im.size, skin)
    im.paste(patch, (0, 0), mask.filter(ImageFilter.GaussianBlur(2.5)))
    # Supersample the strokes so they stay smooth after the LANCZOS shrink.
    k = 4
    ink = Image.new('RGBA', (im.width*k, im.height*k), (0, 0, 0, 0))
    d = ImageDraw.Draw(ink)
    for cx in (146, 231):
        d.arc(((cx-19-x0)*k, (395-y0)*k, (cx+19-x0)*k, (427-y0)*k), 200, 340, fill=lid, width=6*k)
    d.arc(((180-x0)*k, (428-y0)*k, (198-x0)*k, (442-y0)*k), 20, 160, fill=(170, 96, 92, 255), width=3*k)
    for cx in (140, 237):
        d.ellipse(((cx-17-x0)*k, (427-y0)*k, (cx+17-x0)*k, (441-y0)*k), fill=(246, 160, 172, 120))
    im.alpha_composite(ink.resize(im.size, Image.LANCZOS))
    return im

# Every pose shares one scale so the character never changes size between frames.
SCALE, PAD = 0.36, 3
frames, imgs = [], []
for name, (x0, x1) in zip(NAMES, spans):
    rows = np.where((alpha[:, x0:x1] > .5).any(axis=1))[0]
    y0, y1 = rows[0], rows[-1]+1
    # Foot anchor: centre of the lowest opaque band of the pose.
    foot_cols = np.where(alpha[y1-12:y1, x0:x1].max(axis=0) > .5)[0]
    fx = x0+(foot_cols.min()+foot_cols.max())/2
    crop = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    variants = [(name, crop)]
    if name == 'front':
        variants.append(('happy', happy_face(crop.copy(), x0, y0)))
    for vname, im in variants:
        w, h = round(im.width*SCALE), round(im.height*SCALE)
        imgs.append((vname, im.resize((w, h), Image.LANCZOS), (fx-x0)*SCALE, h))
atlas_w = sum(i[1].width+PAD*2 for i in imgs)
atlas_h = max(i[1].height for i in imgs)+PAD*2
atlas = Image.new('RGBA', (atlas_w, atlas_h), (0, 0, 0, 0))
x = 0
for name, im, fx, h in imgs:
    atlas.paste(im, (x+PAD, PAD))
    frames.append(f"{name}:[{x+PAD},{PAD},{im.width},{im.height},{fx:.0f},{h}]")
    x += im.width+PAD*2
out = base/'assets/img/michiru-sprites.png'
atlas.save(out, optimize=True)
print('bg', bg.round(1), 'atlas', atlas.size, out.stat().st_size, 'bytes')
print('frames={'+','.join(frames)+'}  // sx,sy,w,h,footX,footY')
