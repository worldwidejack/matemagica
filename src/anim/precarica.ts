import { FOGLI, type NomeFoglio } from './manifest';

/** Tenuti in memoria già decodificati: il primo tocco parte subito, senza buco. */
const pronti = new Map<NomeFoglio, HTMLImageElement>();

/** Scarica e decodifica i fogli (tutti, se non dici quali). Si chiama all'avvio, con calma. */
export function precaricaFogli(nomi: NomeFoglio[] = Object.keys(FOGLI) as NomeFoglio[]): Promise<void> {
  return Promise.all(
    nomi.map((n) => {
      if (pronti.has(n)) return Promise.resolve();
      const img = new Image();
      img.src = FOGLI[n].url;
      pronti.set(n, img);
      return img.decode().catch(() => {});
    }),
  ).then(() => {});
}

/** Peso di tutti i fogli in KB: lo mostra la pagina di prova. */
export function pesoFogli(): number {
  return Object.values(FOGLI).reduce((s, f) => s + f.kb, 0);
}
