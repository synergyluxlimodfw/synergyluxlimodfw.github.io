import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const E164 = /^\+[1-9]\d{7,14}$/;

export async function POST(req: Request) {
  const { rideId, phone, pickup, occasion, guestName } = await req.json();

  if (!phone || !E164.test(phone)) {
    return NextResponse.json(
      { error: "Invalid phone number — E.164 format required (e.g. +12145550000)" },
      { status: 400 }
    );
  }

  const { error: dbError } = await supabase.from("rebook_requests").insert({
    ride_id:    rideId   || null,
    guest_name: guestName || null,
    phone,
    pickup:     pickup   || null,
    occasion:   occasion || null,
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
    await twilioClient.messages.create({
      to:   operatorPhone,
      from,
      body: `[Rebook] ${guestName || "Guest"} (${phone}) — pickup: ${pickup || "TBD"} — occasion: ${occasion || "TBD"}.`,
    });
  }

  return NextResponse.json({ ok: true });
}
