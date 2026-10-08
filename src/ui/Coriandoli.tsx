import { useEffect, useRef } from 'react';

/**
 * Coriandoli a tutto schermo, disegnati su un canvas: oro, panna, pesca e
 * azzurro, i colori della carta. Partono dal basso come due fontane, cadono
 * e spariscono. Zero dipendenze, si smontano da soli.
 */
const COLORI = ['--color-oro-400', '--color-oro-300', '--color-panna-50', '--color-pesca', '--color-azzurro', '--color-tramonto'];

type Pezzo = { x: number; y: number; vx: number; vy: number; r: number; vr: number; w: number; h: number; c: string };

export function Coriandoli({ quanti = 140, durata = 3200 }: { quanti?: number; durata?: number }) {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = tela.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = window.innerWidth;
    const H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    g.scale(dpr, dpr);
    const stile = getComputedStyle(document.documentElement);
    const colori = COLORI.map((v) => stile.getPropertyValue(v).trim() || '#fff');
    const pezzi: Pezzo[] = Array.from({ length: quanti }, (_, i) => {
      const sinistra = i % 2 === 0;
      return {
        x: sinistra ? W * 0.15 : W * 0.85,
        y: H + 10,
        vx: (sinistra ? 1 : -1) * (2 + Math.random() * 5),
        vy: -(11 + Math.random() * 9) * (H / 800),
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        w: 6 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        c: colori[i % colori.length] ?? '#fff',
      };
    });
    const inizio = performance.now();
    let id = 0;
    const passo = (t: number) => {
      const trascorso = t - inizio;
      g.clearRect(0, 0, W, H);
      g.globalAlpha = Math.max(0, Math.min(1, (durata - trascorso) / 600));
      for (const p of pezzi) {
        p.vy += 0.32;
        p.vx *= 0.99;
        p.vy = Math.min(p.vy, 5);
        p.x += p.vx + Math.sin((t + p.w * 100) / 300) * 0.6;
        p.y += p.vy;
        p.r += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.r);
        g.scale(1, Math.abs(Math.cos(t / 200 + p.w)));
        g.fillStyle = p.c;
        g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        g.restore();
      }
      if (trascorso < durata) id = requestAnimationFrame(passo);
      else g.clearRect(0, 0, W, H);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [quanti, durata]);

  return <canvas ref={tela} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />;
}
