/**
 * app/api/sms/confirm/route.ts
 * POST { rideId } — fetches ride and sends booking confirmation SMS immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleBookingConfirmed } from '@/lib/sms';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: 'rideId required' }, { status: 400 });
    }

    const { data: ride, error } = await supabaseAdmin
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (error || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    await handleBookingConfirmed(ride);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[SMS /confirm]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
