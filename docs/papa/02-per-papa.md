# Matemagica — per papà

*Secondo giro, ottobre 2026. Scritto da Claude, che costruisce il gioco con Jack.*

Grazie! Jack mi ha portato i tuoi fogli e li ho letti tutti, anche le note a margine. Qui ti racconto cosa ne è venuto fuori, rispondo alle tue domande e te ne faccio qualcuna nuova. Come la volta scorsa: niente da compilare, rispondi a quello che ti interessa, come ti viene.

---

## 1. Cosa ho fatto con le tue risposte

- **Trova la regola**: le tue due sequenze sono nel gioco, segnate come tue: quando la difficoltà è quella giusta, il gioco le pesca spesso, mescolate alle altre. `3, 6, 7, 14, 15, 30 → 31` (×2 e poi +1, a turno) e `2, 3, 5, 9, 17, 33 → 65` (ogni numero diventa il doppio meno 1). Ho dato difficoltà 7 alla prima e 6 alla seconda, su 10: nella seconda i salti raddoppiano (+1, +2, +4…) e questo la tradisce un po'. Se non sei d'accordo, cambiale.
- **Il Numero bersaglio**: come hai detto, al primo livello «sommare tutto» resta permesso e le divisioni vengono sempre esatte. Il consiglio della spiegazione l'ho riscritto: ti racconto sotto perché.
- **Catena**: resta un'operazione alla volta, nell'ordine in cui arrivano, come hai detto. Mi segno la tua idea: una versione con l'espressione scritta tutta insieme, e lì vale la precedenza.
- **La Bilancia**: l'inizio ora è più dolce (prima una bilancia con una forma sola, poi un peso sullo stesso piatto, poi forme sui due piatti, e solo dopo due forme da incrociare). Dai livelli alti una forma può pesare meno di zero: il gioco lo avvisa e c'è il tasto ±. Le frazioni più avanti.
- **Già nel gioco, mescolate alle domande di sempre**: in *Chi è più grande?* le divisioni (`6 : 4` contro `25 : 14`), i misti (`9 + 4` contro `4 × 3`) e la tua coppia `4 × 4` contro `9 + 6`; in *Coppie magiche* le differenze, le coppie che fanno un multiplo di 3 e i numeri primi (sotto); in *Stima lampo* il resto della spesa, miglia e chilometri, gradi Celsius e Fahrenheit.
- **I tre giochi nuovi** (piccoli sudoku, l'area di una figura, trovare 2 divisori): segnati. Ti chiedo come li vorresti, in fondo.

---

## 2. Le tue domande

### «Trucco smontato»: cosa vuol dire?

Hai ragione, era un modo di dire nostro. Quasi ogni gioco ha una **scorciatoia furba**: un modo di rispondere giusto senza fare davvero il ragionamento. Se la scorciatoia funzionasse sempre, il gioco si svuoterebbe: è proprio la tua regola. «Smontare il trucco» vuol dire costruire le domande in modo che la scorciatoia porti a sbagliare, così l'unico modo di vincere è pensare.

L'esempio della **Catena**. Compare `7 → +5 → ×2 → −3` e poi quattro risposte. Un errore tipico è perdere l'ultimo passo per strada. Per questo tra le quattro risposte c'era sempre anche **24**, il risultato prima dell'ultimo passo: chi l'ha perso ci casca, chi ha seguito tutta la catena sceglie 21.

E qui una confessione. Rileggendolo per scriverti, mi sono accorto che proprio quest'esca apriva un trucco nuovo: chi guarda solo l'ultima operazione (−3) poteva cercare tra le risposte due numeri che differiscono proprio di 3 (24 e 21) e scegliere il secondo, senza fare la catena. Il computer diceva che così si indovinava 9 volte su 10. È la tua regola in azione: smontando un trucco se ne può creare un altro.

L'ho sistemato così: ora le quattro risposte sono sempre **due coppie** legate dall'ultima operazione, per esempio `24, 21, 26, 23`, e la giusta è a caso il primo o il secondo numero della sua coppia (a volte le risposte sono `21, 18, 23, 20`, e 18 è chi ha fatto −3 due volte). La scorciatoia ora indovina una volta su quattro, come tirare a caso. Se ti viene un'idea migliore, è benvenuta.

Lo stesso vale per la tua coppia `4 × 4` contro `9 + 6`: è bella, ma se comparisse sempre si imparerebbe che «vince il quadrato», perché vince sempre di 1. Per questo la mescoliamo con coppie simili in cui vince l'altra.

### Il bersaglio: «è sempre così?»

No, e hai fatto bene a chiederlo. Ho fatto controllare al computer migliaia di bersagli: partire da un prodotto vicino al bersaglio porta alla soluzione più o meno una volta su due a metà gioco, meno spesso nei livelli più difficili, e quasi mai al primo livello, dove bastano + e −. Lì il consiglio sviava davvero.

Ora la spiegazione dice:

> Un punto di partenza, non una regola: quanto manca al bersaglio? C'è un prodotto vicino? Se non torna, cambia strada.

E ho cambiato anche l'esempio: quello vecchio (3, 4, 6 → 18) si risolveva in un passo solo, 3 × 6. Quello nuovo è `4, 5, 3 → 23`: 4 × 5 = 20, poi 20 + 3 = 23.

### I numeri primi

Mi chiedevi come introdurli. L'ho provato in *Coppie magiche*, da metà gioco in su: il numero magico è pari, per esempio 24, e bisogna trovare **due numeri primi** che lo fanno: 5 + 19, 7 + 17, 11 + 13. Nella griglia ci sono anche coppie che fanno 24 ma non sono due primi (9 + 15, 3 + 21), così la somma da sola non basta: bisogna riconoscere i primi. E non basta nemmeno scartare i non primi: il 3 di 3 + 21 resta senza compagno.

E la storia per la collezione c'è già: nel 1742 Goldbach scrisse a Eulero che, secondo lui, ogni numero pari maggiore di 2 si può scrivere così. Nessuno è ancora riuscito a dimostrarlo.

Ti piace? Li introdurresti in un altro modo?

---

## 3. Domande nuove

**1. I tuoi giochi nuovi: come li vorresti?** Per ognuno mi basta un esempio fatto a mano, il più facile e il più difficile.
- *Piccoli sudoku*: 4 × 4 con i numeri da 1 a 4? Più grandi? Con qualche somma da rispettare?
- *L'area di una figura*: su un foglio a quadretti, contando? Figure da tagliare e ricomporre? Con le misure scritte?
- *Trovare 2 divisori*: per esempio «91 = ? × ?» (7 × 13)? O due divisori qualsiasi, diversi da 1 e dal numero?

E per ognuno: qual è la scorciatoia che lo svuoterebbe?

**2. L'ordine dei livelli.** La volta scorsa non me ne hai parlato: vuol dire che va bene così? Eccolo com'è adesso (c'è un gioco nuovo, il Quadrato magico). Qualcosa arriva troppo presto o troppo tardi?

| Tappa | Livelli |
|---|---|
| 1 | Chi è più grande? · Coppie · Chi è più grande? · Bersaglio · Coppie 📜 |
| 2 | Stima · Bilancia · Chi è più grande? · Catena · Trova la regola 📜 |
| 3 | Coppie · Bersaglio · Stima · Bilancia · Catena 📜 |
| 4 | Quadrato magico · Trova la regola · Coppie · Bersaglio · Stima 📜 |
| 5 | Bilancia · Catena · Chi è più grande? · Trova la regola · Coppie 📜 |
| 6 | Bersaglio · Stima · Bilancia · Catena · Trova la regola 📜 |
| 7 | Chi è più grande? · Coppie · Bersaglio · Stima · Bilancia 📜 |
| 8 | Catena · Trova la regola · Chi è più grande? · Bersaglio · Bilancia 📜 |

📜 = alla fine della tappa si vince una storia.

**3. Le storie.** In fondo trovi le otto storie per intero. Se ti va, controlla fatti e tono. Ma soprattutto: qual è la storia di matematica che racconti sempre volentieri? Anche solo due righe: la scrittura la sistemiamo noi.

---

*Grazie ancora. Quando Trova la regola arriva ai livelli di mezzo, tra le sequenze ti ritrovi le tue.*
