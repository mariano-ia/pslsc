#!/usr/bin/env python3
"""
Genera los assets de la landing del Soccer School (school/assets/) a partir de las fuentes de marca.
Correr desde la raíz del repo:  python3 tools/school-assets.py

  logo-aqua.webp        logo oval recoloreado a aqua (#AAF6E6), 900 px de ancho, con alfa
  og-image.jpg          1200×630 para compartir: lockup de la portada sobre red marine + línea de contexto
  favicon.png           64×64, ancla aqua sobre red marine
  apple-touch-icon.png  180×180, ídem
  crest-aqua.webp       copia del escudo del club (assets/brand)
  anchor-aqua.webp      copia del ancla (assets/brand), viñeta de las razones
  fonts/*.woff2         copias de las fuentes subseteadas del sitio (dist/upload/fonts)
"""
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / 'docs' / 'soccer-school' / 'brand'
OUT = ROOT / 'school' / 'assets'
RED = (255, 0, 72)      # #FF0048 — red marine del manual (es el fondo exacto de la portada)
AQUA = (170, 246, 230)  # #AAF6E6
FONTS = ('Druk-Heavy', 'ProximaNova-Regular', 'ProximaNova-Bold')


def recolor(img, rgb):
    """Pinta toda la figura de un color, conservando el alfa (sirve para logos monocromos)."""
    img = img.convert('RGBA')
    solid = Image.new('RGBA', img.size, rgb + (255,))
    solid.putalpha(img.getchannel('A'))
    return solid


def logo():
    out = recolor(Image.open(BRAND / 'logo.png'), AQUA)
    width = 900
    out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    out.save(OUT / 'logo-aqua.webp', 'WEBP', quality=90, method=6)
    return out.size


def lockup_crop():
    """Recorta el lockup de la portada: todo lo que no es red marine, sin la línea del pie."""
    im = Image.open(BRAND / 'portada.png').convert('RGB')
    pixels = np.asarray(im).astype(int)
    mask = np.abs(pixels - np.array(RED)).sum(axis=2) > 60
    mask[2000:, :] = False  # la línea de categorías del pie queda afuera
    ys, xs = np.where(mask)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def og_image():
    width, height = 1200, 630
    og = Image.new('RGB', (width, height), RED)
    lock = lockup_crop()
    lock_w = 880
    lock = lock.resize((lock_w, round(lock.height * lock_w / lock.width)), Image.LANCZOS)
    og.paste(lock, ((width - lock_w) // 2, 56))
    font = ImageFont.truetype(str(ROOT / 'assets' / 'fonts' / 'ProximaNova-Bold.otf'), 30)
    text = 'PORT ST. LUCIE SC  ·  AGES 5–13  ·  PRE-REGISTRATION OPEN'
    draw = ImageDraw.Draw(og)
    draw.text(((width - draw.textlength(text, font=font)) / 2, height - 86), text, font=font, fill=(255, 255, 255))
    og.save(OUT / 'og-image.jpg', 'JPEG', quality=88, optimize=True)


def icons():
    anchor = recolor(Image.open(ROOT / 'assets' / 'brand' / 'anchor-aqua.webp'), AQUA)
    for size, name in ((64, 'favicon.png'), (180, 'apple-touch-icon.png')):
        icon = Image.new('RGBA', (size, size), RED + (255,))
        mark = anchor.copy()
        mark.thumbnail((round(size * 0.68), round(size * 0.68)), Image.LANCZOS)
        icon.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
        icon.save(OUT / name, 'PNG', optimize=True)


def copies():
    for name in ('crest-aqua.webp', 'anchor-aqua.webp'):
        shutil.copy(ROOT / 'assets' / 'brand' / name, OUT / name)
    (OUT / 'fonts').mkdir(exist_ok=True)
    for font in FONTS:
        shutil.copy(ROOT / 'dist' / 'upload' / 'fonts' / f'{font}.woff2', OUT / 'fonts' / f'{font}.woff2')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    print('logo-aqua.webp', logo())
    og_image()
    icons()
    copies()
    for path in sorted(OUT.rglob('*')):
        if path.is_file():
            print(f'{path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB')
