/**
 * app/api/website-quotes/update/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * PATCH — update a website_quotes row (e.g. confirm status).
 * Used by: app/admin/page.tsx → confirmQuote()
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, ...fields } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 422 });
  }

  // Allowlist updatable columns
  const ALLOWED = new Set(['status', 'quoted_price', 'date', 'time']);
  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (ALLOWED.has(k)) update[k] = v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No allowed fields provided' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('website_quotes')
    .update(update)
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) {
    console.error('[website-quotes/update]', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }

  return NextResponse.json(data);
}
