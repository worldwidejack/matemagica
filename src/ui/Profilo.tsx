import { useState } from 'react';
import { suona } from '@/audio/sfx';
import { STORIE } from '@/content/storie';
import { GIOCHI, ORDINE_GIOCHI } from '@/games/registro';
import { MEDAGLIE, grado, prossimaSoglia, type DatiMedaglie } from '@/profilo/medaglie';
import { OBIETTIVI } from '@/profilo/giornata';
import { SALVA_FIAMMA_MAX, giornoLocale, giornoMeno, livelloDa, statoFiamma } from '@/profilo/progressione';
import { useProfilo } from '@/profilo/store';
import { IconaGioco, Medaglione, Scheda } from './kit';
import { giocoSbloccato } from './progressi';
import { Installa } from './Installa';

/** Il profilo: chi sei nel gioco, cosa hai fatto, le medaglie, le impostazioni. */
export function Profilo() {
  const p = useProfilo();
  const oggi = giornoLocale(new Date());
  const liv = livelloDa(p.xp);
  const fiamma = statoFiamma(p.streak, oggi, p.salvaFiamma);
  const stelleTot = Object.values(p.stelleLivelli).reduce<number>((s, n) => s + n, 0);
  const dati: DatiMedaglie = {
    stat: p.stat,
    partite: p.partite,
    xp: p.xp,
    livello: liv.livello,
    carte: p.carte.length,
    stelleLivelli: p.stelleLivelli,
  };
  const prese = MEDAGLIE.filter((m) => grado(m, dati) > 0).length;

  return (
    <div className="cielo-stellato min-h-full px-4 pt-4 pb-28">
      <h2 className="text-4xl font-semibold text-panna-50">Profilo</h2>
      <div className="mt-4">
        <Installa />
      </div>

      {/* Livello e grado */}
      <Scheda className="mt-4">
        <div className="flex items-center gap-4">
          <span className="titolo flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-oro-400 text-3xl font-semibold shadow-[0_0_0_3px_var(--color-oro-600)]">
            {liv.livello}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold tracking-wider text-inchiostro-chiaro uppercase">Livello {liv.livello}</p>
            <p className="titolo text-2xl font-semibold">{liv.grado}</p>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-panna-200">
              <div className="h-full rounded-full bg-oro-500" style={{ width: `${(liv.xpNelLivello / liv.xpPerIlProssimo) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-inchiostro-chiaro">
              {liv.xpNelLivello} / {liv.xpPerIlProssimo} XP per il livello {liv.livello + 1}
            </p>
          </div>
        </div>
      </Scheda>

      {/* Fiamma e calendario */}
      <Scheda className="mt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="titolo text-2xl font-semibold">
              🔥 {fiamma.giorni} {fiamma.giorni === 1 ? 'giorno' : 'giorni'}
            </p>
            <p className="text-sm text-inchiostro-chiaro">
              Record: {Math.max(p.stat.streakMax, fiamma.giorni)} · {fiamma.protetta ? 'protetta da un salva-fiamma' : 'di fila'}
            </p>
          </div>
          <div className="text-right" aria-label={`${p.salvaFiamma} salva-fiamma su ${SALVA_FIAMMA_MAX}`}>
            <p className="text-2xl tracking-widest">
              {Array.from({ length: SALVA_FIAMMA_MAX }, (_, i) => (
                <span key={i} className={i < p.salvaFiamma ? '' : 'opacity-25 grayscale'}>
                  🧊
                </span>
              ))}
            </p>
            <p className="text-xs text-inchiostro-chiaro">salva-fiamma</p>
          </div>
        </div>
        <Calendario giorni={p.giorniGiocati} oggi={oggi} />
        <p className="mt-2 text-xs text-inchiostro-chiaro">Si vince un salva-fiamma a 3 giorni di fila e poi ogni 7.</p>
      </Scheda>

      {/* Numeri */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Numero valore={p.partite} etichetta="partite" />
        <Numero valore={stelleTot} etichetta="stelle" />
        <Numero valore={`${p.carte.length}/${STORIE.length}`} etichetta="carte" />
        <Numero valore={p.stat.giuste} etichetta="risposte giuste" />
        <Numero valore={p.stat.rompicapoRisolti} etichetta="rompicapo risolti" />
        <Numero valore={p.stat.comboMax} etichetta="combo record" />
      </div>

      {/* Medaglie */}
      <h3 className="mt-6 text-2xl font-semibold text-panna-50">
        Medaglie <span className="text-base text-panna-100/60">{prese}/{MEDAGLIE.length}</span>
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2">
        {MEDAGLIE.map((m) => {
          const g = grado(m, dati);
          const v = m.valore(dati);
          const soglia = prossimaSoglia(m, dati);
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-panna-100 px-3 py-2.5 text-inchiostro shadow">
              <Medaglione icona={m.icona} grado={g} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="titolo text-lg font-semibold">{m.nome}</span>
                  <span className="text-xs text-inchiostro-chiaro tabular-nums">
                    {g === 3 ? 'oro ✓' : `${Math.min(v, soglia)}/${soglia}`}
                  </span>
                </div>
                <p className="text-sm text-inchiostro-chiaro">{m.descrizione.replace('{n}', String(soglia))}</p>
                <div className="mt-1 flex gap-1">
                  {m.soglie.map((s, i) => (
                    <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-panna-200">
                      <span
                        className="block h-full rounded-full bg-oro-500"
                        style={{ width: `${Math.min(1, Math.max(0, (v - (m.soglie[i - 1] ?? 0)) / (s - (m.soglie[i - 1] ?? 0)))) * 100}%` }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Bravura per gioco */}
      <h3 className="mt-6 text-2xl font-semibold text-panna-50">Bravura</h3>
      <Scheda className="mt-3">
        <ul className="flex flex-col gap-2.5">
          {ORDINE_GIOCHI.filter((g) => giocoSbloccato(g, p.stelleLivelli)).map((g) => {
            const b = p.bravura[g] ?? 0;
            return (
              <li key={g} className="flex items-center gap-3">
                <IconaGioco gioco={g} className="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-sm">
                    <span className="truncate">{GIOCHI[g].titolo}</span>
                    <span className="font-bold tabular-nums">{b.toFixed(1)}</span>
                  </span>
                  <span className="mt-1 block h-2 overflow-hidden rounded-full bg-panna-200">
                    <span className="block h-full rounded-full bg-oro-500" style={{ width: `${b * 10}%` }} />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Scheda>

      <Impostazioni />
    </div>
  );
}

function Numero({ valore, etichetta }: { valore: number | string; etichetta: string }) {
  return (
    <div className="rounded-2xl bg-panna-100 px-2 py-3 text-center text-inchiostro shadow">
      <p className="titolo text-2xl font-semibold tabular-nums">{valore}</p>
      <p className="text-xs leading-tight text-inchiostro-chiaro">{etichetta}</p>
    </div>
  );
}

const GIORNI_SETTIMANA = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

/** Le ultime 5 settimane, da lunedì a domenica: i giorni giocati sono accesi. */
function Calendario({ giorni, oggi }: { giorni: string[]; oggi: string }) {
  const giocati = new Set(giorni);
  // Giorno della settimana di oggi, con la settimana che parte da lunedì.
  const dow = (new Date().getDay() + 6) % 7;
  // L'ultima riga finisce con la domenica di questa settimana.
  const fine = giornoMeno(oggi, -(6 - dow));
  const allineate = Array.from({ length: 35 }, (_, i) => giornoMeno(fine, 34 - i));
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-inchiostro-chiaro">
        {GIORNI_SETTIMANA.map((g, i) => (
          <span key={i}>{g}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {allineate.map((g) => {
          const futuro = g > oggi;
          const on = giocati.has(g);
          return (
            <span
              key={g}
              title={g}
              className={[
                'flex aspect-square items-center justify-center rounded-lg text-[11px] tabular-nums',
                on ? 'bg-oro-400 font-bold text-inchiostro' : futuro ? 'bg-transparent text-panna-200' : 'bg-panna-200/60 text-inchiostro-chiaro',
                g === oggi ? 'ring-2 ring-notte-800' : '',
              ].join(' ')}
            >
              {on ? '🔥' : Number(g.slice(8))}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Impostazioni() {
  const muto = useProfilo((p) => p.muto);
  const setMuto = useProfilo((p) => p.setMuto);
  const vibrazione = useProfilo((p) => p.vibrazione);
  const setVibrazione = useProfilo((p) => p.setVibrazione);
  const obiettivo = useProfilo((p) => p.benvenuto.obiettivo);
  const setObiettivo = useProfilo((p) => p.setObiettivo);
  const azzera = useProfilo((p) => p.azzera);
  const [conferma, setConferma] = useState(0);

  return (
    <>
      <h3 className="mt-6 text-2xl font-semibold text-panna-50">Impostazioni</h3>
      <Scheda className="mt-3 flex flex-col gap-1 p-2">
        <Interruttore etichetta="Suoni" acceso={!muto} onCambia={(v) => setMuto(!v)} />
        <Interruttore etichetta="Vibrazione" acceso={vibrazione} onCambia={setVibrazione} />
        <div className="px-3 py-2">
          <p className="mb-2">Obiettivo del giorno</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Obiettivo del giorno">
            {OBIETTIVI.map((o) => (
              <button
                key={o.partite}
                role="radio"
                aria-checked={obiettivo === o.partite}
                onClick={() => {
                  suona('tap');
                  setObiettivo(o.partite);
                }}
                className={`flex-1 rounded-2xl px-2 py-2 text-sm ${obiettivo === o.partite ? 'bg-oro-400 font-bold' : 'bg-panna-50 text-inchiostro-chiaro'}`}
              >
                {o.nome}
                <span className="block text-xs">
                  {o.partite} {o.partite === 1 ? 'partita' : 'partite'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Scheda>
      <div className="mt-6 text-center">
        {conferma === 0 ? (
          <button onClick={() => setConferma(1)} className="text-sm text-panna-100/50 underline underline-offset-4">
            Cancella i progressi
          </button>
        ) : (
          <Scheda className="text-center">
            <p className="font-bold">Cancellare tutto?</p>
            <p className="mt-1 text-sm text-inchiostro-chiaro">Stelle, livelli, carte, medaglie e fiamma. Non si torna indietro.</p>
            <div className="mt-3 flex justify-center gap-3">
              <button onClick={() => setConferma(0)} className="rounded-full bg-panna-50 px-5 py-2 font-bold">
                No, tienili
              </button>
              <button
                onClick={() => {
                  azzera();
                  window.scrollTo(0, 0);
                }}
                className="rounded-full bg-pericolo-400 px-5 py-2 font-bold text-panna-50"
              >
                Sì, cancella
              </button>
            </div>
          </Scheda>
        )}
      </div>
    </>
  );
}

function Interruttore({ etichetta, acceso, onCambia }: { etichetta: string; acceso: boolean; onCambia: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={acceso}
      onClick={() => {
        onCambia(!acceso);
        suona('tap');
      }}
      className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-left"
    >
      <span>{etichetta}</span>
      <span className={`relative h-7 w-12 rounded-full transition-colors ${acceso ? 'bg-oro-500' : 'bg-panna-200'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-panna-50 shadow transition-[left] ${acceso ? 'left-[1.4rem]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
