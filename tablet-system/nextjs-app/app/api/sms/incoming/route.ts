/**
 * app/api/sms/incoming/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — Twilio SMS webhook for inbound messages.
 *
 * Flow:
 *   1. Extract From (phone) and Body (message text)
 *   2. Load full conversation history from sms_conversations
 *   3. Save new user message
 *   4. Call Anthropic with ARIA_SYSTEM_PROMPT + conversation history
 *   5. Save Aria response
 *   6. If BOOKING_READY detected: insert into rides, fire SMS confirmation
 *   7. Send cleaned response back via Twilio SMS
 *   8. Return empty TwiML (Twilio requires a response)
 *
 * Configure in Twilio Console → Phone Number → Messaging webhook → POST
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { ARIA_SYSTEM_PROMPT, extractBookingReady, stripBookingReady } from '@/lib/aria';
import { handleBookingConfirmed } from '@/lib/sms';

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMPTY_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

export async function POST(req: NextRequest) {
  try {
    // Twilio sends x-www-form-urlencoded
    const body = await req.text();
    const params = new URLSearchParams(body);
    const from    = params.get('From') ?? '';
    const msgBody = params.get('Body') ?? '';

    if (!from || !msgBody.trim()) {
      return new NextResponse(EMPTY_TWIML, {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // ── 1. Load conversation history ──────────────────────────────────────
    const { data: history, error: historyError } = await supabaseAdmin
      .from('sms_conversations')
      .select('role, content')
      .eq('phone', from)
      .order('created_at', { ascending: true });

    if (historyError) console.error('[SMS/incoming] History fetch error:', historyError);

    // ── 2. Save incoming user message ─────────────────────────────────────
    const { error: saveUserError } = await supabaseAdmin
      .from('sms_conversations')
      .insert({ phone: from, role: 'user', content: msgBody.trim() });

    if (saveUserError) console.error('[SMS/incoming] Save user msg error:', saveUserError);

    // ── 3. Build messages for Anthropic (exclude system entries) ──────────
    const conversationMessages = (history ?? [])
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Append the new user message
    conversationMessages.push({ role: 'user', content: msgBody.trim() });

    // ── 4. Call Anthropic ─────────────────────────────────────────────────
    let rawResponse = '';

    try {
      const result = await anthropic.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 500, // SMS-friendly length
        system:     ARIA_SYSTEM_PROMPT,
        messages:   conversationMessages,
      });

      rawResponse = result.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('');
    } catch (err) {
      console.error('[SMS/incoming] Anthropic error:', err);
      rawResponse = "I'm having a moment — please reply again and I'll get right back to you.";
    }

    // ── 5. Save Aria response ─────────────────────────────────────────────
    const { error: saveAssistantError } = await supabaseAdmin
      .from('sms_conversations')
      .insert({ phone: from, role: 'assistant', content: rawResponse });

    if (saveAssistantError) console.error('[SMS/incoming] Save assistant msg error:', saveAssistantError);

    // ── 6. BOOKING_READY handling ─────────────────────────────────────────
    const booking = extractBookingReady(rawResponse);

    if (booking) {
      // Build occasion string
      const occasionValue = [
        booking.occasion?.trim(),
        booking.pickup_location?.trim()
          ? `Pickup: ${booking.pickup_location.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ') || null;

      // Build start_time ISO string from date + time (default noon)
      let startTime: string | null = null;
      if (booking.date?.trim()) {
        const timeStr = booking.time?.trim() ?? '12:00';
        const parsed  = new Date(`${booking.date.trim()}T${timeStr}`);
        startTime      = isNaN(parsed.getTime()) ? null : parsed.toISOString();
      }

      const { data: ride, error: rideError } = await supabaseAdmin
        .from('rides')
        .insert({
          guest_name:   booking.name?.trim()        || null,
          client_phone: booking.phone?.trim()       || from,
          destination:  booking.destination?.trim() || null,
          occasion:     occasionValue,
          chauffeur:    'Mr. Rodriguez',
          status:       'scheduled',
          start_time:   startTime,
          eta_minutes:  0,
        })
        .select()
        .single();

      if (rideError) {
        console.error('[SMS/incoming] Ride insert error:', rideError);
      } else if (ride) {
        // Fire SMS confirmation (non-blocking)
        handleBookingConfirmed({
          id:           ride.id,
          guest_name:   booking.name?.trim()        ?? '',
          client_phone: booking.phone?.trim()       || from,
          destination:  booking.destination?.trim() ?? '',
          occasion:     occasionValue,
          chauffeur:    'Mr. Rodriguez',
          status:       'scheduled',
          date:         booking.date?.trim()        ?? null,
          time:         booking.time?.trim()        ?? null,
        }).catch(err => console.error('[SMS/incoming] handleBookingConfirmed error:', err));
      }
    }

    // ── 7. Send Aria response via SMS ─────────────────────────────────────
    const cleanResponse = stripBookingReady(rawResponse);

    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE,
        to:   from,
        body: cleanResponse,
      });
    } catch (err) {
      console.error('[SMS/incoming] Twilio send error:', err);
    }

    // ── 8. Return empty TwiML ─────────────────────────────────────────────
    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (err) {
    console.error('[SMS/incoming] Unhandled error:', err);
    return new NextResponse(EMPTY_TWIML, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
