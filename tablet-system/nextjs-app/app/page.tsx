'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OperatorPanel from '@/components/OperatorPanel';
import Experience    from '@/components/Experience';
import type { Session } from '@/lib/types';

function TabletPageInner() {
  const params      = useSearchParams();
  const isGuest     = params.get('guest')       === '1';
  const isReturn    = params.get('return')      === '1';
  const destination = params.get('destination') ?? '';
  const occasion    = params.get('occasion')    ?? '';
  const pickup      = params.get('pickup')      ?? '';

  // When ?guest=1, pre-populate session from URL params so the
  // rebook card knows the destination/occasion without hitting Supabase.
  const guestSession: Session = {
    name:       '',
    occasion,
    destination,
    vipNote:    pickup,   // repurposed as pickup location for display
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

export default function TabletPage() {
  return (
    <Suspense>
      <TabletPageInner />
    </Suspense>
  );
}
