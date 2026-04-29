import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

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

function json(body: unknown, req: NextRequest, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders(req), ...(init?.headers ?? {}) },
  });
}

export async function POST(req: NextRequest) {
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  try {
    const body = await req.json();
    const {
      Name,
      Phone,
      Email,
      Service,
      Pickup_Location,
      Dropoff_Location,
      Date,
      Time,
      Passengers,
      Notes,
    } = body;

    if (!Phone && !Email) {
      return json({ error: 'Missing contact info' }, req, { status: 400 });
    }

    // Format phone to E.164 if provided
    let passengerPhone = '';
    if (Phone) {
      const digits = Phone.replace(/\D/g, '');
      if (digits.length === 10) passengerPhone = '+1' + digits;
      else if (digits.length === 11) passengerPhone = '+' + digits;
      else passengerPhone = '+' + digits;
    }

    // SMS to operator (you)
    try {
      await twilioClient.messages.create({
        body: `New booking — ${Name}\n${Service}\n${Pickup_Location} → ${Dropoff_Location}\n${Date} at ${Time}\n${Passengers}\nPhone: ${Phone}\nEmail: ${Email}${Notes ? `\nNotes: ${Notes}` : ''}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.OPERATOR_PHONE_NUMBER!,
      });
    } catch (err) {
      console.error('Operator SMS failed:', err);
    }

    // SMS to client (only if valid phone)
    if (passengerPhone.length >= 12) {
      try {
        await twilioClient.messages.create({
          body: `Synergy Lux — We received your booking request for ${Service}. Mr. Rodriguez will confirm shortly. Questions? Call (646) 879-1391 or visit synergyluxlimodfw.com`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: passengerPhone,
        });
      } catch (err) {
        console.error('Client SMS failed:', err);
      }
    }

    return json({ success: true }, req);
  } catch (err: any) {
    console.error('Booking notify error:', err);
    return json({ error: err.message }, req, { status: 500 });
  }
}
