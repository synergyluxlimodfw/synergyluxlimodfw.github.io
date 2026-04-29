/**
 * app/api/admin/dashboard-data/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * GET — fetches all data needed for the admin dashboard top sections
 *       in a single round-trip.
 * Used by: app/admin/page.tsx → refresh()
 *
 * Returns:
 *   todayRides:      rides created today
 *   rebookRequests:  latest 20 rebook requests
 *   quotes:          all website_quotes ordered by created_at desc
 *   todayStats:      { rides, revenue, pending }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().split('T')[0];

  const [ridesRes, rebooksRes, quotesRes] = await Promise.all([
    supabase
      .from('rides')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false }),

    supabase
      .from('rebook_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),

    supabase
      .from('website_quotes')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (ridesRes.error)  console.error('[dashboard-data] rides error',   ridesRes.error);
  if (rebooksRes.error) console.error('[dashboard-data] rebooks error', rebooksRes.error);
  if (quotesRes.error) console.error('[dashboard-data] quotes error',  quotesRes.error);

  const todayRides     = ridesRes.data   ?? [];
  const rebookRequests = rebooksRes.data  ?? [];
  const quotes         = quotesRes.data   ?? [];

  const todayStats = {
    rides:   todayRides.length,
    revenue: todayRides.length * 165,
    pending: rebookRequests.filter((r: { status: string }) => r.status === 'pending').length,
  };

  return NextResponse.json({ todayRides, rebookRequests, quotes, todayStats });
}
