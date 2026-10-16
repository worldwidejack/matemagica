/** XP, livello giocatore e streak: funzioni pure, senza React né storage. */

/** I gradi del giocatore. Provvisori: i nomi veri si decidono con l'identità visiva (B8). */
export const GRADI = [
  'Apprendista',
  'Allievo',
  'Contabile',
  'Calcolatore',
  'Alchimista',
  'Mago',
  'Arcimago',
  'Gran Maestro',
] as const;

/** XP che vale una partita: un cinquantesimo dei punti, più 10 per ogni stella. */
export function xpDaPartita(punteggio: number, stelle: number): number {
  return Math.round(punteggio / 50) + stelle * 10;
}

/** Per passare dal livello n al n+1 servono 100 + 50·n XP: i primi arrivano presto. */
function costoLivello(n: number): number {
  return 100 + 50 * n;
}

export type InfoLivello = {
  livello: number;
  grado: string;
  /** XP accumulati dentro il livello corrente. */
  xpNelLivello: number;
  xpPerIlProssimo: number;
};

export function livelloDa(xp: number): InfoLivello {
  let livello = 1;
  let resto = xp;
  while (resto >= costoLivello(livello)) {
    resto -= costoLivello(livello);
    livello++;
  }
  const grado = GRADI[Math.min(Math.floor((livello - 1) / 3), GRADI.length - 1)] ?? GRADI[0];
  return { livello, grado, xpNelLivello: resto, xpPerIlProssimo: costoLivello(livello) };
}

/** Giorno locale come "2026-10-07": la streak ragiona sul calendario del giocatore. */
export function giornoLocale(data: Date): string {
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const g = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${g}`;
}

function dataDi(giorno: string): Date {
  const [a, m, g] = giorno.split('-').map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, g ?? 1);
}

/** Giorni di calendario tra due date "AAAA-MM-GG" (b − a). */
export function giorniTra(a: string, b: string): number {
  return Math.round((dataDi(b).getTime() - dataDi(a).getTime()) / 86_400_000);
}

/** Il giorno `n` giorni prima (n negativo = dopo). */
export function giornoMeno(giorno: string, n: number): string {
  const d = dataDi(giorno);
  d.setDate(d.getDate() - n);
  return giornoLocale(d);
}

export type Streak = { giorni: number; ultimoGiorno: string | null };

/**
 * Il salva-fiamma (come lo "streak freeze" di Duolingo, ma senza monete): se
 * salti un giorno e hai un salva-fiamma, la fiamma resta accesa. Se ne vincono
 * arrivando a 3 giorni di fila e poi a ogni settimana; se ne tengono al massimo 2.
 */
export const SALVA_FIAMMA_MAX = 2;

export type DopoStreak = { streak: Streak; salvaUsati: number; salvaVinto: boolean };

/** Streak dopo aver giocato `oggi`: +1 se ieri avevi giocato (o i giorni saltati sono coperti), 1 se no. */
export function streakDopoPartita(s: Streak, oggi: string, salva = 0): DopoStreak {
  if (s.ultimoGiorno === oggi) return { streak: s, salvaUsati: 0, salvaVinto: false };
  const saltati = s.ultimoGiorno ? giorniTra(s.ultimoGiorno, oggi) - 1 : Infinity;
  const coperti = saltati >= 0 && saltati <= salva;
  const giorni = coperti ? s.giorni + 1 : 1;
  const salvaUsati = coperti ? saltati : 0;
  const salvaVinto = giorni === 3 || (giorni > 3 && giorni % 7 === 0);
  return { streak: { giorni, ultimoGiorno: oggi }, salvaUsati, salvaVinto };
}

/**
 * La streak da mostrare: viva se hai giocato oggi o ieri, o se i giorni saltati
 * sono coperti dai salva-fiamma che hai. `protetta` = la tiene in vita un salva-fiamma.
 */
export function streakViva(s: Streak, oggi: string, salva = 0): number {
  return statoFiamma(s, oggi, salva).giorni;
}

export function statoFiamma(s: Streak, oggi: string, salva = 0): { giorni: number; protetta: boolean } {
  if (!s.ultimoGiorno) return { giorni: 0, protetta: false };
  const saltati = giorniTra(s.ultimoGiorno, oggi) - 1;
  if (saltati <= 0) return { giorni: s.giorni, protetta: false };
  if (saltati <= salva) return { giorni: s.giorni, protetta: true };
  return { giorni: 0, protetta: false };
}
