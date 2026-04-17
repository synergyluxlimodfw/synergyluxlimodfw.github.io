import { NextRequest, NextResponse } from 'next/server';
import { saveConversion, getAllConversions, getConversionStats } from '@/lib/store';
import { sendSMS } from '@/lib/sms';

const VALID_EVENTS = ['viewed_offer', 'clicked_book', 'completed_payment'] as const;
type ValidEvent = typeof VALID_EVENTS[number];

/** POST /api/track — log a conversion event */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, customerId, service, timestamp, phone } = body as {
      event?: string;
      customerId?: string;
      service?: string;
      timestamp?: string;
      phone?: string;
    };

    console.log('[API] POST /api/track', body);

    if (!event || !VALID_EVENTS.includes(event as ValidEvent)) {
      return NextResponse.json(
        { error: `event must be one of: ${VALID_EVENTS.join(', ')}` },
        { status: 400 },
      );
    }

    const record = saveConversion({
      event:      event as ValidEvent,
      customerId: customerId ?? 'anonymous',
      service:    service ?? '',
      timestamp:  timestamp ?? new Date().toISOString(),
    });

    // Trigger SMS confirmation on completed payment
    if (event === 'completed_payment' && phone?.trim()) {
      const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://synergyluxlimodfw.github.io';
      const rebookUrl = `${appUrl}/rebook/${customerId ?? 'demo'}`;
      await sendSMS(
        phone.trim(),
        `Your Synergy Lux ride is confirmed. Book your next ride anytime: ${rebookUrl}`,
      );
    }

    return NextResponse.json({ ok: true, record });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/** GET /api/track — return all events + funnel stats (admin use) */
export async function GET() {
  return NextResponse.json({
    conversions: getAllConversions(),
    stats:       getConversionStats(),
  });
}
