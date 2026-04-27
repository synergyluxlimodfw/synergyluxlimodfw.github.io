/**
 * app/api/voice/elevenlabs-webhook/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — ElevenLabs Conversational AI post-call webhook.
 *
 * Fires when an ElevenLabs voice conversation ends. Extracts the data
 * Amirah collected during the call (name, phone, occasion, destination)
 * and hands off to the SMS conversation flow:
 *
 *   1. Parse collected_data from ElevenLabs analysis payload
 *   2. Resolve the caller's phone (collected_data.phone ?? call.phone_number)
 *   3. Seed sms_conversations with collected context as system messages
 *   4. Send a contextual follow-up SMS so the conversation continues naturally
 *
 * Configure in ElevenLabs Dashboard → Agent → Analysis → Post-call webhook
 * URL: https://app.synergyluxlimodfw.com/api/voice/elevenlabs-webhook
 *
 * ElevenLabs webhook payload shape (simplified):
 * {
 *   type: "post_call_transcription",
 *   data: {
 *     agent_id: string,
 *     conversation_id: string,
 *     status: "done" | "failed",
 *     transcript: { role: string, message: string, time_in_call_secs: number }[],
 *     analysis: {
 *       data_collection: {
 *         [field]: { value: string, rationale: string }
 *       }
 *     },
 *     call: { phone_number: string }   // caller's number (E.164)
 *   }
 * }
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// ── ElevenLabs payload types ──────────────────────────────────────────────

interface CollectedField {
  value:     string;
  rationale: string;
}

interface ElevenLabsPayload {
  type?: string;
  data?: {
    agent_id?:        string;
    conversation_id?: string;
    status?:          string;
    transcript?:      { role: string; message: string }[];
    analysis?: {
      data_collection?: Record<string, CollectedField>;
    };
    call?: {
      phone_number?: string;
    };
    metadata?: Record<string, string>;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

function field(
  data_collection: Record<string, CollectedField> | undefined,
  ...keys: string[]
): string {
  if (!data_collection) return '';
  for (const key of keys) {
    const val = data_collection[key]?.value?.trim();
    if (val) return val;
  }
  return '';
}

// ── Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const twilioClient  = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    const body: ElevenLabsPayload = await req.json();

    // Only process completed calls
    if (body.data?.status && body.data.status !== 'done') {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const dc    = body.data?.analysis?.data_collection;
    const name        = field(dc, 'name', 'guest_name', 'customer_name');
    const phone       = field(dc, 'phone', 'phone_number', 'mobile') || body.data?.call?.phone_number || '';
    const occasion    = field(dc, 'occasion', 'service', 'ride_type');
    const destination = field(dc, 'destination', 'dropoff', 'drop_off');
    const date        = field(dc, 'date', 'ride_date');
    const time        = field(dc, 'time', 'ride_time', 'pickup_time');
    const price       = field(dc, 'price', 'amount', 'total');

    if (!phone) {
      console.warn('[ElevenLabs webhook] No phone number found in payload');
      return NextResponse.json({ ok: true, skipped: true });
    }

    // ── 1. Seed sms_conversations with collected context ──────────────────
    // Mark conversation as started (skip if already seeded by missed-call route)
    const { data: existing } = await supabaseAdmin
      .from('sms_conversations')
      .select('id')
      .eq('phone', phone)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabaseAdmin.from('sms_conversations').insert({
        phone,
        role:    'system',
        content: 'conversation_started',
      });
    }

    // Inject whatever Amirah collected as assistant context so the SMS
    // conversation picks up mid-flow rather than starting from scratch
    const contextParts: string[] = [];
    if (name)        contextParts.push(`Guest name: ${name}`);
    if (occasion)    contextParts.push(`Occasion: ${occasion}`);
    if (destination) contextParts.push(`Destination: ${destination}`);
    if (date)        contextParts.push(`Date: ${date}`);
    if (time)        contextParts.push(`Time: ${time}`);

    if (contextParts.length > 0) {
      await supabaseAdmin.from('sms_conversations').insert({
        phone,
        role:    'system',
        content: `[Voice call context] ${contextParts.join(' | ')}`,
      });
    }

    // ── 2. Build contextual follow-up SMS ─────────────────────────────────
    let smsBody: string;

    const firstName = name ? name.split(' ')[0] : '';

    if (occasion && destination) {
      // Amirah collected the key fields — confirm and ask for anything missing
      const missingFields: string[] = [];
      if (!date)  missingFields.push('date');
      if (!time)  missingFields.push('time');
      if (!name)  missingFields.push('your name');
      if (!phone) missingFields.push('your phone number');

      if (missingFields.length === 0) {
        // Everything collected — move to confirmation
        smsBody = `Hi${firstName ? ` ${firstName}` : ''}, this is Amirah with Synergy Lux. Your ${occasion} to ${destination}${date ? ` on ${date}` : ''}${time ? ` at ${time}` : ''}${price ? ` for $${price}` : ''} is being reviewed by your chauffeur. He'll confirm shortly.\n\nTo secure your ride now: reply YES and we'll send your payment link immediately.\n\nReply STOP to opt out.`;
      } else {
        smsBody = [
          `Hi${firstName ? ` ${firstName}` : ''}, this is Amirah with Synergy Lux — following up from your call.`,
          `I have your ${occasion} to ${destination}.`,
          `Just need your ${missingFields.join(' and ')} to confirm the booking.`,
          '',
          'Reply STOP to opt out.',
        ].join('\n');
      }
    } else {
      // Minimal data collected — restart gracefully
      smsBody = [
        `Hi${firstName ? ` ${firstName}` : ''}, this is Amirah with Synergy Lux — following up from your call.`,
        "I'd love to get your ride sorted. What's the occasion?",
        '',
        'Reply STOP to opt out.',
      ].join('\n');
    }

    // ── 3. Send the SMS ───────────────────────────────────────────────────
    await twilioClient.messages.create({
      from: process.env.TWILIO_PHONE,
      to:   phone,
      body: smsBody,
    });

    // Save the outbound message to conversation history
    await supabaseAdmin.from('sms_conversations').insert({
      phone,
      role:    'assistant',
      content: smsBody,
    });

    console.log(`[ElevenLabs webhook] Handoff SMS sent to ${phone}`);

    return NextResponse.json({ ok: true, phone });

  } catch (err) {
    console.error('[ElevenLabs webhook] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
