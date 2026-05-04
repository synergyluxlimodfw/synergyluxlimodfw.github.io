import { SENDER_ID, CTIA_FOOTER } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';
import { sendBookingLink as sendBookingLinkEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, name, pickup, destination, occasion, email, service, date, time } = await req.json();

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (!amount || !name || !destination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Synergy Lux — ${pickup ? `${pickup} → ` : ''}${destination}`,
              description: `Chauffeur: Mr. Rodriguez | 2024 Cadillac Escalade${occasion ? ` | ${occasion}` : ''}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: {
        phone: phone || '',
        name,
        pickup: pickup || '',
        destination,
        occasion: occasion || '',
      },
    });

    // Send SMS to client if phone provided
    if (phone) {
      try {
        await twilioClient.messages.create({
          body: `${SENDER_ID}: Your $${amount} booking is ready: ${session.url}\n\nReply with any questions or call (646) 879-1391. ${CTIA_FOOTER}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
      } catch (smsErr) {
        console.error('SMS failed:', smsErr);
      }
    }

    // Send email fallback in parallel (non-blocking)
    if (email) {
      sendBookingLinkEmail({
        to:          email,
        name:        name        || '',
        service:     service     || occasion || '',
        pickup:      pickup      || '',
        destination: destination || '',
        date:        date        || '',
        time:        time        || '',
        price:       amount,
        stripeUrl:   session.url!,
      }).catch(err => console.error('[send-booking-link] Email send error:', err));
    }

    // Update lead status if exists
    if (phone) {
      await supabase
        .from('leads')
        .update({ status: 'link_sent' })
        .eq('phone', phone);
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });

  } catch (err: any) {
    console.error('Send booking link error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
