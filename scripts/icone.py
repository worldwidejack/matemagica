"""Le icone dell'app: il gatto approvato (public/personaggi/gatto.webp) su fondo giallo.

Solo ritaglio e composizione su un colore pieno: il disegno non si tocca.
  <python con PIL> scripts/icone.py
"""
from PIL import Image

GIALLO = (255, 210, 31, 255)
gatto = Image.open("public/personaggi/gatto.webp").convert("RGBA")
gatto = gatto.crop(gatto.getbbox())


def icona(lato: int, quanto: float, raggio: float = 0.0) -> Image.Image:
    """`quanto` = altezza del gatto sul lato; `raggio` = angoli tondi (0 = quadrata piena)."""
    S = lato * 4
    img = Image.new("RGBA", (S, S), GIALLO)
    h = int(S * quanto)
    w = int(gatto.width * h / gatto.height)
    g = gatto.resize((w, h), Image.LANCZOS)
    img.alpha_composite(g, ((S - w) // 2, (S - h) // 2 + int(S * 0.02)))
    if raggio:
        from PIL import ImageDraw

        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * raggio), fill=255)
        img.putalpha(m)
    return img.resize((lato, lato), Image.LANCZOS)


icona(192, 0.74, 0.22).save("public/icona-192.png")
icona(512, 0.74, 0.22).save("public/icona-512.png")
icona(512, 0.56).save("public/icona-maschera-512.png")  # zona sicura delle icone «maskable»
icona(180, 0.74).convert("RGB").save("public/apple-touch-icon.png")  # iOS arrotonda da solo
icona(64, 0.8, 0.22).save("public/favicon.png")
icona(1024, 0.72).convert("RGB").save("public/icona-1024.png")  # per lo store
print("icone fatte")
