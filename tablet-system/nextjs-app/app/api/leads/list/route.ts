/**
 * app/api/leads/list/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * GET — aggregated leads pipeline: rides + rebook_requests + sms_conversations.
 * Used by: app/admin/page.tsx → refresh() (unified leads table)
 *
 * Returns { leads: UnifiedLead[], bookings: { ride_id, amount, payment_type }[] }
 * so the client can join amounts without a separate query.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [ridesRes, bookingsRes, rebooksRes, smsRes] = await Promise.all([
    supabase
      .from('rides')
      .select('id, created_at, guest_name, phone, client_phone, destination, occasion, status, source')
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('bookings')
      .select('ride_id, amount, payment_type')
      .limit(100),

    supabase
      .from('rebook_requests')
      .select('id, created_at, passenger_name, phone, destination, occasion, status, source, preferred_date')
      .order('created_at', { ascending: false })
      .limit(50),

    supabase
      .from('sms_conversations')
      .select('phone, content, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (ridesRes.error)  console.error('[leads/list] rides error',   ridesRes.error);
  if (rebooksRes.error) console.error('[leads/list] rebooks error', rebooksRes.error);
  if (smsRes.error)    console.error('[leads/list] sms error',      smsRes.error);

  return NextResponse.json({
    rides:    ridesRes.data   ?? [],
    bookings: bookingsRes.data ?? [],
    rebooks:  rebooksRes.data  ?? [],
    sms:      smsRes.data      ?? [],
  });
}
