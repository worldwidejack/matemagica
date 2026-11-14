"""I cinque livelli di ogni luogo, misurati sul disegno.

Uso (col Python che ha PIL e numpy, es. il venv di Fenaki):
  python scripts/nodi-luoghi.py <cartella coi luogo-N.png> [--foglio controllo.jpg]

Segue il sentiero chiaro dal basso verso l'alto (riga per riga, la striscia color crema che
tocca quella della riga sotto), poi mette cinque punti a distanza regolare fra il basso e la
porta del monumento. Stampa le righe pronte per src/content/luoghi.ts e, con --foglio, un
foglio di controllo coi punti disegnati sopra e il taglio di un telefono stretto.
Non tocca i disegni: li legge soltanto.
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

# Dove sta il 1° livello (sopra il pulsante in basso) e quanto sotto la porta si ferma il 5°.
Y_PRIMO = 0.835
SOTTO_LA_PORTA = 0.018
# Il sentiero non si cerca più su di così: oltre c'è il monumento.
Y_TETTO = 0.36
# Dove il monumento è chiaro come il sentiero (l'anello del luogo 6) il tetto si dice a mano.
TETTI = {6: 0.432}


def crema(img: Image.Image) -> np.ndarray:
    a = np.asarray(img.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 232) & (g > 212) & (b > 145) & (b < 236) & (r - b > 18)


def strisce(riga: np.ndarray) -> list[tuple[int, int]]:
    """Le strisce di pixel chiari di una riga: (inizio, fine escluso)."""
    d = np.diff(np.concatenate(([0], riga.astype(int), [0])))
    return list(zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)))


def sentiero(m: np.ndarray, tetto: float = Y_TETTO) -> dict[int, float]:
    """Il centro del sentiero per riga, dal basso fin dove arriva."""
    h, w = m.shape
    y = int(h * 0.97)
    prima = max(strisce(m[y]), key=lambda s: s[1] - s[0])
    centri = {y: (prima[0] + prima[1]) / 2}
    while y > int(h * tetto):
        y -= 1
        vicine = [s for s in strisce(m[y]) if s[1] - s[0] >= 6 and min(s[1], prima[1]) - max(s[0], prima[0]) > 0]
        if not vicine:
            break
        prima = max(vicine, key=lambda s: min(s[1], prima[1]) - max(s[0], prima[0]))
        centri[y] = (prima[0] + prima[1]) / 2
    return centri


def nodi(img: Image.Image, tetto: float = Y_TETTO) -> list[tuple[float, float]]:
    m = crema(img)
    h, w = m.shape
    c = sentiero(m, tetto)
    cima = min(c) / h + SOTTO_LA_PORTA
    out = []
    for k in range(5):
        fy = Y_PRIMO + (cima - Y_PRIMO) * k / 4
        y = min(c, key=lambda r: abs(r - fy * h))
        # media su una fascia sottile: il centro non salta sui bordi frastagliati
        fascia = [c[r] for r in range(y - 6, y + 7) if r in c]
        out.append((round(sum(fascia) / len(fascia) / w, 3), round(fy, 3)))
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("cartella", type=Path)
    p.add_argument("--foglio", type=Path)
    a = p.parse_args()

    tessere = []
    for n in range(1, 9):
        f = a.cartella / f"luogo-{n}.png"
        if not f.exists():
            print(f"// luogo {n}: manca {f.name}")
            continue
        img = Image.open(f).convert("RGB")
        pts = nodi(img, TETTI.get(n, Y_TETTO))
        print(f"// luogo {n}")
        print("nodi: [" + ", ".join(f"{{ x: {x}, y: {y} }}" for x, y in pts) + "],")
        if a.foglio:
            t = img.resize((512, 768), Image.LANCZOS)
            d = ImageDraw.Draw(t)
            # il taglio a 375 di larghezza con 690 d'altezza utile: resta l'81,5% centrale
            for fx in (0.0925, 0.9075):
                d.line([(fx * 512, 0), (fx * 512, 768)], fill=(255, 0, 255), width=2)
            for k, (x, y) in enumerate(pts):
                cx, cy, r = x * 512, y * 768, 20
                d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 210, 31), outline=(21, 19, 46), width=3)
                d.text((cx - 4, cy - 6), str(k + 1), fill=(21, 19, 46))
            tessere.append(t)
    if a.foglio and tessere:
        col = 4
        righe = (len(tessere) + col - 1) // col
        tela = Image.new("RGB", (col * 512, righe * 768), (255, 255, 255))
        for i, t in enumerate(tessere):
            tela.paste(t, ((i % col) * 512, (i // col) * 768))
        tela.save(a.foglio, quality=85)
        print(f"foglio: {a.foglio}")


if __name__ == "__main__":
    main()
