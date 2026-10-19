"""Da un'immagine di ChatGPT su fondo magenta a un asset WebP trasparente per l'app.

Uso:
  /opt/homebrew/bin/python3.14 scripts/asset.py <png> <uscita.webp> [--lato 1000]
  /opt/homebrew/bin/python3.14 scripts/asset.py <png> --griglia 2x2 <a.webp> <b.webp> <c.webp> <d.webp> [--lato 900]
  aggiungi --anteprima <file.jpg> per un controllo su notte, crema e magenta.

Toglie il magenta senza alone (togli_magenta di fogli.py), ritaglia sulla figura con un bordo
sottile e riduce al lato lungo indicato. Stampa la misura finale e il rapporto altezza/larghezza
(serve a src/content/isole.ts).
"""
import argparse
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from fogli import leggi, scatola, togli_magenta  # noqa: E402

BORDO = 6


def pulisci(img: Image.Image, lato: int) -> Image.Image:
    img = togli_magenta(img)
    s = scatola(img, soglia=24)
    if s is None:
        raise SystemExit("immagine vuota dopo aver tolto il magenta")
    x0, y0, x1, y1 = s
    img = img.crop((max(0, x0 - BORDO), max(0, y0 - BORDO), min(img.width, x1 + BORDO), min(img.height, y1 + BORDO)))
    k = min(1.0, lato / max(img.width, img.height))
    if k < 1:
        img = img.convert("RGBa").resize((round(img.width * k), round(img.height * k)), Image.LANCZOS).convert("RGBA")
    return img


def anteprima(imgs: list[Image.Image], dest: Path) -> None:
    fondi = [(10, 19, 77), (250, 243, 230), (255, 0, 255)]
    h = max(i.height for i in imgs)
    w = sum(i.width for i in imgs) + 20 * len(imgs)
    tela = Image.new("RGB", (w, h * 3 + 40), (255, 255, 255))
    for r, f in enumerate(fondi):
        x = 0
        for i in imgs:
            blocco = Image.new("RGB", i.size, f)
            blocco.paste(i, (0, 0), i)
            tela.paste(blocco, (x, r * (h + 20)))
            x += i.width + 20
    tela.thumbnail((2400, 2400))
    tela.save(dest, quality=85)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("sorgente", type=Path)
    p.add_argument("uscite", type=Path, nargs="+")
    p.add_argument("--lato", type=int, default=1000)
    p.add_argument("--griglia", default="")
    p.add_argument("--anteprima", type=Path)
    a = p.parse_args()
    img = leggi(a.sorgente)
    pezzi = [img]
    if a.griglia:
        c, r = (int(n) for n in a.griglia.lower().split("x"))
        cw, ch = img.width // c, img.height // r
        pezzi = [img.crop((x * cw, y * ch, (x + 1) * cw, (y + 1) * ch)) for y in range(r) for x in range(c)]
    if len(pezzi) != len(a.uscite):
        raise SystemExit(f"{len(pezzi)} pezzi ma {len(a.uscite)} uscite")
    puliti = []
    for pezzo, out in zip(pezzi, a.uscite):
        q = pulisci(pezzo, a.lato)
        out.parent.mkdir(parents=True, exist_ok=True)
        q.save(out, "WEBP", quality=86, method=6)
        puliti.append(q)
        print(f"{out}  {q.width}x{q.height}  rapporto {q.height / q.width:.4f}  {out.stat().st_size // 1024} KB")
    if a.anteprima:
        anteprima(puliti, a.anteprima)


if __name__ == "__main__":
    main()
