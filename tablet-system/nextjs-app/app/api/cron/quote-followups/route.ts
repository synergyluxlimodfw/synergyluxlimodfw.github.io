/**
 * app/api/cron/quote-followups/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Cron job: sends concierge follow-up SMS to website-quote leads.
 *
 * Triggered by pg_cron every 30 minutes. Three follow-up tiers:
 *   tier_30min — sent 30 min–24 h after capture (followup_30min_sent = false)
 *   tier_24h   — sent 24 h–48 h after capture   (followup_24h_sent = false)
 *   tier_48h   — sent 48 h–96 h after capture   (followup_48h_sent = false)
 *
 * Auth: Bearer CRON_SECRET in Authorization header.
 * Business hours gate: 07:00–21:59 America/Chicago only.
 * Flag update: only on successful Twilio send (no optimistic updates).
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SENDER_ID, CTIA_FOOTER, CTIA_FOOTER_SHORT } from '@/lib/sms';

export const dynamic = 'force-dynamic';

// ── Types ─────────────────────────────────────────────────────────────────

interface QuoteLead {
  id: string;
  name: string | null;
  phone: string | null;
  pickup: string | null;
  destination: string | null;
  datetime: string | null;
  quote_amount: number | null;
  occasion: string | null;
}

interface TierResult {
  sent: number;
  failed: number;
  skipped: number;
}

// ── Auth helper ───────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  return !!process.env.CRON_SECRET && token === process.env.CRON_SECRET;
}

// ── Business hours gate (America/Chicago) ─────────────────────────────────

function texasHour(): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      hour12: false,
    }).format(new Date()),
  );
}

// ── SMS templates ─────────────────────────────────────────────────────────

function firstName(name: string | null): string {
  return (name ?? '').trim().split(' ')[0] || 'there';
}

function routeStr(pickup: string | null, destination: string | null): string {
  const p = (pickup ?? '').trim();
  const d = (destination ?? '').trim();
  if (p && d) return `${p} → ${d}`;
  return p || d || 'your requested route';
}

function amountStr(quote_amount: number | null): string {
  return quote_amount != null ? `$${quote_amount}` : 'your quote';
}

function build30min(lead: QuoteLead): string {
  const fn = firstName(lead.name);
  const amount = amountStr(lead.quote_amount);
  const pickup = (lead.pickup ?? '').trim();
  const destination = (lead.destination ?? '').trim();
  const route = pickup && destination ? `${pickup} → ${destination}` : pickup || destination || 'your route';
  const dt = lead.datetime ? ` on ${lead.datetime}` : '';
  return [
    `${SENDER_ID}: Hi ${fn}, this is Amirah — your personal concierge at Synergy Lux Limo DFW.`,
    '',
    `Your quote of ${amount} for ${route}${dt} is still available.`,
    '',
    `Shall I lock in your chauffeur? Reply YES or call (817) 809-2801.`,
    '',
    CTIA_FOOTER,
  ].join('\n');
}

function build24h(lead: QuoteLead): string {
  const fn = firstName(lead.name);
  const destination = (lead.destination ?? '').trim() || 'your destination';
  const dt = lead.datetime ? ` on ${lead.datetime}` : '';
  return [
    `${SENDER_ID}: Hi ${fn}, Amirah here from Synergy Lux. Checking in on your ride to ${destination}${dt} — availability is tightening for that time.`,
    '',
    `Shall I lock it in for you? Reply YES or call (817) 809-2801.`,
    '',
    CTIA_FOOTER_SHORT,
  ].join('\n');
}

function build48h(lead: QuoteLead): string {
  const fn = firstName(lead.name);
  const destination = (lead.destination ?? '').trim() || 'your destination';
  const dt = lead.datetime ? ` on ${lead.datetime}` : '';
  return [
    `${SENDER_ID}: Hi ${fn}, final check from your concierge at Synergy Lux. I can still secure your ride to ${destination}${dt}, but scheduling is filling up.`,
    '',
    `Reply BOOK to confirm or call (817) 809-2801.`,
    '',
    CTIA_FOOTER_SHORT,
  ].join('\n');
}

// ── Send one follow-up SMS and flip flag on success ───────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendFollowup(
  supabase: SupabaseClient<any>,
  twilioClient: ReturnType<typeof twilio>,
  lead: QuoteLead,
  body: string,
  flagColumn: 'followup_30min_sent' | 'followup_24h_sent' | 'followup_48h_sent',
): Promise<'sent' | 'failed' | 'skipped'> {
  if (!lead.phone) return 'skipped';

  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: lead.phone,
      body,
    });
    console.log(`[quote-followups] ${flagColumn} SMS sent to lead ${lead.id}`);
  } catch (err) {
    console.error(`[quote-followups] Twilio error for lead ${lead.id}:`, err);
    return 'failed';
  }

  // Only update flag after confirmed send
  const updatePayload: Record<string, boolean> = {};
  updatePayload[flagColumn] = true;
  const { error: updateErr } = await supabase
    .from('leads')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updatePayload as any)
    .eq('id', lead.id);

  if (updateErr) {
    console.error(`[quote-followups] Flag update failed for lead ${lead.id}:`, updateErr.message);
    // SMS already sent — log the error but don't report as failed
  }

  return 'sent';
}

// ── Process one tier ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processTier(
  supabase: SupabaseClient<any>,
  twilioClient: ReturnType<typeof twilio>,
  opts: {
    minMinutes: number;
    maxMinutes: number;
    flagColumn: 'followup_30min_sent' | 'followup_24h_sent' | 'followup_48h_sent';
    buildBody: (lead: QuoteLead) => string;
  },
): Promise<TierResult> {
  const { minMinutes, maxMinutes, flagColumn, buildBody } = opts;
  const now = new Date();
  const minAge = new Date(now.getTime() - maxMinutes * 60 * 1000).toISOString();
  const maxAge = new Date(now.getTime() - minMinutes * 60 * 1000).toISOString();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, name, phone, pickup, destination, datetime, quote_amount, occasion')
    .eq('source', 'website-quote')
    .eq(flagColumn, false)
    .not('phone', 'is', null)
    .gte('created_at', minAge)
    .lte('created_at', maxAge);

  if (error) {
    console.error(`[quote-followups] Query error (${flagColumn}):`, error.message);
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const result: TierResult = { sent: 0, failed: 0, skipped: 0 };

  for (const lead of (leads ?? []) as QuoteLead[]) {
    const outcome = await sendFollowup(
      supabase,
      twilioClient,
      lead,
      buildBody(lead),
      flagColumn,
    );
    result[outcome]++;
  }

  return result;
}

// ── Handler ───────────────────────────────────────────────────────────────

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const txHour = texasHour();

  if (txHour < 7 || txHour >= 22) {
    return NextResponse.json({
      skipped: true,
      reason: 'Outside business hours (7am–10pm CT)',
      tx_hour: txHour,
      timestamp: new Date().toISOString(),
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  const [tier30min, tier24h, tier48h] = await Promise.all([
    processTier(supabase, twilioClient, {
      minMinutes: 30,
      maxMinutes: 24 * 60,
      flagColumn: 'followup_30min_sent',
      buildBody: build30min,
    }),
    processTier(supabase, twilioClient, {
      minMinutes: 24 * 60,
      maxMinutes: 48 * 60,
      flagColumn: 'followup_24h_sent',
      buildBody: build24h,
    }),
    processTier(supabase, twilioClient, {
      minMinutes: 48 * 60,
      maxMinutes: 96 * 60,
      flagColumn: 'followup_48h_sent',
      buildBody: build48h,
    }),
  ]);

  return NextResponse.json({
    sent: { tier_30min: tier30min.sent, tier_24h: tier24h.sent, tier_48h: tier48h.sent },
    failed: { tier_30min: tier30min.failed, tier_24h: tier24h.failed, tier_48h: tier48h.failed },
    skipped: { tier_30min: tier30min.skipped, tier_24h: tier24h.skipped, tier_48h: tier48h.skipped },
    tx_hour: txHour,
    timestamp: new Date().toISOString(),
  });
}

export const GET = handler;
export const POST = handler;
