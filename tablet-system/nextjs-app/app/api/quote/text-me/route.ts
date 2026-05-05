import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
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

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, req, { status: 400 });
  }

  const { name, phone, pickup, destination, datetime, passengers, return_trip, quote_amount, service } = body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!name || typeof name !== 'string' || !name.trim()) {
    return json({ error: 'name is required' }, req, { status: 422 });
  }
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    return json({ error: 'phone is required' }, req, { status: 422 });
  }
  if (!quote_amount || isNaN(Number(quote_amount))) {
    return json({ error: 'quote_amount is required' }, req, { status: 422 });
  }

  const normalizedPhone = normalizePhone(String(phone));
  if (!normalizedPhone) {
    return json({ error: 'Invalid phone number' }, req, { status: 422 });
  }

  const firstName = String(name).trim().split(' ')[0];
  const amount    = Number(quote_amount);
  const pickupStr = pickup   ? String(pickup).trim()      : '';
  const destStr   = destination ? String(destination).trim() : '';
  const dtStr     = datetime    ? String(datetime).trim()    : '';

  // ── Insert lead ───────────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: lead, error: dbError } = await supabase
    .from('leads')
    .insert({
      name:         String(name).trim(),
      phone:        normalizedPhone,
      pickup:       pickupStr || null,
      destination:  destStr   || null,
      datetime:     dtStr     || null,
      source:       'website-quote',
      status:       'new',
      lead_type:    'inbound',
      quote_amount: amount,
      occasion:     service ? String(service).trim() : null,
      notes:        [
        passengers ? `Passengers: ${passengers}` : null,
        return_trip ? 'Return trip included' : null,
      ].filter(Boolean).join(' · ') || null,
    })
    .select('id')
    .single();

  if (dbError) {
    console.error('[quote/text-me] Supabase insert error:', dbError);
    return json({ error: 'Database error' }, req, { status: 500 });
  }

  // ── Send confirmation SMS ─────────────────────────────────────────────────
  const routeLine = pickupStr && destStr
    ? `${pickupStr} → ${destStr}`
    : pickupStr || destStr || 'your route';

  const smsLines = [
    `Hi ${firstName} — Synergy Lux Limo DFW.`,
    '',
    `Your quote: $${amount} for ${routeLine}${dtStr ? ` on ${dtStr}` : ''}.`,
    '',
    `Reply BOOK to lock this in, or call (817) 809-2801.`,
    '',
    `Reply STOP to opt out. Msg & data rates may apply.`,
  ];

  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   normalizedPhone,
      body: smsLines.join('\n'),
    });
    console.log(`[quote/text-me] Confirmation SMS sent to ${normalizedPhone} (lead ${lead.id})`);
  } catch (smsErr) {
    console.error('[quote/text-me] Twilio error:', smsErr);
    // Lead is saved — don't fail the request over SMS
  }

  return json({ success: true, lead_id: lead.id }, req);
}
