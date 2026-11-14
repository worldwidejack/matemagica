"""Icona e schermata d'avvio del guscio iOS, dallo stesso disegno delle icone PWA (scripts/icone.py).

Segnaposto fino all'identità visiva: quando cambia il disegno in icone.py, si rilancia questo.
  ~/Desktop/JACK/_GITHUB/jackos-lab/progetti/fenaki/.venv/bin/python scripts/icona-ios.py
Icona: 1024×1024 opaca, quadrata (iOS la arrotonda da solo). Avvio: la stessa icona al centro
sulla notte del paese (#0a134d, come capacitor.config.json e il manifest).
"""
from pathlib import Path
from PIL import Image

src = Path(__file__).with_name("icone.py").read_text()
exec(src.split("\nicona(192)")[0])  # prende solo il disegno (icona, colori), non salva le icone PWA

RES = Path("ios/App/App/Assets.xcassets")
BG = (0x0A, 0x13, 0x4D)

# Il disegno ha il fondo NOTTE (11,15,42): lo uso così com'è, opaco.
icona(1024, arrotondata=False).convert("RGB").save(RES / "AppIcon.appiconset/AppIcon-512@2x.png")

lato = 2732
avvio = Image.new("RGB", (lato, lato), BG)
centro = icona(640, arrotondata=True)
avvio.paste(centro, ((lato - 640) // 2, (lato - 640) // 2), centro)
for nome in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
    avvio.save(RES / "Splash.imageset" / nome)
print("icona e avvio scritti in", RES)
