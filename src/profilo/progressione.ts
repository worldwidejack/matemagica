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

function giornoPrima(giorno: string): string {
  const [a, m, g] = giorno.split('-').map(Number);
  return giornoLocale(new Date(a ?? 1970, (m ?? 1) - 1, (g ?? 1) - 1));
}

export type Streak = { giorni: number; ultimoGiorno: string | null };

/** Streak dopo aver giocato `oggi`: +1 se ieri avevi giocato, 1 se hai saltato. */
export function streakDopoPartita(s: Streak, oggi: string): Streak {
  if (s.ultimoGiorno === oggi) return s;
  if (s.ultimoGiorno === giornoPrima(oggi)) return { giorni: s.giorni + 1, ultimoGiorno: oggi };
  return { giorni: 1, ultimoGiorno: oggi };
}

/** La streak da mostrare: se l'ultimo giorno giocato non è né oggi né ieri, è spenta. */
export function streakViva(s: Streak, oggi: string): number {
  if (s.ultimoGiorno === oggi || s.ultimoGiorno === giornoPrima(oggi)) return s.giorni;
  return 0;
}
