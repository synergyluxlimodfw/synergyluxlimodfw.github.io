/**
 * app/api/aria/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — Aria AI concierge chat endpoint.
 *
 * Two modes:
 *
 * 1. Normal chat  { messages: ChatMessage[] }
 *    → Calls Anthropic. If BOOKING_READY is detected, returns
 *      { type: 'booking_confirmation', booking, message }  WITHOUT saving.
 *    → Otherwise returns { type: 'message', response }
 *
 * 2. Confirm booking  { confirm: true, bookingData: BookingData, messages?: ChatMessage[] }
 *    → Saves to Supabase, fires handleBookingConfirmed, returns
 *      { type: 'booking_confirmed', response }
 *
 * Required env var: ANTHROPIC_API_KEY
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import {
  ARIA_SYSTEM_PROMPT,
  extractBookingReady,
  stripBookingReady,
} from '@/lib/aria';
import { handleBookingConfirmed } from '@/lib/sms';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

interface BookingData {
  name?:             string;
  phone?:            string;
  occasion?:         string;
  destination?:      string;
  pickup_location?:  string;
  date?:             string;
  time?:             string;
}

// ── Shared helper: save booking to Supabase ───────────────────────────────

async function saveBooking(booking: BookingData, fallbackPhone?: string) {
  const occasionValue = [
    booking.occasion?.trim(),
    booking.pickup_location?.trim()
      ? `Pickup: ${booking.pickup_location.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ') || null;

  let startTime: string | null = null;
  if (booking.date?.trim()) {
    const timeStr = booking.time?.trim() ?? '12:00';
    const parsed  = new Date(`${booking.date.trim()}T${timeStr}`);
    startTime      = isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('rides')
    .insert({
      guest_name:   booking.name?.trim()        || null,
      client_phone: booking.phone?.trim()       || fallbackPhone || null,
      destination:  booking.destination?.trim() || null,
      occasion:     occasionValue,
      chauffeur:    'Mr. Rodriguez',
      status:       'scheduled',
      start_time:   startTime,
      eta_minutes:  0,
    })
    .select()
    .single();

  return { data, error, occasionValue };
}

// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // ── Mode 2: explicit booking confirmation ─────────────────────────────
    if (body.confirm === true) {
      const bookingData = body.bookingData as BookingData | undefined;

      if (!bookingData) {
        return NextResponse.json({ error: 'bookingData required' }, { status: 422 });
      }

      const { data, error, occasionValue } = await saveBooking(bookingData);

      if (error) {
        console.error('[Aria/confirm] Supabase insert error:', error);
        return NextResponse.json({
          type:     'booking_confirmed',
          response: 'I had trouble saving your booking. Please call us at (646) 879-1391.',
        });
      }

      if (data && bookingData.phone?.trim()) {
        handleBookingConfirmed({
          id:           data.id,
          guest_name:   bookingData.name?.trim()        ?? '',
          client_phone: bookingData.phone.trim(),
          destination:  bookingData.destination?.trim() ?? '',
          occasion:     occasionValue,
          chauffeur:    'Mr. Rodriguez',
          status:       'scheduled',
          date:         bookingData.date?.trim()        ?? null,
          time:         bookingData.time?.trim()        ?? null,
        }).catch(err => console.error('[SMS] Aria confirm error:', err));
      }

      return NextResponse.json({
        type:     'booking_confirmed',
        response: "You're all set. Mr. Rodriguez will take care of everything.",
      });
    }

    // ── Mode 1: normal chat ───────────────────────────────────────────────
    const raw = body.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 422 });
    }

    const messages: ChatMessage[] = (raw as unknown[])
      .filter(
        (m): m is ChatMessage =>
          typeof m === 'object' &&
          m !== null &&
          ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
          typeof (m as ChatMessage).content === 'string' &&
          (m as ChatMessage).content.trim().length > 0
      )
      .map(m => ({ role: m.role, content: m.content.trim() }));

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid messages' }, { status: 422 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let rawResponse: string;

    try {
      const result = await client.messages.create({
        model:      'claude-sonnet-4-5',
        max_tokens: 1000,
        system:     ARIA_SYSTEM_PROMPT,
        messages,
      });

      rawResponse = result.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('');
    } catch (err) {
      console.error('[Aria] Anthropic error:', err);
      return NextResponse.json({
        type:     'message',
        response: 'I apologize — I am having trouble connecting right now. Please call us directly at (646) 879-1391.',
      });
    }

    // ── BOOKING_READY detected → return confirmation prompt, do NOT save ──
    const booking = extractBookingReady(rawResponse);

    if (booking) {
      const cleanMessage = stripBookingReady(rawResponse).trim() ||
        'Here are your ride details. Shall I reserve this for you?';

      return NextResponse.json({
        type:    'booking_confirmation',
        booking,
        message: cleanMessage,
      });
    }

    // ── Normal response ───────────────────────────────────────────────────
    return NextResponse.json({
      type:     'message',
      response: stripBookingReady(rawResponse),
    });

  } catch (error) {
    console.error('[Aria] Unhandled error:', error);
    return NextResponse.json({
      type:     'message',
      response: 'I apologize — something went wrong on our end. Please call us at (646) 879-1391.',
    });
  }
}
