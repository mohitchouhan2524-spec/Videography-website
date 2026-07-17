/* ============================================================
   2BCLICKS — SITE CONFIG
   Edit the values below with your real details. Everything in
   this file is plain text (no build step needed) — save and
   refresh the page to see changes.
   ============================================================ */

const CONFIG = {

  /* ---------- SUPABASE ----------
     From your Supabase project: Project Settings → API.
     - supabaseUrl        → "Project URL"
     - supabaseAnonKey    → "anon public" key (this is MEANT to be
       public / visible in client code — it only allows what your
       Row Level Security policies in supabase/schema.sql permit,
       which is: public read, admin-only write).
     Leave both as "" and the site will show placeholder content
     with a console note, instead of breaking.
  ---------------------------------------------------------------- */
  supabaseUrl: "",
  supabaseAnonKey: "",

  /* ---------- CONTACT DETAILS ---------- */
  // WhatsApp number in international format, digits only, no + or spaces.
  // Example: "919876543210"  ← leave "" to keep placeholder links disabled.
  whatsappNumber: "",

  // Phone number as you want it displayed / dialled.
  // Example: "+91 98765 43210"
  phone: "",

  // Studio email address.
  // Example: "hello@2bclicks.in"
  email: "",

  // Full Instagram profile URL.
  // Example: "https://instagram.com/2bclicks"
  instagram: "",

  // Full YouTube channel URL.
  // Example: "https://youtube.com/@2bclicks"
  youtube: "",

  // Full Facebook page URL.
  // Example: "https://facebook.com/2bclicks"
  facebook: "",

  // Google Maps embed query — city/area is fine, or a full address.
  mapsQuery: "Indore, Madhya Pradesh",

  /* ---------- ADMIN ACCOUNTS ----------
     There is nothing to configure here anymore — admin accounts
     now live in Supabase itself (Authentication → Users), not in
     this file. Create one login per person who should be able to
     edit the site (e.g. Ankit's Gmail + a password, Mohit's Gmail
     + a password you choose). Visitors are never asked to log in;
     only the "Studio Login" button in the footer checks against
     these Supabase accounts, and only a logged-in session can
     add/delete anything (enforced by the database itself via the
     policies in supabase/schema.sql).
  ---------------------------------------------------------------- */

  /* ---------- MISC ---------- */
  studioName: "2Bclicks",
  tagline: "Turning love into art.",
  foundersLine: "Ankit Chouhan & Mohit Chouhan",
  citiesServed: ["Indore", "Dewas", "Dhar", "Ujjain"]
};
