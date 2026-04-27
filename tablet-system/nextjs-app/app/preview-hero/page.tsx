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
    <>
      {/* z-index 0 — video fills the viewport */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position:      'fixed',
          top:            0,
          left:           0,
          width:         '100vw',
          height:        '100vh',
          objectFit:     'cover',
          zIndex:         0,
          pointerEvents: 'none',
        }}
      >
        <source src="/escalade-hero.mp4" type="video/mp4" />
      </video>

      {/* z-index 1 — dark overlay */}
      <div
        style={{
          position:      'fixed',
          top:            0,
          left:           0,
          width:         '100vw',
          height:        '100vh',
          background:    'rgba(0,0,0,0.5)',
          zIndex:         1,
          pointerEvents: 'none',
        }}
      />

      {/* PrestigeBackground — untouched, renders at its own z-index */}
      <PrestigeBackground intensity="minimal" />

      {/* z-index 10 — operator panel renders normally on top */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Suspense>
          <TabletPageInner />
        </Suspense>
      </div>
    </>
  );
}
