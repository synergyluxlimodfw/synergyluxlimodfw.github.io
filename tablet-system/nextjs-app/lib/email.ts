import { Resend } from 'resend';

interface BookingLinkEmailParams {
  to:          string;
  name:        string;
  service:     string;
  pickup:      string;
  destination: string;
  date:        string;
  time:        string;
  price:       number;
  stripeUrl:   string;
}

export async function sendBookingLink(params: BookingLinkEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith('re_placeholder')) {
    console.warn('[email] RESEND_API_KEY not configured — skipping email');
    return;
  }
  const resend = new Resend(apiKey);
  const { to, name, service, pickup, destination, date, time, price, stripeUrl } = params;

  const text = [
    `Hi ${name || 'there'},`,
    '',
    'Thank you for choosing Synergy Lux Limo DFW.',
    '',
    `Your ${service} from ${pickup} to ${destination} on ${date} at ${time} is confirmed.`,
    'Chauffeur: Mr. Rodriguez | 2024 Cadillac Escalade',
    '',
    `Total: $${price}`,
    '',
    'Tap below to complete your secure booking:',
    stripeUrl,
    '',
    'Questions? Call or text (646) 879-1391',
    'synergyluxlimodfw.com',
    '',
    '— Amirah',
    'Synergy Lux Concierge',
  ].join('\n');

  await resend.emails.send({
    from:    'Amirah <amirah@synergyluxlimodfw.com>',
    to,
    subject: 'Your Synergy Lux booking is ready — secure your ride',
    text,
  });
}
