# CLAUDE.md — Matemagica

> Leggi questo file all'inizio di ogni sessione, prima di toccare codice.
> Aggiorna "Stato" (qui e in `_STATO.md`) alla fine di ogni sessione, prima del merge.

---

## Stato

**Ripartiti da zero il 7 ottobre 2026**, dopo l'intervista a Jack e papà. Il lavoro
precedente (M0/M1, gioco dei segni) è stato accantonato: resta solo nella storia di git.

- Live: **https://matemagica-teal.vercel.app** (production = `main`)
- Repo: **https://github.com/worldwidejack/matemagica**
- Ogni branch/PR ha il suo **preview deploy** Vercel: è il link da aprire dal telefono prima del merge.

**B1-B7 fatti (7 ottobre 2026), B8 a metà.** Tutti e 7 i giochi, sentiero misto di 40
livelli in 8 tappe, Palestra, collezione di 8 storie, spiegazione al debutto di ogni gioco,
XP/livello giocatore/streak, PWA installabile e offline. Mancano solo identità visiva e nome
definitivo (B8: gusto di Jack e papà).

**Prossimo: il giro con papà.** Il documento è `docs/papa/01-per-papa.md` (+ PDF da stampare).
Le sue risposte entrano in: `src/content/spiegazioni.ts`, `storie.ts`, `sequenze.ts`,
`sentiero.ts` (ordine), e nei generatori se trova trucchi nuovi. Tutti i contenuti con
`autore: 'bozza'` sono di Claude e aspettano lui.

---

## Visione

**Il Duolingo / Candy Crush della matematica.** Super gamificato, giocoso, da telefono.
- **Per tutti**: nessun target. Il gioco capisce il tuo livello e si adatta.
- **Infinito**: sentieri di livelli e giochi che possono andare avanti all'infinito, su
  qualsiasi argomento.
- **Il perché di papà**: in un'epoca con l'AI ovunque, un modo divertente per aprire e
  allenare la mente. Non prepara esami: stimola.

## Ruoli

- **Jack + Claude** costruiscono l'app.
- **Papà** (matematico in pensione) è il riferimento per la matematica e il percorso
  didattico. Lavora con carta e penna.
- **Come si lavora con papà**: niente moduli o template. Claude scrive domande aperte o una
  direzione su cui ragionare (`docs/papa/NN-*.md`, PDF con `python3 scripts/pdf-papa.py <file>`);
  Jack gliele passa; papà risponde come vuole (foto di fogli, voce, testo); Jack porta la
  risposta e Claude la trasforma in contenuti.

## La regola di papà (vale per ogni gioco)

> **Un gioco non deve svuotarsi con un solo trucco.** Deve far pensare anche dopo che hai
> capito il trucco.

Il gioco dei segni è stato buttato per questo (bastava contare i meno). Ogni generatore
smonta i trucchi ovvi e `npm run verifica` li misura su 46.000 quesiti:

| Gioco | Trucco smontato | Misura |
|---|---|---|
| Chi è più grande? | "vince il numero più grosso"; numeri in comune | sbaglia nel 51%; 0% numeri in comune |
| Coppie magiche | "l'ultima coppia è obbligata" | numeri esca in ~99,6% delle griglie (d≥2) |
| Catena | "guardo solo l'ultima operazione" | l'esca del penultimo passo c'è sempre |
| Stima lampo | "la giusta è quella in mezzo"; "guardo l'ultima cifra" | 33/33/34%; opzioni arrotondate |
| Il Numero bersaglio | "sommo tutto"; un'operazione sola | 0% da d≥2; risolutore esaustivo |
| La Bilancia | "la leggo da una bilancia sola" | soluzione unica e incrocio obbligato (forza bruta) |
| Trova la regola | "aggiungo l'ultimo salto" | 100% / 38% / 0% / 0% / 0% per fascia |

## Principi

1. **Ogni sessione finisce online.** Il tempo arriva a raffiche ("quando capita"): mai lasciare
   `main` rotto, blocchi piccoli che si chiudono.
2. **Juice prima di contenuto.** Feedback, suoni, ritmo. Un gioco eccellente batte tre mediocri.
3. **Segnaposto fino a B8.** Forme, colori pieni, emoji. Se non diverte nudo, la grafica non lo salva.
4. **Formato cartuccia** (sotto). Un gioco nuovo costa "un generatore + una vista".
5. **Il successo è "ci piace giocarci"**: Jack e papà lo aprono da soli, non per testarlo.
6. **Idee nuove → `BACKLOG.md`.** Non nell'MVP.

---

## Il formato "cartuccia"

Il **motore** (`src/engine/`) possiede timer, vite, combo, punteggio, suoni, stelle e livello
adattivo, per tutti i giochi. Ogni gioco (`src/games/<id>/`) fornisce solo il contratto in
`src/engine/cartuccia.ts`. Due motori:

- **Arcade** (`ArcadeShell`): `generate`, `View`, `check`, `timeFor`, opzionali `revealFor`
  (fase di rivelazione, Catena) e `roundPerPartita`. La vista può chiamare `onHit` / `onMiss`
  per risposte parziali (le coppie di una griglia).
- **Rompicapo** (`PuzzleShell`): niente timer né vite; `generate`, `View` (chiama `onTry`),
  `check`, `aiuti` (progressivi, costano punti), `soluzione` (il momento "aha").

**Regola pratica:** se stai per scrivere un timer o un contatore di vite in `src/games/*`,
stai sbagliando file.

### Livello adattivo e stelle (`src/engine/regole.ts`)
- Difficoltà continua 0-10. Ogni gioco ha una **bravura** salvata nel profilo.
- Arcade: la partita parte 1 sotto la bravura; giusta → sale (di più se rapida), sbagliata →
  scende di colpo. Errore ogni ~8 quesiti. I passi si allungano per le partite corte
  (`scala = 20 / quesiti`: Coppie ha 5 griglie, Catena 10, Stima 15).
- Rompicapo: risolto pulito → +0,8; con aiuti o sbagli → +0,3; saltato → −1,2.
- A fine partita la bravura va verso la difficoltà più alta raggiunta (−0,5). Nel sentiero
  ogni livello ha una **fascia** (`limiti`): se tocchi il tetto, la bravura non scende.
- **Le stelle non dipendono dal punteggio.** Arcade: ★ metà giuste · ★★ completa · ★★★
  completa con ≤1 errore. Rompicapo: ★ metà risolti · ★★ tutti · ★★★ tutti, senza aiuti, ≤1
  sbaglio.
- Tarato con `npm run simula`: bravura giusta in ~5 partite; stelle ~37% una, ~43% due, ~15% tre.

### Sentiero, sblocchi, collezione
- `src/content/sentiero.ts`: l'ordine dei 40 livelli (lo decide papà). La fascia di un livello
  si calcola dalla k-esima apparizione di quel gioco (parte facile, sale); si può forzare.
- Un livello si apre quando il precedente ha ≥1 stella. Un gioco entra in Palestra quando lo
  incontri in un livello aperto. Calcolato dal profilo (`src/ui/progressi.ts`), niente stato extra.
- Ogni 5 livelli una storia: si sblocca la prima volta che quel livello prende una stella e
  diventa una carta della collezione.

---

## Struttura

```
/src
  App.tsx        → navigazione a pila legata alla cronologia (tasto indietro del telefono)
  /engine        → cartuccia.ts (contratti), regole.ts (punti, stelle, adattivo), caso.ts (rng),
                   partita.ts (tipi comuni), ArcadeShell, PuzzleShell, Pronto, Risultato
  /games
    registro.tsx → i 7 giochi (titolo, icona, motore)
    /_comune     → Tastierino
    /<id>/logica.ts → generatore puro e simulabile;  /<id>/index.tsx → vista + cartuccia
  /content       → sentiero.ts, spiegazioni.ts, storie.ts, sequenze.ts — QUI SCRIVE PAPÀ
  /profilo       → store.ts (zustand + localStorage, v2 con migrazione), progressione.ts
  /ui            → Sentiero, Palestra, Collezione, Schede (spiegazione, storia), Intestazione
  /audio         → sfx.ts (suoni sintetizzati con Web Audio, zero file)
/public          → manifest, icone PWA, sw.js (offline)
/scripts         → simula.ts, verifica.ts, icone.py, pdf-papa.py
/docs/papa       → documenti per papà e le sue risposte
```

I moduli puri (`engine/regole.ts`, `engine/caso.ts`, `games/*/logica.ts`, `content/*`) usano
import relativi con estensione `.ts`: così li legge anche Node per `simula` e `verifica`.
Il resto usa l'alias `@/`.

## Convenzioni

- **TypeScript strict** + `noUncheckedIndexedAccess`. Niente `any`.
- **Tailwind** per il layout; effetti in `src/index.css`. Colori **solo dai token** `@theme`
  (notte, oro, turchese, magenta, pericolo), mai hex sparsi.
- **Mobile-first.** I rompicapo più difficili devono stare in 375×812 senza scorrere.
  Ogni PR si prova dal telefono sul preview deploy prima del merge.
- **Contenuti in italiano.**
- **Dipendenze**: react, zustand (profilo), tailwind. Niente di nuovo senza un motivo scritto
  in "Deviazioni". Router e libreria audio tolti: navigazione a stato e Web Audio bastano.
- Lint: `only-export-components` spenta (ogni file di gioco esporta cartuccia + vista).

Comandi: `npm run dev` · `npm run build` · `npm run lint` · `npm run simula` · `npm run verifica`
· `python3 scripts/pdf-papa.py docs/papa/<file>.md` · `python3 scripts/icone.py`

## Flusso

- Branch + PR anche da soli; ogni PR ha il suo preview deploy.
- Fine sessione: build, lint e `verifica` verdi, prova da telefono, merge, aggiorna Stato qui e
  in `_STATO.md`.

---

## Blocchi dell'MVP

| # | Cosa | Stato |
|---|---|---|
| B1 | Progetto nuovo, motore arcade, profilo, SFX + mute, **Chi è più grande?** | ✅ |
| B2 | Sentiero misto + Palestra + spiegazione/storia + **Coppie magiche** | ✅ |
| B3 | Motore rompicapo + **Il Numero bersaglio** | ✅ |
| B4 | **La Bilancia** | ✅ |
| B5 | **Catena** + **Stima lampo** | ✅ |
| B6 | **Trova la regola** (sequenze di papà) | ✅ (bozze, aspetta papà) |
| B7 | Sentiero completo (40 livelli), collezione, XP/streak | ✅ (ordine e storie da rivedere con papà) |
| B8 | Identità visiva, nome, PWA, caricamento <3 s | ½: PWA + offline + 82 KB gzip fatti; identità e nome da fare |

**Non-goal dell'MVP:** account e login, backend, classifiche, test d'ingresso (rivalutare se
l'inizio annoia), monete/valuta, app nativa, i18n, impostazioni oltre al mute.

---

## Deviazioni dal piano

Se una scelta si rivela sbagliata sul campo, cambiarla è legittimo: annotala qui col perché.

- *(2026-10-07, B1)* Le 3 stelle con "zero errori" erano quasi impossibili (~5% in
  simulazione): portate a "al massimo 1 errore" (~15%).
- *(2026-10-07, B1)* La bravura si aggiorna sulla difficoltà **più alta** raggiunta, non sulla
  media: con la media un giocatore forte impiegava ~15 partite di roba facile.
- *(2026-10-07, B2)* Dopo una partita perfetta in un livello facile la bravura scendeva (la
  fascia tagliava la difficoltà): se tocchi il tetto della fascia, la bravura non scende.
- *(2026-10-07, B2)* Coppie con 5 griglie si adattava 4 volte più piano: passi adattivi scalati
  sul numero di quesiti per partita.
- *(2026-10-07, B5)* Catena e Stima a scelta multipla (4 e 3 opzioni) invece che col
  tastierino: sul telefono, a tempo, il tastierino rallenta più del calcolo.
- *(2026-10-07, B8)* Service worker scritto a mano (40 righe) invece di un plugin PWA: zero
  dipendenze nuove.
