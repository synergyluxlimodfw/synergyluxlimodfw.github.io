import { NextRequest, NextResponse } from 'next/server';

/** POST /api/ride/[id]/complete */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const BACKEND = process.env.BACKEND_URL;
  if (BACKEND) {
    const res = await fetch(`${BACKEND}/ride/${params.id}/complete`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${process.env.DRIVER_TOKEN ?? ''}` },
    });
    return NextResponse.json(await res.json(), { status: res.status });
  }

  return NextResponse.json({ id: params.id, status: 'COMPLETED' });
}
