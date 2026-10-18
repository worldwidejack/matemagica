# Schermate approvate (stile S5)

> 18 ottobre 2026 · approvate da Jack, una per una. Misura 375×812 (render a 3×).
> Flusso di riferimento: `docs/grafica/percorso-ui.md`.

| # | Schermata | File | Nota di Jack |
|---|---|---|---|
| 1 | Benvenuto, il gatto che parla | `01-benvenuto.jpg` | «bellissima»; da rivedere font e testi |
| 2 | Debutto del gioco (il gatto spiega) | `02-debutto.jpg` | ok col gatto sulla nuvoletta e il mondo dietro |
| 3 | Partita arcade, «Chi è più grande?» | `03-partita.jpg` | «impostazione bellissima»; da rifinire font, riquadri, animazione al tocco |
| 4 | Rompicapo, «La Bilancia» (aiuto del gatto) | `04-bilancia.jpg` | come la 3; conterà l'animazione (After Effects) |
| 5 | Fine partita 3★ | `05-fine.jpg` | approvata: è la base dell'animazione |
| 6 | Carta della storia: davanti / dietro | `06a-carta-fronte.jpg`, `06b-carta-retro.jpg` | «bellissime le carte da collezione»; davanti solo arte e nome, si gira, dietro la storia |

## Le regole uscite dal giro

- **Il gatto definitivo** è `gatto-riferimento.webp` (la via di mezzo «più B» tra espressivo ed elegante, scelta il
  18/10). Tutte le pose in `asset/` vengono da quel disegno (Codex, fondo magenta, scontorno da script).
- **Il gatto non vola mai**: poggia sempre su qualcosa. Quando non è su un'isola, **viaggia su una nuvoletta**
  (oggi la `nuvola-1` del sentiero; da disegnare una nuvoletta sua per l'animazione).
- **Mai solo cielo stellato**: in ogni schermata qualcosa del mondo (isola in basso, nuvole ai lati).
- **Cielo più stellato** di prima: `sorgenti/stelle.svg`, uguale in tutte le schermate.
- **Bocca senza bordo chiaro**: il bordo della bocca è blu notte, il naso resta beige.
- **Inquadratura alla Duolingo**: il gatto grande e in primo piano quando parla da solo; piccolo in alto a sinistra,
  col fumetto a fianco, quando c'è del contenuto; fuori campo mentre giochi, e spunta dal bordo solo per reagire.
- **La matematica si scrive dal codice**, mai dentro le immagini generate (le somme sulla lavagna di Gauss sono testo).

## Ancora aperto

- **Font e testi**: a Jack non piacciono (Fraunces + Nunito, battute del gatto). Giro dedicato.
- **Gatto nero su blu notte**: si legge poco. Provati contorno lilla, disco dietro, luce di luna sul bordo:
  nessuno convince. Da riprendere.
- **Icone dei giochi** (`public/giochi/*.webp`): sono ancora dello stile «notte» con mare e paesino (bocciati).
- **Formine della Bilancia**: un po' più vettoriali delle isole dipinte.

## Come si rifanno

`sorgenti/*.html` sono le schermate vere (HTML + CSS con i token dell'app): si aprono in Chrome a 375×812.
Le immagini puntano a `asset/` e a `public/`. Colori, ombre e misure da riprendere quando si scrive il codice.
