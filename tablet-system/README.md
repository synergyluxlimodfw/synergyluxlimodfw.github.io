# Synergy Lux — Tablet System

Production-ready backend + frontend for the in-car tablet experience.

## Stack
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL via Prisma ORM
- **Frontend**: Next.js (React)
- **Payments**: Stripe Checkout (Apple Pay / Google Pay included)
- **Auth**: Driver token (Bearer header)

---

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # fill in DB, Stripe, JWT values
npm install
npm run db:generate          # generate Prisma client
npm run db:push              # push schema to Postgres
npm run dev                  # start on :4000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm install
npm run dev                  # start on :3000
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ride/start` | Driver | Start ride session |
| GET | `/ride/:id` | Public | Get ride details |
| POST | `/ride/:id/update` | Driver | Update ETA + emit socket |
| POST | `/ride/:id/prompt` | Driver | Manually trigger rebook modal |
| POST | `/ride/:id/complete` | Driver | Complete ride + simulate SMS |
| POST | `/booking/create` | Public | Create booking + Stripe session |
| GET | `/booking/customer/:id` | Public | Prefill data for QR rebook |
| POST | `/booking/webhook` | Stripe | Mark booking as paid |

---

## Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:ride` | Client → Server | `rideId` |
| `ride:update` | Server → Client | `{ etaMinutes }` |
| `show:rebook` | Server → Client | `{ type: "midway" \| "pre_dropoff" }` |
| `ride:complete` | Server → Client | `{ customerId }` |

---

## Auto-Prompt Logic

On ride start, two timers are scheduled automatically:

- **Midway** — fires at 50% of ride duration → emits `show:rebook`
- **Pre drop-off** — fires 5 min before arrival → emits `show:rebook`

On ETA update, both timers reset based on the new ETA.

---

## Pages

| URL | Description |
|-----|-------------|
| `/tablet/:rideId` | In-car tablet UI |
| `/rebook/:customerId` | QR landing page — pre-filled rebook |
| `/booking/success` | Post-payment confirmation |

---

## Driver Token

All driver-facing endpoints require:

```
Authorization: Bearer <DRIVER_TOKEN>
```

Set `DRIVER_TOKEN` in `.env`. In production, replace with a proper JWT-based driver auth system.

---

## Production Upgrade Path

| Current | Upgrade To |
|---------|-----------|
| In-memory prompt timers | BullMQ + Redis |
| Console SMS simulation | Twilio SMS |
| Driver token | JWT + driver accounts |
| Single Node process | PM2 cluster / Railway / Render |
