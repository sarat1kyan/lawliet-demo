#!/usr/bin/env python3
"""Generate optimised logo derivatives (WebP + PNG) from the real brand artwork.
Run from repo root: python3 tools/build-brand.py
Source files live in assets/img/brand/*-src.png and are not shipped.
"""
import os
from PIL import Image

BRAND = "assets/img/brand"
mark = Image.open(f"{BRAND}/mark-src.png").convert("RGBA")   # 512x512
word = Image.open(f"{BRAND}/wordmark-src.png").convert("RGBA")  # 944x79


def save(im, name):
    im.save(f"{BRAND}/{name}.png", optimize=True)
    im.save(f"{BRAND}/{name}.webp", lossless=True, method=6, quality=100)


def resize_h(im, h):
    w = round(im.width * h / im.height)
    return im.resize((w, h), Image.LANCZOS)


def resize_w(im, w):
    h = round(im.height * w / im.width)
    return im.resize((w, h), Image.LANCZOS)


# Mark: square sizes. 512 native, 1024 is exactly 2x (allowed).
for size in (56, 112, 256, 512, 1024):
    src = mark if size <= 512 else mark.resize((1024, 1024), Image.LANCZOS)
    im = mark.resize((size, size), Image.LANCZOS) if size < 512 else src
    save(im, f"mark-{size}")

# Wordmark: by width. Header ~240, hero up to ~760 (2x of 380).
for w in (240, 480, 760):
    save(resize_w(word, w), f"wordmark-{w}")

# Report sizes
for f in sorted(os.listdir(BRAND)):
    if f.endswith((".png", ".webp")) and "-src" not in f:
        print(f, os.path.getsize(f"{BRAND}/{f}"))
