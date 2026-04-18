'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import OperatorPanel from '@/components/OperatorPanel';
import Experience from '@/components/Experience';
import type { Session } from '@/lib/types';

const GUEST_SESSION: Session = {
  name:        '',
  occasion:    '',
  destination: '',
  vipNote:     '',
  chauffeur:   'W. Rodriguez',
  etaMinutes:  0,
};

function TabletPageInner() {
  const params  = useSearchParams();
  const isGuest = params.get('guest') === '1';

  const [session, setSession] = useState<Session | null>(isGuest ? GUEST_SESSION : null);

  if (!session) {
    return <OperatorPanel onStart={setSession} />;
  }

  return <Experience session={session} />;
}

export default function TabletPage() {
  return (
    <Suspense>
      <TabletPageInner />
    </Suspense>
  );
}
