import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    if (!date || !time) {
      return NextResponse.json({ error: 'date and time required' }, { status: 400 });
    }

    const requestedTime = new Date(`${date}T${time}`);
    if (isNaN(requestedTime.getTime())) {
      return NextResponse.json({ error: 'invalid date or time' }, { status: 400 });
    }

    // 2-hour buffer window (1hr ride + 1hr prep)
    const bufferMs = 2 * 60 * 60 * 1000;
    const windowStart = new Date(requestedTime.getTime() - bufferMs);
    const windowEnd   = new Date(requestedTime.getTime() + bufferMs);

    const { data: conflicts } = await supabase
      .from('rides')
      .select('id, start_time, guest_name, status')
      .gte('start_time', windowStart.toISOString())
      .lte('start_time', windowEnd.toISOString())
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'complete');

    const available = !conflicts || conflicts.length === 0;

    // Find next available slot if taken
    let nextAvailable = null;
    if (!available) {
      // Try every hour for the next 48 hours
      for (let h = 1; h <= 48; h++) {
        const candidate = new Date(requestedTime.getTime() + h * 60 * 60 * 1000);
        const cStart = new Date(candidate.getTime() - bufferMs);
        const cEnd   = new Date(candidate.getTime() + bufferMs);

        const { data: cConflicts } = await supabase
          .from('rides')
          .select('id')
          .gte('start_time', cStart.toISOString())
          .lte('start_time', cEnd.toISOString())
          .not('status', 'eq', 'cancelled')
          .not('status', 'eq', 'complete');

        if (!cConflicts || cConflicts.length === 0) {
          nextAvailable = candidate.toISOString();
          break;
        }
      }
    }

    return NextResponse.json({ available, conflicts: conflicts || [], nextAvailable });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
