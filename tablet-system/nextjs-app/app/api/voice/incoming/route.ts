/**
 * app/api/voice/incoming/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — Twilio Voice webhook for incoming calls.
 *
 * Flow:
 *   1. Extract caller's phone from 'From' field
 *   2. Send opening SMS from Amirah so conversation continues via text
 *   3. Store conversation_started record in sms_conversations
 *   4. Return TwiML that forwards the call to ElevenLabs (ELEVENLABS_AGENT_ID)
 *      or plays a brief hold message if the env var is not set.
 *
 * NOTE: This route should be set as the Twilio Voice webhook ONLY if
 * ElevenLabs is NOT already configured to answer calls directly via the
 * Twilio phone number in the ElevenLabs dashboard. If ElevenLabs owns
 * the number, remove this webhook from Twilio entirely.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { SENDER_ID, CTIA_FOOTER } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const OPENING_MESSAGE =
  `${SENDER_ID}: Good day — this is Amirah. ` +
  `Mr. Rodriguez is with a client right now, but I can take care of your transportation. ` +
  `Where will we be picking you up and your destination? ${CTIA_FOOTER}`;

export async function POST(req: NextRequest) {
  const twilioClient  = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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

    // Forward to ElevenLabs agent if configured, otherwise play a hold message
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const twiml = agentId
      ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}" />
  </Connect>
</Response>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">One moment — connecting you with Amirah at Synergy Lux.</Say>
  <Pause length="2"/>
  <Say voice="Polly.Joanna">We'll be right with you. You can also reach us by text at this number.</Say>
</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('[Voice/incoming] Error:', err);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Thank you for calling Synergy Lux. Please text us at this number and we will get right back to you.</Say></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}
