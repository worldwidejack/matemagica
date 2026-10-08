"""Trova i dischi di pietra vuoti dentro una scena del sentiero.

    python3 scripts/dischi.py docs/grafica/scene/scena-01-originale.png [--debug out.png]

I dischi sono macchie chiare, calde e poco sature (pietra al tramonto), larghe e
schiacciate (ellissi viste in prospettiva). Stampa i centri in frazioni della
scena (0-1), dal basso verso l'alto: sono le posizioni dei livelli nel gioco.
"""
import json
import sys
from collections import deque

from PIL import Image, ImageDraw, ImageFilter


LISCIO = 14
# area minima di un disco, in frazione dell'immagine (vale per originali e catture)
AREA_MIN = 0.0008


def trova(percorso: str, attesi: int = 5):
    im = Image.open(percorso).convert("RGB")
    W, H = im.size
    px = im.load()
    # Quanto è "liscia" ogni zona: i dischi sono pietra levigata, il selciato e
    # i gradini hanno fughe e bordi. Bordi sfocati = misura di ruvidità locale.
    ruvido = im.convert("L").filter(ImageFilter.FIND_EDGES).filter(ImageFilter.BoxBlur(4)).load()
    chiaro = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            r, g, b = px[x, y]
            mx, mn = max(r, g, b), min(r, g, b)
            # pietra chiara scaldata dal tramonto: luminosa, calda ma poco satura
            # (non le lanterne, troppo sature; non il cielo, blu)
            if r > 195 and g > 160 and b > 120 and 4 < r - b < 130 and (mx - mn) < 0.5 * mx and ruvido[x, y] < LISCIO:
                chiaro[y * W + x] = 1
    visto = bytearray(W * H)
    blob = []
    for y0 in range(H):
        for x0 in range(W):
            i0 = y0 * W + x0
            if not chiaro[i0] or visto[i0]:
                continue
            coda = deque([(x0, y0)])
            visto[i0] = 1
            xs, ys = [], []
            while coda:
                x, y = coda.popleft()
                xs.append(x)
                ys.append(y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < W and 0 <= ny < H:
                        j = ny * W + nx
                        if chiaro[j] and not visto[j]:
                            visto[j] = 1
                            coda.append((nx, ny))
            n = len(xs)
            if n < AREA_MIN * W * H:
                continue
            w = max(xs) - min(xs) + 1
            h = max(ys) - min(ys) + 1
            riemp = n / (w * h)
            # un disco in prospettiva: largo 1,6-4 volte l'altezza, ben pieno (ellisse ≈ 0,78)
            if 1.5 < w / h < 4.5 and riemp > 0.55:
                blob.append({"x": sum(xs) / n / W, "y": sum(ys) / n / H, "r": w / 2 / W, "area": n})
    blob.sort(key=lambda b: -b["area"])
    blob = sorted(blob[:attesi], key=lambda b: -b["y"])
    return im, blob


if __name__ == "__main__":
    im, dischi = trova(sys.argv[1])
    print(json.dumps([{k: round(v, 4) if isinstance(v, float) else v for k, v in d.items()} for d in dischi], indent=1))
    if "--debug" in sys.argv:
        out = sys.argv[sys.argv.index("--debug") + 1]
        d = ImageDraw.Draw(im)
        W, H = im.size
        for i, b in enumerate(dischi):
            x, y, r = b["x"] * W, b["y"] * H, b["r"] * W
            d.ellipse([x - r, y - r / 2.5, x + r, y + r / 2.5], outline=(255, 0, 255), width=5)
            d.text((x - 6, y - 10), str(i + 1), fill=(255, 0, 255))
        im.save(out)
