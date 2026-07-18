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
  tag text default 'Untitled',
  url text default '',
  created_at timestamptz default now()
);

create table if not exists bts_photos (
  id uuid primary key default gen_random_uuid(),
  caption text default 'Untitled',
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

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  name text default 'Anonymous',
  rating int not null check (rating between 1 and 5),
  message text default '',
  created_at timestamptz default now()
);

alter table feedback enable row level security;

-- Anyone can read reviews (shown publicly on the site)
create policy "public read feedback" on feedback for select using (true);

create policy "public submit feedback" on feedback for insert
  with check (true);

-- Only a logged-in admin can remove a review (e.g. spam/abuse) —
-- there is no public "edit" or "delete" of feedback.
create policy "admin delete feedback" on feedback for delete
  using (auth.role() = 'authenticated');

alter publication supabase_realtime add table feedback;

-- ============================================================
-- SITE SETTINGS + EQUIPMENT  (added later — lets the founders
-- photo/caption, equipment photos, and the showreel be edited
-- from the Studio Dashboard instead of by hand in the code)
-- ------------------------------------------------------------
-- Run just this block if you already ran the rest of this file.
-- ============================================================

-- Small key/value table for one-off, singleton content: the
-- founders photo, founders caption, and the showreel video.
create table if not exists site_settings (
  key text primary key,
  value text default '',
  updated_at timestamptz default now()
);

alter table site_settings enable row level security;
create policy "public read settings" on site_settings for select using (true);
create policy "admin write settings" on site_settings for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
alter publication supabase_realtime add table site_settings;

-- Equipment list: camera body, drone, gimbal, lens kit, etc. —
-- add/rename/remove as many as you like from the dashboard.
create table if not exists equipment_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  photo_url text default '',
  created_at timestamptz default now()
);

alter table equipment_items enable row level security;
create policy "public read equipment" on equipment_items for select using (true);
create policy "admin write equipment" on equipment_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
alter publication supabase_realtime add table equipment_items;