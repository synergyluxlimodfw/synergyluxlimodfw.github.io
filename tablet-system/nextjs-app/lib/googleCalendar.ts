/**
 * lib/googleCalendar.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Google Calendar integration via OAuth 2.0 (refresh token flow).
 * Uses a long-lived refresh token so the server never needs user interaction.
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID       — OAuth 2.0 client ID
 *   GOOGLE_CLIENT_SECRET   — OAuth 2.0 client secret
 *   GOOGLE_REFRESH_TOKEN   — offline refresh token (one-time setup, see below)
 *   GOOGLE_CALENDAR_ID     — calendar ID, e.g. "primary" or "abc123@group.calendar.google.com"
 * ─────────────────────────────────────────────────────────────────────────
 */

import { google } from 'googleapis';

// ── Types ──────────────────────────────────────────────────────────────────

export interface BookingData {
  guestName:   string;
  pickup:      string;
  destination: string;
  date:        string; // ISO date string: "2026-04-20"
  timeSlot:    string; // "HH:MM" in 24-hour, e.g. "14:30"
  durationMin: number; // estimated ride duration in minutes
  occasion?:   string;
  phone?:      string;
  notes?:      string;
}

// ── OAuth2 client (module singleton) ───────────────────────────────────────

function getAuthClient() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return client;
}

function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getAuthClient() });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? 'primary';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Converts "2026-04-20" + "14:30" → RFC3339 string in local time */
function toRFC3339(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

/** Adds minutes to an RFC3339 string */
function addMinutes(rfc3339: string, minutes: number): string {
  return new Date(new Date(rfc3339).getTime() + minutes * 60_000).toISOString();
}

// ── checkAvailability ──────────────────────────────────────────────────────

/**
 * Returns true if the calendar has no events overlapping the given
 * date + timeSlot window (uses a 60-minute window by default).
 */
export async function checkAvailability(
  date: string,
  timeSlot: string,
  durationMin = 60,
): Promise<boolean> {
  const calendar   = getCalendarClient();
  const timeMin    = toRFC3339(date, timeSlot);
  const timeMax    = addMinutes(timeMin, durationMin);

  const { data } = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    maxResults: 1,
  });

  return (data.items?.length ?? 0) === 0;
}

// ── createCalendarEvent ────────────────────────────────────────────────────

/**
 * Creates a calendar event for a booked ride.
 * Returns the Google Calendar event ID (store this to delete later if needed).
 */
export async function createCalendarEvent(booking: BookingData): Promise<string> {
  const calendar = getCalendarClient();

  const startTime = toRFC3339(booking.date, booking.timeSlot);
  const endTime   = addMinutes(startTime, booking.durationMin);

  const descriptionLines = [
    `Guest: ${booking.guestName}`,
    `Pickup: ${booking.pickup}`,
    `Destination: ${booking.destination}`,
    booking.occasion ? `Occasion: ${booking.occasion}` : null,
    booking.phone    ? `Phone: ${booking.phone}`        : null,
    booking.notes    ? `Notes: ${booking.notes}`        : null,
  ].filter(Boolean).join('\n');

  const { data } = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary:     `Prestige · ${booking.guestName} → ${booking.destination}`,
      description: descriptionLines,
      location:    booking.pickup,
      start: { dateTime: startTime, timeZone: 'America/Chicago' },
      end:   { dateTime: endTime,   timeZone: 'America/Chicago' },
      colorId: '5', // banana yellow — closest to gold in Google Calendar
    },
  });

  if (!data.id) throw new Error('Google Calendar returned no event ID');
  return data.id;
}

// ── deleteCalendarEvent ────────────────────────────────────────────────────

/**
 * Deletes a calendar event by its Google Calendar event ID.
 * Safe to call on already-deleted events (404 is silently ignored).
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendarClient();

  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });
  } catch (err: unknown) {
    // 404 = already deleted or never existed — not an error for our purposes
    if ((err as { code?: number }).code === 404) return;
    throw err;
  }
}
