import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, name, pickup, destination, occasion } = await req.json();

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
          body: `Synergy Lux — Your secure booking link: ${session.url}\n\nReply with any questions or call (646) 879-1391.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
      } catch (smsErr) {
        console.error('SMS failed:', smsErr);
      }
    }

    // Update lead status if exists
    if (phone) {
      await supabase
        .from('rides')
        .update({ status: 'link_sent' })
        .eq('phone', phone)
        .eq('status', 'scheduled');
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
