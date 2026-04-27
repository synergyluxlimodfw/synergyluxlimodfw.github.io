import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const OPERATOR_PHONE = '+16468791391';
const FROM_PHONE     = process.env.TWILIO_PHONE!;

export async function POST(req: NextRequest) {
  try {
    const { phone, name, service, date, time, pickup, dropoff, price, passengers } = await req.json();

    if (!phone || !name) {
      return NextResponse.json({ error: 'phone and name required' }, { status: 422 });
    }

    const customerMsg =
      `Hi ${name}, this is Amirah with Synergy Lux. ` +
      `Your quote for ${service} on ${date} at ${time} ` +
      `from ${pickup} to ${dropoff} is $${price}. ` +
      `Mr. Rodriguez will personally confirm your reservation shortly. ` +
      `Questions? Call (646) 879-1391.`;

    const operatorMsg =
      `NEW QUOTE REQUEST\nName: ${name}\nPhone: ${phone}` +
      `\nService: ${service}\nDate: ${date} at ${time}` +
      `\nPickup: ${pickup}\nDropoff: ${dropoff}` +
      `\nQuoted: $${price}\nPassengers: ${passengers || 1}`;

    await Promise.allSettled([
      twilioClient.messages.create({ from: FROM_PHONE, to: phone,          body: customerMsg }),
      twilioClient.messages.create({ from: FROM_PHONE, to: OPERATOR_PHONE, body: operatorMsg }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[send-quote-confirmation]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
