-- ─────────────────────────────────────────────────────────
-- Synergy Lux — Supabase Schema
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/axnzxbltlwgspptqcbhy/sql
-- ─────────────────────────────────────────────────────────
--
-- ── Migrations ────────────────────────────────────────────
-- 2026-04-21: add phone + show_booking to rides; add rebook_requests
--   alter table rides add column if not exists phone text;
--   alter table rides add column if not exists show_booking boolean default false;
-- ─────────────────────────────────────────────────────────

-- ── rides ─────────────────────────────────────────────────
create table if not exists rides (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz      default now(),
  guest_name   text,
  destination  text,
  occasion     text,
  chauffeur    text,
  eta_minutes  int,
  status       text             default 'idle',
  vip_note     text,
  phone        text,
  show_booking boolean          default false
);

-- ── bookings ──────────────────────────────────────────────
create table if not exists bookings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz      default now(),
  ride_id      uuid             references rides(id) on delete set null,
  service      text,
  amount       numeric,
  deposit      numeric,
  stripe_link  text,
  payment_type text             -- 'deposit' | 'full'
);

-- ── tips ──────────────────────────────────────────────────
create table if not exists tips (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz      default now(),
  ride_id      uuid             references rides(id) on delete set null,
  guest_name   text,
  percent      int,             -- 10 | 15 | 20 | null (custom)
  amount       numeric,
  stripe_key   text             -- 'ten' | 'fifteen' | 'twenty' | 'custom'
);

-- ── rebook_requests ───────────────────────────────────────
create table if not exists rebook_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz      default now(),
  ride_id      uuid             references rides(id) on delete set null,
  guest_name   text,
  phone        text,
  pickup       text,
  occasion     text,
  notes        text
);

-- ── RLS (disable for now — enable per-table when auth is wired) ──
alter table rides             disable row level security;
alter table bookings          disable row level security;
alter table tips              disable row level security;
alter table rebook_requests   disable row level security;
