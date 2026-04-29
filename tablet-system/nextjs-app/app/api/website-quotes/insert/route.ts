/**
 * app/api/website-quotes/insert/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — insert a new website_quotes row.
 * Used by: marketing site calculator → confirmQuoteRequest()
 *
 * Replaces the direct anon-key Supabase insert that was in index.html.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    name, phone, service,
    date, time,
    pickup, dropoff,
    passengers,
    quoted_price,
    status = 'pending',
    sms_consent = false,
    sms_consent_timestamp = null,
  } = body as {
    name?: string;
    phone?: string;
    service?: string;
    date?: string;
    time?: string;
    pickup?: string;
    dropoff?: string;
    passengers?: number;
    quoted_price?: number;
    status?: string;
    sms_consent?: boolean;
    sms_consent_timestamp?: string | null;
  };

  const { data, error } = await supabase
    .from('website_quotes')
    .insert({
      name:        name        ?? null,
      phone:       phone       ?? null,
      service:     service     ?? null,
      date:        date        ?? null,
      time:        time        ?? null,
      pickup:      pickup      ?? null,
      dropoff:     dropoff     ?? null,
      passengers:  passengers  ?? 1,
      quoted_price: quoted_price ?? null,
      status,
      sms_consent,
      sms_consent_timestamp: sms_consent ? (sms_consent_timestamp ?? new Date().toISOString()) : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[website-quotes/insert] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
