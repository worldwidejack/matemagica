/**
 * Effetti sonori sintetizzati al volo con Web Audio: zero file da scaricare,
 * zero dipendenze. Sono segnaposto: i suoni veri arrivano con l'identità (B8),
 * e basterà cambiare questo file.
 *
 * Su iPhone l'audio si sblocca solo dentro un tocco: il primo `suona()`
 * chiamato da un click crea e riattiva il contesto.
 */

export type Suono = 'tap' | 'giusto' | 'sbagliato' | 'combo' | 'fine' | 'stella' | 'livello';

let ctx: AudioContext | null = null;
let muto = false;

export function setMutoAudio(m: boolean): void {
  muto = m;
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
  return ctx;
}

type Nota = { f: number; t: number; dur: number; tipo?: OscillatorType; vol?: number; aF?: number };

function note(lista: Nota[]): void {
  const c = contesto();
  if (!c || muto) return;
  const ora = c.currentTime + 0.01;
  for (const n of lista) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = n.tipo ?? 'triangle';
    osc.frequency.setValueAtTime(n.f, ora + n.t);
    if (n.aF) osc.frequency.exponentialRampToValueAtTime(n.aF, ora + n.t + n.dur);
    const v = n.vol ?? 0.18;
    g.gain.setValueAtTime(0.0001, ora + n.t);
    g.gain.exponentialRampToValueAtTime(v, ora + n.t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ora + n.t + n.dur);
    osc.connect(g).connect(c.destination);
    osc.start(ora + n.t);
    osc.stop(ora + n.t + n.dur + 0.02);
  }
}

/** `intensita` (0-1) alza il tono del "giusto" col combo: più vai, più sale. */
export function suona(s: Suono, intensita = 0): void {
  const su = 1 + Math.min(1, intensita) * 0.5;
  switch (s) {
    case 'tap':
      return note([{ f: 660, t: 0, dur: 0.05, tipo: 'sine', vol: 0.08 }]);
    case 'giusto':
      return note([
        { f: 660 * su, t: 0, dur: 0.09 },
        { f: 990 * su, t: 0.06, dur: 0.14 },
      ]);
    case 'sbagliato':
      return note([{ f: 220, t: 0, dur: 0.28, tipo: 'sawtooth', vol: 0.1, aF: 110 }]);
    case 'combo':
      return note([
        { f: 784, t: 0, dur: 0.08 },
        { f: 988, t: 0.07, dur: 0.08 },
        { f: 1319, t: 0.14, dur: 0.2 },
      ]);
    case 'stella':
      return note([{ f: 1047, t: 0, dur: 0.25, tipo: 'sine', vol: 0.2 }]);
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
        { f: 1047, t: 0.3, dur: 0.4, vol: 0.22 },
      ]);
  }
}

/** Vibrazione breve su Android (iPhone la ignora). */
export function vibra(ms: number): void {
  if (!muto && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
}
