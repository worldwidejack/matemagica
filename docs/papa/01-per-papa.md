# Matemagica — per papà

*Primo giro, ottobre 2026. Scritto da Claude, che costruisce il gioco con Jack.*

Ciao! Matemagica adesso esiste: sette giochi, un sentiero di 40 livelli, una palestra e una collezione di storie. Si gioca dal telefono e funziona.

**Qui non c'è niente da compilare.** Sono cose da guardare e domande su cui ragionare. Scrivi pure a margine, cancella, rispondi solo a quello che ti interessa, a mano o a voce. Jack mi porta le risposte e io le trasformo nel gioco.

Per provarlo: Jack ti manda il link. Si apre dal telefono e si può aggiungere alla schermata Home come un'app.

---

## 1. Com'è fatto, in breve

- **Il sentiero**: 40 livelli in fila, divisi in 8 tappe. È **misto**, come avete deciso voi: i giochi si alternano, così non si resta mai bloccati su un argomento che non piace. Ogni 5 livelli si vince una storia.
- **La palestra**: un gioco solo, quanto si vuole, per chi preferisce allenare una cosa precisa.
- **Il livello si adatta.** Ogni gioco si ricorda quanto sei bravo e parte da lì. Se vai bene la difficoltà sale, se sbagli scende. Nessun test d'ingresso.
- **Le stelle non dipendono dai punti**, ma da come hai giocato al tuo livello. Così un principiante e un matematico possono prendere 3 stelle tutti e due.
- **Due tipi di gioco**: quattro *arcade* (a tempo, con 3 vite) e tre *rompicapo* (senza fretta, con aiuti e la soluzione spiegata alla fine).

## 2. La tua regola

> Un gioco non deve svuotarsi con un solo trucco.

Ho fatto in modo che ogni gioco la rispetti, e l'ho controllato col computer su 46.000 quesiti generati. Per ogni gioco ti scrivo qual era il trucco ovvio e come l'ho smontato. **La domanda che vale per tutti: c'è un altro trucco che non ho visto?**

---

## 3. I sette giochi

### ⚡ Chi è più grande? *(arcade)*
Due espressioni una sopra l'altra: tocchi quella che vale di più. Si parte da `8 + 5` contro `7 + 2` e si arriva a `19 × 38` contro `27²`.

- **Trucco smontato**: «vince chi mostra il numero più grosso». Nel 51% dei quesiti porta alla risposta sbagliata. In più le due espressioni non hanno mai un numero in comune.
- **Domande**: che coppie ti fanno dire «ah, carina»? Ho messo il classico `n²` contro `(n−1)(n+1)`: ne conosci altri così?

### ⚡ Coppie magiche *(arcade)*
Una griglia di numeri: tocchi due numeri che insieme fanno il numero magico. All'inizio sommati fanno 10, poi 20, poi 100. Più avanti moltiplicati fanno 24, 36, 48, 60… e infine somme a 1000.

- **Trucco smontato**: «l'ultima coppia è obbligata». Ci sono numeri esca, senza compagno.
- **Domande**: che altri numeri magici useresti? (frazioni che fanno 1? differenze? numeri primi?)

### ⚡ Catena *(arcade)*
Compare un numero, poi passano le operazioni una alla volta (`7 → +5 → ×2 → −3`). Alla fine scegli il risultato tra quattro. Le operazioni diventano di più, più veloci, e compaiono × e ÷.

- **Trucco smontato**: «guardo solo l'ultima operazione». Tra le risposte sbagliate c'è sempre il risultato prima dell'ultimo passo.
- **Domande**: le operazioni si fanno in ordine, da sinistra a destra, ignorando la precedenza (la × non viene prima). Ti sta bene, o lo trovi diseducativo?

### ⚡ Stima lampo *(arcade)*
Un calcolo troppo lungo per pochi secondi (`38 × 21`, `37% di 820`, `7412 ÷ 18`) e tre risposte arrotondate: scegli la più vicina.

- **Trucchi smontati**: «la giusta è sempre quella in mezzo» (è la più bassa, la media o la più alta un terzo delle volte ciascuna). E «guardo l'ultima cifra» (sono tutte arrotondate).
- **Domande**: che calcoli da stimare ti sembrano più utili nella vita vera?

### 🧩 Il Numero bersaglio *(rompicapo)*
Hai qualche numero e un bersaglio. Li combini due alla volta con + − × ÷ finché arrivi al bersaglio. Si parte da 3 numeri piccoli e si arriva a 5 numeri con 25, 50, 75, 100 e bersagli a tre cifre.

- **Trucchi smontati**: bersagli raggiungibili con un'operazione sola, o sommando tutto. Un risolutore controlla ogni quesito. Eccezione: al primissimo livello «sommare tutto» è permesso, per entrare nel gioco.
- **Domande**: è giusto permetterlo all'inizio? Le divisioni devono venire sempre esatte: va bene?

### 🧩 La Bilancia *(rompicapo)*
Bilance in equilibrio con forme misteriose (🔺 🟦 🟡) e pesi numerati: quanto pesa la forma chiesta? È algebra senza lettere. Si parte da `🔺🔺🔺 = 12` e si arriva a sistemi di tre equazioni.

- **Trucco smontato**: «la leggo da una bilancia sola». Dal secondo livello in su la forma chiesta si trova solo incrociando le bilance. Il computer prova tutte le combinazioni di pesi per garantire che la soluzione sia unica.
- **Domande**: i pesi sono sempre numeri interi da 1 a 15. Ti piacerebbe vedere anche pesi negativi o frazioni, più avanti?

### 🧩 Trova la regola *(rompicapo)*
Una sequenza di numeri: qual è il prossimo? Si parte da «+4 ogni volta» e si arriva a Fibonacci, triangolari, cubi, primi, regole alternate.

- **Trucco smontato**: «aggiungo l'ultimo salto». Funziona solo sulle sequenze più facili; dal livello medio in su non funziona mai.
- **Qui sei tu l'autore.** Il gioco usa per prime le sequenze scritte a mano. Ne ho messe 5 di prova (quadrati, Fibonacci, 2-6-12-20-30, i salti che crescono, «guarda e racconta»). **Scrivimi le tue preferite**: la sequenza, la risposta, la regola in una riga e quanto è difficile da 0 a 10.

---

## 4. Le spiegazioni dei giochi (da correggere)

La prima volta che un gioco arriva nel sentiero compare una mini-lezione: come si gioca, il trucco e un esempio. **Le ho scritte io: correggile, riscrivile, cambiale come vuoi.**

| Gioco | Il trucco che suggerisco |
|---|---|
| Chi è più grande? | Non serve il risultato esatto: arrotonda e confronta. 19 × 6 è quasi 20 × 6 = 120. |
| Coppie magiche | Per ogni numero chiediti «quanto manca?». Alcuni numeri sono esche. |
| Catena | Tieni a mente un numero solo e aggiornalo a ogni passo. |
| Stima lampo | Arrotonda a cifre tonde: 38 × 21 è circa 40 × 20 = 800. |
| Il Numero bersaglio | Parti dal bersaglio: è vicino a un prodotto dei tuoi numeri? Poi aggiusta con + e −. |
| La Bilancia | Parti dalla bilancia più semplice; quello che sai da una, usalo nelle altre. |
| Trova la regola | Guarda i salti; se non sono uguali, guarda come cambiano i salti. |

**Domanda**: come lo spiegheresti tu a un amico che «odiava la matematica»?

---

## 5. Il sentiero (l'ordine è tuo)

Adesso è così: ogni gioco compare la prima volta facile e poi torna sempre un po' più difficile. Le tappe sono di 5 livelli.

| Tappa | Livelli |
|---|---|
| 1 | Chi è più grande? · Coppie · Chi è più grande? · Bersaglio · Coppie 📜 |
| 2 | Stima · Bilancia · Chi è più grande? · Catena · Trova la regola 📜 |
| 3 | Coppie · Bersaglio · Stima · Bilancia · Catena 📜 |
| 4 | Chi è più grande? · Trova la regola · Coppie · Bersaglio · Stima 📜 |
| 5 | Bilancia · Catena · Chi è più grande? · Trova la regola · Coppie 📜 |
| 6 | Bersaglio · Stima · Bilancia · Catena · Trova la regola 📜 |
| 7 | Chi è più grande? · Coppie · Bersaglio · Stima · Bilancia 📜 |
| 8 | Catena · Trova la regola · Chi è più grande? · Bersaglio · Bilancia 📜 |

📜 = alla fine della tappa si vince una storia.

**Domande**: l'ordine ti convince? Qualche gioco arriva troppo presto o troppo tardi? Un rompicapo dopo ogni arcade, o va bene così?

---

## 6. Le storie (da controllare)

Le storie sono il premio del sentiero e diventano carte da collezionare. Si leggono in 20 secondi. **Le ho scritte io: controlla i fatti e il tono**, e soprattutto **raccontami le tue**, quelle che racconti sempre volentieri. Anche solo l'idea in due righe: la scrittura la sistemiamo noi.

Le otto bozze:

1. **Gauss bambino**: la somma da 1 a 100 fatta in un minuto, con le coppie che fanno 101.
2. **al-Khwarizmi**: da *al-jabr* nasce «algebra», dal suo nome «algoritmo».
3. **La tartaruga Lo Shu**: il quadrato magico 3 × 3 sul guscio, somma sempre 15.
4. **Eratostene**: misura la Terra con l'ombra di un bastone e la distanza Siene–Alessandria.
5. **Fibonacci**: porta in Europa le cifre indo-arabe; il problema dei conigli.
6. **Lo zero**: Brahmagupta scrive le regole per usarlo come un numero vero.
7. **Archimede**: la corona del re, l'acqua spostata, «Eureka!».
8. **Ramanujan**: il taxi 1729, la somma di due cubi in due modi.

Il testo completo di ognuna si legge nel gioco (scheda Collezione) o nel file `src/content/storie.ts`.

---

## 7. La domanda grande

Per te, cosa vuol dire concretamente **«allenare la mente»**? Quali «muscoli» vorresti che questi giochi facessero lavorare: stima, memoria, intuizione, pazienza, vedere gli schemi, altro?

E se potessi aggiungere **un solo gioco** ai sette, quale sarebbe?

---

*Grazie! Tutto quello che scrivi entra nel gioco.*
