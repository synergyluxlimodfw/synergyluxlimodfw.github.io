/**
 * app/api/tips/insert/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — record a tip selection in the tips table.
 * Used by: components/TipSelector.tsx → handleSelect()
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

  const { ride_id, guest_name, percent, stripe_key } = body;

  const { data, error } = await supabase
    .from('tips')
    .insert({
      ride_id:    ride_id    ?? null,
      guest_name: guest_name ? String(guest_name) : null,
      percent:    typeof percent === 'number' ? percent : null,
      stripe_key: stripe_key ? String(stripe_key) : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[tips/insert]', error);
    return NextResponse.json({ error: 'Failed to record tip' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
