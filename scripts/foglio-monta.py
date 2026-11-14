"""Monta le schermate di `foglio-schermate.mjs` in un foglio solo (e in strisce da guardare).

  <python con PIL> scripts/foglio-monta.py [cartella] [colonne]
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

dove = Path(sys.argv[1] if len(sys.argv) > 1 else "_lavoro/foglio")
colonne = int(sys.argv[2]) if len(sys.argv) > 2 else 7
file = sorted(p for p in dove.glob("[0-9][0-9]-*.png"))
L, A, M, T = 375, 812, 24, 34  # telefono, margine, riga del titolo
try:
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
except OSError:
    font = ImageFont.load_default()

def striscia(pezzi):
    w = M + len(pezzi) * (L + M)
    im = Image.new("RGB", (w, T + A + M), "#15132E")
    d = ImageDraw.Draw(im)
    for i, p in enumerate(pezzi):
        x = M + i * (L + M)
        d.text((x, 8), p.stem.replace("-", " ", 1).replace("-", " "), fill="#FFF4DC", font=font)
        im.paste(Image.open(p).convert("RGB").resize((L, A), Image.LANCZOS), (x, T))
    return im

righe = [file[i : i + colonne] for i in range(0, len(file), colonne)]
strisce = [striscia(r) for r in righe]
for i, s in enumerate(strisce, 1):
    s.save(dove / f"striscia-{i}.jpg", quality=88)
w = max(s.width for s in strisce)
foglio = Image.new("RGB", (w, sum(s.height for s in strisce)), "#15132E")
y = 0
for s in strisce:
    foglio.paste(s, (0, y))
    y += s.height
foglio.save(dove / "foglio-schermate.jpg", quality=88)
print(len(file), "schermate,", len(strisce), "strisce,", foglio.size)
