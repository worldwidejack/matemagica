import { useRef, useState, type PointerEvent as PE } from 'react';
import type { ArcadeGame, ArcadeViewProps } from '@/engine/cartuccia';
import { suona } from '@/audio/sfx';
import { genera, giusta, risultato, tempo, type Lato, type RoundPiuGrande } from './logica';

/** Quanti px di spinta verso il basso bastano perché l'altalena ceda. */
const SPINTA = 16;

/**
 * «Oltre la porta» (14/11): le due espressioni sono due pesi su un'altalena ferma.
 * Si spinge giù col dito quello che pesa di più; l'altalena cede, poi si muove
 * davvero secondo i valori: se avevi ragione resta giù dalla tua parte, se no
 * scatta dall'altra e il peso giusto si illumina. Il gesto è premere in basso.
 */
function Vista({ round, onAnswer, locked, given, correct }: ArcadeViewProps<RoundPiuGrande, Lato>) {
  const feedback = correct !== null;
  const vincente: Lato = round.a.valore > round.b.valore ? 'a' : 'b';
  const [premuto, setPremuto] = useState<{ lato: Lato; dy: number } | null>(null);
  const inizio = useRef<{ y: number; id: number; lato: Lato } | null>(null);
  const dato = useRef(false);

  const dai = (lato: Lato) => {
    if (dato.current) return;
    dato.current = true;
    onAnswer(lato);
  };

  const giu = (lato: Lato) => (e: PE<HTMLDivElement>) => {
    if (locked || feedback || dato.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inizio.current = { y: e.clientY, id: e.pointerId, lato };
    setPremuto({ lato, dy: 0 });
    suona('tap');
  };
  const muovi = (e: PE<HTMLDivElement>) => {
    const i = inizio.current;
    if (!i || i.id !== e.pointerId) return;
    const dy = Math.max(0, e.clientY - i.y);
    setPremuto({ lato: i.lato, dy });
    if (dy > SPINTA) {
      inizio.current = null;
      dai(i.lato);
    }
  };
  const su = (e: PE<HTMLDivElement>) => {
    const i = inizio.current;
    if (!i || i.id !== e.pointerId) return;
    inizio.current = null;
    // Anche un tocco secco spinge: il peso è già sceso sotto il dito.
    dai(i.lato);
  };

  // L'angolo dell'asse: positivo = scende la destra (b).
  const segno = (l: Lato) => (l === 'a' ? -1 : 1);
  let angolo = 0;
  if (feedback) {
    const diff = Math.abs(round.a.valore - round.b.valore);
    const scala = Math.max(Math.abs(round.a.valore), Math.abs(round.b.valore), 1);
    angolo = segno(vincente) * (6 + Math.min(9, (diff / scala) * 60));
  } else if (premuto) {
    angolo = segno(premuto.lato) * (3 + Math.min(4, premuto.dy * 0.25));
  }

  const peso = (lato: Lato) => {
    const e = round[lato];
    const scelto = (given ?? premuto?.lato) === lato;
    const giustoQui = feedback && lato === vincente;
    const sbagliatoQui = feedback && given === lato && !correct;
    const lungo = e.testo.length;
    const corpo = lungo > 11 ? 'text-xl' : lungo > 7 ? 'text-2xl' : 'text-[2rem]';
    return (
      <div
        key={lato}
        onPointerDown={giu(lato)}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerCancel={su}
        className={[
          'absolute bottom-full mb-1 flex h-[88px] w-[47%] touch-none flex-col items-center justify-center rounded-2xl border-2 px-2 select-none',
          lato === 'a' ? 'left-0' : 'right-0',
          giustoQui
            ? 'border-oro-600 bg-oro-400 text-inchiostro shadow-[0_0_30px_var(--color-oro-500)]'
            : sbagliatoQui
              ? 'border-pericolo-600 bg-pericolo-400 text-panna-50'
              : 'border-panna-200 bg-panna-100 text-inchiostro',
          scelto && !feedback ? 'translate-y-1 shadow-none' : 'shadow-[0_5px_0_var(--color-panna-200)]',
          'transition-[transform,box-shadow,background-color] duration-100',
        ].join(' ')}
      >
        <span className={`titolo leading-none font-semibold whitespace-nowrap tabular-nums ${corpo}`}>{e.testo}</span>
        <span
          className={`mt-1.5 h-6 text-lg leading-6 font-bold tabular-nums transition-opacity duration-200 ${feedback ? 'opacity-90' : 'opacity-0'}`}
        >
          {risultato(e.valore)}
        </span>
        {!feedback && !premuto && (
          <span aria-hidden className="animate-respiro absolute -bottom-6 text-sm text-panna-100/40">
            ▼
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-center text-panna-100/60">Spingi giù il più pesante</p>
      <div className="relative mt-[104px] h-[110px] w-full max-w-[360px]">
        {/* L'asse: ruota attorno al perno; i pesi ci stanno sopra e girano con lui. */}
        <div
          className="absolute inset-x-0 top-0 h-3.5 rounded-full border-2 border-inchiostro bg-oro-500"
          style={{
            transform: `rotate(${angolo}deg)`,
            transformOrigin: '50% 50%',
            transition: feedback
              ? 'transform 520ms cubic-bezier(.3,1.7,.5,1)'
              : 'transform 90ms ease-out',
          }}
        >
          {peso('a')}
          {peso('b')}
        </div>
        {/* Il perno. */}
        <svg viewBox="0 0 60 56" className="absolute top-2 left-1/2 h-14 w-[60px] -translate-x-1/2" aria-hidden>
          <path d="M30 2 56 54H4Z" fill="var(--color-notte-600)" stroke="var(--color-inchiostro)" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="30" cy="8" r="5" fill="var(--color-oro-300)" stroke="var(--color-inchiostro)" strokeWidth="2" />
        </svg>
        <div className="absolute inset-x-6 top-[66px] h-1.5 rounded-full bg-notte-950/60" />
      </div>
    </div>
  );
}

export const piuGrande: ArcadeGame<RoundPiuGrande, Lato> = {
  id: 'piu-grande',
  mode: 'arcade',
  title: 'Chi è più grande?',
  hint: 'Spingi giù l’espressione che pesa di più. Stimare va benissimo.',
  generate: genera,
  View: Vista,
  check: giusta,
  timeFor: (round, d) => tempo(d, round),
  fluido: true,
  reazione: (giusta) => (giusta ? 750 : 1300),
};
