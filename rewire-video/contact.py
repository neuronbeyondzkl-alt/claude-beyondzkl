"""Tile rendered stills into one contact sheet for quick review."""
import sys
from PIL import Image, ImageDraw
paths = sys.argv[2:]
cols = 2
w, h = 960, 540
sheet = Image.new("RGB", (cols * w, ((len(paths) + cols - 1) // cols) * h), (40, 40, 40))
for i, p in enumerate(paths):
    im = Image.open(p).resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(im).text((10, 10), p.split("/")[-1], fill=(255, 80, 80))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(sys.argv[1])
