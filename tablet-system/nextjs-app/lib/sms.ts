// lib/sms.ts
// SMS service — stub until Twilio is configured.
// All logic lives here so swapping to real SMS requires only this file.
//
// To enable Twilio:
//   1. npm install twilio
//   2. Add to .env:
//        TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//        TWILIO_AUTH_TOKEN=your_auth_token
//        TWILIO_FROM=+1xxxxxxxxxx
//   3. Replace the console.log body below with the Twilio call.

export async function sendSMS(phone: string, message: string): Promise<void> {
  console.log(`[SMS] → ${phone}: ${message}`);

  // Twilio implementation (uncomment when ready):
  // const accountSid = process.env.TWILIO_ACCOUNT_SID;
  // const authToken  = process.env.TWILIO_AUTH_TOKEN;
  // const from       = process.env.TWILIO_FROM;
  // if (!accountSid || !authToken || !from) {
  //   console.warn('[SMS] Twilio env vars not set — skipping');
  //   return;
  // }
  // const twilio = require('twilio')(accountSid, authToken);
  // await twilio.messages.create({ body: message, from, to: phone });
}
