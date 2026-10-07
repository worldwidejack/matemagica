"""Trasforma un documento per papà (Markdown) in un PDF da stampare.

Papà lavora con carta e penna: margini larghi per scrivere, caratteri grandi,
e in appendice il testo completo delle storie, da controllare sul foglio.

    python3 scripts/pdf-papa.py docs/papa/01-per-papa.md

Usa Chrome in modalità headless (niente dipendenze da installare).
"""
import html
import re
import subprocess
import sys
from pathlib import Path

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def inline(t: str) -> str:
    t = html.escape(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*([^*]+)\*", r"<i>\1</i>", t)
    return t


def md_a_html(md: str) -> str:
    out, lista, tabella, para = [], None, [], []

    def chiudi_para():
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para.clear()

    def chiudi_lista():
        nonlocal lista
        if lista:
            out.append(f"</{lista}>")
            lista = None

    def chiudi_tabella():
        if tabella:
            righe = [r for r in tabella if not re.match(r"^\|[\s\-|]+\|$", r)]
            celle = [[c.strip() for c in r.strip("|").split("|")] for r in righe]
            out.append("<table><tr>" + "".join(f"<th>{inline(c)}</th>" for c in celle[0]) + "</tr>")
            for r in celle[1:]:
                out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
            out.append("</table>")
            tabella.clear()

    for riga in md.splitlines():
        r = riga.rstrip()
        if r.startswith("|"):
            chiudi_para(); chiudi_lista(); tabella.append(r); continue
        chiudi_tabella()
        if not r:
            chiudi_para(); chiudi_lista(); continue
        m = re.match(r"^(#{1,3}) (.*)", r)
        if m:
            chiudi_para(); chiudi_lista()
            n = len(m.group(1))
            out.append(f"<h{n}>{inline(m.group(2))}</h{n}>"); continue
        if r == "---":
            chiudi_para(); chiudi_lista(); out.append("<hr>"); continue
        if r.startswith("> "):
            chiudi_para(); out.append(f"<blockquote>{inline(r[2:])}</blockquote>"); continue
        m = re.match(r"^(\d+)\. (.*)", r)
        if m or r.startswith("- "):
            chiudi_para()
            tipo = "ol" if m else "ul"
            if lista != tipo:
                chiudi_lista(); out.append(f"<{tipo}>"); lista = tipo
            out.append(f"<li>{inline(m.group(2) if m else r[2:])}</li>"); continue
        para.append(r.strip())
    chiudi_para(); chiudi_lista(); chiudi_tabella()
    return "\n".join(out)


def appendice_storie() -> str:
    src = Path("src/content/storie.ts").read_text(encoding="utf-8")
    storie = re.findall(r"carta: '([^']*)',.*?titolo: '([^']*)',\s*testo:\s*((?:'(?:[^'\\]|\\.)*'\s*\+?\s*)+)", src, re.S)
    out = ['<h2 class="nuova-pagina">Appendice — le storie per intero</h2>',
           "<p>Da controllare: fatti, numeri, tono. Si possono riscrivere del tutto.</p>"]
    for carta, titolo, testo in storie:
        pezzi = re.findall(r"'((?:[^'\\]|\\.)*)'", testo)
        t = "".join(pezzi).replace("\\'", "'")
        out.append(f'<div class="storia"><p class="carta">{html.escape(carta)}</p><h3>{html.escape(titolo)}</h3><p>{html.escape(t)}</p></div>')
    return "\n".join(out)


CSS = """
@page { size: A4; margin: 18mm 45mm 18mm 18mm; }
body { font-family: -apple-system, 'Helvetica Neue', sans-serif; font-size: 12.5pt; line-height: 1.5; color: #111; }
h1 { font-size: 24pt; margin: 0 0 4pt; }
h2 { font-size: 16pt; margin: 20pt 0 6pt; border-bottom: 2px solid #f5b731; padding-bottom: 2pt; }
h3 { font-size: 13.5pt; margin: 14pt 0 4pt; }
p, li { margin: 4pt 0; }
code { font-family: Menlo, monospace; font-size: 11pt; background: #f3f0e6; padding: 0 3pt; border-radius: 3pt; }
blockquote { font-size: 15pt; font-weight: bold; border-left: 4px solid #17b5a3; margin: 8pt 0; padding: 4pt 12pt; }
table { border-collapse: collapse; width: 100%; margin: 6pt 0; font-size: 11pt; }
th, td { border: 1px solid #ccc; padding: 4pt 6pt; text-align: left; vertical-align: top; }
th { background: #f6f3ea; }
hr { border: none; border-top: 1px dashed #bbb; margin: 14pt 0; }
h3, li, tr, .storia { break-inside: avoid; }
.nuova-pagina { break-before: page; }
.storia { border: 1px solid #ddd; border-radius: 8pt; padding: 6pt 12pt; margin: 10pt 0; }
.carta { font-size: 9.5pt; letter-spacing: 1pt; text-transform: uppercase; color: #a87a12; margin: 0; }
"""


def main() -> None:
    sorgente = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/papa/01-per-papa.md")
    corpo = md_a_html(sorgente.read_text(encoding="utf-8")) + appendice_storie()
    pagina = f'<!doctype html><html lang="it"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{corpo}</body></html>'
    tmp = sorgente.with_suffix(".html")
    tmp.write_text(pagina, encoding="utf-8")
    pdf = sorgente.with_suffix(".pdf")
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf.resolve()}", tmp.resolve().as_uri()],
                   check=True, capture_output=True)
    tmp.unlink()
    print(f"PDF: {pdf}")


if __name__ == "__main__":
    main()
