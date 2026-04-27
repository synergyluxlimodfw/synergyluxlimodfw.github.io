import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

export async function GET(req: NextRequest) {
  const supabase     = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    // Find all pending messages that are due
    const now = new Date().toISOString();

    const { data: messages, error } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('sent', false)
      .lte('send_at', now)
      .limit(50);

    if (error) throw error;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;

    for (const msg of messages) {
      try {
        // Only send if phone exists
        if (msg.phone) {
          await twilioClient.messages.create({
            body: msg.message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: msg.phone,
          });
        }

        // Mark as sent regardless — prevents retries
        await supabase
          .from('scheduled_messages')
          .update({ sent: true })
          .eq('id', msg.id);

        sent++;
      } catch (smsError) {
        console.error('Follow-up SMS failed:', msg.id, smsError);
        // Mark as sent to prevent infinite retry
        await supabase
          .from('scheduled_messages')
          .update({ sent: true })
          .eq('id', msg.id);
      }
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error('Followup route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
