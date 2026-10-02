"""
make_logo_png.py — build the website logos from the official crest.

Created by Master of AI.

Source : assets/source/university-logo.jpg
Output : assets/logo.png          (large, transparent background)
         assets/logo-dark.png     (header logo for the dark theme)
         assets/logo-light.png    (header logo for the light theme)
         assets/favicon.png       (64 x 64 browser-tab icon)

The white background around the crest is removed with a flood fill that
starts at the image edges, so white parts inside the crest are kept.
"""
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "source" / "university-logo.jpg"
OUT = ROOT / "assets"


def remove_background(img, threshold=232):
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    near_white = lambda p: p[0] >= threshold and p[1] >= threshold and p[2] >= threshold
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        if not near_white(px[x, y]):
            continue
        px[x, y] = (255, 255, 255, 0)
        queue.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    # keep only the crest (largest connected shape); drop specks from the scan edge
    seen = bytearray(w * h)
    shapes = []
    for sy in range(h):
        for sx in range(w):
            if seen[sy * w + sx] or px[sx, sy][3] == 0:
                continue
            shape, queue = [], deque([(sx, sy)])
            seen[sy * w + sx] = 1
            while queue:
                x, y = queue.popleft()
                shape.append((x, y))
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and px[nx, ny][3] > 0:
                        seen[ny * w + nx] = 1
                        queue.append((nx, ny))
            shapes.append(shape)
    shapes.sort(key=len, reverse=True)
    for shape in shapes[1:]:
        if len(shape) < 0.02 * len(shapes[0]):
            for x, y in shape:
                px[x, y] = (255, 255, 255, 0)
    # soften the cut edge slightly
    alpha = img.getchannel("A").filter(ImageFilter.GaussianBlur(0.6))
    img.putalpha(alpha)
    return img.crop(img.getbbox())


def fit(img, height):
    ratio = height / img.height
    return img.resize((max(1, round(img.width * ratio)), height), Image.LANCZOS)


if __name__ == "__main__":
    crest = remove_background(Image.open(SRC))
    fit(crest, 512).save(OUT / "logo.png")
    header = fit(crest, 160)                 # shown at ~44 px tall, sharp on high-DPI screens
    header.save(OUT / "logo-dark.png")
    header.save(OUT / "logo-light.png")
    icon = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    small = fit(crest, 62)
    icon.paste(small, ((64 - small.width) // 2, 1), small)
    icon.save(OUT / "favicon.png")
    print("crest", crest.size, "-> logo.png, logo-dark.png, logo-light.png, favicon.png")
