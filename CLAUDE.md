# Synergy Lux Limo DFW — Claude Code Context

Auto-loaded at session start. Read this before making any changes.

---

## 1. Project Overview

**Synergy Lux Limo DFW LLC** is a luxury black car / chauffeur service operating in the Dallas–Fort Worth metroplex. Primary vehicle: black Cadillac Escalade. Services include airport transfers (DFW & Love Field), corporate transport, events, and bespoke rides.

**Founder:** Wilmer Rodriguez
- Currently in New York City, finishing a teaching contract through May 2026
- Moving to Texas in June 2026
- Bilingual: English / Spanish

**Business partner:** Gabriel — operates a black Cadillac Escalade in DFW; handles overflow bookings while Wilmer is still in NYC.

**Key dates:**
- LLC formed: April 21, 2026 (TX File #806558700, EIN 41-5226837)
- Target launch / Wilmer in DFW full-time: June 18, 2026

**Business address:** 7144 Fire Hill Drive, Fort Worth, TX 76137

---

## 2. Repository Structure

**This repo** (`synergyluxlimodfw.github.io`) is the marketing site AND the monorepo root. It auto-deploys to GitHub Pages on every `git push origin main`. Domain: `synergyluxlimodfw.com`.

The Next.js app lives at `tablet-system/nextjs-app/` and deploys to Vercel (`vercel --prod` from that directory — GitHub → Vercel auto-deploy is NOT wired up, must deploy manually). Domain: `app.synergyluxlimodfw.com`.

### Top-level files and directories

```
index.html                    — Main marketing landing page (booking form + quote calculator)
fifa-2026.html                — FIFA 2026 corporate transportation page
affiliates.html               — B2B affiliate / partner signup
privacy.html                  — Privacy policy (includes required Twilio SMS clauses)
terms.html                    — Terms of service
thank-you.html                — Redirect target after successful form submission
sitemap.xml                   — SEO sitemap
CNAME                         — GitHub Pages custom domain config (synergyluxlimodfw.com)
aria-chat.js / aria-chat.css  — Amirah chat widget (embedded on marketing site)
experience.html               — In-car guest experience page
ride.html                     — Live ride tracking page
tablet-system/                — Next.js operator app + API layer
  nextjs-app/                 — Next.js 14 app (Vercel project: nextjs-app)
assets-tablet/                — Tablet UI assets
tablet-app-dist/              — Legacy tablet app distribution
*.html (city pages)           — SEO landing pages (arlington, dallas, fort-worth, etc.)
escalade-*.jpg/png            — Vehicle photo assets
*.mp4                         — Hero video assets
```

---

## 3. Tech Stack

### Marketing site (`/`)
- Vanilla HTML / CSS / JavaScript
- No build step — raw files served by GitHub Pages
- Google Maps Distance Matrix + Places API (quote calculator distance/autocomplete)
- EmailJS (booking form email notifications)
- Formspree (form submission backup / email delivery)
- Deployed on: GitHub Pages, auto-deploys on `git push origin main`

### Next.js app (`tablet-system/nextjs-app/`)
- **Framework:** Next.js 14.x, App Router, TypeScript strict mode
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
  - Project name: `synergy-lux`
  - Project ID: `axnzxbltlwgspptqcbhy`
  - Region: `us-east-2`
- **Auth:** Supabase Auth (admin dashboard protected)
- **ORM:** Prisma (used for some queries alongside supabase-js)
- **SMS / Voice:** Twilio
  - Toll-free number: `+18883306902` (TFV verification in progress)
  - DFW local number: `+18178092801` (A2P 10DLC campaign in progress)
- **AI concierge:** Amirah — Claude Sonnet model via Anthropic SDK + ElevenLabs voice
- **Payments:** Stripe (Checkout sessions, webhooks, payment links)
- **Deployment:** Vercel (manual `vercel --prod` from `tablet-system/nextjs-app/`)

---

## 4. Architecture Decisions

**No direct client → Supabase writes.** All inserts/updates go through server-side Next.js API routes (`/app/api/`). The Supabase anon key is NEVER used for writes. Only `SUPABASE_SERVICE_ROLE_KEY` (server-only env var) touches the database.

**RLS enforced on all tables.** Anon and authenticated roles have grants revoked on all 8 tables. Only service role can write.

**CORS handled per-route.** Each API route called from the marketing site (`synergyluxlimodfw.com`) has an explicit CORS block with:
- `ALLOWED_ORIGINS` array (apex + www)
- `corsHeaders(req)` helper
- Exported `OPTIONS` handler returning 204 + CORS headers
- `json()` wrapper that injects CORS headers on every response
Pattern lives in `/app/api/aria/route.ts` — copy it exactly for any new cross-origin route.

**`keepalive: true` on fire-and-forget fetches.** Any fetch that fires before a `window.location.replace()` redirect must include `keepalive: true` or the browser will cancel it mid-flight. See `handleBooking` in `index.html`.

**`export const dynamic = 'force-dynamic'`** required on any GET route that reads live DB data. Without it, Next.js may statically cache the response at build time and serve stale data. Add this to every new read-only API route.

**GitHub Pages vs. Vercel deploy paths:**
- Marketing site changes (`index.html`, `fifa-2026.html`, `affiliates.html`, `privacy.html`, etc.) → `git push origin main` (GitHub Pages auto-deploys, ~60–90 seconds)
- Next.js API or UI changes → `cd tablet-system/nextjs-app && vercel --prod` (must be run manually every time)

---

## 5. Key Files

### Next.js app (`tablet-system/nextjs-app/`)

#### Library / shared logic

| File | Purpose |
|---|---|
| `lib/aria.ts` | Amirah AI concierge — system prompt, `BOOKING_READY` tag extraction, lead classification, operator alert formatting. Imported by the `/api/aria` route. |
| `lib/sms.ts` | SMS helpers — `handleBookingConfirmed()`, sends Twilio booking confirmation and operator alert after a ride is saved. |
| `lib/supabase.ts` | Supabase client factory (anon + service role). |
| `lib/services.ts` | Service type definitions and pricing constants. |
| `lib/events.ts` | Client-side event tracking for the admin dashboard conversion metrics. |
| `lib/types.ts` | Shared TypeScript types across the app. |
| `lib/email.ts` | Email helper using **Resend** (`RESEND_API_KEY`). Exports `sendBookingLink()` — sends Stripe payment link email from `amirah@synergyluxlimodfw.com`. |
| `lib/audio.ts` | ElevenLabs voice synthesis helpers. |
| `lib/googleCalendar.ts` | Google Calendar integration for ride scheduling. |
| `lib/prisma.ts` | Prisma client singleton. |
| `lib/store.ts` | Client-side Zustand store for operator tablet state. |
| `lib/experienceStore.ts` | Store for in-car guest experience state. |

#### API routes

| Route | Purpose |
|---|---|
| `app/api/aria/route.ts` | Amirah AI concierge endpoint. Two modes: (1) chat `{ messages[] }` → returns AI response or booking confirmation card; (2) confirm `{ confirm: true, bookingData }` → saves ride to Supabase, fires SMS. Has full CORS config — the canonical CORS pattern to copy. |
| `app/api/leads/insert/route.ts` | Inserts a row into `public.leads`. Called fire-and-forget from all 3 marketing site forms (booking, FIFA, affiliate). Accepts: name, email, phone, pickup, destination, datetime, occasion, notes, source, lead_type, sms_consent. Has CORS headers. |
| `app/api/leads/inbound/route.ts` | Returns leads from `public.leads` filtered to sources: `website-booking`, `website-fifa`, `website-affiliate`, `amirah`. Used by admin dashboard "Inbound Leads" section. Has `export const dynamic = 'force-dynamic'`. |
| `app/api/leads/list/route.ts` | Returns unified leads for admin "Leads Pipeline": queries `rides`, `bookings`, `rebook_requests`, `sms_conversations`. Does NOT touch the `leads` table. |
| `app/api/booking-notify/route.ts` | Fires Twilio SMS to operator and client after booking form submission. Has CORS headers. Historically was broken (no CORS) — fixed April 29, 2026. |
| `app/api/website-quotes/insert/route.ts` | Inserts a row into `public.website_quotes`. Called from quote calculator on marketing site. Has CORS headers. |
| `app/api/website-quotes/update/route.ts` | PATCH — updates quote status (e.g. `confirmed`). Used by admin dashboard "Confirm" button. |
| `app/api/stripe-webhook/route.ts` | Handles Stripe webhook events (checkout.session.completed, etc.). Updates ride/booking status, sends confirmation SMS. |
| `app/api/send-booking-link/route.ts` | Creates a Stripe Checkout session and sends payment link via Twilio SMS to client. Called from admin dashboard "Pay Link" button. |
| `app/api/sms/incoming/route.ts` | Twilio webhook for inbound SMS. Routes STOP/HELP/replies, passes to Amirah if conversational. |
| `app/api/sms/confirm/route.ts` | Handles booking confirmation via SMS reply. |
| `app/api/sms/cron/route.ts` | Cron handler for scheduled follow-up messages (`scheduled_messages` table). |
| `app/api/sms/post-ride/route.ts` | Sends post-ride feedback / rebook prompt SMS. |
| `app/api/sms/airport-return/route.ts` | Sends airport return ride follow-up. |
| `app/api/admin/dashboard-data/route.ts` | Single-request fetch for admin top section: today's rides, rebook requests, website quotes. Queries `rides`, `rebook_requests`, `website_quotes`. |
| `app/api/admin/outreach/route.ts` | GET/PATCH for LinkedIn outreach leads (`source IN ('linkedin-apify', 'serpapi-google', 'manual')`). Separate from inbound web leads. |
| `app/api/admin/metrics/route.ts` | Conversion metrics for admin dashboard. |
| `app/api/availability/route.ts` | Checks ride availability for a given date/time. |
| `app/api/rides/insert/route.ts` | Inserts a ride row. |
| `app/api/rides/update/route.ts` | Updates ride status/fields. |
| `app/api/rides/list/route.ts` | Returns rides list. |
| `app/api/voice/incoming/route.ts` | Twilio voice webhook — handles inbound calls, routes to Amirah. |
| `app/api/voice/elevenlabs-webhook/route.ts` | ElevenLabs voice synthesis webhook. |

#### Pages

| Page | Purpose |
|---|---|
| `app/admin/page.tsx` | Admin dashboard. Sections: Today stats, **Inbound Leads** (website forms + Amirah), Quote Requests, Leads Pipeline (rides/rebooks), Outreach Pipeline (LinkedIn), conversion metrics, today's rides, rebook requests, quick actions. |
| `app/operator/page.tsx` | Operator tablet — start ride, manage active rides. |
| `app/experience/page.tsx` | In-car guest experience (tip prompts, rebook flow). |
| `app/drivers/page.tsx` | Driver view. |
| `app/success/page.tsx` | Post-payment success page. |
| `app/aria/page.tsx` | Standalone Amirah chat page. |
| `app/confirm/page.tsx` | Rebook confirmation page. |
| `app/corporate/page.tsx` | Corporate accounts landing. |
| `app/rebook/[customerId]/page.tsx` | Personalized rebook page with customer pre-fill. |

#### Scripts (`tablet-system/nextjs-app/scripts/`)

| File | Purpose |
|---|---|
| `scrape-leads.ts` | Scrapes 50 DFW corporate leads via Apify/SerpAPI, writes to `leads` table with `source: 'linkedin-apify'` or `'serpapi-google'`. |
| `generate-emails.ts` | Generates personalized LinkedIn message + email draft for each scraped lead using Claude. Writes back to `leads` table. |
| `export-drafts.ts` | Exports ready-to-send drafts to CSV for manual outreach. |

### Marketing site (root)

| File | Purpose |
|---|---|
| `index.html` | Main landing page. Contains: hero, services, fleet, booking form (`handleBooking`), quote calculator (`confirmQuoteRequest`). Two SMS consent checkboxes (bookingSmsConsent, quoteSmsConsent). |
| `fifa-2026.html` | FIFA 2026 corporate page. Contains: FIFA booking form (`handleFifaBooking`), SMS consent (fifaSmsConsent). |
| `affiliates.html` | B2B affiliate partner signup. Contains: affiliate form (`handleAffiliate`), SMS consent (affiliateSmsConsent). |
| `privacy.html` | Privacy policy. Sections include: SMS Communications, Information Sharing, **SMS Messaging Data & Consent** (added April 29, 2026 for Twilio TFV). |
| `terms.html` | Terms of service. |
| `thank-you.html` | Redirect destination after booking form submission. |
| `aria-chat.js` | Amirah chat widget script embedded on marketing site. Calls `app.synergyluxlimodfw.com/api/aria`. |
| `aria-chat.css` | Amirah widget styles. |
| `experience.html` | In-car guest experience page served from marketing site. |

---

## 6. Conventions to Follow

- **TypeScript strict mode** in `nextjs-app`. Run `npx tsc --noEmit` before every commit touching TS files.
- **API error shape:** `{ error: string }` on failure, appropriate HTTP status code. Never throw raw errors to the client.
- **SMS consent checkboxes** are `UNCHECKED` by default and `OPTIONAL` — never add `required`. This is mandatory Twilio compliance (error 30505 = required opt-in is a violation).
- **SMS sender identity:** Always "Synergy Lux Limo DFW LLC" in all outbound SMS copy — never "Amirah", "Mr. Rodriguez", or any other name.
- **CTIA disclosures** must appear on all SMS consent labels: STOP to opt out, HELP for help, msg/data rates apply, frequency varies.
- **Privacy Policy link** must appear in every SMS consent span: `<a href="/privacy.html" target="_blank">Privacy Policy</a>`.
- **Tailwind** for styling in the Next.js app — no custom CSS where a Tailwind class works.
- **New cross-origin API routes** (called from marketing site) must have the full CORS block. Copy from `app/api/aria/route.ts` lines 34–61.
- **New DB-read routes** must have `export const dynamic = 'force-dynamic'` or risk stale cached responses.

---

## 7. DO NOT Change Without Explicit Approval

- The `required` attribute on form fields (`phone`, `email`, `name`) in any HTML form
- JavaScript handlers: `handleBooking`, `handleFifaBooking`, `handleAffiliate`, `confirmQuoteRequest`
- The SMS consent `<input type="checkbox">` element itself — only edit the `<span>` content if language needs updating
- Twilio phone numbers or environment variables without coordinating the corresponding Twilio Console change
- **The Privacy Policy SMS section wording** — Twilio reviewers grep for specific phrases. Particularly: "originator opt-in data", "will not be shared with any third parties or affiliates for marketing or promotional purposes". Do not paraphrase.
- Supabase RLS policies or table-level grants without a full review
- The `SUPABASE_SERVICE_ROLE_KEY` — never expose to client-side code

---

## 8. Current State

See `STATUS.md` for current state of external systems. `STATUS.md` is updated as milestones close (Twilio approvals, Google Business verification, etc.).

---

## 9. Open Issues / Roadmap

- **Pushover notifications** — push alerts to Wilmer's phone for new inbound leads (deferred; currently relying on Supabase admin dashboard)
- **support@ email** — Cloudflare email routing to forward support@synergyluxlimodfw.com (referenced in Twilio TFV submission as contact method)
- **Real vehicle photos** — Replace stock Cadillac photos on marketing site with actual Escalade photos (during TX trip)
- **Customer testimonials** — Need 3 total; 1 collected (Lindsey K.). Two more needed before launch.
- **Image alt tags** — Need to update "2023 Escalade" references to "2024 Escalade" in img alt attributes
- **Meta Business verification** — Requires Chase business bank statement. Waiting on business account opening during TX trip.
- **Admin dashboard status buttons** — "Inbound Leads" section is currently read-only. Status update buttons (mark contacted, confirmed, spam) are next phase via `/api/leads/update-status`.
- **Phase 4 realtime** — Replace disabled Supabase realtime channel in `experience/page.tsx` with polling so operator status changes propagate to tablet without websocket.

---

## 10. Supabase Tables (key ones)

> **Note:** No migration files or generated types file found in the repo. This list is based on observed code references and may be incomplete. Verify the full table list against Supabase Console → Table Editor.

| Table | Purpose |
|---|---|
| `rides` | Confirmed/dispatched rides. Created by Amirah confirm flow or operator. |
| `leads` | All lead sources: website forms (`website-booking`, `website-fifa`, `website-affiliate`), Amirah captures (`amirah`), LinkedIn scrapes (`linkedin-apify`, `serpapi-google`, `manual`). |
| `website_quotes` | Quote calculator submissions from marketing site. |
| `rebook_requests` | Post-ride rebook requests from guest experience flow. |
| `bookings` | Payment records — linked to rides via `ride_id`. |
| `sms_conversations` | All inbound/outbound SMS messages logged. |
| `scheduled_messages` | Future SMS to be sent (follow-ups, reminders). `sent: true` when delivered. |
| `tips` | Tip transactions from in-car experience. |

All tables: **RLS enforced**, anon/authenticated grants revoked, service role only.

`leads` table columns added April 29, 2026: `email`, `sms_consent`, `sms_consent_timestamp`.
`rides` table columns added April 29, 2026: `sms_consent`, `sms_consent_timestamp`.
`website_quotes` table columns added April 29, 2026: `sms_consent`, `sms_consent_timestamp`.

---

## 11. Communication & Collaboration Style

- **Direct and action-oriented** — skip excessive disclaimers and hedging
- **Pushback welcome** — if something seems wrong or suboptimal, say so before proceeding. Wilmer prefers honest disagreement over silent compliance.
- **Show diffs before pushing** — for non-trivial changes, always show what will change and wait for explicit approval before committing or deploying
- **Investigate before fixing** — when diagnosing bugs, show findings first. Don't guess-and-push.
- **Deployments require confirmation** — `vercel --prod` and `git push` to production should be deliberate. Never sneak a deploy inside a larger task without noting it.
- Spanish is fine for casual communication if Wilmer writes in Spanish.
