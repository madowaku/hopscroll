"""Shrink the Codex-generated Moon Journey art into game assets and measure the bridge slabs.

Reads art/generated/moon-journey/*.png and writes assets/img/{title-earthwatch.jpg, earth.webp,
moon-bridge.webp, meteor-bridge.webp}. It prints the slab metrics that src/moon-sky.mjs uses:
the top edge of the slab, its thickness, and where the plain body starts and ends (the 3-slice cuts).
Requires Pillow and numpy; run from anywhere.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image

base = Path(__file__).resolve().parent.parent
src, out = base/'art/generated/moon-journey', base/'assets/img'
out.mkdir(parents=True, exist_ok=True)

# Title: opaque key art, JPEG is smallest; 720 wide covers phones at DPR 2 behind the logo.
title = Image.open(src/'title-earthwatch.png').convert('RGB')
title = title.resize((720, round(720*title.height/title.width)), Image.LANCZOS)
title.save(out/'title-earthwatch.jpg', quality=84, optimize=True, progressive=True)

def crop(im):
    return im.crop(im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())

# Earth: crop to the disc (plus halo) and keep alpha.
earth = crop(Image.open(src/'earth.png').convert('RGBA'))
earth.resize((384, round(384*earth.height/earth.width)), Image.LANCZOS).save(out/'earth.webp', quality=86, method=6)

metrics = {}
for name in ['moon-bridge', 'meteor-bridge']:
    im = crop(Image.open(src/f'{name}.png').convert('RGBA'))
    im = im.resize((768, round(768*im.height/im.width)), Image.LANCZOS)
    a = np.asarray(im.getchannel('A')) / 255
    mid = a[:, im.width//2]
    rows = np.where(mid > .5)[0]
    top, bottom = int(rows[0]), int(rows[-1])
    row = a[(top+bottom)//2]
    cols = np.where(row > .5)[0]
    # Plain body: where the slab's own rows are solid and nothing hangs below it.
    below = a[bottom+4:].max(axis=0) if bottom+4 < im.height else np.zeros(im.width)
    plain = np.where((row > .5) & (below < .15))[0]
    body = [int(plain[0]), int(plain[-1])] if len(plain) else [int(cols[0]), int(cols[-1])]
    metrics[name] = {'w': im.width, 'h': im.height, 'top': top, 'thick': bottom-top+1,
                     'slab': [int(cols[0]), int(cols[-1])], 'plain': body}
    im.save(out/f'{name}.webp', quality=88, method=6)

for f in ['title-earthwatch.jpg', 'earth.webp', 'moon-bridge.webp', 'meteor-bridge.webp']:
    print(f, (out/f).stat().st_size, 'bytes')
print(json.dumps(metrics))
