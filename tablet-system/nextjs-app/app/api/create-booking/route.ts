/**
 * app/api/create-booking/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — create a booking in the bookings_calendar table.
 *
 * Accepts: name, phone, email, pickup_location, destination,
 *          date, time, service, occasion, notes
 * Required: name, pickup_location, destination, date, time
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface CreateBookingBody {
  name:             string;
  phone?:           string;
  email?:           string;
  pickup_location:  string;
  destination:      string;
  date:             string;
  time:             string;
  service?:         string;
  occasion?:        string;
  notes?:           string;
}

const REQUIRED: (keyof CreateBookingBody)[] = [
  'name',
  'pickup_location',
  'destination',
  'date',
  'time',
];

export async function POST(req: NextRequest) {
  let body: Partial<CreateBookingBody>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate required fields
  const missing = REQUIRED.filter(
    field => !body[field] || String(body[field]).trim() === ''
  );

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 422 }
    );
  }

  // Map to bookings_calendar schema.
  // pickup_location is stored in the occasion field as context since
  // the table has no dedicated pickup column.
  const occasionValue = [
    body.occasion?.trim(),
    body.pickup_location?.trim() ? `Pickup: ${body.pickup_location.trim()}` : null,
  ]
    .filter(Boolean)
    .join(' · ') || null;

  const { data, error } = await supabase
    .from('bookings_calendar')
    .insert({
      client_name:  body.name!.trim(),
      client_phone: body.phone?.trim()       || null,
      client_email: body.email?.trim()       || null,
      service:      body.service?.trim()     || null,
      date:         body.date!.trim(),
      time_slot:    body.time!.trim(),
      destination:  body.destination!.trim(),
      occasion:     occasionValue,
      status:       'scheduled',
    })
    .select()
    .single();

  if (error) {
    console.error('[create-booking] Supabase error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
