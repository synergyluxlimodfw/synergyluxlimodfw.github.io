import { SENDER_ID, CTIA_FOOTER } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('rebook_requests')
    .select('*')
    .eq('confirm_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const { token } = await req.json();

    const { data, error } = await supabase
      .from('rebook_requests')
      .select('*')
      .eq('confirm_token', token)
      .single();

    if (error || !data) throw new Error('Invalid token');

    if (data.status === 'confirmed') {
      return NextResponse.json({ success: true });
    }

    await supabase
      .from('rebook_requests')
      .update({ status: 'confirmed' })
      .eq('id', data.id);

    try {
      await twilioClient.messages.create({
        body: `${SENDER_ID}: Your ride is confirmed. Mr. Rodriguez looks forward to serving you. Questions? Call (646) 879-1391. ${CTIA_FOOTER}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.phone,
      });
    } catch (smsError) {
      console.error('Confirmation SMS failed:', smsError);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
