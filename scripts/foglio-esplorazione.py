"""Foglio numerato dell'esplorazione di stile: una riga per stile, tre pezzi per riga.

Uso: /opt/homebrew/bin/python3.14 scripts/foglio-esplorazione.py docs/grafica/giro-16-10/originali docs/grafica/giro-16-10/foglio-esplorazione.jpg
Nella cartella: mm-s<N><a|b|c>.png (a = sentiero, b = gatto, c = momento di gioco). Se c'è una versione
corretta (mm-s1c2.png) vince quella con il numero più alto.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
STILI = {
    1: "Ligne claire («ora blu»)",
    2: "Cartone buffo e tondo",
    3: "Cartone moderno dipinto",
    4: "Geometria pastello",
    5: "Anni '50 grafico",
    6: "China e tratteggio",
    7: "Notte dipinta",
}
CREMA, INCHIOSTRO, ORO, GRIGIO = (250, 243, 230), (20, 27, 61), (214, 150, 38), (92, 98, 125)
W, M, GAP = 1200, 40, 30
H_ALTA = 560                      # altezza dei pezzi verticali (9:16)
L_ALTA = round(H_ALTA * 941 / 1672)
L_QUADRA = W - 2 * M - 2 * L_ALTA - 2 * GAP


def font(nome, size):
    for p in (f"/System/Library/Fonts/Supplemental/{nome}.ttf", f"/System/Library/Fonts/{nome}.ttc"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default(size)


TITOLO, TESTO, NUMERO, NOME = font("Georgia Bold", 52), font("Avenir Next", 26), font("Georgia Bold", 40), font("Georgia Bold", 34)


def pezzo(n, k):
    """L'ultima versione di mm-s<n><k>*.png."""
    cand = []
    for f in SRC.glob(f"mm-s{n}{k}*.png"):
        m = re.fullmatch(rf"mm-s{n}{k}(\d*)\.png", f.name)
        if m:
            cand.append((int(m.group(1) or 1), f))
    return max(cand)[1] if cand else None


def tondo(im, r=18):
    maschera = Image.new("L", im.size, 0)
    ImageDraw.Draw(maschera).rounded_rectangle((0, 0, *im.size), r, fill=255)
    out = Image.new("RGB", im.size, CREMA)
    out.paste(im, (0, 0), maschera)
    return out


TESTA, RIGA = 190, 70 + H_ALTA + 60
foglio = Image.new("RGB", (W, TESTA + RIGA * len(STILI) + 110), CREMA)
d = ImageDraw.Draw(foglio)
d.text((M, 38), "Matemagica · 7 stili", font=TITOLO, fill=INCHIOSTRO)
d.text((M, 108), "Dimmi i numeri dei pezzi che ti piacciono, anche mescolati", font=TESTO, fill=GRIGIO)
d.text((M, 142), "(es. «il mondo 4a col gatto 2b»), e quelli che non ti dicono niente.", font=TESTO, fill=GRIGIO)

y = TESTA
for n, nome in STILI.items():
    d.line((M, y, W - M, y), fill=(220, 210, 190), width=3)
    d.text((M, y + 18), f"S{n}", font=NOME, fill=ORO)
    d.text((M + 70, y + 18), nome, font=NOME, fill=INCHIOSTRO)
    x, yy = M, y + 70
    for k, (lw, lh) in zip("abc", [(L_ALTA, H_ALTA), (L_QUADRA, L_QUADRA), (L_ALTA, H_ALTA)]):
        f = pezzo(n, k)
        top = yy + (H_ALTA - lh) // 2
        if f:
            foglio.paste(tondo(Image.open(f).convert("RGB").resize((lw, lh), Image.LANCZOS)), (x, top))
        else:
            d.rounded_rectangle((x, top, x + lw, top + lh), 18, outline=GRIGIO, width=2)
        etichetta = f"{n}{k}"
        bx = d.textbbox((0, 0), etichetta, font=NUMERO)
        d.rounded_rectangle((x + 10, top + 10, x + 30 + bx[2], top + 22 + bx[3]), 12, fill=INCHIOSTRO)
        d.text((x + 20, top + 12), etichetta, font=NUMERO, fill=(255, 236, 190))
        x += lw + GAP
    y += RIGA

d.text((M, y + 30), "a = il sentiero · b = il gatto · c = un momento di gioco", font=TESTO, fill=GRIGIO)
OUT.parent.mkdir(parents=True, exist_ok=True)
foglio.save(OUT, quality=88)
print(OUT, foglio.size, f"{OUT.stat().st_size // 1024} KB")
