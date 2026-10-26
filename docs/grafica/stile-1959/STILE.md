# Lo stile 1959 di Matemagica

> Il nostro art style, ricavato dal film d'origine (`LIBRETTO.md`) e dalle decisioni già prese (S5, Sassi e
> isole, gatto a colori pieni). È testo nostro: descrive tratti, non copia disegni. Vale la regola del 1959.
> Stato al 23/10/2026: **proposta**. Le varianti della prova di stile aspettano Jack nella Lanterna; la regola
> scelta entra nel mondo Diorama con le sue parole.

## In una riga

Un mondo notturno dipinto, su cui la matematica **si accende** in linee e forme piene e calde; ogni regno ha il
suo colore; i personaggi sono piatti e puliti davanti a fondali con la grana.

## 1. La tavolozza a ruoli

Misurata sul film (`_handoff/mathmagic-1959/board/0-tavolozza.png`, 8 capitoli, un fotogramma ogni 4 s), poi
messa accanto ai token dell'app (`src/index.css`).

| Ruolo | Nel film | Da noi oggi | Cosa cambierebbe |
|---|---|---|---|
| Fondo (la notte) | carbone verdastro `#161511`, blu spento `#101d2f` `#152f52`, pietra `#2f302e` | blu notte saturo `notte-900 #021756` … `notte-600 #2a46a8` | il fondo potrebbe scurirsi e scaldarsi: meno cobalto, più notte «vera» |
| Accento caldo 1 | rosso vermiglio `#c22712` | manca (solo `pericolo`) | **nuovo**: il colore dei giochi e delle cose importanti |
| Accento caldo 2 | corallo / terracotta `#c56341` | `pesca #f8c7a0` (più chiaro) | corallo più deciso |
| Oro | giallo `#f2bb3c` | `oro-400 #fed347` | quasi uguale: resta |
| Azzurri | petrolio `#29729b`, cielo `#3e8fc8`, ciano `#4dc4f7`, cobalto `#0a34a3` | turchese, `notte-600` | il petrolio per l'acqua e la geometria |
| Chiari | cipria `#e0ccc6`, bianco caldo `#f3ece7` | `panna-50 #fff3df`, `lilla #c6a8ba` | vicini: restano |

I colori non sono protetti: si possono prendere. Nessun token si cambia prima della scelta di Jack.

## 2. Il colore di ogni regno

Come i capitoli del film, ogni regno ha un colore dominante, che tinge cielo, nuvole e Nebbia quando ci sei.
Viaggiare è vedere il mondo cambiare colore. Proposta (da allineare con `../mondo/MAPPA.md`):

| Regno | Fondo | Accento |
|---|---|---|
| L'Approdo delle forme | blu notte | corallo e oro |
| L'isola dell'Armonia | pietra fredda, blu ardesia | oro |
| L'isola della Spirale | verde petrolio | corallo |
| L'isola d'Oro | blu burrasca | oro e bianco caldo |
| L'isola dei Giochi | rosso vermiglio che sfuma nel nero | bianco e oro |
| La Soffitta della mente | carbone caldo | rosso e cipria |
| La Porta dell'infinito | cobalto profondo | rosa e oro |

## 3. Forme e materia

- **Fondali dipinti con la grana** (pietra, tela, nuvole a pennello), **figure piatte** davanti, con un contorno
  sottile scuro o senza contorno. Il gatto resta com'è: colori pieni, tavolozza fissa (regola del 20/10).
- **Sagome geometriche in controluce**: rocce, alberi e architetture come forme nere o scure, semplici, che
  fanno da quinte. Niente dettagli piccoli.
- **La matematica è la forma del posto**, mai una scritta: un'isola a spirale, alberi a pentagono, un ponte che
  è una corda tesa. Mai cifre o formule disegnate (regola di Jack e di Diorama).

## 4. La linea di luce (il segno di Matemagica)

Nel film la geometria compare tracciandosi sopra il buio. Da noi diventa il segno grafico dell'app:
- una **linea piena, chiara e calda** (oro, bianco caldo, rosa), con lo spessore costante, **senza alone né
  bagliore** (il glow «da gioco AI» è bocciato);
- la **disegna il codice** (SVG animato), mai l'immagine generata: si traccia, si chiude, diventa una forma, e la
  forma può trasformarsi in un'altra;
- la si usa per i momenti di matematica: la soluzione di un rompicapo che si disegna, la spirale che collega i
  sassi, la traiettoria di un rimbalzo, la stella che si forma a fine partita.

## 5. Composizione

- Una cosa sola al centro, con tanto vuoto intorno (vale anche per le schermate dei giochi).
- All'arrivo in un regno il gatto è piccolo dentro il paesaggio grande; nei giochi esce di scena (inquadrature
  di `schermate-s5` in Diorama).
- L'infinito si mostra in prospettiva centrale (porte, archi, sassi che si perdono).

## 6. Movimento (animazione limitata)

- **Metamorfosi**: una forma diventa un'altra (cerchio → ruota → luna); è il movimento tipico del mondo.
- **Tracciatura**: la linea di luce si disegna in 0,4–0,8 s, poi la forma si riempie.
- Pochi movimenti di camera; quando ci sono, un **carrello in avanti** verso il fondo (entrare in un regno).
- Ritmo, anticipi e tenute dal libretto Duolingo (`docs/grafica/duolingo/LIBRETTO.md`).

## 7. Cosa non prendiamo mai

Paperino, le creature del film, i pitagorici, la ragazza col fiocco, le pedine vive, gli schedari della mente,
il corridoio di porte così com'è, le inquadrature, la musica, i titoli. Il test: chi ha visto il film deve dire
«stesso spirito», mai «è la stessa cosa».

## 8. Parole per i prompt (senza nomi)

Da usare al posto di qualunque nome di film o studio:
`mid-century modern illustration, flat cut-paper shapes, limited palette, dark painterly night backdrop with
paper and brush texture, geometric silhouettes, vermilion and coral accents, warm gold, petrol blue, lots of
empty space, single subject centered, no text, no numbers, no letters`.

## 9. La prova di stile (23/10)

La stessa scena (l'isola della Spirale, il gatto sul primo sasso) in quattro varianti, per scegliere quanto
spingersi verso il film. I candidati sono in Diorama, nell'entità «Stile 1959». Jack sceglie nella Lanterna.

| Variante | Cosa cambia |
|---|---|
| A · S5 com'è | la tavolozza di oggi (blu notte saturo, oro, panna): il controllo |
| B · Notte carbone | il fondo scurisce e si scalda come nel film; accenti vermiglio e corallo |
| C · Lavagna di luce | B più la linea di luce disegnata da codice sopra il paesaggio |
| D · Colore di regno | tutta la scena intonata al colore del suo regno (Spirale: verde petrolio e corallo) |
