'use client';

/**
 * /preview-hero — video background preview page.
 *
 * Identical in behaviour to the root homepage (app/page.tsx) but replaces
 * the solid lux-black background with a looping muted autoplay video hero.
 *
 * To delete: remove this file and public/escalade-hero.mp4.
 * The root app/page.tsx is NOT modified by this file.
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OperatorPanel      from '@/components/OperatorPanel';
import Experience         from '@/components/Experience';
import PrestigeBackground from '@/components/PrestigeBackground';
import type { Session } from '@/lib/types';

function TabletPageInner() {
  const params      = useSearchParams();
  const isGuest     = params.get('guest')       === '1';
  const isReturn    = params.get('return')      === '1';
  const destination = params.get('destination') ?? '';
  const occasion    = params.get('occasion')    ?? '';
  const pickup      = params.get('pickup')      ?? '';

  const guestSession: Session = {
    name:       '',
    occasion,
    destination,
    vipNote:    pickup,
    chauffeur:  'Mr. Rodriguez',
    etaMinutes: 0,
  };

  const [session, setSession] = useState<Session | null>(
    isGuest ? guestSession : null
  );

  if (!session) {
    return <OperatorPanel onStart={setSession} />;
  }

  return <Experience session={session} isGuest={isGuest} isReturn={isReturn} />;
}

export default function PreviewHeroPage() {
  return (
    <div className="preview-hero-root" style={{ position: 'relative', minHeight: '100vh' }}>

      {/*
       * Scoped style: make OperatorPanel's root div transparent so the
       * video behind it shows through. Only applies inside .preview-hero-root.
       */}
      <style>{`
        .preview-hero-root .bg-lux-black {
          background-color: transparent !important;
        }
      `}</style>

      {/* ── Full-screen video background ──────────────────────── */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        style={{
          position:   'fixed',
          inset:       0,
          width:      '100%',
          height:     '100%',
          objectFit:  'cover',
          zIndex:     -2,
          pointerEvents: 'none',
        }}
      >
        <source src="/escalade-hero.mp4" type="video/mp4" />
      </video>

      {/* ── Dark overlay (opacity 0.5) ────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:        'fixed',
          inset:            0,
          background:      'rgba(0,0,0,0.5)',
          zIndex:          -1,
          pointerEvents:   'none',
        }}
      />

      {/* ── Existing prestige ambient glows ──────────────────── */}
      <PrestigeBackground intensity="minimal" />

      {/* ── Operator panel (same as homepage) ────────────────── */}
      <Suspense>
        <TabletPageInner />
      </Suspense>

    </div>
  );
}
