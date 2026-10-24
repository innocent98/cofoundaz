import confetti from 'canvas-confetti';

/**
 * A short brand-coloured confetti burst for a win (a deal closed won). It never
 * throws and is skipped under prefers-reduced-motion, where the page still tells
 * the user in words.
 */
export function celebrate(): void {
  try {
    void confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2D5A3F', '#D89A6E', '#9C5B34', '#B5D4C0'], // colour-ok: canvas-confetti paints on a <canvas>; it cannot resolve CSS variables
      disableForReducedMotion: true,
    });
  } catch {
    /* a missing canvas (old browser, test env) must never break closing a deal */
  }
}
