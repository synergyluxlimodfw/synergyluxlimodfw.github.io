/**
 * app/api/aria/route.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Streaming API endpoint for the Aria AI concierge chat widget.
 * Accepts a messages array, calls Anthropic claude-sonnet-4-20250514,
 * and streams back SSE chunks.
 *
 * When BOOKING_READY JSON is detected in the completed response,
 * it is saved to the Supabase bookings_calendar table.
 *
 * Required env var:
 *   ANTHROPIC_API_KEY
 * ─────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from 'next/server';
import Anthropic        from '@anthropic-ai/sdk';
import { supabase }     from '@/lib/supabase';

export const runtime = 'edge';

// ── CORS headers (GitHub Pages → Next.js) ─────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  'https://synergyluxlimodfw.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// ── System prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Aria, a luxury chauffeur concierge for Prestige by Synergy Lux.
Your role is to guide users toward booking a ride while maintaining a premium, effortless experience.

TONE
- Calm, confident, and refined
- Never pushy or salesy
- Never overly casual
- Speak like a high-end concierge

PRIMARY GOAL
Guide every conversation toward a confirmed booking.

CONVERSATION FLOW
1. Always begin with: 'Welcome to Prestige by Synergy Lux. What's the occasion for your ride?'
2. Identify customer type: Airport, Corporate, Wedding, or Event
3. Adapt tone: Airport → reliability/timing, Corporate → efficiency/professionalism, Wedding → elegance/coordination, Event → experience/flexibility
4. Collect booking details naturally one question at a time: pickup location, destination, date, time
5. Provide reassurance: 'Everything looks good on our end.'
6. Move toward booking: 'Let me secure this for you.'
7. Confirm: 'You are all set for [date/time]. We will take care of everything from here.'

RULES
- Never ask 'Do you want to book?'
- Never overwhelm with questions
- Never sound like customer support
- Keep responses concise and elegant
- Always guide the user forward

PRICE HANDLING
If asked about price: 'Pricing depends slightly on timing and distance, but I can confirm that for you right away.'

SERVICES AND PRICING
- Airport Transfer DFW: from $155
- Airport Transfer Love Field: from $140
- Hourly Charter: $165/hr (2hr minimum)
- Wedding: from $625
- Prom and Events: from $575
- Night Out: from $475
- Sporting Events: $300 roundtrip
- Corporate accounts: 4+ rides/month, 10-15% off all rides

BOOKING COMPLETION
When you have collected name, pickup, destination, date and time — tell the user:
'Perfect. I have everything I need. Let me send you a secure payment link to confirm your reservation.'
Then output this exact JSON on a new line (the system will intercept it):
BOOKING_READY:{"name":"[name]","pickup":"[pickup]","destination":"[destination]","date":"[date]","time":"[time]","service":"[service]","phone":"[phone if collected]"}`;

// ── Message type ──────────────────────────────────────────────────────────
interface ChatMessage {
  role:    'user' | 'assistant';
  content: string;
}

// ── POST handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: { messages?: unknown };

  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS });
  }

  const incoming = body.messages;
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return new Response('messages array required', { status: 422, headers: CORS });
  }

  // Validate and clean message array
  const messages: ChatMessage[] = incoming
    .filter((m): m is ChatMessage =>
      typeof m === 'object' &&
      m !== null &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
    )
    .map(m => ({ role: m.role, content: m.content.trim() }));

  if (messages.length === 0) {
    return new Response('No valid messages', { status: 422, headers: CORS });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ── Stream from Anthropic → SSE to client ─────────────────────────────
  const encoder = new TextEncoder();
  let fullText  = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 512,
          system:     SYSTEM_PROMPT,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text;
            fullText += chunk;

            // Forward as SSE
            const ssePayload = JSON.stringify({ delta: { text: chunk } });
            controller.enqueue(encoder.encode(`data: ${ssePayload}\n\n`));
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();

        // ── Detect BOOKING_READY and save to Supabase ────────────────────
        const match = fullText.match(/BOOKING_READY:(\{[\s\S]*?\})/);
        if (match) {
          try {
            const booking = JSON.parse(match[1]);
            await supabase.from('bookings_calendar').insert({
              guest_name:  booking.name        || null,
              pickup:      booking.pickup      || null,
              destination: booking.destination || null,
              date:        booking.date        || null,
              time:        booking.time        || null,
              service:     booking.service     || null,
              phone:       booking.phone       || null,
              source:      'aria_chat',
            });
          } catch (e) {
            console.error('[Aria] Failed to save booking:', e);
          }
        }

      } catch (err) {
        console.error('[Aria] Stream error:', err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS,
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
