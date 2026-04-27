import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import Stripe from 'stripe';

const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' });

const OPERATOR_PHONE = '+16468791391';
const FROM_PHONE     = process.env.TWILIO_PHONE!;

export async function POST(req: NextRequest) {
  try {
    const { phone, name, service, date, time, pickup, dropoff, price, passengers,
            returnTrip, returnDate, returnTime } = await req.json();

    const priceNum = parseInt(price, 10);

    if (!phone || !name) {
      return NextResponse.json({ error: 'phone and name required' }, { status: 422 });
    }

    const customerMsg =
      `Hi ${name}, this is Amirah with Synergy Lux. ` +
      `Your quote for ${service} on ${date} at ${time} ` +
      `from ${pickup} to ${dropoff} is $${price}. ` +
      (returnTrip ? `Return trip: ${dropoff} → ${pickup} on ${returnDate} at ${returnTime}. ` : '') +
      `Mr. Rodriguez will personally confirm your reservation shortly. ` +
      `Questions? Call (646) 879-1391.`;

    // ── Stripe checkout (best-effort) ────────────────────────────────────────
    let stripeUrl: string | null = null;
    if (!isNaN(priceNum) && priceNum > 0) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency:     'usd',
              unit_amount:  priceNum * 100,
              product_data: { name: `Synergy Lux — ${service}: ${pickup} → ${dropoff}` },
            },
            quantity: 1,
          }],
          mode:        'payment',
          success_url: 'https://synergyluxlimodfw.com?booked=true',
          cancel_url:  'https://synergyluxlimodfw.com',
        });
        stripeUrl = session.url;
      } catch (stripeErr) {
        console.error('[send-quote-confirmation] Stripe session failed:', stripeErr);
      }
    }

    // ── Build operator SMS ───────────────────────────────────────────────────
    const forwardBlock = stripeUrl
      ? `\n── FORWARD TO CLIENT ──\nHi ${name}, your Synergy Lux ${service} on ${date} at ${time} is confirmed. Tap to pay:\n${stripeUrl}\nReply STOP to opt out.`
      : '';

    const operatorMsg =
      `NEW QUOTE REQUEST\nName: ${name}\nPhone: ${phone}` +
      `\nService: ${service}\nDate: ${date} at ${time}` +
      `\nPickup: ${pickup}\nDropoff: ${dropoff}` +
      `\nQuoted: $${price}\nPassengers: ${passengers || 1}` +
      (returnTrip ? `\nReturn: ${returnDate} at ${returnTime} (${dropoff} → ${pickup})` : '') +
      forwardBlock;

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
