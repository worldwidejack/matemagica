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

**PR aperte, nessuna su `main`:** #3 grafica «ora blu» (stile scelto da Jack l'8/10 dopo 20
proposte: ligne claire + paesino mediterraneo al tramonto, riferimento in
`docs/grafica/RIFERIMENTO-…` su quel branch), #4 notte dell'8/10 (profilo, medaglie, sfida del
giorno, Quadrato magico…), **#5 animazioni a scatti** (15/10, questo branch). Su `main` i colori
Tailwind sui `<button>` vengono ignorati (`button { color: inherit }` fuori da `@layer`): in #3
è già sistemato con `@layer base`.

**Identità e animazioni (15 ottobre 2026).** Jack vuole che l'app sia unica per le animazioni:
al tocco forme che si animano fotogramma per fotogramma, cartoon, amichevoli, UI cozy. Fatto il
motore (sotto). Giro 1 (4 direzioni dentro «ora blu»: maiolica, forme anni '50, rubber hose, filo
di luce; 4 mascotte: gatto, gatto mago, polpo, geco) **bocciato**: «il mare non c'entra con la
magia; mi piace lo stile alla Kiki's Delivery Service, ma è troppo normale; la scalinata dovrebbe
portare a qualcosa sopra le nuvole, così all'inizio non lo vedi». Giro 2 (`foglio-scelta-2-nuvole.jpg`):
stesso stile Ghibli, si parte da una valle di montagna, la scala sale e sparisce nelle nuvole, la
cima si scopre solo al livello 40 (le nuvole si aprono a ogni tappa; dopo la cima la scala
continua tra le stelle). Bocciato anche questo: «non mi piacciono le scalinate». **Cambio di metodo** (proposto da Jack):
prima una ricerca di reference, poi i disegni. Tavola di 22 reference numerate (mondi magici: Matemagica
1959, Monument Valley, La città incantata, Howl, Laputa, Sky, Ori, Botanicula, Gorogoa, Kiki; cartoni a
scatti: Cuphead, Chuchel, Lost in Play, Missi; mascotte: Calcifer, i nerini, i Nooms, Finch; app:
Duolingo, Royal Match, Brilliant, Prodigy). Non è nel repo (è pubblico e le immagini hanno copyright):
sta nelle note di sessione, `matemagica-reference/`. **Aspetta i numeri di Jack**: la direzione nuova
si costruisce da quelli, non da un altro giro di mockup. Tutto in `docs/grafica/giro-15-10/`, chat ChatGPT
nelle note di sessione. Poi: le 8 scene del sentiero nel mondo scelto, identità applicata
(colori, font, bottoni), 8 animazioni (tocco, giusto, sbagliato, combo, livello finito, stella,
streak, sblocco), suoni, mascotte col metodo del Bro (neutra → 8-10 espressioni, blink e
intermedi da codice) che reagisce alle risposte. Obiettivo: online entro mer 21 ottobre.

**Stile e struttura (16 ottobre 2026).** Dalla tavola Jack ha scelto i numeri; giro 3 di 7 stili × 3 pezzi
(`docs/grafica/giro-16-10/foglio-esplorazione.jpg`): vince **S5**, modernismo grafico anni '50 alla Matemagica
1959 (`originali/mm-s5a.png`, `mm-s5b.png`, `mm-s5c2.png`), gatto nero. Il problema era la scala (ogni livello
disegnato come un'isola): struttura **«Sassi e isole»**, scelta da Jack: livello = sasso piccolo sul sentierino,
tappa = isola con 5 sassi e il monumento della sua storia in cima, l'isola dopo è una sagoma dietro un velo di
nuvole che si dirada a ogni livello e si apre al 5°; dopo l'8ª isola le costellazioni di PR #4. Mockup in
`docs/grafica/giro-16-10/struttura/` (`foglio-struttura.jpg`). **Aspetta il sì di Jack**, poi: branch nuovo da
`main` con #4 + #5, `src/content/isole.ts`, `Sentiero.tsx` riscritto (Isola, Sasso, Velo, Etichetta, gatto con
`<Scatto>`), isole 1-4 dipinte per il 21, le altre come costellazioni finché papà non conferma le storie.

**Sassi e isole fatto (17-18 ottobre 2026): PR #6** (`claude/sassi-e-isole`, unisce e sostituisce #3, #4, #5).
Isole 1-4 dipinte, bimbo mago e gatto nero che saltano di sasso in sasso, velo che si dirada, scoperta con le
nuvole che si squarciano, risposte di papà nei giochi (`docs/papa/01-risposte.md`, ritorno in `02-per-papa.md`).
Verde, provato a 375×812. Per rivedere le scene in sviluppo: `?scoperta=L10` (scoperta) o `?scoperta=L7` (salto)
con un profilo che ha le stelle fino a quel livello. **Aspetta la prova di Jack dal telefono**, poi merge.

**Identità animata (18 ottobre 2026).** Jack vuole che il lato creativo sia l'USP, come per Duolingo: il gatto
nero reagisce agli eventi del motore (giusto, sbagliato, combo, fine partita 1/2/3 stelle, sblocchi, streak) e
fa da regia (cambi d'inquadratura e di schermata). Si copia la grammatica di Duolingo (tempi, anticipo, camera,
suono), mai i disegni. Una sessione a parte ne fa il «libretto dei momenti» (`docs/grafica/duolingo/`, branch
suo). Poi: rig del gatto in After Effects animato da Jack, frame a scatti in sprite, camera fatta dal codice;
primo momento la fine partita.

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
| Chi è più grande? | "vince il numero più grosso"; numeri in comune; "vince il quadrato" (4 × 4 contro 9 + 6); "vince il dividendo più grande" | sbaglia nel 48% da d2; 0 numeri in comune; 47%; 51% |
| Coppie magiche | "l'ultima coppia è obbligata"; primi: "sommo e basta" / "scarto i non primi"; differenza: "guardo solo le unità" | esche nel ~99,6% delle griglie (d≥2); sbagliano nel 100% / 98%; coppia falsa nel 100% |
| Catena | "guardo solo l'ultima operazione" (cerco due risposte legate da lei) | indovina 26% (a caso 25%): le risposte sono due coppie, la giusta è "prima" o "dopo" 50/50 |
| Stima lampo | "la giusta è quella in mezzo"; "guardo l'ultima cifra"; "guardo le distanze fra le opzioni" | 34/32/34%; opzioni arrotondate; 34% (a caso 33%) |
| Il Numero bersaglio | "sommo tutto"; un'operazione sola | 0% da d≥2; risolutore esaustivo |
| La Bilancia | "la leggo da una bilancia sola"; da d 7 "i pesi sono tutti positivi" | soluzione unica e incrocio obbligato (forza bruta, anche sui negativi); negativi 15-23%, la chiesta è la negativa nel 34% |
| Trova la regola | "aggiungo l'ultimo salto"; "mi ricordo la risposta" (sequenze scritte) | 100% / 42% / 0% / 0% / 0% per fascia; ogni sequenza scritta ≤ 19% dei quesiti (prima fino a metà) |

Le famiglie nuove dalle risposte di papà (16/10) restano minoritarie: in Chi è più grande? mista
23%, divisione 11% (da d 4), quadrato 6% (da d 2); in Coppie differenza 15%, multiplo 9%, primi
10%; in Stima resto, distanze e temperature ~10% l'una.

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

### Animazioni a scatti (`src/anim/`)
- Ogni animazione è un **foglio di fotogrammi WebP** in griglia, suonato a **12 disegni al
  secondo** senza passaggi morbidi (lo scatto del cartone). I fotogrammi vengono da After Effects
  (sequenza PNG con alfa, solo se la corsia Adobe è libera: Gary ha la precedenza) o da ChatGPT
  (griglia su fondo magenta). Un'animazione nuova = un comando:
  `/opt/homebrew/bin/python3.14 scripts/fogli.py <cartella|griglia.png> --nome giusto [--griglia 4x2]`
  → `src/anim/fogli/<nome>.webp` + `.json` e `src/anim/manifest.ts` rigenerato (non si tocca a mano).
  Con `--anteprima` scrive un foglio di controllo su magenta/notte/crema; `--tremolio 3` fa
  tremare un disegno fermo.
- Nell'app: `<Scatto nome larghezza giro onFine />` dove serve; `scoppia(nome, x, y)` da qualsiasi
  file per un'animazione sopra a tutto; `<StratoScoppi tocco="tocco" />` montato una volta fa
  partire il tocco su ogni bottone; `<FiltriTremolio />` + classe `tremolio` per i contorni che
  vibrano (sullo strato del contorno, non sul testo). `precaricaFogli()` all'avvio.
- Prova: **`/prova.html`** (pagina a parte, il gioco non la vede). Verifica: `npm run guarda` (vedi
  Comandi) dà i ms fra un disegno e l'altro e una foto per disegno; il pannello browser nascosto e le
  schede di Chrome in background fermano `requestAnimationFrame`, lì le animazioni non si misurano.
  Misurato: ~83-86 ms a disegno, tremolio forte 60 fps. Budget: ~40 KB ad animazione.

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
  /anim          → Scatto, scoppi, Tremolio, orologio (un rAF per tutti), precarica,
                   manifest.ts (GENERATO) e fogli/ (WebP + json, da scripts/fogli.py)
  /prova         → la pagina di prova delle animazioni (prova.html)
/public          → manifest, icone PWA, sw.js (offline)
/scripts         → simula.ts, verifica.ts, icone.py, pdf-papa.py, fogli.py
/docs/papa       → documenti per papà e le sue risposte
/docs/grafica    → giro-15-10: fogli di scelta (giro 1 bocciato, giro 2 sopra le nuvole), originali
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
· `python3.14 scripts/fogli.py <sorgente> --nome <animazione>` (Pillow e numpy: il python3 di sistema non li ha)
· `npm run guarda -- <url di prova.html> <cartella>`: Chrome headless, tempi veri e una foto per disegno di ogni animazione

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
- *(2026-10-15, animazioni)* Animazioni come fogli di fotogrammi WebP suonati cambiando
  `background-position`, niente Lottie o librerie: zero dipendenze, e i fotogrammi possono
  arrivare sia da After Effects sia dai disegni di ChatGPT.
- *(2026-10-15, animazioni)* Build a due pagine (`index.html` + `prova.html`) per provare le
  animazioni dal telefono senza toccare il gioco. `sw.js` ora mette ogni pagina nella sua casella
  di cache: prima ogni navigazione veniva salvata come `/`.
- *(2026-10-17, risposte di papà)* **Catena**: l'esca "risultato prima dell'ultimo passo, sempre"
  era essa stessa un trucco (cerco due risposte legate dall'ultima operazione: 85-97%). Ora le 4
  risposte sono due coppie legate dall'ultima operazione e la giusta è il "prima" o il "dopo" a
  caso (26%). Si tengono solo le catene dove vanno bene tutti e due i modi e l'altra coppia sopra e
  sotto, se no il ÷ e i numeri piccoli tradivano la giusta.
- *(2026-10-17)* **Stima**: esche spaziate a caso e in rapporto, mescolate con Fisher-Yates. Prima
  "guardo le distanze fra le opzioni" indovinava nel 61-67% e la giusta stava sul terzo bottone
  solo nel 25%. Nelle conversioni la formula è sempre scritta: allena la stima, non la memoria.
- *(2026-10-17)* **Trova la regola**: ogni sequenza scritta esce al massimo nel 12% dei quesiti
  (prima quota fissa del 50%: da d 9 "guarda e racconta" era metà dei quesiti, e la risposta si
  impara a memoria). Prezzo: a d 3 ci sono meno scritte e il trucco in fascia 1 sale dal 35% al 42%;
  quelle di papà a d 8 scendono dal 26% al 12%.
- *(2026-10-17)* **Bilancia**: da d 7 l'avviso "una forma può pesare meno di zero" c'è sempre,
  anche quando non succede (~80% delle volte): mostrarlo solo coi negativi sarebbe un indizio. Il
  tasto ± sta nella vista della Bilancia (il Tastierino comune non ha il meno). Con tre bilance la
  vista è più compatta: prima a d 8-10 sforava 375×812 nel 2-29% dei rompicapo.
- *(2026-10-17)* **Chi è più grande?**: un numero in comune non passa mai (prima, dopo 450
  tentativi, sì); le divisioni hanno 1,5 s in più. Il classico n² contro (n−1)(n+1) ora perde metà
  delle volte (con "+ c"): prima vinceva sempre il quadrato, ed era un trucco.
- *(2026-10-17)* **Coppie**: `verifica` prova tutti gli ordini di gioco con `formano`, perché in
  differenza e multiplo un numero ha più compagni (il vecchio controllo "compagno unico" non vale
  più). `verifica` misura il tempo solo della generazione, non dei suoi controlli.
