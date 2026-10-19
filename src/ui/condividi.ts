/**
 * Condivisione a costo zero: il menu "Condividi" del telefono (WhatsApp,
 * messaggi…) e, dove non c'è, il testo copiato negli appunti.
 */
export type EsitoCondivisione = 'condiviso' | 'copiato' | 'annullato' | 'errore';

export async function condividiTesto(testo: string): Promise<EsitoCondivisione> {
  if (typeof navigator === 'undefined') return 'errore';
  if (navigator.share) {
    try {
      await navigator.share({ text: testo });
      return 'condiviso';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'annullato';
    }
  }
  try {
    await navigator.clipboard.writeText(testo);
    return 'copiato';
  } catch {
    return 'errore';
  }
}

/** Le stelle come le mostra un messaggio: ⭐⭐☆ */
export function stelleTesto(n: number): string {
  return '⭐'.repeat(n) + '☆'.repeat(3 - n);
}

export function indirizzo(): string {
  return typeof location === 'undefined' ? '' : location.origin;
}
