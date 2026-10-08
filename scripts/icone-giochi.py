"""Ritaglia le icone dipinte dei giochi da un foglio generato (griglia di
medaglioni su fondo magenta #FF00FF) e le salva trasparenti e leggere.

    python3 scripts/icone-giochi.py docs/grafica/icone/foglio-icone.png

Ordine dei medaglioni nel foglio (da sinistra a destra, dall'alto in basso) =
ORDINE qui sotto. Uscita: public/giochi/<id>.webp (256 px, alfa vero).
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ORDINE = ["piu-grande", "coppie", "catena", "stima", "bersaglio", "bilancia", "regola", "quadrato", "misto"]
USCITA = "public/giochi"
LATO = 256


def tratto_piu_lungo(indici):
    """Il tratto contiguo più lungo: il medaglione, non i fili di quelli vicini."""
    migliore, corrente = [], []
    for i in indici:
        corrente = corrente + [i] if corrente and i == corrente[-1] + 1 else [i]
        if len(corrente) > len(migliore):
            migliore = corrente
    return migliore


def magenta(p):
    r, g, b = p[:3]
    return r > 150 and b > 150 and g < 110 and abs(r - b) < 90


def main(percorso: str) -> None:
    im = Image.open(percorso).convert("RGB")
    w, h = im.size
    px = im.load()
    # Maschera: 255 dove NON è magenta.
    m = Image.new("L", (w, h), 0)
    mp = m.load()
    for y in range(h):
        for x in range(w):
            if not magenta(px[x, y]):
                mp[x, y] = 255
    m = m.filter(ImageFilter.MedianFilter(5))

    # Le 9 celle della griglia 3×3: in ognuna il riquadro dei pixel non magenta.
    os.makedirs(USCITA, exist_ok=True)
    for k, gioco in enumerate(ORDINE):
        cx, cy = k % 3, k // 3
        box = (cx * w // 3, cy * h // 3, (cx + 1) * w // 3, (cy + 1) * h // 3)
        cella = m.crop(box)
        cw, ch = cella.size
        cp = cella.load()
        # Righe e colonne "piene" (>8% della cella): i fili dei medaglioni vicini restano fuori.
        col = tratto_piu_lungo([x for x in range(cw) if sum(1 for y in range(ch) if cp[x, y]) > ch * 0.08])
        rig = tratto_piu_lungo([y for y in range(ch) if sum(1 for x in range(cw) if cp[x, y]) > cw * 0.08])
        if not col or not rig:
            print(f"✗ {gioco}: cella vuota")
            continue
        x0, y0, x1, y1 = col[0] + box[0], rig[0] + box[1], col[-1] + 1 + box[0], rig[-1] + 1 + box[1]
        lato = max(x1 - x0, y1 - y0)
        cxm, cym = (x0 + x1) // 2, (y0 + y1) // 2
        q = (cxm - lato // 2, cym - lato // 2, cxm + lato // 2, cym + lato // 2)
        rgb = im.crop(q)
        cerchio = Image.new("L", rgb.size, 0)
        ImageDraw.Draw(cerchio).ellipse((1, 1, rgb.size[0] - 2, rgb.size[1] - 2), fill=255)
        alfa = Image.composite(m.crop(q), Image.new("L", rgb.size, 0), cerchio).filter(ImageFilter.GaussianBlur(1.2))
        # Via il bordino rosa: dove l'alfa è parziale il colore tira al magenta, lo si scurisce verso l'oro.
        rp = rgb.load()
        ap = alfa.load()
        for y in range(rgb.size[1]):
            for x in range(rgb.size[0]):
                if ap[x, y] < 250:
                    r, g, b = rp[x, y]
                    if r > g + 40 and b > g + 40:
                        rp[x, y] = (min(r, 200), max(g, 150), min(b, 90))
        out = rgb.convert("RGBA")
        out.putalpha(alfa)
        out = out.resize((LATO, LATO), Image.LANCZOS)
        dest = f"{USCITA}/{gioco}.webp"
        out.save(dest, "WEBP", quality=85, method=6)
        print(f"✓ {gioco}: {lato}px → {dest} ({os.path.getsize(dest) // 1024} KB)")


if __name__ == "__main__":
    main(sys.argv[1])
