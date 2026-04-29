/**
 * app/api/rides/list/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * GET — query rides with optional filters.
 * Used by:
 *   app/admin/page.tsx → today's rides, all rides for leads pipeline
 *   app/experience/page.tsx → latest active ride (when no ?ride= param)
 *
 * Query params:
 *   today=true          — filter to rides created today (UTC)
 *   status=a,b,c        — comma-separated status values (IN filter)
 *   limit=N             — max rows (default 50, max 200)
 *   select=col1,col2    — comma-separated columns (default *)
 *   order=asc|desc      — created_at sort direction (default desc)
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { searchParams } = req.nextUrl;

  const todayOnly  = searchParams.get('today') === 'true';
  const statusRaw  = searchParams.get('status');
  const limitRaw   = searchParams.get('limit');
  const selectRaw  = searchParams.get('select');
  const orderDir   = searchParams.get('order') === 'asc' ? true : false;

  const limit      = Math.min(Math.max(parseInt(limitRaw ?? '50', 10) || 50, 1), 200);
  const columns    = selectRaw ?? '*';

  let query = supabase
    .from('rides')
    .select(columns)
    .order('created_at', { ascending: orderDir })
    .limit(limit);

  if (todayOnly) {
    const today = new Date().toISOString().split('T')[0];
    query = query.gte('created_at', today);
  }

  if (statusRaw) {
    const statuses = statusRaw.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0]);
    } else if (statuses.length > 1) {
      query = query.in('status', statuses);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[rides/list]', error);
    return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
