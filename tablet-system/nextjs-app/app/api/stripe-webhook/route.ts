import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    return new NextResponse('Missing stripe-signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { phone, name, pickup, destination, occasion } = session.metadata || {};
    const amount = session.amount_total ? session.amount_total / 100 : 0;

    try {
      // Create ride in Supabase
      const { data: ride } = await supabase
        .from('rides')
        .insert({
          guest_name: name,
          phone: phone || null,
          pickup: pickup || null,
          destination,
          occasion: occasion || null,
          chauffeur: 'Mr. Rodriguez',
          status: 'scheduled',
          source: 'stripe',
          eta_minutes: 0,
        })
        .select()
        .single();

      console.log('[Stripe webhook] Ride created:', ride?.id);

      // Notify operator
      try {
        await twilioClient.messages.create({
          body: `💳 Payment received — ${name}\n${pickup ? `${pickup} → ` : ''}${destination}${occasion ? `\n${occasion}` : ''}\nAmount: $${amount}\nPhone: ${phone || 'not provided'}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: process.env.OPERATOR_PHONE_NUMBER!,
        });
      } catch (smsErr) {
        console.error('Operator SMS failed:', smsErr);
      }

      // Confirm to client
      if (phone) {
        try {
          await twilioClient.messages.create({
            body: `Synergy Lux — Payment confirmed. Your ride is booked. Mr. Rodriguez will be in touch to confirm details. Questions? Call (646) 879-1391.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone,
          });
        } catch (smsErr) {
          console.error('Client confirmation SMS failed:', smsErr);
        }
      }

    } catch (dbErr) {
      console.error('[Stripe webhook] DB error:', dbErr);
    }
  }

  return NextResponse.json({ received: true });
}
