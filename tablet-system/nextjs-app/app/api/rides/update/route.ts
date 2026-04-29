/**
 * app/api/rides/update/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * PATCH — update fields on an existing ride.
 * Used by:
 *   app/operator/page.tsx → advanceTo() (status, start_time, end_time)
 *   app/operator/page.tsx → showBooking() (show_booking)
 *   lib/experienceStore.ts → setActive(), completeRide() (status)
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...fields } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 422 });
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 422 });
  }

  // Allowlist the columns that can be updated via this route
  const ALLOWED = new Set([
    'status', 'start_time', 'end_time', 'show_booking',
    'eta_minutes', 'vip_note', 'chauffeur',
  ]);

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED.has(k)) update[k] = v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No allowed fields provided' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('rides')
    .update(update)
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('[rides/update]', error);
    return NextResponse.json({ error: 'Failed to update ride' }, { status: 500 });
  }

  return NextResponse.json(data);
}
