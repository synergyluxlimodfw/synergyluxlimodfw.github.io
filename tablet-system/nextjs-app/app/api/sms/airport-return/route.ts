/**
 * app/api/sms/airport-return/route.ts
 * POST { rideId } — sends the airport return ride booking link SMS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAirportReturn } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: 'rideId required' }, { status: 400 });
    }

    await sendAirportReturn(rideId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[SMS /airport-return]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
