import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: allLeads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: todayLeads } = await supabase
      .from('leads')
      .select('*')
      .gte('created_at', today);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('amount');

    const total = allLeads?.length || 0;
    const booked = allLeads?.filter(l => l.status === 'booked').length || 0;
    const linkSent = allLeads?.filter(l => l.status === 'link_sent').length || 0;
    const newLeads = allLeads?.filter(l => l.status === 'new').length || 0;
    const todayTotal = todayLeads?.length || 0;
    const todayBooked = todayLeads?.filter(l => l.status === 'booked').length || 0;
    const revenue = bookings?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0;
    const conversionRate = total > 0 ? ((booked / total) * 100).toFixed(1) : '0.0';
    const todayConversionRate = todayTotal > 0 ? ((todayBooked / todayTotal) * 100).toFixed(1) : '0.0';
    const linkNotPaid = allLeads?.filter(l => l.status === 'link_sent') || [];
    const revenueLeftOnTable = linkNotPaid.length * 165;

    return NextResponse.json({
      total,
      booked,
      linkSent,
      newLeads,
      todayTotal,
      todayBooked,
      conversionRate,
      todayConversionRate,
      revenue,
      revenueLeftOnTable,
      linkNotPaid: linkNotPaid.map(l => ({
        name: l.name,
        phone: l.phone,
        destination: l.destination,
        created_at: l.created_at
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
