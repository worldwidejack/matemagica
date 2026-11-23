---
progetto: Matemagica
stato: attivo
aggiornato: 2026-11-23
dettaglio: CLAUDE.md
rimasti: main e sito live sono la versione nuova: paese, 11 giochi coi gesti, gatto a fine partita
primo_passo: Jack e papà aprono matemagica-teal.vercel.app dal telefono e giocano dieci minuti
---
## Siamo arrivati a
Notte del 23/11 (Jack: «rendi questa la versione ultima definitiva su github»): **`main` e il sito live sono la versione nuova col paese** (PR #12-#18; il `main` vecchio delle isole sta nel tag `main-isole`). Dentro:
- prima apertura «Perché sei qui?» e intro senza camminata (gatto fermo, porta che si spalanca, luce);
- paese da sinistra a destra: fiore, gatto che cammina al livello dopo, nebbia; gatto vivo che aspetta;
- fine partita col gatto per 1★/2★/3★ (v15 e le v3d non approvate, messe così come sono);
- 8 giochi coi gesti, senza pulsanti-risposta (Chi è più grande, Coppie, Bersaglio, Stima, Catena, Regola, Bilancia, Quadrato) più Lampo misto;
- 3 giochi nuovi in bozza per papà: I due divisori (L11), Quanto è grande? (L14), Mini sudoku (L18), ognuno con la sua misura in `npm run verifica`;
- juice: il giusto sale col combo, stelle a tre note, errore morbido, punteggio che conta, colpetto su iPhone.

Build, lint e verifica (5 script) verdi; giro a 375×812 in locale; sito live controllato (il js servito contiene le PR #15-#17). Diario, ricerca juice, QR e foglio schermate: `_lavoro/notte-23-11/`.

Mai provato su un telefono vero: colpetto iPhone, corolla del Sudoku ai bordi, gesti di Aree sulle figure piccole. Provvisori: medaglioni ÷ ▱ # dei giochi nuovi, suoni sintetizzati, niente musica.

## Prossimo passo
Jack e papà: giocano dal telefono (`?dev` = Da capo e Salta livello, `?papa` = tutto aperto) e dicono cosa non va. Papà risponde a `docs/papa/03-per-papa.md` (PDF accanto): domande sui tre giochi nuovi.
Claude, dopo la prova: correzioni dai loro appunti; 2★ e 3★ rifatte in Fenaki (foglio di pose prima); medaglioni dipinti dei 3 giochi nuovi (reference, sceglie Jack); camminata verso la porta solo in After Effects con walk cycle in prospettiva (mp4 da guardare prima che entri nell'app); guscio iOS verso TestFlight.
