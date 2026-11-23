/**
 * Effetti sonori sintetizzati al volo con Web Audio: zero file da scaricare,
 * zero dipendenze. Sono segnaposto: i suoni veri arrivano con l'identità (B8),
 * e basterà cambiare questo file.
 *
 * 23/11: il «giusto» sale di un semitono per ogni risposta giusta di fila (tetto 8),
 * le stelle salgono di tono una dopo l'altra, l'errore è una nota morbida che scende
 * (mai un ronzio), e c'è il «tick» del punteggio che conta.
 *
 * Su iPhone l'audio si sblocca solo dentro un tocco: il primo `suona()`
 * chiamato da un click crea e riattiva il contesto.
 */

export type Suono = 'tap' | 'tick' | 'giusto' | 'sbagliato' | 'combo' | 'fine' | 'stella' | 'livello' | 'festa';

let ctx: AudioContext | null = null;
/** Il bus d'uscita: un compressore leggero e un filo d'eco, come in una piazza di sera. */
let uscita: AudioNode | null = null;
let muto = false;
let vibrazione = true;

export function setMutoAudio(m: boolean): void {
  muto = m;
}

export function setVibrazioneAudio(v: boolean): void {
  vibrazione = v;
}

function contesto(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  if (!uscita) {
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const eco = ctx.createDelay(0.5);
    eco.delayTime.value = 0.13;
    const ritorno = ctx.createGain();
    ritorno.gain.value = 0.22;
    const umido = ctx.createGain();
    umido.gain.value = 0.35;
    // secco → compressore; secco → eco ⟲ ritorno → umido → compressore
    const ingresso = ctx.createGain();
    ingresso.connect(comp);
    ingresso.connect(eco);
    eco.connect(ritorno).connect(eco);
    eco.connect(umido).connect(comp);
    comp.connect(ctx.destination);
    uscita = ingresso;
  }
  return ctx;
}

/** `campana`: aggiunge l'armonica all'ottava e alla dodicesima, per un suono più "di vetro". */
type Nota = { f: number; t: number; dur: number; tipo?: OscillatorType; vol?: number; aF?: number; campana?: boolean };

function note(lista: Nota[]): void {
  const c = contesto();
  if (!c || muto) return;
  const ora = c.currentTime + 0.01;
  const dest = uscita ?? c.destination;
  const suonaUna = (n: Nota) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.tipo ?? 'triangle';
    osc.frequency.setValueAtTime(n.f, ora + n.t);
    if (n.aF) osc.frequency.exponentialRampToValueAtTime(n.aF, ora + n.t + n.dur);
    const v = n.vol ?? 0.18;
    g.gain.setValueAtTime(0.0001, ora + n.t);
    g.gain.exponentialRampToValueAtTime(v, ora + n.t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ora + n.t + n.dur);
    osc.connect(g).connect(dest);
    osc.start(ora + n.t);
    osc.stop(ora + n.t + n.dur + 0.02);
  };
  for (const n of lista) {
    suonaUna(n);
    if (n.campana) {
      const v = n.vol ?? 0.18;
      suonaUna({ ...n, f: n.f * 2, tipo: 'sine', vol: v * 0.35, dur: n.dur * 0.7, campana: false });
      suonaUna({ ...n, f: n.f * 3, tipo: 'sine', vol: v * 0.12, dur: n.dur * 0.45, campana: false });
    }
  }
}

/** Do, mi, sol: la prima, la seconda e la terza stella. */
const SCALA_STELLE = [1, 1.26, 1.498] as const;

/**
 * `intensita` (0-1): per il «giusto» sono le giuste di fila in dodicesimi (combo / 12),
 * un semitono l'una fino a 8; per la «stella» è quale stella (0, ⅓, ⅔).
 */
export function suona(s: Suono, intensita = 0): void {
  const i = Math.max(0, Math.min(1, intensita));
  const su = 2 ** (Math.min(8, Math.round(i * 12)) / 12);
  switch (s) {
    case 'tap':
      return note([{ f: 660, t: 0, dur: 0.05, tipo: 'sine', vol: 0.08 }]);
    case 'tick':
      return note([{ f: 1320 * (1 + i * 0.5), t: 0, dur: 0.03, tipo: 'sine', vol: 0.05 }]);
    case 'giusto':
      return note([
        { f: 660 * su, t: 0, dur: 0.09, campana: true },
        { f: 990 * su, t: 0.06, dur: 0.18, campana: true },
      ]);
    case 'sbagliato':
      // Due note tonde che scendono: «quasi», non «sbagliato».
      return note([
        { f: 330, t: 0, dur: 0.16, tipo: 'triangle', vol: 0.13, aF: 262 },
        { f: 247, t: 0.12, dur: 0.28, tipo: 'sine', vol: 0.14, aF: 196 },
      ]);
    case 'combo':
      return note([
        { f: 784, t: 0, dur: 0.08 },
        { f: 988, t: 0.07, dur: 0.08 },
        { f: 1319, t: 0.14, dur: 0.2 },
      ]);
    case 'stella':
      return note([{ f: 1047 * (SCALA_STELLE[Math.round(i * 3)] ?? 1.498), t: 0, dur: 0.45, tipo: 'sine', vol: 0.2, campana: true }]);
    case 'fine':
      return note([
        { f: 523, t: 0, dur: 0.15 },
        { f: 659, t: 0.12, dur: 0.15 },
        { f: 784, t: 0.24, dur: 0.3 },
      ]);
    case 'livello':
      return note([
        { f: 523, t: 0, dur: 0.12 },
        { f: 659, t: 0.1, dur: 0.12 },
        { f: 784, t: 0.2, dur: 0.12 },
        { f: 1047, t: 0.3, dur: 0.6, vol: 0.22, campana: true },
      ]);
    case 'festa':
      // Arpeggio che sale e ricade: tappa completata, medaglia.
      return note([
        { f: 523, t: 0, dur: 0.18, campana: true },
        { f: 659, t: 0.09, dur: 0.18, campana: true },
        { f: 784, t: 0.18, dur: 0.18, campana: true },
        { f: 1047, t: 0.27, dur: 0.22, campana: true },
        { f: 1319, t: 0.36, dur: 0.22, campana: true },
        { f: 1568, t: 0.45, dur: 0.7, vol: 0.2, campana: true },
        { f: 1047, t: 0.45, dur: 0.7, vol: 0.12 },
      ]);
  }
}

/**
 * Il colpetto su iPhone: Safari non ha `navigator.vibrate`, ma un interruttore
 * (`<input type="checkbox" switch>`) dà il suo «tic» quando scatta. Se ne crea uno
 * nascosto, lo si fa scattare e lo si toglie. Dove l'interruttore non esiste non succede niente.
 */
function colpetto(): void {
  if (typeof document === 'undefined') return;
  const etichetta = document.createElement('label');
  etichetta.setAttribute('aria-hidden', 'true');
  etichetta.style.display = 'none';
  const leva = document.createElement('input');
  leva.type = 'checkbox';
  leva.setAttribute('switch', '');
  etichetta.appendChild(leva);
  document.head.appendChild(etichetta);
  etichetta.click();
  etichetta.remove();
}

/** Solo i telefoni Apple: lì la vibrazione del browser non c'è. */
const SOLO_COLPETTO = ((): boolean => {
  if (typeof navigator === 'undefined') return false;
  const nav: Navigator = navigator;
  if (typeof nav.vibrate === 'function') return false;
  return /iP(hone|ad|od)/.test(nav.userAgent) || nav.maxTouchPoints > 1;
})();

/** Vibrazione breve: su Android quella del browser, su iPhone il colpetto dell'interruttore (due per un errore). */
export function vibra(ms: number): void {
  if (!vibrazione || typeof navigator === 'undefined') return;
  const nav: Navigator = navigator;
  if (typeof nav.vibrate === 'function') {
    nav.vibrate(ms);
    return;
  }
  if (!SOLO_COLPETTO) return;
  colpetto();
  if (ms >= 60) window.setTimeout(colpetto, 110);
}
