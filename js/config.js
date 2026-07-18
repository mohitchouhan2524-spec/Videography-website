const CONFIG = {
  supabaseUrl: "https://ykxpbltynwocdbynjbwy.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreHBibHR5bndvY2RieW5qYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMjg4OTIsImV4cCI6MjA5OTgwNDg5Mn0.GpWYm42ECYGPo97MMAwin7de0K1QVWIuOV5BmCBSNQ0",

  whatsappNumber: "7723917739",
  phone: "+91 87704 73787",
  email: "7723917739@gmail.com",
  instagram: "https://www.instagram.com/2bclicks_indore",
  youtube: "https://youtube.com/@2bclicks_indore",
  facebook: "",
  mapsQuery: "Karjoda, Madhya Pradesh",

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
  foundersLine: "Ankit Chouhan and Mohit Chouhan",
  citiesServed: ["Indore", "Dewas", "Dhar", "Ujjain"]
};
