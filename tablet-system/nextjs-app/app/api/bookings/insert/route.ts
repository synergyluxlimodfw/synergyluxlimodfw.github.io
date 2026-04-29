/**
 * app/api/bookings/insert/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — record a booking (Stripe payment intent) in the bookings table.
 * Used by: components/ScreenBooking.tsx → openStripe()
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

  const { ride_id, service, amount, deposit, stripe_link, payment_type } = body;

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ride_id:      ride_id      ?? null,
      service:      service      ? String(service)      : null,
      amount:       typeof amount  === 'number' ? amount  : null,
      deposit:      typeof deposit === 'number' ? deposit : null,
      stripe_link:  stripe_link  ? String(stripe_link)  : null,
      payment_type: payment_type ? String(payment_type) : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[bookings/insert]', error);
    return NextResponse.json({ error: 'Failed to record booking' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
