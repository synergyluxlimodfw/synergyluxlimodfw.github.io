import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    const body = await req.json();
    const { name, phone, pickup, destination, datetime, occasion, status } = body;

    // Upsert by phone so we don't create duplicates
    const { data, error } = await supabase
      .from('leads')
      .upsert(
        { name, phone, pickup, destination, datetime, occasion, status: status || 'new', source: 'amirah' },
        { onConflict: 'phone' }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, lead: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
