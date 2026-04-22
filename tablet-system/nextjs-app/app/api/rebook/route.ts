import crypto from 'crypto';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const E164 = /^\+[1-9]\d{7,14}$/;

export async function POST(req: Request) {
  const {
    originalRideId,
    passengerName,
    phone,
    pickup,
    destination,
    vehicleType,
    occasion,
  } = await req.json();

  if (!phone || !E164.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone number — E.164 format required (e.g. +12145550000)" },
      { status: 400 }
    );
  }

  const confirmToken = crypto.randomBytes(16).toString('hex');

  const { error: dbError } = await supabase.from("rebook_requests").insert({
    original_ride_id: originalRideId  || null,
    passenger_name:   passengerName   || null,
    phone,
    pickup:           pickup          || null,
    destination:      destination     || null,
    vehicle_type:     vehicleType     || '2024 Cadillac Escalade',
    occasion:         occasion        || null,
    status:           'pending',
    source:           'tablet',
    confirm_token:    confirmToken,
  });

  if (dbError) {
    console.error("[rebook] supabase insert error:", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  const from = process.env.TWILIO_PHONE_NUMBER!;

  await twilioClient.messages.create({
    to:   phone,
    from,
    body: `Synergy Lux: Your ride request has been received. Our team will confirm your booking shortly. — Synergy Lux Limo DFW`,
  });

  const operatorPhone = process.env.OPERATOR_PHONE_NUMBER;
  if (operatorPhone) {
    const confirmLink = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm?token=${confirmToken}`;
    await twilioClient.messages.create({
      to:   operatorPhone,
      from,
      body: `New rebook — ${passengerName || "Guest"}\n${pickup || "TBD"} → ${destination || "TBD"}\nPhone: ${phone}\nConfirm: ${confirmLink}`,
    });
  }

  return NextResponse.json({ ok: true });
}
