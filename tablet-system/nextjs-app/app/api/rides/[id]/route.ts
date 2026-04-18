import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// ── GET /api/rides/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ride = await prisma.ride.findUnique({ where: { id: params.id } });
  if (!ride) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(ride);
}

// ── PATCH /api/rides/[id] ──────────────────────────────────────────────────

const PatchRideSchema = z.object({
  status: z.enum(['PREPARING', 'READY', 'ACTIVE', 'COMPLETE']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'OPERATOR' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchRideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const ride = await prisma.ride.findUnique({ where: { id: params.id } });
  if (!ride) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.ride.update({
    where: { id: params.id },
    data:  { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
