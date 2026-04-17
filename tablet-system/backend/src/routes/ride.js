const { Router } = require('express');
const prisma = require('../lib/prisma');
const { requireDriver } = require('../middleware/auth');
const { schedule, reschedule, cancel } = require('../lib/promptScheduler');

const router = Router();

// Injected by index.js after socket server is ready
let emitToRide;
function setEmitter(fn) { emitToRide = fn; }

// ─────────────────────────────────────────────
// POST /ride/start
// Called by driver app to begin a ride session
// ─────────────────────────────────────────────
router.post('/start', requireDriver, async (req, res) => {
  const { name, phone, pickup, dropoff, chauffeurName, etaMinutes } = req.body;

  if (!name || !phone || !pickup || !dropoff || !chauffeurName || !etaMinutes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Upsert customer by phone (phone is the reliable unique identifier)
    const customer = await prisma.customer.upsert({
      where: { phone },
      update: { name }, // refresh name if it changed
      create: { name, phone },
    });

    // Create ride
    const ride = await prisma.ride.create({
      data: {
        customerId: customer.id,
        pickup,
        dropoff,
        chauffeurName,
        etaMinutes: parseInt(etaMinutes),
        status: 'ACTIVE',
      },
    });

    // Schedule auto-prompts
    schedule(ride.id, ride.etaMinutes, (rideId, type) => {
      if (emitToRide) emitToRide(rideId, 'show:rebook', { type });
    });

    res.status(201).json({ ride, customer });
  } catch (err) {
    console.error('POST /ride/start', err);
    res.status(500).json({ error: 'Failed to start ride' });
  }
});

// ─────────────────────────────────────────────
// GET /ride/:id
// Tablet polls this on load to hydrate state
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({
      where: { id: req.params.id },
      include: { customer: true },
    });

    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('GET /ride/:id', err);
    res.status(500).json({ error: 'Failed to fetch ride' });
  }
});

// ─────────────────────────────────────────────
// POST /ride/:id/update
// Driver updates ETA. Emits ride:update via socket.
// ─────────────────────────────────────────────
router.post('/:id/update', requireDriver, async (req, res) => {
  const { etaMinutes } = req.body;

  if (!etaMinutes || isNaN(etaMinutes)) {
    return res.status(400).json({ error: 'etaMinutes is required' });
  }

  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { etaMinutes: parseInt(etaMinutes) },
    });

    // Reschedule prompts based on new ETA
    reschedule(ride.id, ride.etaMinutes, (rideId, type) => {
      if (emitToRide) emitToRide(rideId, 'show:rebook', { type });
    });

    // Emit real-time update to tablet
    if (emitToRide) emitToRide(ride.id, 'ride:update', { etaMinutes: ride.etaMinutes });

    res.json(ride);
  } catch (err) {
    console.error('POST /ride/:id/update', err);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

// ─────────────────────────────────────────────
// POST /ride/:id/prompt
// Manually trigger a rebook prompt (driver app)
// ─────────────────────────────────────────────
router.post('/:id/prompt', requireDriver, async (req, res) => {
  const { type } = req.body;

  if (!['midway', 'pre_dropoff'].includes(type)) {
    return res.status(400).json({ error: 'type must be "midway" or "pre_dropoff"' });
  }

  try {
    const ride = await prisma.ride.findUnique({ where: { id: req.params.id } });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'ACTIVE') return res.status(409).json({ error: 'Ride is not active' });

    if (emitToRide) emitToRide(ride.id, 'show:rebook', { type });

    res.json({ ok: true, type });
  } catch (err) {
    console.error('POST /ride/:id/prompt', err);
    res.status(500).json({ error: 'Failed to trigger prompt' });
  }
});

// ─────────────────────────────────────────────
// POST /ride/:id/complete
// Mark ride complete. Cancel timers. Simulate SMS.
// ─────────────────────────────────────────────
router.post('/:id/complete', requireDriver, async (req, res) => {
  try {
    const ride = await prisma.ride.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { customer: true },
    });

    cancel(ride.id); // clear scheduled prompts

    // Simulate SMS rebook notification
    console.log(
      `[SMS → ${ride.customer.phone}] ` +
      `Thanks for riding with Synergy Lux, ${ride.customer.name}. ` +
      `Rebook anytime: ${process.env.FRONTEND_URL}/rebook/${ride.customer.id}`
    );

    if (emitToRide) emitToRide(ride.id, 'ride:complete', { customerId: ride.customer.id });

    res.json(ride);
  } catch (err) {
    console.error('POST /ride/:id/complete', err);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

module.exports = { router, setEmitter };
