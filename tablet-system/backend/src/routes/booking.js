const { Router } = require('express');
const prisma = require('../lib/prisma');
const { createCheckoutSession, constructWebhookEvent } = require('../lib/stripe');

const router = Router();

// ─────────────────────────────────────────────
// POST /booking/create
// Rebook flow — creates booking + Stripe session
// ─────────────────────────────────────────────
router.post('/create', async (req, res) => {
  const { customerId, pickup, dropoff, scheduledAt, price } = req.body;

  if (!customerId || !pickup || !dropoff || !scheduledAt || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const booking = await prisma.booking.create({
      data: {
        customerId,
        pickup,
        dropoff,
        scheduledAt: new Date(scheduledAt),
        price: parseInt(price), // cents — e.g. 16500 = $165
        status: 'PENDING',
      },
    });

    const session = await createCheckoutSession({
      booking,
      customer,
      successUrl: `${process.env.FRONTEND_URL}/booking/success`,
      cancelUrl:  `${process.env.FRONTEND_URL}/rebook/${customerId}`,
    });

    // Store Stripe session ID on booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    res.status(201).json({
      booking,
      checkoutUrl: session.url,
    });
  } catch (err) {
    console.error('POST /booking/create', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ─────────────────────────────────────────────
// GET /booking/customer/:customerId
// Returns last booking for QR rebook prefill
// ─────────────────────────────────────────────
router.get('/customer/:customerId', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId: req.params.customerId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    // Also grab last completed ride for route prefill
    const lastRide = await prisma.ride.findFirst({
      where: {
        customerId: req.params.customerId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
    });

    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    res.json({
      customer,
      lastBooking: bookings[0] ?? null,
      lastRide: lastRide ?? null,
    });
  } catch (err) {
    console.error('GET /booking/customer/:id', err);
    res.status(500).json({ error: 'Failed to fetch customer data' });
  }
});

// ─────────────────────────────────────────────
// POST /booking/webhook
// Stripe webhook — mark booking as PAID
// Raw body required (set in index.js)
// ─────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature invalid:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      await prisma.booking.update({
        where: { stripeSessionId: session.id },
        data: { status: 'PAID' },
      });
      console.log(`[Stripe] Booking paid — session ${session.id}`);
    } catch (err) {
      console.error('Failed to update booking after payment:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
