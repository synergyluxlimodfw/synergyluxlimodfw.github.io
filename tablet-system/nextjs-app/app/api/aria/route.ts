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

import { SENDER_ID, CTIA_FOOTER, CTIA_FOOTER_SHORT } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import {
  ARIA_SYSTEM_PROMPT,
  extractBookingReady,
  stripBookingReady,
  classifyLead,
  formatOperatorAlert,
} from '@/lib/aria';
import { handleBookingConfirmed } from '@/lib/sms';

// ── CORS — allows the marketing site to call this endpoint ────────────────
const ALLOWED_ORIGINS = [
  'https://synergyluxlimodfw.com',
  'https://www.synergyluxlimodfw.com',
];

function corsHeaders(req: NextRequest) {
  const origin  = req.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

/** Wraps NextResponse.json and injects CORS headers on every response. */
function json(body: unknown, req: NextRequest, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders(req), ...(init?.headers ?? {}) },
  });
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveBooking(supabaseAdmin: any, booking: BookingData, fallbackPhone?: string) {
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
      pickup:       booking.pickup_location?.trim() || null,
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

// ── SMS consent enforcement ───────────────────────────────────────────────
//
// Scans conversation history to determine whether explicit SMS consent
// has been obtained. Returns 'granted', 'declined', or 'pending'.
//
// Logic:
//   1. Walk backwards through messages to find the LAST assistant message
//      that contains an SMS consent question (detected by keyword set).
//   2. If found, inspect the NEXT user message after it:
//      - Affirmative word  → 'granted'
//      - Negative word     → 'declined'
//      - Anything else     → 'pending' (question asked, answer unclear)
//   3. If no consent question found in history → 'pending'
//
// This is intentionally conservative: ambiguous answers always → 'pending'
// so Amirah re-asks rather than silently skipping consent.

function hasExplicitSmsConsent(
  messages: ChatMessage[]
): 'granted' | 'declined' | 'pending' {
  // Keywords that indicate an assistant message was asking for SMS consent.
  // At least one from each group must be present.
  const consentTopicWords  = ['text', 'sms', 'message you', 'send you', 'notification'];
  const consentContextWords = ['stop', 'opt out', 'confirmation', 'updates', 'reservation'];

  let consentQuestionIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== 'assistant') continue;
    const lower = msg.content.toLowerCase();
    const hasTopic   = consentTopicWords.some(w  => lower.includes(w));
    const hasContext = consentContextWords.some(w => lower.includes(w));
    if (hasTopic && hasContext) {
      consentQuestionIndex = i;
      break;
    }
  }

  // No consent question found in history — must ask
  if (consentQuestionIndex === -1) return 'pending';

  // Look for the first user reply after the consent question
  for (let i = consentQuestionIndex + 1; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;

    const lower = msg.content.toLowerCase().trim();

    // Explicit decline
    const declinePatterns = [
      /^no\b/, /^nope\b/, /^nah\b/, /^no thanks\b/, /^no thank you\b/,
      /don't text/, /do not text/, /no texts/, /no sms/, /no messages/,
    ];
    if (declinePatterns.some(p => p.test(lower))) return 'declined';

    // Affirmative consent
    const affirmPatterns = [
      /^yes\b/, /^yeah\b/, /^yep\b/, /^yup\b/, /^sure\b/, /^ok\b/, /^okay\b/,
      /^of course\b/, /^absolutely\b/, /^definitely\b/, /^please\b/, /^go ahead\b/,
      /^sounds good\b/, /^that('s| is) fine\b/, /^that works\b/, /^confirmed\b/,
    ];
    if (affirmPatterns.some(p => p.test(lower))) return 'granted';

    // User replied but with something ambiguous (e.g. a question, unrelated text)
    // Treat as pending so we re-ask
    return 'pending';
  }

  // Consent question was the last assistant message — user hasn't replied yet
  return 'pending';
}

// ─────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const twilioClient  = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  try {
    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON' }, req, { status: 400 });
    }

    // ── Mode 2: explicit booking confirmation ─────────────────────────────
    if (body.confirm === true) {
      const bookingData = body.bookingData as BookingData | undefined;

      if (!bookingData) {
        return json({ error: 'bookingData required' }, req, { status: 422 });
      }

      const { data, error, occasionValue } = await saveBooking(supabaseAdmin, bookingData);

      // Cancel any pending follow-ups for this phone
      if (bookingData.phone) {
        const digits = bookingData.phone.replace(/\D/g, '');
        const formattedPhone = digits.length === 10 ? `+1${digits}` : `+${digits}`;
        const { error: cancelErr } = await supabaseAdmin
          .from('scheduled_messages')
          .update({ sent: true })
          .eq('phone', formattedPhone)
          .eq('sent', false);
        if (cancelErr) console.error('Cancel follow-up error:', cancelErr);
      }

      if (error) {
        console.error('[Aria/confirm] Supabase insert error:', error);
        return json({
          type:     'booking_confirmed',
          response: 'I had trouble saving your booking. Please call us at (646) 879-1391.',
        }, req);
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

        // Update lead status to booked
        if (bookingData.phone?.trim()) {
          try {
            await supabaseAdmin
              .from('leads')
              .update({ status: 'booked' })
              .eq('phone', bookingData.phone.trim());
          } catch (err) {
            console.error('Lead status update error:', err);
          }
        }
      }

      return json({
        type:     'booking_confirmed',
        response: "You're all set. Mr. Rodriguez will take care of everything.",
      }, req);
    }

    // ── Mode 1: normal chat ───────────────────────────────────────────────
    const raw = body.messages;
    if (!Array.isArray(raw) || raw.length === 0) {
      return json({ error: 'messages array required' }, req, { status: 422 });
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
      return json({ error: 'No valid messages' }, req, { status: 422 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let rawResponse: string;
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 25000);

    try {
      const result = await client.messages.create(
        {
          model:      'claude-sonnet-4-5',
          max_tokens: 1500,
          system:     ARIA_SYSTEM_PROMPT + `\n\nCURRENT TIME CONTEXT:\nThe current time is ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit', hour12: true })} Central Time. Use this to determine the correct greeting — Good morning (5am–11:59am), Good afternoon (12pm–5:59pm), Good evening (6pm–4:59am).`,
          messages,
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      rawResponse = result.content
        .filter(block => block.type === 'text')
        .map(block => (block as { type: 'text'; text: string }).text)
        .join('');
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('[Aria] Request timed out after 25s');
        return json({
          type:     'message',
          response: "I'm sorry — it's taking a moment on our end. Please try again or call us directly at (646) 879-1391.",
        }, req);
      }
      console.error('[Aria] Anthropic error:', err);
      return json({
        type:     'message',
        response: 'I apologize — I am having trouble connecting right now. Please call us directly at (646) 879-1391.',
      }, req);
    }

    // ── BOOKING_READY detected → enforce SMS consent before confirmation ──
    const booking = extractBookingReady(rawResponse);

    if (booking) {
      // Hard code-level consent gate — independent of system prompt compliance.
      const consentStatus = hasExplicitSmsConsent(messages);

      if (consentStatus === 'pending') {
        // Consent not yet asked or answer was ambiguous — ask now, block confirmation.
        return json({
          type:     'message',
          response: 'Almost done — one quick thing. May I text you the confirmation details and any updates for this reservation? You can reply STOP at any time to opt out.',
        }, req);
      }

      if (consentStatus === 'declined') {
        // User explicitly declined SMS — route to phone booking, no card.
        return json({
          type:     'message',
          response: 'No problem — we can finalize your booking by phone. Please call (646)\u00a0879-1391 and we\'ll take care of everything directly.',
        }, req);
      }

      // consentStatus === 'granted' — fall through to normal confirmation logic
      const cleanMessage = stripBookingReady(rawResponse).trim() ||
        'Here are your ride details. Shall I reserve this for you?';

      // Check availability before confirming
      let availabilityWarning = null;
      if (booking.date && booking.time) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const availRes = await fetch(
            `${baseUrl}/api/availability?date=${encodeURIComponent(booking.date)}&time=${encodeURIComponent(booking.time)}`
          );
          const availData = await availRes.json();
          if (!availData.available && availData.nextAvailable) {
            const next = new Date(availData.nextAvailable);
            const nextStr = next.toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
            availabilityWarning = `That time is already reserved — I can take care of you at ${nextStr} instead.`;
          }
        } catch (availErr) {
          console.error('Availability check error:', availErr);
        }
      }

      const tier = classifyLead(booking);
      const alertMessage = formatOperatorAlert(booking, tier);

      try {
        if (process.env.OPERATOR_PHONE_NUMBER && process.env.TWILIO_PHONE_NUMBER) {
          await twilioClient.messages.create({
            body: alertMessage,
            from: process.env.TWILIO_PHONE_NUMBER,
            to:   process.env.OPERATOR_PHONE_NUMBER,
          });
        }
      } catch (smsErr) {
        console.error('Operator alert SMS failed:', smsErr);
      }

      // Save to leads table
      try {
        await supabaseAdmin
          .from('leads')
          .upsert({
            name:        booking.name?.trim()            || null,
            phone:       booking.phone?.trim()           || null,
            pickup:      booking.pickup_location?.trim() || null,
            destination: booking.destination?.trim()     || null,
            datetime:    booking.date?.trim()
                           ? `${booking.date.trim()} ${booking.time?.trim() ?? ''}`.trim()
                           : null,
            occasion:    booking.occasion?.trim()        || null,
            source:      'amirah',
            status:      'new',
          }, { onConflict: 'phone' });
      } catch (leadErr) {
        console.error('Lead save error:', leadErr);
      }

      return json({
        type:                'booking_confirmation',
        booking,
        message:             availabilityWarning || cleanMessage,
        tier,
        availabilityWarning: availabilityWarning || null,
      }, req);
    }

    // ── Normal response ───────────────────────────────────────────────────

    // Schedule follow-ups if a phone number was just provided
    const lastUserMessage = messages[messages.length - 1];
    const phoneRegex = /(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/;
    const hasPhone = lastUserMessage?.content &&
      phoneRegex.test(lastUserMessage.content);

    if (hasPhone && lastUserMessage?.role === 'user') {
      const phoneMatch = lastUserMessage.content.match(phoneRegex);
      const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : null;
      const formattedPhone = phone && phone.length === 10 ?
        `+1${phone}` : phone ? `+${phone}` : null;

      if (formattedPhone) {
        const now = new Date();
        const oneHour       = new Date(now.getTime() + 60 * 60 * 1000);
        const twentyFourHrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const { error: scheduleErr } = await supabaseAdmin.from('scheduled_messages').insert([
          {
            type:     'followup_1h',
            phone:    formattedPhone,
            send_at:  oneHour.toISOString(),
            sent:     false,
            message:  `${SENDER_ID}: Hi, this is Amirah following up. I wanted to make sure your transportation is taken care of. Still need a ride? I can have everything arranged in minutes. ${CTIA_FOOTER}`,
          },
          {
            type:     'followup_24h',
            phone:    formattedPhone,
            send_at:  twentyFourHrs.toISOString(),
            sent:     false,
            message:  `${SENDER_ID}: Hi, this is Amirah checking in. Your ride details are saved — just say the word and Mr. Rodriguez will take care of everything. Call (646) 879-1391. ${CTIA_FOOTER_SHORT}`,
          },
        ]);
        if (scheduleErr) console.error('Follow-up schedule error:', scheduleErr);
      }
    }

    return json({
      type:     'message',
      response: stripBookingReady(rawResponse),
    }, req);

  } catch (error) {
    console.error('[Aria] Unhandled error:', error);
    return json({
      type:     'message',
      response: 'I apologize — something went wrong on our end. Please call us at (646) 879-1391.',
    }, req);
  }
}
