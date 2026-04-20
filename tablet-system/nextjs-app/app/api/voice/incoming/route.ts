/**
 * app/api/voice/incoming/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — Twilio Voice webhook for missed calls.
 *
 * Flow:
 *   1. Extract caller's phone from 'From' field
 *   2. Send opening SMS from Aria (missed-call auto-reply)
 *   3. Store conversation_started record in sms_conversations
 *   4. Return TwiML <Reject/> so the call is not answered
 *
 * Configure in Twilio Console → Phone Number → Voice webhook → POST
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENING_MESSAGE =
  "Hi, this is Aria with Synergy Lux Limo DFW. W. Rodriguez is currently " +
  "with a client — but I can help you book right now. " +
  "What's the occasion for your ride? (Reply here to chat)";

export async function POST(req: NextRequest) {
  try {
    // Twilio sends x-www-form-urlencoded
    const body = await req.text();
    const params = new URLSearchParams(body);
    const from = params.get('From') ?? '';

    if (from) {
      // Send opening SMS
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE,
        to:   from,
        body: OPENING_MESSAGE,
      });

      // Store conversation start in Supabase
      const { error } = await supabaseAdmin
        .from('sms_conversations')
        .insert({
          phone:   from,
          role:    'system',
          content: 'conversation_started',
        });

      if (error) console.error('[Voice/incoming] Supabase insert error:', error);
    }

    // Reject the call — do not answer
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (err) {
    console.error('[Voice/incoming] Error:', err);
    // Always return valid TwiML even on error
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}
