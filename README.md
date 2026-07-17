# 2Bclicks — Cinematic Videography Website

A premium, dark, black-and-gold cinematic portfolio site for **2Bclicks**
(Ankit Chouhan & Mohit Chouhan), serving Indore, Dewas, Dhar & Ujjain.

Plain HTML/CSS/JS on the frontend (no build step), backed by **Supabase**
(Postgres database + Storage + Auth) for content that admins manage
through the site itself — no database console needed day-to-day.

- **Visitors:** browse the whole site with zero login.
- **Admins (Ankit & Mohit):** log into the Studio Dashboard (footer →
  "Studio Login") with an account you create for them, and add/delete
  hero videos, portfolio films, gallery photos, BTS photos and
  available dates — all from the website, no forms, no booking-form
  leads to manage.

---

## 1. One-time Supabase setup (~10 minutes)

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project → **SQL Editor** → New query → paste the entire
   contents of `supabase/schema.sql` from this folder → **Run**.
   This creates all 5 tables, the security rules (public read /
   admin-only write), the `media` storage bucket, and turns on
   realtime sync.
3. In your project → **Authentication → Users → Add user** — create
   one login per admin, e.g.:
   - Ankit's Gmail + a password you choose
   - Mohit's Gmail + a password you choose

   These are the *only* accounts that will ever be able to log into
   the Studio Dashboard. There's no public sign-up anywhere on the site.
4. In your project → **Project Settings → API**, copy:
   - **Project URL**
   - **anon public** key
5. Paste both into `js/config.js`:
   ```js
   supabaseUrl: "https://xxxxxxxx.supabase.co",
   supabaseAnonKey: "eyJhbGciOi...",
   ```

That's it — the site is now fully backed by a real, shared database.

---

## 2. Add your contact details — `js/config.js`

While you're in `js/config.js`, also fill in:
- `whatsappNumber` — digits only, country code, no `+` or spaces (e.g. `"919876543210"`)
- `phone`, `email`, `instagram`, `youtube`, `facebook`
- `mapsQuery` — city/area or full address for the embedded Google Map

Every placeholder is commented — search for `add later`, `Add your`,
or the SUPABASE section at the top of the file.

---

## 3. Running it locally

Just open `index.html` in a browser — no server or build step
required. (If `supabaseUrl`/`supabaseAnonKey` aren't filled in yet,
the site runs fine on small built-in placeholder content so you can
preview the design immediately.)

---

## 4. The Studio Dashboard (Admin panel)

Click **Studio Login** in the footer, sign in with an account you
created in step 1.3. From the dashboard:

| Tab | What it does |
|---|---|
| **Hero Videos** | Add/remove the background video(s) behind the homepage title. Paste a direct `.mp4` URL, or upload a file — it's stored in Supabase Storage and a public URL is saved automatically. |
| **Portfolio** | Add/remove films in the filterable portfolio grid (title, category, YouTube/Vimeo embed URL). |
| **Photos** | Add/remove Gallery stills and Behind-the-Scenes photos — paste a URL or upload a file. |
| **Availability** | Add a date and mark it Available/Booked, or delete it — these are exactly the dates visitors see under "Check Availability & Book". |

Every add/delete here writes straight to Supabase, so **it's visible
to every visitor, on every device, immediately** — and thanks to
Supabase Realtime, already-open tabs/dashboards update live without a
refresh. This is the key difference from the earlier localStorage
version: nothing here lives only on one device or browser anymore.

Security note: the Studio Dashboard UI is just a convenience — the
real protection is server-side. The database itself (via Row Level
Security policies in `supabase/schema.sql`) rejects any write that
isn't from a logged-in admin account, even if someone tried to call
the API directly. Visitors are never prompted to log in for anything.

---

## 5. There's no booking form, by design

**Availability & Book** (`#availability`) shows open dates and sends
visitors straight to WhatsApp (pre-filled with the date), Instagram
DM, or a phone call — no data entry, no lead database to check.

---

## 6. Folder structure

```
2Bclicks/
├── index.html
├── css/
│   ├── style.css        → design tokens, layout, all components
│   ├── animations.css    → keyframes + transitions
│   └── responsive.css    → all @media breakpoints
├── js/
│   ├── config.js          → ★ your Supabase credentials + contact info
│   ├── supabaseClient.js  → initialises the shared Supabase client
│   ├── main.js            → shared utilities (nav, reveal, lightbox, contact, uploads)
│   ├── portfolio.js       → portfolio grid + hero videos (Supabase-backed)
│   ├── gallery.js         → gallery + BTS photos (Supabase-backed)
│   ├── availability.js    → available dates + WhatsApp/Instagram/call CTAs (Supabase-backed)
│   └── ui.js              → Studio Dashboard (Supabase Auth login + management panels)
├── supabase/
│   └── schema.sql          → ★ run this once in the Supabase SQL editor
├── assets/
│   ├── videos/, images/, icons/   → optional self-hosted files
│   └── logo/aperture-mark.svg     → the site's aperture logo mark (favicon)
├── data/
│   └── *.json              → only used as offline placeholder content if Supabase isn't connected yet
└── README.md
```

---

## 7. Moving to Next.js later (optional)

This build works as-is on any static host (Vercel, Netlify, GitHub
Pages, or just a folder on your own server) since it's plain
HTML/CSS/JS talking to Supabase over the network — no server-side
code required. If you later want to rebuild the frontend in Next.js
for its own sake (routing, SEO, etc.), the Supabase schema, RLS
policies and Storage bucket here need no changes — you'd just port
the fetch/insert/delete calls from `js/portfolio.js` /
`gallery.js` / `availability.js` into React using
`@supabase/supabase-js` the same way.

---

## 8. Design notes

- **Palette:** near-black background, antique gold (`#c6a15b`) accents.
- **Type:** Cormorant Garamond (display/headlines), Jost (body/UI), Space Mono (labels/eyebrows).
- **Signature motif:** the aperture/iris mark (nodding to "2B**clicks**" — a shutter click) is reused as the page loader, the scroll-progress indicator, section markers, and the video play button.
- **Cinematic touches:** letterboxed hero bars with a scrolling film-slate marquee, grain overlay, glassmorphism panels.
