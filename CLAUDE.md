# CLAUDE.md — contesto di progetto

> Leggi questo file **all'inizio di ogni sessione**, prima di toccare codice.
> Aggiorna la sezione "Stato" **alla fine di ogni sessione**, prima del merge.

---

## Stato

**Milestone corrente: M0 — COMPLETATA.** Criterio di uscita verificato.

- Live: **https://matemagica-teal.vercel.app** (production, `main`)
- Repo: **https://github.com/worldwidejack/matemagica** (pubblico)
- Clone locale: `~/Desktop/JACK/_GITHUB/matemagica`
- Vercel: progetto `matemagica`, preset Vite, root `./`. Ogni push su `main`
  ridispiega; ogni branch/PR ottiene il suo **preview deploy** — è il link da
  aprire dal telefono prima del merge.

Fatto: scaffold Vite+React+TS+Tailwind, struttura cartelle, contratti di tipo
(`MiniGame`, `World`, `Progress`), contenuti statici dei 2 mondi + 1 lore,
pagina hello mobile-first, repo su GitHub.

**M1 — COMPLETATA.** `GameShell` (timer, 3 vite, combo, punteggio, feedback,
schermata risultato con stelle) + cartuccia `segni` nel formato `MiniGame`.
Si gioca sull'URL pubblico, da telefono.

Prossimo: **M2 — mappa, progressione, persistenza `localStorage`, primi SFX**.
Da lì parte l'auto-test continuo (§1.5): se non ti scappa "ancora una partita",
si itera sul juice prima di andare avanti.

Aperto / da decidere:
- Il nome "Matemagica" è **provvisorio** (il naming è un task di M4).
- Il record è tenuto in memoria React: si azzera al reload. La persistenza vera
  (`localStorage`) è M2, per piano — non anticiparla di nascosto.
- `starThresholds` del mondo 2 sono ancora `[0,0,0]`: da tarare in M3.
- Nessun suono: gli SFX sono M2.

---

## Visione

Gioco web di allenamento matematico mentale: *"Duolingo per il cervello
matematico"*, ma con l'USP nella **giocosità pura** — dopamina, arcade, juice —
**non** nella serietà educativa.

Direzione visiva: mondo geometrico-magico, palette notturna con oro e turchese.
Ispirazione atmosferica, **zero IP di terzi**.

Caso d'uso reale: il telefono, in piedi, in fila alla posta, 90 secondi.

---

## Principi non negoziabili

1. **Ogni sessione finisce deployata.** Mai lasciare `main` rotto: il tempo
   arriva a raffiche irregolari e un progetto rotto non viene più riaperto.
2. **Juice prima di contenuto.** Un minigioco eccellente batte tre mediocri.
   Il tempo si spende su feedback, suoni, ritmo — non su copertura di argomenti.
3. **Placeholder-first.** Forme geometriche, colori pieni ed emoji fino a M4.
   Se il gioco non è divertente "nudo", gli asset non lo salveranno.
4. **Formato cartuccia.** Vedi sotto. È l'investimento che rende il mondo 3+
   quasi gratis.
5. **Il backlog è sacro e chiuso.** Ogni idea nuova → una riga in `BACKLOG.md`.
   Zero eccezioni, zero deroghe all'MVP.

---

## Il formato "cartuccia" (decisione architetturale centrale)

Il `GameShell` (`src/shell/`) possiede timer, 3 vite, combo, punteggio, suoni,
schermata risultato e assegnazione stelle. Ogni minigioco (`src/games/<id>/`)
implementa solo l'interfaccia `MiniGame` in `src/shell/types.ts`:
`generateRound`, `RoundView`, `checkAnswer`, `difficultyCurve`.

**Regola pratica:** se stai per scrivere un timer o un contatore di vite dentro
`src/games/*`, stai sbagliando file.

Conseguenza: migliorare il juice nel guscio migliora tutti i giochi insieme, e
un mondo nuovo costa "una `generateRound` + una view".

---

## Struttura

```
/src
  /shell     → GameShell: timer, vite, combo, punteggio, feedback, risultato
  /games
    /segni     → cartuccia 1 — regola dei segni (M1)
    /quadrato  → cartuccia 2 — quadrato magico 3x3 (M3)
  /map       → mappa mondi, nodi, sblocchi (M2)
  /lore      → schermate fun-fact (M3)
  /state     → store progressione + persistenza localStorage (M2)
  /audio     → wrapper Howler, registry SFX (M2)
  /content   → worlds.ts, lore.ts — dati dichiarativi, non codice
/public/assets → immagini e suoni, prodotti in M4
```

---

## Convenzioni

- **TypeScript strict** (più `noUncheckedIndexedAccess`). I tipi sono la rete di
  sicurezza tra sessioni distanti settimane: non aggirarli con `any`.
- **Tailwind** per il layout; CSS custom (`src/index.css`) per gli effetti juice.
  I colori passano **sempre** dai token in `@theme`, mai hex sparsi nel codice.
- **Import con alias `@/`** (`@/shell/types`), mai `../../..`.
- **Niente nuove dipendenze senza un motivo scritto** qui sotto, in "Deviazioni".
- **Mobile-first, sempre.** Ogni PR si prova **dal telefono** sul preview deploy
  Vercel prima del merge. Il desktop non è il device di riferimento.
- **Contenuti in italiano.** Niente i18n nell'MVP.

Dipendenze attuali e perché: `react-router-dom` (3 route: mappa, gioco, lore),
`zustand` (store progressione), `howler` (SFX affidabili su mobile browser),
`tailwindcss` (velocità di iterazione).

---

## Flusso di lavoro

- Si lavora **a branch + PR** anche da soli: ogni PR ha il suo preview deploy.
- Non si apre la milestone successiva se il criterio di uscita della corrente
  non è verificato.
- A fine sessione: merge, deploy verde, aggiorna "Stato" qui sopra.

Comandi: `npm run dev` · `npm run build` · `npm run preview` · `npm run lint`

---

## Milestone

| # | Cosa | Criterio di uscita |
|---|---|---|
| M0 | Fondazioni: scaffold, repo, Vercel, hello page | URL pubblico che si apre dal telefono ✅ |
| M1 | `GameShell` + cartuccia "regola dei segni" | Si gioca sull'URL pubblico, con punteggio e stelle |
| M2 | Mappa, progressione, `localStorage`, primi SFX | Gioco → stelle → reload → stelle ancora lì. E "suona" |
| M3 | Cartuccia "quadrato magico" + nodo lore + sblocco mondo 2 | Due mondi in sequenza con lore nel mezzo |
| M4 | Asset pass: style bible, produzione, naming, logo | Identità visiva addosso, layout invariato |
| M5 | Rifinitura: juice finale, PWA, perf <3s, analytics | Checklist DoD tutta verde |
| M6 | Playtest con 5 persone | Decisione documentata in `BACKLOG.md` |

**Definition of Done dell'MVP** — si spedisce quando *tutte* sono vere:
mappa navigabile con 2 mondi + nodi lore · minigioco 1 completo di juice ·
minigioco 2 idem · 1 schermata lore · progressione persistente al reload ·
giocabile bene da telefono · nessun vicolo cieco · caricamento <3s su rete
mobile · deployato su Vercel · eventi analytics attivi · toggle audio.

**Non-goals espliciti:** account e login, classifiche, terzo mondo, app nativa,
streak e notifiche, impostazioni oltre al mute, i18n, backend di qualunque tipo,
animazioni cinematiche sulla mappa, monete/valuta.

---

## Deviazioni dal piano

Se una scelta del piano si rivela sbagliata sul campo, cambiarla è legittimo:
**annota qui la deviazione e il perché**, così questo file resta la mappa del
territorio reale e non delle intenzioni.

- *(2026-08-23, M0)* Tailwind v4 con plugin `@tailwindcss/vite` invece della
  vecchia config PostCSS: è il setup corrente supportato, meno file di config.
- *(2026-08-23, M1)* Soglie stelle del mondo 1 tarate su **4000 partite
  simulate** invece che a occhio: `[1200, 4500, 12000]`. Con la curva attuale
  una prima partita mediana fa ~1500 (1 stella), chi ci ha preso la mano ~5800
  (2 stelle), 3 stelle richiedono una partita davvero buona. Da riverificare con
  giocatori veri in M6: la simulazione modella il tempo di reazione, non la
  fatica mentale.
- *(2026-08-23, M0)* Aggiunto `noUncheckedIndexedAccess` oltre a `strict`: con
  settimane di pausa tra le sessioni, gli accessi ad array non controllati sono
  la classe di bug più probabile.
