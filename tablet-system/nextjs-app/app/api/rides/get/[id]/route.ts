/**
 * app/api/rides/get/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * GET — fetch a single ride by ID.
 * Used by: app/experience/page.tsx → initial load when ?ride=<id> is set
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 422 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }
    console.error('[rides/get]', error);
    return NextResponse.json({ error: 'Failed to fetch ride' }, { status: 500 });
  }

  return NextResponse.json(data);
}
