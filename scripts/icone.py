"""Genera le icone PNG della PWA dallo stesso disegno di public/favicon.svg.

Segnaposto fino all'identità visiva (B8): quando arriva il logo vero si
cambia questo disegno e si rilancia `python3 scripts/icone.py`.
"""
from PIL import Image, ImageDraw

NOTTE, ORO, TURCHESE, ORO_CHIARO = (11, 15, 42), (245, 183, 49), (53, 214, 194), (255, 215, 110)


def icona(lato: int, margine: float = 0.0, arrotondata: bool = True) -> Image.Image:
    s = 4  # disegno a 4x e poi riduco: bordi lisci
    L = lato * s
    img = Image.new("RGBA", (L, L), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if arrotondata:
        d.rounded_rectangle([0, 0, L - 1, L - 1], radius=int(L * 14 / 64), fill=NOTTE)
    else:
        d.rectangle([0, 0, L, L], fill=NOTTE)
    k = L / 64 * (1 - 2 * margine)
    o = L * margine
    p = lambda x, y: (o + x * k, o + y * k)
    r = 23 * k
    cx, cy = p(32, 32)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ORO + (155,), width=max(1, int(1.6 * k)))
    d.line([p(32, 13), p(51, 45), p(13, 45), p(32, 13)], fill=TURCHESE, width=max(1, int(2.6 * k)), joint="curve")
    rp = 3.4 * k
    d.ellipse([cx - rp, cy - rp, cx + rp, cy + rp], fill=ORO_CHIARO)
    return img.resize((lato, lato), Image.LANCZOS)


icona(192).save("public/icona-192.png")
icona(512).save("public/icona-512.png")
icona(512, margine=0.12, arrotondata=False).save("public/icona-maschera-512.png")
icona(180, arrotondata=False).save("public/apple-touch-icon.png")
print("icone generate in public/")
