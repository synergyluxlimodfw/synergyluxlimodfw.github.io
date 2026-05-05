/**
 * app/api/leads/inbound/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * GET — returns inbound website and Amirah leads.
 * Used by: app/admin/page.tsx → "Inbound Leads" section.
 *
 * Sources included:
 *   website-booking  — booking form on synergyluxlimodfw.com
 *   website-fifa     — FIFA 2026 form
 *   website-affiliate — affiliate/partner form
 *   amirah           — Amirah AI concierge captures
 *   website-quote    — "Save My Quote" text-me button on calculator
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from('leads')
    .select('id, name, email, phone, pickup, destination, datetime, occasion, notes, source, lead_type, status, sms_consent, sms_consent_timestamp, created_at')
    .in('source', ['website-booking', 'website-fifa', 'website-affiliate', 'amirah', 'website-quote'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[leads/inbound] error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ leads: data ?? [] });
}
