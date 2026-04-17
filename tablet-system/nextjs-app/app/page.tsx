'use client';

import { useState } from 'react';
import OperatorPanel from '@/components/OperatorPanel';
import Experience from '@/components/Experience';
import type { Session } from '@/lib/types';

export default function TabletPage() {
  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return <OperatorPanel onStart={setSession} />;
  }

  return <Experience session={session} />;
}
