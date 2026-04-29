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

// ── CORS — allows the marketing site to call this endpoint ────────────────
const ALLOWED_ORIGINS = [
  'https://synergyluxlimodfw.com',
  'https://www.synergyluxlimodfw.com',
];

function corsHeaders(req: NextRequest) {
  const origin  = req.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function json(body: unknown, req: NextRequest, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders(req), ...(init?.headers ?? {}) },
  });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, req, { status: 400 });
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
    return json({ error: error.message }, req, { status: 500 });
  }

  return json({ id: data.id }, req, { status: 201 });
}
