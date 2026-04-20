/**
 * app/api/aria/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * POST — Aria AI concierge chat endpoint.
 *
 * Accepts:  { messages: { role: 'user'|'assistant', content: string }[] }
 * Returns:  { response: string, bookingCreated: boolean, booking?: object }
 *
 * When Aria outputs BOOKING_READY:{json}, the JSON is extracted, saved to
 * the rides table, and returned alongside the cleaned response text.
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

// Admin client — bypasses RLS, required for server-side inserts
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('API KEY present:', !!process.env.ANTHROPIC_API_KEY);

    let body: { messages?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate messages array
    const raw = body.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 422 });
    }

    const messages: ChatMessage[] = raw
      .filter(
        (m): m is ChatMessage =>
          typeof m === 'object' &&
          m !== null &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0
      )
      .map(m => ({ role: m.role, content: m.content.trim() }));

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No valid messages' }, { status: 422 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    let rawResponse: string;

    console.log('Calling Anthropic with key:', process.env.ANTHROPIC_API_KEY?.slice(0, 20));

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
      console.error('Full error:', JSON.stringify(err, null, 2));
      return NextResponse.json({
        response:       'I apologize — I am having trouble connecting right now. Please call us directly at (646) 879-1391.',
        bookingCreated: false,
        error:          String(err),
      }, { status: 200 });
    }

    // ── BOOKING_READY handling ─────────────────────────────────────────────
    let bookingCreated = false;
    let savedBooking: object | undefined;

    const booking = extractBookingReady(rawResponse);

    if (booking) {
      // Build occasion string — combine occasion + pickup location
      const occasionValue = [
        booking.occasion?.trim(),
        booking.pickup_location?.trim()
          ? `Pickup: ${booking.pickup_location.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ') || null;

      // Build start_time ISO string from date + time fields
      // Falls back to noon on the given date if time is missing
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
          client_phone: booking.phone?.trim()       || null,
          destination:  booking.destination?.trim() || null,
          occasion:     occasionValue,
          chauffeur:    'Will Rodriguez',
          status:       'scheduled',
          start_time:   startTime,
          eta_minutes:  0,
        })
        .select()
        .single();

      if (error) {
        console.error('[Aria] Supabase insert error:', error);
      } else {
        bookingCreated = true;
        savedBooking   = data;

        // Fire booking confirmation SMS (non-blocking — don't await)
        if (booking.phone?.trim()) {
          handleBookingConfirmed({
            id:           data.id,
            guest_name:   booking.name?.trim()        ?? '',
            client_phone: booking.phone.trim(),
            destination:  booking.destination?.trim() ?? '',
            occasion:     occasionValue,
            chauffeur:    'Will Rodriguez',
            status:       'scheduled',
            date:         booking.date?.trim()        ?? null,
            time:         booking.time?.trim()        ?? null,
          }).catch(err => console.error('[SMS] Aria confirm error:', err));
        }
      }
    }

    const cleanResponse = stripBookingReady(rawResponse);

    return NextResponse.json({
      response:       cleanResponse,
      bookingCreated,
      booking:        savedBooking,
    });

  } catch (error) {
    console.error('[Aria] Unhandled error:', error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json({
      response:       'I apologize — something went wrong on our end. Please call us at (646) 879-1391.',
      bookingCreated: false,
      error:          String(error),
    }, { status: 200 });
  }
}
