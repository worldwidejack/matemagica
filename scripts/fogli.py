"""Impacchetta un'animazione a scatti in un foglio di fotogrammi WebP per l'app.

Da dove arrivano i fotogrammi:
  - una cartella di PNG con alfa (render di After Effects, disegni ripuliti), in ordine di nome;
  - un foglio a griglia di ChatGPT su fondo magenta (--griglia 4x2): lo taglia e toglie il magenta;
  - un disegno fermo (--tremolio 3): ne fa 3 fotogrammi che tremano come disegnati a mano.

Cosa produce (in src/anim/fogli/): <nome>.webp (il foglio) e <nome>.json (fps, griglia,
misure, peso), poi riscrive src/anim/manifest.ts, che l'app importa. Con --anteprima scrive
anche un foglio di controllo su fondi diversi, per vedere a occhio aloni e tagli.

Uso (serve il Python con Pillow e numpy: /opt/homebrew/bin/python3.14):
  python3.14 scripts/fogli.py render/giusto/ --nome giusto
  python3.14 scripts/fogli.py griglia.png --griglia 4x2 --nome tocco --lato 256
  python3.14 scripts/fogli.py bottone.png --tremolio 3 --nome bottone --loop
  python3.14 scripts/fogli.py --manifest      # rigenera solo manifest.ts dai .json
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RADICE = Path(__file__).resolve().parent.parent
FOGLI = RADICE / "src" / "anim" / "fogli"
MANIFEST = RADICE / "src" / "anim" / "manifest.ts"
BORDO = 2  # px trasparenti attorno a ogni fotogramma: niente sbavature del vicino


# ── Lettura dei fotogrammi ──────────────────────────────────────────────────

def leggi(percorso: Path) -> Image.Image:
    img = Image.open(percorso)
    img.load()
    return img.convert("RGBA")


def togli_magenta(img: Image.Image) -> Image.Image:
    """Fondo magenta (#FF00FF) → trasparente, senza alone rosa sui bordi.

    «Quanto è magenta» = min(R, B) − G. Sopra 0,55 è fondo, sotto 0,25 è disegno, in mezzo
    è bordo: lì si toglie il magenta dal colore (il pixel osservato è disegno + fondo).
    """
    a = np.asarray(img, dtype=np.float32) / 255.0
    rgb, alfa_orig = a[..., :3], a[..., 3]
    m = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    t = np.clip((m - 0.25) / (0.55 - 0.25), 0.0, 1.0)
    alfa = 1.0 - t * t * (3 - 2 * t)  # smoothstep
    alfa[alfa < 0.04] = 0.0
    # pixel = alfa·disegno + (1−alfa)·magenta  →  disegno = (pixel − (1−alfa)·magenta) / alfa
    fondo = np.array([1.0, 0.0, 1.0], dtype=np.float32)
    bordo = (alfa > 0) & (alfa < 1)
    k = alfa[bordo][:, None]
    rgb = rgb.copy()
    rgb[bordo] = np.clip((rgb[bordo] - (1 - k) * fondo) / k, 0.0, 1.0)
    out = np.dstack([rgb, alfa * alfa_orig])
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), "RGBA")


def ha_alfa_vero(img: Image.Image) -> bool:
    return bool((np.asarray(img)[..., 3] < 250).mean() > 0.01)


def taglia_griglia(img: Image.Image, colonne: int, righe: int) -> list[Image.Image]:
    w, h = img.size
    celle = []
    for r in range(righe):
        for c in range(colonne):
            box = (round(c * w / colonne), round(r * h / righe), round((c + 1) * w / colonne), round((r + 1) * h / righe))
            celle.append(img.crop(box))
    return celle


def campiona(pre: np.ndarray, sx: np.ndarray, sy: np.ndarray) -> np.ndarray:
    """Lettura bilineare di un'immagine premoltiplicata in coordinate non intere."""
    h, w = pre.shape[:2]
    x0 = np.clip(np.floor(sx).astype(np.int32), 0, w - 1)
    y0 = np.clip(np.floor(sy).astype(np.int32), 0, h - 1)
    x1, y1 = np.clip(x0 + 1, 0, w - 1), np.clip(y0 + 1, 0, h - 1)
    fx, fy = (sx - np.floor(sx))[..., None], (sy - np.floor(sy))[..., None]
    sopra = pre[y0, x0] * (1 - fx) + pre[y0, x1] * fx
    sotto = pre[y1, x0] * (1 - fx) + pre[y1, x1] * fx
    return sopra * (1 - fy) + sotto * fy


def tremolio(img: Image.Image, n: int, forza: float, seme: int = 7) -> list[Image.Image]:
    """N copie dello stesso disegno spostate da un rumore morbido diverso: il «line boil»."""
    a = np.asarray(img, dtype=np.float32) / 255.0
    pre = np.dstack([a[..., :3] * a[..., 3:], a[..., 3]])
    h, w = a.shape[:2]
    gen = np.random.default_rng(seme)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    passo = 24  # grana del rumore in px: onde larghe, non sgranato
    gh, gw = h // passo + 2, w // passo + 2
    fotogrammi = []
    for _ in range(n):
        spost = []
        for _asse in range(2):
            griglia = Image.fromarray(gen.uniform(-1, 1, (gh, gw)).astype(np.float32), "F")
            spost.append(np.asarray(griglia.resize((w + passo, h + passo), Image.BICUBIC))[:h, :w] * forza)
        out = campiona(pre, np.clip(xx + spost[0], 0, w - 1), np.clip(yy + spost[1], 0, h - 1))
        al = out[..., 3:]
        rgb = np.where(al > 0, out[..., :3] / np.maximum(al, 1e-6), 0)
        fotogrammi.append(Image.fromarray((np.dstack([rgb, al]) * 255 + 0.5).astype(np.uint8), "RGBA"))
    return fotogrammi


# ── Misure comuni, griglia, salvataggio ─────────────────────────────────────

def scatola(img: Image.Image, soglia: int = 8) -> tuple[int, int, int, int] | None:
    al = np.asarray(img)[..., 3] > soglia
    if not al.any():
        return None
    ys, xs = np.where(al)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def centra(fotogrammi: list[Image.Image]) -> list[Image.Image]:
    """Ogni fotogramma col suo disegno al centro (per i fogli di ChatGPT, che non lo tengono fermo)."""
    w = max(f.width for f in fotogrammi)
    h = max(f.height for f in fotogrammi)
    out = []
    for f in fotogrammi:
        s = scatola(f)
        tela = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        if s:
            pezzo = f.crop(s)
            tela.alpha_composite(pezzo, ((w - pezzo.width) // 2, (h - pezzo.height) // 2))
        out.append(tela)
    return out


def ritaglia_insieme(fotogrammi: list[Image.Image]) -> tuple[list[Image.Image], list[str]]:
    """Stesso ritaglio per tutti (l'animazione non balla) e avvisi se un disegno tocca il bordo."""
    avvisi = []
    scatole = []
    for i, f in enumerate(fotogrammi):
        s = scatola(f)
        if s is None:
            continue
        scatole.append(s)
        if s[0] == 0 or s[1] == 0 or s[2] == f.width or s[3] == f.height:
            avvisi.append(f"fotogramma {i + 1}: il disegno tocca il bordo della cella (forse tagliato)")
    if not scatole:
        raise SystemExit("tutti i fotogrammi sono vuoti")
    x0 = min(s[0] for s in scatole)
    y0 = min(s[1] for s in scatole)
    x1 = max(s[2] for s in scatole)
    y1 = max(s[3] for s in scatole)
    return [f.crop((x0, y0, x1, y1)) for f in fotogrammi], avvisi


def riduci(f: Image.Image, lato: int) -> Image.Image:
    """Lato lungo = `lato` px (meno il bordo), su alfa premoltiplicata: niente aloni scuri."""
    k = (lato - 2 * BORDO) / max(f.width, f.height)
    w, h = max(1, round(f.width * k)), max(1, round(f.height * k))
    pre = f.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")
    tela = Image.new("RGBA", (w + 2 * BORDO, h + 2 * BORDO), (0, 0, 0, 0))
    tela.paste(pre, (BORDO, BORDO))
    return tela


def impagina(fotogrammi: list[Image.Image]) -> tuple[Image.Image, int, int]:
    n = len(fotogrammi)
    w, h = fotogrammi[0].size
    colonne = math.ceil(math.sqrt(n * h / w))
    colonne = max(1, min(n, colonne))
    righe = math.ceil(n / colonne)
    foglio = Image.new("RGBA", (colonne * w, righe * h), (0, 0, 0, 0))
    for i, f in enumerate(fotogrammi):
        foglio.paste(f, ((i % colonne) * w, (i // colonne) * h))
    return foglio, colonne, righe


def anteprima(fotogrammi: list[Image.Image], dest: Path) -> None:
    """Striscia di controllo: i fotogrammi su magenta, su notte e su crema."""
    w, h = fotogrammi[0].size
    fondi = [(255, 0, 255), (11, 15, 42), (250, 243, 230)]
    tela = Image.new("RGB", (w * len(fotogrammi), h * len(fondi)))
    for r, colore in enumerate(fondi):
        for i, f in enumerate(fotogrammi):
            cella = Image.new("RGBA", (w, h), colore + (255,))
            cella.alpha_composite(f)
            tela.paste(cella.convert("RGB"), (i * w, r * h))
    tela.save(dest)


# ── Manifest per l'app ──────────────────────────────────────────────────────

def identificatore(nome: str) -> str:
    return "foglio_" + re.sub(r"[^a-zA-Z0-9]", "_", nome)


def scrivi_manifest() -> None:
    voci = sorted((json.loads(p.read_text()) for p in FOGLI.glob("*.json")), key=lambda v: v["nome"])
    righe = [
        "// GENERATO da scripts/fogli.py: non modificarlo a mano, si riscrive a ogni foglio nuovo.",
        "// Ogni voce è un'animazione a scatti: un foglio WebP con i fotogrammi in griglia.",
        "",
    ]
    for v in voci:
        righe.append(f"import {identificatore(v['nome'])} from './fogli/{v['nome']}.webp';")
    righe += [
        "",
        "export type Foglio = {",
        "  url: string;",
        "  fps: number;",
        "  fotogrammi: number;",
        "  colonne: number;",
        "  righe: number;",
        "  /** misure di un fotogramma, in px del foglio */",
        "  w: number;",
        "  h: number;",
        "  loop: boolean;",
        "  /** peso del foglio */",
        "  kb: number;",
        "};",
        "",
        "export const FOGLI = {",
    ]
    for v in voci:
        righe.append(
            f"  '{v['nome']}': {{ url: {identificatore(v['nome'])}, fps: {v['fps']}, fotogrammi: {v['fotogrammi']}, "
            f"colonne: {v['colonne']}, righe: {v['righe']}, w: {v['w']}, h: {v['h']}, "
            f"loop: {'true' if v['loop'] else 'false'}, kb: {v['kb']} }},"
        )
    righe += ["} satisfies Record<string, Foglio>;", "", "export type NomeFoglio = keyof typeof FOGLI;", ""]
    MANIFEST.write_text("\n".join(righe))
    totale = sum(v["kb"] for v in voci)
    print(f"manifest: {len(voci)} fogli, {totale:.1f} KB in tutto → {MANIFEST.relative_to(RADICE)}")


# ── Main ────────────────────────────────────────────────────────────────────

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("sorgente", nargs="?", type=Path, help="cartella di PNG, foglio a griglia o disegno fermo")
    p.add_argument("--nome", help="nome dell'animazione nell'app (minuscole e trattini)")
    p.add_argument("--fps", type=int, default=12, help="fotogrammi al secondo (12 = a scatti, come un cartone)")
    p.add_argument("--lato", type=int, default=320, help="lato lungo di un fotogramma in px (320 ≈ 160 px a 2x)")
    p.add_argument("--qualita", type=int, default=82, help="qualità WebP 0-100")
    p.add_argument("--loop", action="store_true", help="si ripete all'infinito (idle, tremolio)")
    p.add_argument("--griglia", help="COLONNExRIGHE: la sorgente è un foglio a griglia (di ChatGPT)")
    p.add_argument("--magenta", action="store_true", help="togli il fondo magenta (automatico se manca l'alfa)")
    p.add_argument("--centra", action="store_true", help="metti ogni disegno al centro della sua cella")
    p.add_argument("--salta", default="", help="fotogrammi da buttare, numerati da 1 (es. 3,7)")
    p.add_argument("--tremolio", type=int, default=0, help="da un disegno fermo: N fotogrammi che tremano")
    p.add_argument("--forza", type=float, default=2.5, help="ampiezza del tremolio in px della sorgente")
    p.add_argument("--anteprima", action="store_true", help="scrive <nome>-controllo.png accanto alla sorgente")
    p.add_argument("--manifest", action="store_true", help="rigenera solo src/anim/manifest.ts")
    a = p.parse_args()

    FOGLI.mkdir(parents=True, exist_ok=True)
    if a.manifest:
        scrivi_manifest()
        return
    if not a.sorgente or not a.nome:
        p.error("servono la sorgente e --nome")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.nome):
        p.error("--nome: solo minuscole, cifre e trattini (es. livello-finito)")

    if a.sorgente.is_dir():
        fotogrammi = [leggi(f) for f in sorted(a.sorgente.glob("*.png"))]
        if not fotogrammi:
            raise SystemExit(f"nessun PNG in {a.sorgente}")
    else:
        img = leggi(a.sorgente)
        if a.magenta or not ha_alfa_vero(img):
            img = togli_magenta(img)
        if a.griglia:
            colonne, righe = (int(x) for x in a.griglia.lower().split("x"))
            fotogrammi = taglia_griglia(img, colonne, righe)
        elif a.tremolio:
            fotogrammi = tremolio(img, a.tremolio, a.forza)
        else:
            fotogrammi = [img]
    if a.sorgente.is_dir() and (a.magenta or not ha_alfa_vero(fotogrammi[0])):
        fotogrammi = [togli_magenta(f) for f in fotogrammi]

    via = {int(x) for x in a.salta.split(",") if x.strip()}
    fotogrammi = [f for i, f in enumerate(fotogrammi, 1) if i not in via]
    if a.centra:
        fotogrammi = centra(fotogrammi)
    fotogrammi, avvisi = ritaglia_insieme(fotogrammi)
    fotogrammi = [riduci(f, a.lato) for f in fotogrammi]
    foglio, colonne, righe = impagina(fotogrammi)

    dest = FOGLI / f"{a.nome}.webp"
    foglio.save(dest, "WEBP", quality=a.qualita, alpha_quality=90, method=6, exact=False)
    kb = round(dest.stat().st_size / 1024, 1)
    w, h = fotogrammi[0].size
    meta = {
        "nome": a.nome,
        "fps": a.fps,
        "fotogrammi": len(fotogrammi),
        "colonne": colonne,
        "righe": righe,
        "w": w,
        "h": h,
        "loop": a.loop or bool(a.tremolio),
        "kb": kb,
    }
    (FOGLI / f"{a.nome}.json").write_text(json.dumps(meta, indent=1) + "\n")
    print(f"{a.nome}: {len(fotogrammi)} fotogrammi {w}×{h} in {colonne}×{righe}, {kb} KB → {dest.relative_to(RADICE)}")
    for av in avvisi:
        print("  attenzione:", av, file=sys.stderr)
    if a.anteprima:
        controllo = a.sorgente.with_name(f"{a.nome}-controllo.png") if not a.sorgente.is_dir() else a.sorgente / f"{a.nome}-controllo.png"
        anteprima(fotogrammi, controllo)
        print("  controllo:", controllo)
    scrivi_manifest()


if __name__ == "__main__":
    main()
