/**
 * app/api/leads/insert/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — insert a new lead row.
 * Used by: marketing site booking, FIFA, and affiliate forms.
 *
 * All fields are optional except phone. Non-blocking — callers fire-and-forget.
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
    name                  = null,
    email                 = null,
    phone                 = null,
    pickup                = null,
    destination           = null,
    datetime              = null,
    occasion              = null,
    notes                 = null,
    source                = 'website',
    lead_type             = null,
    price_estimate        = null,
    sms_consent           = false,
    sms_consent_timestamp = null,
  } = body as {
    name?:                  string | null;
    email?:                 string | null;
    phone?:                 string | null;
    pickup?:                string | null;
    destination?:           string | null;
    datetime?:              string | null;
    occasion?:              string | null;
    notes?:                 string | null;
    source?:                string;
    lead_type?:             string | null;
    price_estimate?:        number | null;
    sms_consent?:           boolean;
    sms_consent_timestamp?: string | null;
  };

  const { data, error } = await supabase
    .from('leads')
    .insert({
      name,
      email,
      phone,
      pickup,
      destination,
      datetime,
      occasion,
      notes,
      source,
      lead_type,
      price_estimate,
      status:                'new',
      sms_consent,
      sms_consent_timestamp: sms_consent
        ? (sms_consent_timestamp ?? new Date().toISOString())
        : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[leads/insert] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
