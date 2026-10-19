/**
 * Il link per chi prova il gioco (papà): `…/?papa` apre subito tutti i giochi in Palestra,
 * così si provano anche quelli che nel sentiero arrivano tardi (Bilancia, Trova la regola,
 * Quadrato magico). Il sentiero resta com'è. Una volta aperto il link, resta ricordato.
 */
const CHIAVE = 'matemagica-tutto-aperto';

export const tuttoAperto: boolean = (() => {
  if (typeof window === 'undefined') return false;
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.has('papa')) {
      window.localStorage.setItem(CHIAVE, '1');
      // Toglie ?papa dall'indirizzo: se si installa l'app, parte pulita.
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash);
    }
    return window.localStorage.getItem(CHIAVE) === '1';
  } catch {
    return false;
  }
})();
