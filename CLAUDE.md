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

**B1 — fatto.** Progetto nuovo, motore arcade, profilo salvato nel telefono (XP, livello
giocatore, streak, bravura per gioco, record, stelle), suoni sintetizzati + mute, primo gioco
**Chi è più grande?**. Verificato: partita → reload → tutto ancora lì.

Prossimo: **B2** — sentiero misto + Palestra + schermate spiegazione/storia + **Coppie magiche**.
In parallelo papà risponde al primo lotto di domande (`docs/papa/01-domande.md`).

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
  direzione su cui ragionare (`docs/papa/NN-*.md`); Jack gliele passa; papà risponde come vuole
  (foto di fogli, voce, testo); Jack porta la risposta e Claude la trasforma in contenuti.

## La regola di papà (vale per ogni gioco)

> **Un gioco non deve svuotarsi con un solo trucco.** Deve far pensare anche dopo che hai
> capito il trucco.

Il gioco dei segni è stato buttato per questo (bastava contare i meno). In pratica: ogni
generatore smonta i trucchi ovvi, e `npm run simula` misura quanto spesso il trucco
fallirebbe (es. in *Chi è più grande?* il trucco "vince il numero più grosso" sbaglia nel ~50%
dei quesiti, e non ci sono mai numeri in comune tra le due espressioni).

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
`src/engine/cartuccia.ts`: `generate(difficoltà, rng)`, `View`, `check`, `timeFor`
(+ `revealFor` opzionale). Previsti da subito: `onHit` per i quesiti a più risposte (Coppie)
e la fase di rivelazione (Catena).

**Regola pratica:** se stai per scrivere un timer o un contatore di vite in `src/games/*`,
stai sbagliando file.

Due motori: **arcade** (`ArcadeShell`, fatto) e **rompicapo** (B3: niente timer, punteggio da
tentativi e aiuti). Stessa schermata risultato, stesse stelle.

### Livello adattivo e stelle (`src/engine/regole.ts`)
- Difficoltà continua 0-10. Ogni gioco ha una **bravura** salvata nel profilo.
- La partita parte 1 punto sotto la bravura (riscaldamento); giusta → sale un po' (di più se
  rapida), sbagliata → scende di colpo. Equilibrio: un errore ogni ~8 quesiti.
- A fine partita la bravura va verso la difficoltà più alta raggiunta (−0,5).
- Partita = 20 quesiti o 3 vite. **Le stelle non dipendono dal punteggio** ma da come giochi al
  tuo livello: ★ almeno 10 giuste · ★★ partita completa · ★★★ completa con al massimo 1 errore.
  Così un principiante e un matematico possono fare 3 stelle entrambi.
- Tarato con `npm run simula` (giocatori finti di bravura 1-9): bravura giusta in ~5 partite;
  stelle ~37% una, ~43% due, ~15% tre.

---

## Struttura

```
/src
  /engine        → motore: cartuccia.ts (contratto), regole.ts (punti, stelle, adattivo),
                   caso.ts (rng), ArcadeShell.tsx, Risultato.tsx
  /games
    registro.tsx → tutti i giochi; quelli senza Play sono "in arrivo"
    /piu-grande  → logica.ts (pura, simulabile) + index.tsx (vista + cartuccia)
  /profilo       → store.ts (zustand + localStorage), progressione.ts (XP, gradi, streak)
  /audio         → sfx.ts (suoni sintetizzati con Web Audio, zero file)
/scripts/simula.ts → partite simulate per tarare i numeri
/docs/papa       → domande e spunti per papà, e le sue risposte
```

I moduli puri (`regole.ts`, `caso.ts`, `games/*/logica.ts`) usano import relativi con
estensione `.ts`: così li legge anche Node per `npm run simula`. Il resto usa l'alias `@/`.

## Convenzioni

- **TypeScript strict** + `noUncheckedIndexedAccess`. Niente `any`.
- **Tailwind** per il layout; effetti in `src/index.css`. Colori **solo dai token** `@theme`
  (notte, oro, turchese, magenta, pericolo), mai hex sparsi.
- **Mobile-first.** Ogni PR si prova dal telefono sul preview deploy prima del merge.
- **Contenuti in italiano.**
- **Dipendenze**: react, zustand (profilo), tailwind. Niente di nuovo senza un motivo scritto
  in "Deviazioni". Router e libreria audio tolti: navigazione a stato e Web Audio bastano.
- Lint: restano 2 avvisi "only-export-components" (registro e cartuccia esportano oggetti):
  toccano solo l'hot reload in sviluppo, accettati.

Comandi: `npm run dev` · `npm run build` · `npm run lint` · `npm run simula`

## Flusso

- Branch + PR anche da soli; ogni PR ha il suo preview deploy.
- Fine sessione: build e lint verdi, prova da telefono, merge, aggiorna Stato qui e in `_STATO.md`.

---

## Blocchi dell'MVP

| # | Cosa | Uscita |
|---|---|---|
| B1 | Progetto nuovo, motore arcade, profilo, SFX + mute, **Chi è più grande?** | ✅ partita → reload → tutto lì |
| B2 | Sentiero misto + Palestra + spiegazione/storia + **Coppie magiche** | sentiero di ~8 livelli con 2 giochi |
| B3 | Motore rompicapo + **Il Numero bersaglio** | primo rompicapo nel sentiero |
| B4 | **La Bilancia** | |
| B5 | **Catena** + **Stima lampo** | 4 arcade |
| B6 | **Trova la regola** (sequenze di papà) | 7 giochi |
| B7 | Sentiero completo (~40 livelli, ordine di papà), collezione = storie di papà | MVP completo "nudo" |
| B8 | Identità visiva, nome, PWA, caricamento <3 s | ci piace giocarci |

**I 7 giochi.** Arcade: *Chi è più grande?* (due espressioni, tocca la maggiore) · *Coppie
magiche* (griglia, coppie che fanno 10 / 100 / ×=24) · *Catena* (operazioni che scorrono,
alla fine "quanto fa?") · *Stima lampo* (38×21 ≈ ?, tre opzioni). Rompicapo: *Il Numero
bersaglio* (combina i numeri per arrivare al bersaglio) · *La Bilancia* (quanto pesa ogni
forma: algebra senza lettere) · *Trova la regola* (sequenze, scopri la regola).

**Struttura del gioco.** Sentiero **misto** per default (si alternano argomenti e giochi, per
non annoiare); **Palestra** per chi vuole un gioco solo, a oltranza. Spiegazione breve quando
arriva un gioco nuovo; storia di papà come premio, che diventa una carta della collezione.
Gamification: stelle, XP e livello giocatore, streak, collezione.

**Non-goal dell'MVP:** account e login, backend, classifiche, test d'ingresso (rivalutare se
l'inizio annoia), monete/valuta, app nativa, i18n, impostazioni oltre al mute.

---

## Deviazioni dal piano

Se una scelta si rivela sbagliata sul campo, cambiarla è legittimo: annotala qui col perché.

- *(2026-10-07, B1)* Le 3 stelle con "zero errori" erano quasi impossibili (~5% in
  simulazione): portate a "al massimo 1 errore" (~15%).
- *(2026-10-07, B1)* La bravura si aggiorna sulla difficoltà **più alta** raggiunta, non sulla
  media: con la media un giocatore forte impiegava ~15 partite di roba facile.
