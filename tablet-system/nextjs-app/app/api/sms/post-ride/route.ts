/**
 * app/api/sms/post-ride/route.ts
 * POST { rideId } — sends the post-ride thank-you + rebook link SMS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { handlePostRide } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { rideId } = await req.json();
    if (!rideId) {
      return NextResponse.json({ error: 'rideId required' }, { status: 400 });
    }

    await handlePostRide(rideId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[SMS /post-ride]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
