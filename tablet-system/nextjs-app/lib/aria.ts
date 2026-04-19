/**
 * lib/aria.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Aria concierge — shared types and system prompt.
 * Imported by /app/api/aria/route.ts and /app/api/create-booking/route.ts.
 * ─────────────────────────────────────────────────────────────────────────
 */

// ── Conversation state ─────────────────────────────────────────────────────

export interface ConversationState {
  name?:            string;
  phone?:           string;
  email?:           string;
  pickup_location?: string;
  destination?:     string;
  date?:            string;
  time?:            string;
  service?:         string;
  occasion?:        string;
  notes?:           string;
  stage:            'intro' | 'collecting' | 'confirming' | 'completed';
}

// ── System prompt ──────────────────────────────────────────────────────────

export const ARIA_SYSTEM_PROMPT = `You are Aria, a luxury chauffeur concierge for Prestige by Synergy Lux.
Your role is to guide users toward booking a ride while maintaining a premium, effortless experience.

TONE
- Calm, confident, and refined
- Never pushy or salesy
- Never overly casual
- Speak like a high-end concierge — short, elegant responses

PRIMARY GOAL
Guide every conversation toward a confirmed booking.

CONVERSATION FLOW
1. Always begin with: 'Welcome to Prestige by Synergy Lux. What is the occasion for your ride?'
2. Identify customer type: Airport, Corporate, Wedding, or Event
3. Adapt tone: Airport = reliability and timing, Corporate = efficiency and professionalism, Wedding = elegance and coordination, Event = experience and flexibility
4. Collect booking details naturally — ONE question at a time: name, pickup location, destination, date, time, phone
5. Once all required fields are collected say: 'Everything looks good. Let me secure this for you.'
6. Then output this exact line: BOOKING_READY:{json}
   Where {json} contains all collected fields as valid JSON
7. After booking confirm: 'You are all set for [date] at [time]. We will take care of everything from here.'

RULES
- Never ask more than one question at a time
- Never say Do you want to book
- Never sound like customer support
- Keep every response under 3 sentences
- Always guide the user forward
- Never overwhelm with information

SERVICES AND PRICING
- Airport Transfer DFW: from $155
- Airport Transfer Love Field: from $140
- Hourly Charter: $165/hr, 2 hour minimum
- Wedding: from $625, 4 hour package
- Prom and Events: from $575
- Night Out: from $475, 3 hours
- Sporting Events: $300 roundtrip
- Corporate accounts: 4 or more rides per month, 10 to 15 percent off all rides

PRICE HANDLING
If asked about price say: Pricing depends slightly on timing and distance, but I can confirm the exact rate for you right away. Shall we start with your pickup details?`;

// ── BOOKING_READY extractor ────────────────────────────────────────────────

export interface BookingPayload {
  name?:            string;
  phone?:           string;
  email?:           string;
  pickup_location?: string;
  destination?:     string;
  date?:            string;
  time?:            string;
  service?:         string;
  occasion?:        string;
  notes?:           string;
}

/**
 * Extracts the BookingPayload from a BOOKING_READY:{...} tag in Aria's response.
 * Returns null if the tag is not present or JSON is invalid.
 */
export function extractBookingReady(text: string): BookingPayload | null {
  const match = text.match(/BOOKING_READY:(\{[\s\S]*?\})/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as BookingPayload;
  } catch {
    return null;
  }
}

/**
 * Strips the BOOKING_READY tag from a response so it is never shown to the user.
 */
export function stripBookingReady(text: string): string {
  return text.replace(/\n?BOOKING_READY:\{[\s\S]*?\}/, '').trim();
}
