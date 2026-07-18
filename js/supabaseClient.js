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
