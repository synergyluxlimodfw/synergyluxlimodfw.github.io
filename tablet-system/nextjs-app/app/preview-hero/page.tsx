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
       * Scoped styles:
       * - bg-lux-black → transparent so the video shows through
       * - PrestigeBackground sits at z-index 2 (overrides its default z-index 0)
       * - Page content wrapper sits at z-index 10
       */}
      <style>{`
        .preview-hero-root .bg-lux-black {
          background-color: transparent !important;
        }
        .preview-hero-root > [aria-hidden]:not(video):not(div[style*="rgba"]) {
          z-index: 2 !important;
        }
        .preview-hero-root > div:last-child {
          position: relative;
          z-index: 10;
        }
      `}</style>

      {/* z-index 0 — video fills the viewport behind everything */}
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        style={{
          position:      'fixed',
          inset:          0,
          width:         '100%',
          height:        '100%',
          objectFit:     'cover',
          zIndex:         0,
          pointerEvents: 'none',
        }}
      >
        <source src="/escalade-hero.mp4" type="video/mp4" />
      </video>

      {/* z-index 1 — dark overlay keeps text readable */}
      <div
        aria-hidden
        style={{
          position:      'fixed',
          inset:          0,
          background:    'rgba(0,0,0,0.5)',
          zIndex:         1,
          pointerEvents: 'none',
        }}
      />

      {/* z-index 2 — PrestigeBackground ambient glows */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }} aria-hidden>
        <PrestigeBackground intensity="minimal" />
      </div>

      {/* z-index 10 — operator panel floats above all background layers */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Suspense>
          <TabletPageInner />
        </Suspense>
      </div>

    </div>
  );
}
