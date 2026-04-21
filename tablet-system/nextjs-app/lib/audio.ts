/**
 * audio.ts — preload-based audio unlock strategy.
 *
 * On mount, preloadAudio() plays a silent WAV to unlock the browser's
 * autoplay policy. Subsequent AudioContext calls then work without
 * requiring a user gesture.
 */

// Silent 0.1s WAV — used to pre-unlock audio on mount
export const SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

export function preloadAudio(): void {
  try {
    const audio = new Audio(SILENT_WAV);
    audio.volume = 0;
    audio.play().catch(() => {
      // Will unlock on first interaction instead
    });
  } catch { /* silent */ }
}

export function playArrivalChime(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();

    ([
      [392, 0],
      [523, 0.18],
      [659, 0.36],
    ] as [number, number][]).forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.7);
    });

    setTimeout(() => ctx.close(), 2000);
  } catch { /* silent */ }
}

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
