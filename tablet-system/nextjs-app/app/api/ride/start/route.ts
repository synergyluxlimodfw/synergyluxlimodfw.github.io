import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ride/start
 * Mock — proxies to the Express backend if BACKEND_URL is set,
 * otherwise returns a simulated ride object.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, pickup, dropoff, chauffeurName, etaMinutes } = body;

  if (!name || !pickup || !dropoff || !chauffeurName || !etaMinutes) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const BACKEND = process.env.BACKEND_URL;

  // ── Proxy to real backend ──
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/ride/start`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.DRIVER_TOKEN ?? ''}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // ── Mock response ──
  const rideId = crypto.randomUUID();
  return NextResponse.json({
    ride: {
      id:           rideId,
      customerId:   crypto.randomUUID(),
      pickup,
      dropoff,
      status:       'ACTIVE',
      chauffeurName,
      etaMinutes:   parseInt(etaMinutes),
      createdAt:    new Date().toISOString(),
    },
    customer: {
      id:        crypto.randomUUID(),
      name,
      phone:     phone ?? '',
      createdAt: new Date().toISOString(),
    },
  }, { status: 201 });
}
