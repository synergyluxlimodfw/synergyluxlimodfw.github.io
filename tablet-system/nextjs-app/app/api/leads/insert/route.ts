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
    return json({ error: error.message }, req, { status: 500 });
  }

  return json({ id: data.id }, req, { status: 201 });
}
