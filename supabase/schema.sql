-- ============================================================
-- 2BCLICKS — SUPABASE SCHEMA
-- ------------------------------------------------------------
-- HOW TO RUN THIS:
-- 1. Go to your Supabase project → SQL Editor → New query.
-- 2. Paste this entire file in and click "Run".
-- 3. That's it — tables, security rules and the storage bucket
--    are all created in one go.
--
-- WHAT THIS SETS UP:
-- - 5 tables mirroring the site's content (portfolio, hero
--   videos, gallery photos, BTS photos, availability dates).
-- - Row Level Security (RLS) so that:
--     • ANYONE can read (visitors never need to log in).
--     • ONLY a logged-in admin account can add/edit/delete.
--   This is enforced by the database itself — even if someone
--   opens dev tools and calls the API directly, the database
--   will reject writes from anyone who isn't logged in.
-- - A public "media" storage bucket for uploaded videos/photos,
--   with the same read-open / write-admin-only rule.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- TABLES ----------

create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  url text default '',
  created_at timestamptz default now()
);

create table if not exists hero_videos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  created_at timestamptz default now()
);

create table if not exists gallery_photos (
  id uuid primary key default gen_random_uuid(),
  tag text default 'gallery_work',
  url text default '',
  created_at timestamptz default now()
);

create table if not exists bts_photos (
  id uuid primary key default gen_random_uuid(),
  caption text default 'BTS',
  url text default '',
  created_at timestamptz default now()
);

create table if not exists availability_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  status text not null default 'available' check (status in ('available','booked')),
  created_at timestamptz default now()
);

-- ---------- ROW LEVEL SECURITY ----------

alter table portfolio_items enable row level security;
alter table hero_videos enable row level security;
alter table gallery_photos enable row level security;
alter table bts_photos enable row level security;
alter table availability_dates enable row level security;

-- Public read — no login required. This is what lets visitors
-- browse the site with zero authentication, as intended.
create policy "public read portfolio" on portfolio_items for select using (true);
create policy "public read hero" on hero_videos for select using (true);
create policy "public read gallery" on gallery_photos for select using (true);
create policy "public read bts" on bts_photos for select using (true);
create policy "public read availability" on availability_dates for select using (true);

-- Admin-only write. "authenticated" here means: signed in with an
-- account YOU created (Authentication → Users in the Supabase
-- dashboard) — there's no public sign-up form anywhere on the
-- site, so the only people who can ever be "authenticated" are
-- the admin accounts you set up yourself.
create policy "admin write portfolio" on portfolio_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write hero" on hero_videos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write gallery" on gallery_photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write bts" on bts_photos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write availability" on availability_dates for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------- REALTIME ----------
-- Lets the site update live for every visitor the moment an admin
-- adds/removes something, with no page refresh needed.
alter publication supabase_realtime add table portfolio_items;
alter publication supabase_realtime add table hero_videos;
alter publication supabase_realtime add table gallery_photos;
alter publication supabase_realtime add table bts_photos;
alter publication supabase_realtime add table availability_dates;

-- ---------- STORAGE (videos + photos) ----------

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select
  using (bucket_id = 'media');
create policy "admin upload media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "admin delete media" on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- ============================================================
-- NEXT STEPS (after running this file):
-- 1. Authentication → Users → Add user → create one login per
--    admin (e.g. Ankit's Gmail + a password, Mohit's Gmail + a
--    password). These are the ONLY accounts that can edit the site.
-- 2. Project Settings → API → copy your "Project URL" and
--    "anon public" key into js/config.js.
-- 3. Open the site — visitors see it exactly as before, and
--    "Studio Login" in the footer now checks against the real
--    accounts you just created.
-- ============================================================
