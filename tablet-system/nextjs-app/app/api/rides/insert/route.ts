/**
 * app/api/rides/insert/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — create a new ride in the rides table.
 * Used by: app/operator/page.tsx → handleLaunch()
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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

  if (!body.guest_name || !body.destination) {
    return NextResponse.json(
      { error: 'guest_name and destination are required' },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from('rides')
    .insert({
      guest_name:  String(body.guest_name).trim(),
      destination: String(body.destination).trim(),
      occasion:    body.occasion    ? String(body.occasion).trim()    : null,
      chauffeur:   body.chauffeur   ? String(body.chauffeur).trim()   : 'Mr. Rodriguez',
      eta_minutes: typeof body.eta_minutes === 'number' ? body.eta_minutes : 24,
      status:      body.status      ? String(body.status)             : 'preparing',
      vip_note:    body.vip_note    ? String(body.vip_note).trim()    : null,
      phone:       body.phone       ? String(body.phone).trim()       : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[rides/insert]', error);
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
