/* ============================================================
   2BCLICKS — SUPABASE CLIENT
   Requires the Supabase CDN script to be loaded first (see the
   <script src="https://cdn.jsdelivr.net/.../supabase.js"> tag in
   index.html), and js/config.js to be loaded before this file.
   Every other script uses the global `sb` created here.
   ============================================================ */

let sb = null;
let SUPABASE_READY = false;

(function(){
  if(!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey){
    console.info('[2Bclicks] Supabase URL/anon key not set in js/config.js yet — the site will run on built-in placeholder content until you connect a real project (see supabase/schema.sql).');
    return;
  }
  try{
    sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    SUPABASE_READY = true;
  }catch(e){
    console.error('[2Bclicks] Failed to initialise Supabase client:', e);
  }
})();
