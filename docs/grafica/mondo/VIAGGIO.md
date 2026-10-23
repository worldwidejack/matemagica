# Il viaggio: come si gioca un regno

> Proposta del 23/10/2026. Struttura del sentiero ripensata attorno ai regni (`MAPPA.md`), tenendo quello che
> è già deciso: sentiero misto (papà), Sassi e isole (Jack, 16/10), stelle che non dipendono dal punteggio.

## Un regno, dall'inizio alla fine

1. **Arrivo.** La nuvoletta col gatto attracca, la camera fa un carrello in avanti dentro il regno, il mondo
   cambia colore. L'abitante del regno saluta con una battuta. (Una volta sola, la prima volta che ci arrivi.)
2. **Cinque sassi.** Cinque livelli a giochi misti: **il gioco di casa al 1° e al 5° sasso**, in mezzo gli altri,
   così resta il sentiero misto deciso con papà e il regno ha comunque un'identità.
3. **Monumento.** Al quinto sasso con almeno una stella: il monumento si accende (linea di luce), si sblocca la
   storia e la carta del custode.
4. **Uscita.** La Nebbia, che si è diradata un sasso alla volta, si apre sul regno dopo.

## Le modalità diventano luoghi

| Modalità | Luogo | Cosa cambia rispetto a oggi |
|---|---|---|
| Sentiero | **il Viaggio** fra i regni | i nomi delle tappe diventano i nomi dei regni; colore e abitante per regno |
| Palestra | **la Soffitta della mente** | non è più un menu: è un posto fra le nuvole, sempre raggiungibile, dove si rigioca quello che hai incontrato |
| (nuova) | **la Porta dell'infinito** | dopo l'ultimo regno: regni generati senza fine, giochi a rotazione, fasce sempre più alte |
| Collezione | **le carte dei custodi** | resta com'è (davanti l'illustrazione, dietro la storia) |

## Cosa costa nel codice (dopo i sì)

- `src/content/regni.ts` nuovo: per ogni regno nome, colore, gioco di casa, abitante, isola dipinta.
- `sentiero.ts`: le tappe diventano regni (5 livelli l'uno, come ora); ordine di papà.
- `isole.ts`: l'isola resta legata alla storia, come ora; si aggiungono le isole nuove man mano che si dipingono.
- I colori di regno come token `@theme` (mai hex sparsi).
- La Porta dell'infinito: un generatore di regni dopo il 40° livello (le fasce esistono già in `regole.ts`).

Niente di questo si scrive prima del sì di Jack alla mappa e delle risposte di papà.
