import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: 'Missing contact info' },
        { status: 400 }
      );
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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Booking notify error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
