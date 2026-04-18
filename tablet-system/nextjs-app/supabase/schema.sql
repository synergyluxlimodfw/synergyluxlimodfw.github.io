-- ─────────────────────────────────────────────────────────
-- Synergy Lux — Supabase Schema
-- Run this in the Supabase SQL editor:
-- https://supabase.com/dashboard/project/axnzxbltlwgspptqcbhy/sql
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
  vip_note     text
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

-- ── RLS (disable for now — enable per-table when auth is wired) ──
alter table rides    disable row level security;
alter table bookings disable row level security;
alter table tips     disable row level security;
