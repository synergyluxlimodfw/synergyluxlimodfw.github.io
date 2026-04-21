'use client';

/**
 * PrestigeBackground — tiered warm starlight background system.
 *
 * intensity variants:
 *   'full'    — passenger screen   — 200 stars, 4 concurrent twinkles, full glow
 *   'subtle'  — operator console   — 80 barely-perceptible stars, 1 twinkle max
 *   'light'   — Amirah page        — warm amber glow only, no canvas
 *   'minimal' — root / marketing   — single soft glow layer, no canvas
 *
 * position: fixed, inset 0, z-index 0, pointer-events: none
 * All page content must sit at z-10 or higher.
 */

import { useEffect, useRef } from 'react';

export interface PrestigeBackgroundProps {
  intensity: 'full' | 'subtle' | 'light' | 'minimal';
}

// ─── Canvas star types ────────────────────────────────────────────────────────

type TwinkleState = 'idle' | 'brightening' | 'dimming';

interface Star {
  x:              number;
  y:              number;
  baseRadius:     number;
  peakRadius:     number;
  currentRadius:  number;
  radiusSpeed:    number;
  baseOpacity:    number;
  currentOpacity: number;
  twinkleState:   TwinkleState;
  twinkleTarget:  number;
  twinkleSpeed:   number;
}

// ─── Per-intensity star config ────────────────────────────────────────────────

const STAR_CFG = {
  full: {
    count:        200,
    baseOpMin:    0.06,  baseOpRange:  0.14,  // 0.06–0.20
    peakOpMin:    0.85,  peakOpRange:  0.10,  // 0.85–0.95
    baseRadMin:   0.8,   baseRadRange: 1.0,   // 0.8–1.8 px
    peakRadMin:   2.0,   peakRadRange: 1.0,   // 2.0–3.0 px
    maxActive:    4,
    prob:         0.007,                       // ~1 new twinkle per 2.5s @60fps
  },
  subtle: {
    count:        80,
    baseOpMin:    0.04,  baseOpRange:  0.08,  // 0.04–0.12
    peakOpMin:    0.30,  peakOpRange:  0.05,  // 0.30–0.35
    baseRadMin:   0.5,   baseRadRange: 0.5,   // 0.5–1.0 px
    peakRadMin:   1.2,   peakRadRange: 0.3,   // 1.2–1.5 px
    maxActive:    1,
    prob:         0.00125,                     // ~1 new twinkle per 8s @60fps
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrestigeBackground({ intensity }: PrestigeBackgroundProps) {
  const hasCanvas = intensity === 'full' || intensity === 'subtle';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!hasCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seeded deterministic random — avoids SSR / client hydration mismatches
    const rng = (seed: number) => {
      const x = Math.sin(seed + 1) * 43758.5453123;
      return x - Math.floor(x);
    };

    const cfg = STAR_CFG[intensity as 'full' | 'subtle'];

    const stars: Star[] = Array.from({ length: cfg.count }, (_, i) => {
      const base       = rng(i * 5 + 1) * cfg.baseOpRange + cfg.baseOpMin;
      const baseRadius = rng(i * 5 + 3) * cfg.baseRadRange + cfg.baseRadMin;
      const peakRadius = rng(i * 7 + 9) * cfg.peakRadRange + cfg.peakRadMin;
      return {
        x:              rng(i * 5)     * window.innerWidth,
        y:              rng(i * 5 + 2) * window.innerHeight,
        baseRadius,
        peakRadius,
        currentRadius:  baseRadius,
        radiusSpeed:    0,
        baseOpacity:    base,
        currentOpacity: base,
        twinkleState:   'idle' as TwinkleState,
        twinkleTarget:  rng(i * 5 + 4) * cfg.peakOpRange + cfg.peakOpMin,
        twinkleSpeed:   0,
      };
    });

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Maybe wake up a new idle star
      const activeCount = stars.filter(s => s.twinkleState !== 'idle').length;
      if (activeCount < cfg.maxActive && Math.random() < cfg.prob) {
        const idle = stars.filter(s => s.twinkleState === 'idle');
        if (idle.length > 0) {
          const star   = idle[Math.floor(Math.random() * idle.length)];
          const frames = 180 + Math.random() * 120; // 3–5s per phase at 60fps
          star.twinkleSpeed = (star.twinkleTarget - star.baseOpacity) / frames;
          star.radiusSpeed  = (star.peakRadius    - star.baseRadius)  / frames;
          star.twinkleState = 'brightening';
        }
      }

      for (const star of stars) {
        if (star.twinkleState === 'brightening') {
          star.currentOpacity += star.twinkleSpeed;
          star.currentRadius  += star.radiusSpeed;
          if (star.currentOpacity >= star.twinkleTarget) {
            star.currentOpacity = star.twinkleTarget;
            star.currentRadius  = star.peakRadius;
            star.twinkleState   = 'dimming';
          }
        } else if (star.twinkleState === 'dimming') {
          star.currentOpacity -= star.twinkleSpeed;
          star.currentRadius  -= star.radiusSpeed;
          if (star.currentOpacity <= star.baseOpacity) {
            star.currentOpacity = star.baseOpacity;
            star.currentRadius  = star.baseRadius;
            star.twinkleState   = 'idle';
          }
        }

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.currentRadius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,248,220,${star.currentOpacity.toFixed(3)})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [hasCanvas, intensity]);

  return (
    <div
      aria-hidden
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
      }}
    >
      {/* ── Ambient glow layers ─────────────────────────────── */}

      {/* Primary glow — top-center (all intensities) */}
      {intensity === 'full' && (
        <div style={{
          position:      'fixed',
          top:           '-100px',
          left:          '50%',
          width:         '600px',
          height:        '600px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(212,175,90,0.05) 0%, transparent 70%)',
          animation:     'ambientPulseCenter 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      {intensity === 'subtle' && (
        <div style={{
          position:      'fixed',
          top:           '-120px',
          left:          '50%',
          width:         '600px',
          height:        '600px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(212,175,90,0.025) 0%, transparent 70%)',
          animation:     'ambientPulseCenter 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      {intensity === 'light' && (
        <div style={{
          position:      'fixed',
          top:           '-100px',
          left:          '50%',
          width:         '700px',
          height:        '500px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(212,175,90,0.018) 0%, transparent 70%)',
          animation:     'ambientPulseCenter 10s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      {intensity === 'minimal' && (
        <div style={{
          position:      'fixed',
          top:           '-80px',
          left:          '50%',
          width:         '800px',
          height:        '500px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(212,175,90,0.03) 0%, transparent 70%)',
          animation:     'ambientPulseCenter 12s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Secondary glow — bottom-right (full + subtle + light) */}
      {intensity === 'full' && (
        <div style={{
          position:      'fixed',
          bottom:        0,
          right:         0,
          width:         '400px',
          height:        '400px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(232,198,112,0.035) 0%, transparent 70%)',
          animation:     'ambientPulse 8s ease-in-out 4s infinite',
          pointerEvents: 'none',
        }} />
      )}
      {intensity === 'subtle' && (
        <div style={{
          position:      'fixed',
          bottom:        '-80px',
          right:         '-80px',
          width:         '400px',
          height:        '400px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(232,198,112,0.018) 0%, transparent 70%)',
          animation:     'ambientPulse 8s ease-in-out 4s infinite',
          pointerEvents: 'none',
        }} />
      )}
      {intensity === 'light' && (
        <div style={{
          position:      'fixed',
          bottom:        0,
          right:         0,
          width:         '500px',
          height:        '500px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(232,198,112,0.012) 0%, transparent 70%)',
          animation:     'ambientPulse 10s ease-in-out 5s infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Tertiary glow — center-left (full only) */}
      {intensity === 'full' && (
        <div style={{
          position:      'fixed',
          top:           '40%',
          left:          '10%',
          width:         '300px',
          height:        '300px',
          borderRadius:  '50%',
          background:    'radial-gradient(circle, rgba(212,175,90,0.025) 0%, transparent 65%)',
          animation:     'ambientPulse 12s ease-in-out 8s infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Canvas starlight (full + subtle only) ───────────── */}
      {hasCanvas && (
        <canvas
          ref={canvasRef}
          style={{
            position:      'fixed',
            inset:         0,
            zIndex:        1,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
