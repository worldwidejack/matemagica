import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { LUOGHI } from '@/content/luoghi';
import { MOTIVI } from '@/profilo/giornata';
import { Bottone, Icona } from './kit';

/** L'obiettivo del giorno di partenza (3 partite): si cambia dal profilo. */
const OBIETTIVO_INIZIALE = 3;

/**
 * La prima apertura: il primo luogo, il gatto, una domanda a più risposte e subito il primo
 * livello, che è già il tutorial. Niente account, niente moduli, niente pagine da sfogliare.
 */
export function Benvenuto({ onFine }: { onFine: (motivo: string, obiettivo: number) => void }) {
  // Più risposte insieme (Jack, 13/11): nel profilo finiscono unite da una virgola.
  const [motivi, setMotivi] = useState<string[]>([]);
  const cambia = (id: string) => setMotivi((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const luogo = LUOGHI[0];

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      {/* Sul telefono vero: sotto la tacca continua il cielo dell'alba, sotto la barra di casa il foglio. */}
      <div className="fixed inset-x-0 top-0 h-[env(safe-area-inset-top)] bg-[#fc9eb5]" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 h-[env(safe-area-inset-bottom)] bg-carta" aria-hidden />
      {/* Il primo luogo, all'alba: dove comincia il viaggio. */}
      <div className="relative min-h-40 flex-1" aria-hidden>
        {luogo && <img src={luogo.file} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover object-[50%_18%]" />}
        <p className="titolo ombra-dura absolute top-4 left-4 rounded-full bg-panna-50 px-4 py-1.5 text-lg font-bold text-inchiostro">Matemagica</p>
      </div>
      {/* Il foglio con la domanda; il gatto ci sta seduto sopra. */}
      <div className="animate-sale relative rounded-t-[2rem] bg-carta px-5 pt-6 pb-5 text-inchiostro">
        <img
          src="/personaggi/gatto.webp"
          alt=""
          draggable={false}
          className="animate-respiro-scatti pointer-events-none absolute right-6 bottom-full -mb-2 h-28 w-auto origin-bottom"
        />
        <h1 className="text-[2.3rem] leading-none font-bold">Perché sei qui?</h1>
        <p className="mt-1.5 font-bold text-inchiostro-chiaro">Scegli tutte quelle che vuoi.</p>
        <div className="mt-4 mb-5 flex flex-col gap-2.5">
          {MOTIVI.map((m) => {
            const attiva = motivi.includes(m.id);
            return (
              <button
                key={m.id}
                role="checkbox"
                aria-checked={attiva}
                onClick={() => {
                  suona('tap');
                  cambia(m.id);
                }}
                className={[
                  'flex min-h-[3.6rem] items-center gap-3 rounded-3xl px-4 py-2 text-left transition-transform duration-100 active:translate-y-1',
                  attiva ? 'bg-oro-400 shadow-[0_5px_0_var(--color-oro-600)]' : 'bg-panna-50 shadow-[0_5px_0_rgb(21_19_46/0.14)]',
                ].join(' ')}
              >
                <span className="w-8 text-center text-2xl">{m.icona}</span>
                <span className="flex-1 text-[1.15rem] leading-tight font-extrabold">{m.testo}</span>
                <span
                  aria-hidden
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${attiva ? 'animate-pop bg-inchiostro text-oro-400' : 'bg-inchiostro/10'}`}
                >
                  {attiva && <Icona nome="spunta" className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
        <Bottone
          freccia
          className="w-full"
          disabled={motivi.length === 0}
          onClick={() => {
            suona('stella');
            onFine(motivi.join(','), OBIETTIVO_INIZIALE);
          }}
        >
          Si parte
        </Bottone>
      </div>
    </div>
  );
}
