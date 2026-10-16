import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { GIOCHI } from '@/games/registro';
import { giornoLocale } from '@/profilo/progressione';
import { dataBreve, sfidaDel } from '@/profilo/sfida';
import { useProfilo } from '@/profilo/store';
import { condividiTesto, indirizzo, stelleTesto } from './condividi';
import { Icona, IconaGioco, Stelline } from './kit';

export function testoSfida(giorno: string, punteggio: number, stelle: number): string {
  const s = sfidaDel(giorno);
  const g = GIOCHI[s.gioco];
  return `Matemagica · Sfida del ${dataBreve(giorno)}\n${g.icona} ${g.titolo}\n${stelleTesto(stelle)}  ${punteggio} punti\n${indirizzo()}`;
}

/**
 * La scheda della sfida del giorno. Prima di giocarla: il gioco a sorpresa e
 * "Gioca". Dopo: il risultato e "Condividi". `compatta` = una pillola sola.
 */
export function SfidaDelGiorno({ onGioca, compatta }: { onGioca: () => void; compatta?: boolean }) {
  const oggi = giornoLocale(new Date());
  const fatta = useProfilo((p) => p.sfide[oggi]);
  const sfida = sfidaDel(oggi);
  const g = GIOCHI[sfida.gioco];
  const [copiato, setCopiato] = useState(false);

  if (compatta) {
    if (fatta) return null;
    return (
      <button
        onClick={() => {
          suona('tap');
          onGioca();
        }}
        className="animate-pop flex items-center gap-2 rounded-full bg-oro-400 py-1.5 pr-4 pl-2 text-inchiostro shadow-[0_4px_0_var(--color-oro-600),0_8px_20px_rgb(0_0_0/0.3)] active:translate-y-0.5"
      >
        <IconaGioco gioco={sfida.gioco} className="h-9 w-9" />
        <span className="titolo text-base font-semibold">Sfida del giorno</span>
      </button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-oro-300 to-oro-500 p-4 text-inchiostro shadow-[0_6px_0_var(--color-oro-600),0_10px_24px_rgb(0_0_0/0.25)]">
      <div className="flex items-center gap-3">
        <IconaGioco gioco={sfida.gioco} className="h-16 w-16" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <Icona nome="calendario" className="h-4 w-4" /> Sfida del {dataBreve(oggi)}
          </p>
          <p className="titolo text-xl font-semibold">{g.titolo}</p>
          <p className="text-sm text-inchiostro-chiaro">
            {fatta ? (
              <span className="inline-flex items-center gap-2">
                <Stelline n={fatta.stelle} /> {fatta.punteggio} punti
              </span>
            ) : (
              'Un gioco a sorpresa, uguale per tutti. Conta il primo tentativo.'
            )}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {fatta ? (
          <>
            <button
              onClick={() => {
                suona('tap');
                void condividiTesto(testoSfida(oggi, fatta.punteggio, fatta.stelle)).then((e) => setCopiato(e === 'copiato'));
              }}
              className="titolo flex-1 rounded-full bg-notte-800 py-2.5 text-lg font-semibold text-panna-50"
            >
              {copiato ? 'Copiato!' : 'Condividi'}
            </button>
            <button
              onClick={() => {
                suona('tap');
                onGioca();
              }}
              className="rounded-full bg-panna-50/70 px-4 py-2.5 font-bold"
            >
              Rigioca
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              suona('tap');
              onGioca();
            }}
            className="titolo flex-1 rounded-full bg-notte-800 py-2.5 text-lg font-semibold text-panna-50"
          >
            Gioca la sfida
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-inchiostro-chiaro">Domani un gioco nuovo</p>
    </div>
  );
}
