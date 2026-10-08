"""Prepara le scene del sentiero per il gioco.

Per ogni docs/grafica/scene/scena-NN-originale.webp (illustrazione generata,
941×1672): trova i 5 dischi di pietra (scripts/dischi.py), salva una WebP
leggera in public/scene/scena-NN.webp e scrive src/content/scene.ts con i
centri dei dischi. Le scene mancanti restano fuori: il gioco ripiega su un
cielo stellato.

    python3 scripts/scene.py
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from dischi import trova  # noqa: E402

FONTE = "docs/grafica/scene"
USCITA = "public/scene"
DATI = "src/content/scene.ts"

os.makedirs(USCITA, exist_ok=True)
MANUALI = json.load(open(f"{FONTE}/dischi-manuali.json")) if os.path.exists(f"{FONTE}/dischi-manuali.json") else {}
scene = []
for percorso in sorted(glob.glob(f"{FONTE}/scena-*-originale.webp")):
    n = int(re.search(r"scena-(\d+)", percorso).group(1))
    im, dischi = trova(percorso)
    extra = MANUALI.get(str(n), {}).get("aggiungi", [])
    if extra:
        dischi = sorted(dischi + extra, key=lambda d: -d["y"])
        print(f"  scena {n}: {len(extra)} dischi aggiunti a mano")
    if len(dischi) != 5:
        print(f"✗ scena {n}: trovati {len(dischi)} dischi invece di 5, la salto")
        continue
    dest = f"{USCITA}/scena-{n:02d}.webp"
    im.save(dest, "WEBP", quality=78, method=6)
    kb = os.path.getsize(dest) // 1024
    scene.append({"n": n, "file": f"/scene/scena-{n:02d}.webp", "rapporto": round(im.size[1] / im.size[0], 4),
                  "dischi": [{"x": round(d["x"], 4), "y": round(d["y"], 4), "r": round(d["r"], 4)} for d in dischi]})
    print(f"✓ scena {n}: 5 dischi, {kb} KB")

righe = [
    "// GENERATO da scripts/scene.py: non modificare a mano.",
    "// Una scena per tappa del sentiero; i dischi sono i centri (frazioni 0-1)",
    "// dei 5 dischi di pietra dipinti, dal basso verso l'alto.",
    "export type Disco = { x: number; y: number; r: number };",
    "export type Scena = { n: number; file: string; rapporto: number; dischi: Disco[] };",
    f"export const SCENE: Scena[] = {json.dumps(scene, indent=2, ensure_ascii=False)};",
    "",
]
open(DATI, "w", encoding="utf-8").write("\n".join(righe))
print(f"scritto {DATI}: {len(scene)} scene")
