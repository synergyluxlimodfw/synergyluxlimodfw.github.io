import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

const CreateRideSchema = z.object({
  guestName:   z.string().min(1),
  destination: z.string().min(1),
  occasion:    z.string().optional(),
  temperature: z.number().int().min(60).max(90).default(72),
  music:       z.boolean().default(false),
  notes:       z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateRideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { guestName, destination, occasion, temperature, music, notes } = parsed.data;

  const eta = Math.floor(Math.random() * 21) + 15; // 15–35

  const ride = await prisma.ride.create({
    data: {
      guestName,
      destination,
      occasion:     occasion ?? null,
      chauffeurName: 'James',
      eta,
      temperature,
      music,
      notes:  notes ?? null,
      status: 'PREPARING',
    },
  });

  return NextResponse.json(ride, { status: 201 });
}
