import { NextRequest, NextResponse } from 'next/server';

/** PATCH /api/ride/[id]/update — update ETA */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { etaMinutes } = await req.json();

  if (!etaMinutes) {
    return NextResponse.json({ error: 'etaMinutes required' }, { status: 400 });
  }

  const BACKEND = process.env.BACKEND_URL;
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/ride/${params.id}/update`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.DRIVER_TOKEN ?? ''}`,
      },
      body: JSON.stringify({ etaMinutes }),
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  return NextResponse.json({ id: params.id, etaMinutes: parseInt(etaMinutes) });
}
