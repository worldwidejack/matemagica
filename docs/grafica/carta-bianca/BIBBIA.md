# Carta bianca: la bibbia (13/11/2026, notte)

Una pagina. Scritta prima di disegnare, poi non si riapre: le note di Jack arrivano dopo, tutte insieme.

## L'idea in una riga
**Un giorno intero col gatto.** Otto luoghi fatti di matematica, uno per tappa, dall'alba alla notte stellata. Ogni luogo è una pagina a tutto schermo con cinque livelli sul sentiero e un monumento in cima.

## Perché così
- Il gatto è nero: sul blu notte di prima spariva. Qui è la cosa più scura dello schermo, sempre.
- Un luogo = un'immagine. Niente fondali da affiancare, niente cuciture: 40 livelli costano 8 immagini, e 5 livelli nuovi ne costano una.
- Ogni tappa ha il suo colore, quindi si sente di avanzare anche senza leggere niente.

## I luoghi
| # | Luogo | Ora | Colore della tappa |
|---|---|---|---|
| 1 | La torre | alba | corallo |
| 2 | L'arco | mattina | blu cielo |
| 3 | La tartaruga | mezzogiorno | turchese |
| 4 | L'obelisco | primo pomeriggio | terracotta |
| 5 | L'albero | pomeriggio | verde |
| 6 | L'anello | tramonto | magenta |
| 7 | La leva | crepuscolo | viola |
| 8 | L'osservatorio | notte | blu notte |

## Il tratto
Carta ritagliata, come il gatto: forme piatte, bordi netti, niente contorni, niente sfumature, un filo di grana dentro le forme. Il paesaggio è fatto di matematica: colline che sono curve, alberi che sono coni e sfere, rocce che sono cubi, qualche cifra gigante piantata come un edificio. Il sentiero è sempre chiaro, così il gatto ci si legge sopra anche di notte.

Regole per i generatori: mai nomi di film o di studi, mai fotogrammi; niente personaggi né scritte nei fondali; il gatto si aggiunge sopra, dal disegno approvato.

## L'interfaccia
- **Carta** `#FFF4DC` per le schermate dove si sceglie (casa, palestra, collezione, profilo), **inchiostro** `#15132E` per il testo, **giallo degli occhi del gatto** `#FFD21F` per l'unico pulsante che conta in ogni schermata.
- **Si gioca dentro il colore della tappa**: lo schermo della partita è pieno del colore del luogo, tessere color carta, numeri in inchiostro. In Palestra ogni gioco ha il suo colore.
- Forme: angoli molto tondi, ombra dura sotto (il pulsante si schiaccia), nessun contorno, nessuna ombra sfumata grande.
- Font: Grandstander per titoli, numeri e pulsanti; Nunito per il testo che si legge.
- Movimento: tutto risponde entro 150 ms e si chiude entro 1 secondo. Rimbalzo corto, niente attese.
- Voce: frasi corte, in seconda persona, niente punti esclamativi a raffica. Il gatto non parla: guarda.

## Il mondo entra in ogni schermata (giro del 14/11)
- **Il luogo sta dietro alla partita**, tono su tono nel colore della tappa (`.tinta::before`): si legge il posto, non disturba i numeri.
- **Niente emoji dove c'è un disegno**: fiamma, ghiaccio, lampadina e stella (`public/oggetti/`), le 12 medaglie (`public/medaglie/`), le 8 carte delle storie (`public/carte/`), i 4 motivi del benvenuto (`public/motivi/`). Restano emoji solo le forme della Bilancia e le carte-stella.
- **Il gatto ha un posto in ogni momento**: indica nella spiegazione, è accucciato sopra «Via!», sbircia dal basso nelle partite a tempo (si abbassa se sbagli), siede sul foglio del risultato, si scalda alla fiamma.
- **Tutto ciò che si tocca ha l'ombra dura**: tessere, tastierino, piatti della bilancia. Un pulsante spento è scuro e piatto, mai slavato.
- **La domanda di ogni gioco** è in Grandstander, color carta piena: è la cosa che si legge per prima.

## Cosa non c'è
Il blu notte dappertutto, il paese che scorre, la soglia, il mago, le isole.
