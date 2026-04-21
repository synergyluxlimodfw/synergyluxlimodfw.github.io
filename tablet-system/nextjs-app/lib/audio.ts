/**
 * audio.ts — Safari-compatible Web Audio helpers.
 *
 * Safari requires AudioContext to be created synchronously inside a direct
 * user gesture handler (onClick / onTouchStart). No async/await, no
 * setTimeout, no Promise chains around context creation or osc.start().
 *
 * All tones are scheduled via ctx.currentTime offsets so multiple notes
 * can be queued in a single context without any JS-level delays.
 */

export function createAndPlayTone(
  frequencies: number[],
  delays: number[],
  duration: number,
  volume: number = 0.08,
): void {
  // Must be called synchronously from a user gesture
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    frequencies.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type            = 'sine';
      osc.frequency.value = freq;

      const start = ctx.currentTime + (delays[i] ?? 0);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.start(start);
      osc.stop(start + duration + 0.1);
    });
  } catch { /* silent — unsupported or policy blocked */ }
}

/** G4 → C5 → E5 ascending chime (scheduled in one context, no JS delays) */
export function playArrivalChime(): void {
  createAndPlayTone([392, 523, 659], [0, 0.18, 0.36], 0.6, 0.08);
}

/** Soft two-note exit tone */
export function playExitTone(): void {
  createAndPlayTone([220, 440], [0, 0], 0.8, 0.06);
}
