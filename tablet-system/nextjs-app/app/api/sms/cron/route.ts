/**
 * app/api/sms/cron/route.ts
 * GET — processes all pending scheduled_messages whose send_at <= now().
 * Called every minute by Vercel Cron.
 */

import { NextResponse } from 'next/server';
import { processScheduledMessages } from '@/lib/sms';

export async function GET() {
  try {
    const processed = await processScheduledMessages();
    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    console.error('[SMS /cron]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
