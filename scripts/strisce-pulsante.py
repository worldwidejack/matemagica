"""Il pulsante della prova B (?sentiero=b): un foglio di 3 stati in fila su magenta
(chiuso, aperto, fatto) diventa la striscia public/paese/seg/pulsante.webp.
Uso: <python con PIL> scripts/strisce-pulsante.py <foglio.png>
Solo scontorno e ritaglio comune ai tre stati: il disegno non si ritocca."""
import json, sys
import numpy as np
from PIL import Image

M = np.array([255, 0, 255], float)
OUT = "public/paese/seg/"
ALT = 200


def chiave(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.clip(np.minimum(r - g, b - g) / 255, 0, 1)
    al = np.clip(1 - (m - 0.12) / 0.20, 0, 1)
    al3 = np.maximum(al, 1e-3)[..., None]
    c = (a - (1 - al3) * M) / al3
    return np.dstack([np.clip(c, 0, 255), al * 255]).astype(np.uint8)


im = chiave(np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(float))
H, W = im.shape[:2]
# I tre oggetti si trovano dalle colonne piene: tre gruppi separati da magenta.
pieno = (im[..., 3] > 40).sum(axis=0) > H * 0.01
gruppi, dentro, x0 = [], False, 0
for x in range(W):
    if pieno[x] and not dentro:
        dentro, x0 = True, x
    if dentro and (not pieno[x] or x == W - 1):
        dentro = False
        if x - x0 > W * 0.05:
            gruppi.append((x0, x))
assert len(gruppi) == 3, f"trovati {len(gruppi)} oggetti, ne servono 3: {gruppi}"
celle = []
for a, b in gruppi:
    c = Image.fromarray(im[:, a:b], "RGBA")
    celle.append(c.crop(c.getchannel("A").point(lambda v: 255 if v > 14 else 0).getbbox()))
# Stessa tela per i tre: appoggiati in basso, centrati.
w, h = max(c.width for c in celle), max(c.height for c in celle)
s = ALT / h
tw = round(w * s)
S = Image.new("RGBA", (tw * 3, ALT))
for k, c in enumerate(celle):
    t = Image.new("RGBA", (w, h))
    t.alpha_composite(c, ((w - c.width) // 2, h - c.height))
    S.paste(t.resize((tw, ALT), Image.LANCZOS), (k * tw, 0))
S.save(OUT + "pulsante.webp", quality=90, method=6)
info = json.load(open(OUT + "seg.json"))
info["pulsante"] = {"w": tw, "h": ALT, "n": 3}
json.dump(info, open(OUT + "seg.json", "w"))
print(info["pulsante"], [c.size for c in celle])
