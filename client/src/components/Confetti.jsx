import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * Confetti — Fires confetti animation on mount.
 * Uses canvas-confetti library.
 */
export default function Confetti() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const duration = 4000;
    const end = Date.now() + duration;

    const colors = ['#8b5cf6', '#22d3ee', '#f472b6', '#fbbf24', '#34d399'];
    let lastFire = 0;
    const interval = 120; // Fire every 120ms instead of 16ms (60fps)

    const frame = () => {
      const now = Date.now();
      if (now - lastFire >= interval) {
        lastFire = now;
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }

      if (now < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return null;
}
