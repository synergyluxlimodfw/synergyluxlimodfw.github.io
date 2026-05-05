import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const INBOUND_SOURCES = new Set([
  'website-booking',
  'website-fifa',
  'website-affiliate',
  'amirah',
  'website-quote',
]);

const SOURCE_LABEL: Record<string, string> = {
  'website-booking':   'WEBSITE BOOKING',
  'website-fifa':      'FIFA 2026',
  'website-affiliate': 'AFFILIATE',
  'amirah':            'AMIRAH CHAT',
  'website-quote':     'QUOTE — TEXT ME',
};

function fmt(val: unknown, fallback = '—'): string {
  const s = typeof val === 'string' ? val.trim() : '';
  return s || fallback;
}

export async function POST(req: NextRequest) {
  // ── 1. Validate webhook secret ────────────────────────────────────────────
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    console.warn('[new-lead] Unauthorized webhook attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let payload: { type?: string; record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const record = payload.record;
  if (!record) {
    return NextResponse.json({ skipped: true, reason: 'no record in payload' });
  }

  // ── 3. Filter by source ───────────────────────────────────────────────────
  const source = fmt(record.source, '');
  if (!INBOUND_SOURCES.has(source)) {
    return NextResponse.json({ skipped: true, reason: `source '${source}' not an inbound lead` });
  }

  // ── 4. Build SMS body ─────────────────────────────────────────────────────
  const label       = SOURCE_LABEL[source] ?? source.toUpperCase();
  const name        = fmt(record.name);
  const phone       = fmt(record.phone);
  const pickup      = fmt(record.pickup);
  const destination = fmt(record.destination);
  const datetime    = fmt(record.datetime);

  const hasRoute  = pickup !== '—' || destination !== '—';
  const routeLine = hasRoute ? `${pickup} → ${destination}` : null;

  const lines = [
    `🚨 NEW LEAD — ${label}`,
    `${name} · ${phone}`,
    ...(routeLine ? [routeLine] : []),
    ...(datetime !== '—' ? [datetime] : []),
    `View: app.synergyluxlimodfw.com/admin`,
  ];

  // ── 5. Send SMS ───────────────────────────────────────────────────────────
  try {
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   process.env.WILL_PERSONAL_PHONE!,
      body: lines.join('\n'),
    });
    console.log(`[new-lead] SMS sent for lead ${record.id} (${label})`);
  } catch (err) {
    // Log but return 200 — prevents Supabase retry storm on Twilio failures
    console.error('[new-lead] Twilio send failed:', err);
    return NextResponse.json({ sent: false, lead_id: record.id, error: 'SMS send failed' });
  }

  return NextResponse.json({ sent: true, lead_id: record.id });
}
