import { NextRequest, NextResponse } from 'next/server';

/** POST /api/booking/create — create booking + return Stripe checkout URL */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, pickup, dropoff, scheduledAt, price } = body;

  if (!customerId || !pickup || !dropoff || !scheduledAt || !price) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const BACKEND = process.env.BACKEND_URL;
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/booking/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  // Mock — redirect to main site booking section
  return NextResponse.json({
    booking: {
      id:          crypto.randomUUID(),
      customerId,
      pickup,
      dropoff,
      scheduledAt,
      price,
      status:      'PENDING',
    },
    checkoutUrl: `https://synergyluxlimodfw.github.io/#booking`,
  }, { status: 201 });
}
