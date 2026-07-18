const Site = (function(){

  let settings = {};
  let equipment = [];

  const FALLBACK_EQUIP = [
    { id:'e1', label:'Camera Body', photo_url:'' },
    { id:'e2', label:'Drone', photo_url:'' },
    { id:'e3', label:'Gimbal', photo_url:'' },
    { id:'e4', label:'Lens Kit', photo_url:'' }
  ];

  /* ---------- Supabase reads ---------- */
  async function fetchSettings(){
    if(!SUPABASE_READY) return {};
    const { data, error } = await sb.from('site_settings').select('*');
    if(error){ console.error(error); return {}; }
    const map = {};
    data.forEach(row=>{ map[row.key] = row.value; });
    return map;
  }
  async function fetchEquipment(){
    if(!SUPABASE_READY) return FALLBACK_EQUIP;
    const { data, error } = await sb.from('equipment_items').select('*').order('created_at', {ascending:true});
    if(error){ console.error(error); return FALLBACK_EQUIP; }
    return data;
  }

  /* ---------- render: founders photo + caption ---------- */
  function renderFounders(){
    const img = document.getElementById('foundersPhoto');
    const ap = document.getElementById('aboutAperture');
    const cap = document.getElementById('foundersCaption');
    const hasPhoto = !!settings.founders_photo;
    if(img){
      img.src = settings.founders_photo || '';
      img.style.display = hasPhoto ? 'block' : 'none';
    }
    if(ap) ap.style.display = hasPhoto ? 'none' : '';
    if(cap) cap.innerHTML = settings.founders_caption || 'ANKIT CHOUHAN &amp; MOHIT CHOUHAN<br>FOUNDERS, 2BCLICKS';
  }

  /* ---------- render: equipment grid ---------- */
  function equipItemHTML(e){
    if(e.photo_url){
      return `<div class="equip-item" data-id="${e.id}"><img src="${e.photo_url}" alt="${e.label}"><span class="equip-label">${e.label}</span></div>`;
    }
    return `<div class="equip-slot" data-id="${e.id}">${e.label}<br>— add later —</div>`;
  }
  function renderEquipment(){
    const grid = document.getElementById('equipGrid');
    if(!grid) return;
    const list = equipment.length ? equipment : FALLBACK_EQUIP;
    grid.innerHTML = list.map(equipItemHTML).join('');
  }

  /* ---------- render: showreel (embed OR direct .mp4) ---------- */
  function renderShowreel(){
    const frame = document.getElementById('reelFrame');
    if(!frame) return;
    if(settings.showreel_type === 'mp4' && settings.showreel_url){
      frame.innerHTML = `<video src="${settings.showreel_url}" controls autoplay muted loop playsinline preload="none"></video>`;
    } else if(settings.showreel_type === 'embed' && settings.showreel_url){
      frame.innerHTML = `<iframe src="${settings.showreel_url}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    } else {
      frame.innerHTML = `<div class="reel-placeholder"><div class="aperture"></div><span>Showreel embed goes here</span></div>`;
      App.injectApertures(frame);
    }
  }

  function renderAll(){ renderFounders(); renderEquipment(); renderShowreel(); }

  /* ---------- public API used by ui.js (Studio Dashboard) ---------- */
  function getSettings(){ return settings; }
  function getEquipment(){ return equipment; }

  async function setSetting(key, value){
    if(!SUPABASE_READY) throw new Error('Supabase not connected — add credentials in js/config.js.');
    const { error } = await sb.from('site_settings').upsert({ key, value }, { onConflict:'key' });
    if(error) throw error;
  }
  async function addEquipment(label, photo_url){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('equipment_items').insert({ label, photo_url: photo_url || '' });
    if(error) throw error;
  }
  async function removeEquipment(id){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('equipment_items').delete().eq('id', id);
    if(error) throw error;
  }

  /* ---------- realtime: keep every open tab in sync ---------- */
  function initRealtime(){
    if(!SUPABASE_READY) return;
    sb.channel('site-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'site_settings' }, async ()=>{
        settings = await fetchSettings(); renderAll();
        if(window.UI) window.UI.refreshSitePane();
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'equipment_items' }, async ()=>{
        equipment = await fetchEquipment(); renderAll();
        if(window.UI) window.UI.refreshSitePane();
      })
      .subscribe();
  }

  async function init(){
    settings = await fetchSettings();
    equipment = await fetchEquipment();
    renderAll();
    initRealtime();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getSettings, getEquipment, setSetting, addEquipment, removeEquipment };
})();