const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Create a Stripe Checkout Session for a booking.
 * Supports Apple Pay, Google Pay, and card via Payment Element.
 */
async function createCheckoutSession({ booking, customer, successUrl, cancelUrl }) {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'], // enables Apple Pay / Google Pay automatically
    customer_email: customer.email ?? undefined,
    metadata: {
      bookingId: booking.id,
      customerId: customer.id,
    },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: booking.price, // already in cents
          product_data: {
            name: `Synergy Lux — ${booking.pickup} → ${booking.dropoff}`,
            description: `Scheduled: ${new Date(booking.scheduledAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Validate Stripe webhook signature and return parsed event.
 */
function constructWebhookEvent(rawBody, signature) {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = { stripe, createCheckoutSession, constructWebhookEvent };
