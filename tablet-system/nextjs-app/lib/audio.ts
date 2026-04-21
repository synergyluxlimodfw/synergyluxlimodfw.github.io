/**
 * audio.ts — Web Audio helpers.
 *
 * Arrival chime is played synchronously inside the bell tap handler in
 * experience/page.tsx (guaranteed to satisfy Safari's autoplay policy).
 * Exit tone is played from ExitMoment's tap handler for the same reason.
 */

export function playExitTone(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    ([
      [220, 0],
      [440, 0],
    ] as [number, number][]).forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.start(t);
      osc.stop(t + 0.9);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch { /* silent */ }
}
