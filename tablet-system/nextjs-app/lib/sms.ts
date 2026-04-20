/**
 * lib/sms.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Twilio SMS automation for Synergy Lux ride lifecycle messaging.
 *
 * Message flow per ride:
 *   1. Booking confirmed  → immediate SMS
 *   2. Pre-ride reminder  → start_time − 2 h  (scheduled)
 *   3. Post-ride          → end_time + 20 min  (scheduled)
 *   4. Review request     → end_time + 2 h     (scheduled)
 *   5. Rebook nudge       → end_time + 24 h    (scheduled)
 *
 * Required env vars:
 *   TWILIO_SID, TWILIO_AUTH, TWILIO_PHONE
 *   BOOKING_URL, GOOGLE_REVIEW_URL
 *   SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL
 * ─────────────────────────────────────────────────────────────────────────
 */

import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { addMinutes, addHours, subHours } from 'date-fns';

// ── Clients ───────────────────────────────────────────────────────────────

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

// Admin client bypasses RLS — server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────

export interface Ride {
  id:           string;
  guest_name:   string;
  client_phone: string;
  destination:  string;
  occasion:     string | null;
  chauffeur:    string;
  status:       string;
  start_time?:  string | null;
  end_time?:    string | null;
  date?:        string | null;
  time?:        string | null;
}

type ScheduledMessageType =
  | 'PRE_RIDE_REMINDER'
  | 'POST_RIDE'
  | 'REVIEW_REQUEST'
  | 'REBOOK_NUDGE';

// ── Message templates ─────────────────────────────────────────────────────

function bookingConfirmed(ride: Ride): string {
  const dateStr = ride.date ?? 'your scheduled date';
  const timeStr = ride.time ?? 'your scheduled time';
  return [
    `Synergy Lux: Your ride is confirmed for ${dateStr} at ${timeStr}.`,
    '',
    `Chauffeur: ${ride.chauffeur}`,
    'Vehicle: Cadillac Escalade',
    '',
    'Reply here if you need anything.',
  ].join('\n');
}

function preRideReminder(): string {
  return [
    "Synergy Lux: We'll be arriving shortly for your ride today.",
    '',
    'Your chauffeur will be ready and on time.',
    'Reply here if anything changes.',
    '',
    'See you soon.',
  ].join('\n');
}

function postRide(): string {
  return [
    'Thank you for riding with Synergy Lux today.',
    '',
    `Reserve your next ride here:\n${process.env.BOOKING_URL}`,
  ].join('\n');
}

function reviewRequest(): string {
  return [
    "If you had a great experience, we'd truly appreciate a quick review:",
    process.env.GOOGLE_REVIEW_URL,
    '',
    'Thank you — it means a lot.',
  ].join('\n');
}

function rebookNudge(name: string): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  return [
    `Hi ${firstName}, if you need another ride this week, I'd be happy to take care of it.`,
    '',
    `Reserve anytime:\n${process.env.BOOKING_URL}`,
  ].join('\n');
}

function airportReturn(name: string): string {
  const firstName = name ? name.split(' ')[0] : 'there';
  return [
    `Hi ${firstName}, if you'll need a return ride from the airport, I can have that ready for you.`,
    '',
    `Schedule here:\n${process.env.BOOKING_URL}`,
  ].join('\n');
}

// ── Core send ─────────────────────────────────────────────────────────────

export async function sendSMS(to: string, body: string): Promise<void> {
  await twilioClient.messages.create({
    from: process.env.TWILIO_PHONE,
    to,
    body,
  });
}

// ── Lifecycle scheduling ───────────────────────────────────────────────────

export async function scheduleLifecycleMessages(ride: Ride): Promise<void> {
  const startTime = ride.start_time ? new Date(ride.start_time) : null;
  const endTime   = ride.end_time   ? new Date(ride.end_time)   : null;

  const rows: { ride_id: string; type: ScheduledMessageType; send_at: string }[] = [];

  if (startTime) {
    rows.push({
      ride_id: ride.id,
      type:    'PRE_RIDE_REMINDER',
      send_at: subHours(startTime, 2).toISOString(),
    });
  }

  if (endTime) {
    rows.push(
      {
        ride_id: ride.id,
        type:    'POST_RIDE',
        send_at: addMinutes(endTime, 20).toISOString(),
      },
      {
        ride_id: ride.id,
        type:    'REVIEW_REQUEST',
        send_at: addHours(endTime, 2).toISOString(),
      },
      {
        ride_id: ride.id,
        type:    'REBOOK_NUDGE',
        send_at: addHours(endTime, 24).toISOString(),
      }
    );
  }

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from('scheduled_messages')
    .insert(rows);

  if (error) console.error('[SMS] scheduleLifecycleMessages insert error:', error);
}

// ── High-level handlers ───────────────────────────────────────────────────

export async function handleBookingConfirmed(ride: Ride): Promise<void> {
  if (!ride.client_phone) return;

  try {
    await sendSMS(ride.client_phone, bookingConfirmed(ride));
    console.log('[SMS] bookingConfirmed sent to', ride.client_phone);
  } catch (err) {
    console.error('[SMS] bookingConfirmed error:', err);
  }

  await scheduleLifecycleMessages(ride);
}

export async function handlePostRide(rideId: string): Promise<void> {
  const { data: ride, error } = await supabaseAdmin
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (error || !ride) {
    console.error('[SMS] handlePostRide — ride not found:', rideId, error);
    return;
  }

  if (!ride.client_phone) return;

  try {
    await sendSMS(ride.client_phone, postRide());
    console.log('[SMS] postRide sent to', ride.client_phone);
  } catch (err) {
    console.error('[SMS] postRide error:', err);
  }
}

export async function sendAirportReturn(rideId: string): Promise<void> {
  const { data: ride, error } = await supabaseAdmin
    .from('rides')
    .select('*')
    .eq('id', rideId)
    .single();

  if (error || !ride) {
    console.error('[SMS] sendAirportReturn — ride not found:', rideId, error);
    return;
  }

  if (!ride.client_phone) return;

  try {
    await sendSMS(ride.client_phone, airportReturn(ride.guest_name ?? ''));
    console.log('[SMS] airportReturn sent to', ride.client_phone);
  } catch (err) {
    console.error('[SMS] airportReturn error:', err);
  }
}

// ── Cron processor ────────────────────────────────────────────────────────

export async function processScheduledMessages(): Promise<number> {
  const { data: messages, error } = await supabaseAdmin
    .from('scheduled_messages')
    .select('*, rides(*)')
    .eq('sent', false)
    .lte('send_at', new Date().toISOString());

  if (error) {
    console.error('[SMS] processScheduledMessages fetch error:', error);
    return 0;
  }

  if (!messages || messages.length === 0) return 0;

  let processed = 0;

  for (const msg of messages) {
    const ride = msg.rides as Ride | null;

    if (!ride?.client_phone) {
      // No phone — mark sent to skip on future runs
      await supabaseAdmin
        .from('scheduled_messages')
        .update({ sent: true })
        .eq('id', msg.id);
      continue;
    }

    try {
      let body: string;

      switch (msg.type as ScheduledMessageType) {
        case 'PRE_RIDE_REMINDER':
          body = preRideReminder();
          break;
        case 'POST_RIDE':
          body = postRide();
          break;
        case 'REVIEW_REQUEST':
          body = reviewRequest();
          break;
        case 'REBOOK_NUDGE':
          body = rebookNudge(ride.guest_name ?? '');
          break;
        default:
          console.warn('[SMS] Unknown message type:', msg.type);
          continue;
      }

      await sendSMS(ride.client_phone, body);
      console.log(`[SMS] ${msg.type} sent to ${ride.client_phone}`);
    } catch (err) {
      console.error(`[SMS] ${msg.type} send error:`, err);
    }

    await supabaseAdmin
      .from('scheduled_messages')
      .update({ sent: true })
      .eq('id', msg.id);

    processed++;
  }

  return processed;
}
