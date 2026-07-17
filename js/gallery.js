/* ============================================================
   2BCLICKS — GALLERY + BEHIND THE SCENES  (Supabase-backed)
   Reads/writes the `gallery_photos` and `bts_photos` tables.
   ============================================================ */

const Gallery = (function(){

  let photos = [];
  let bts = [];

  const FALLBACK = {
    gallery: [
      { id:'g1', tag:'Wedding · Indore', url:'' },
      { id:'g2', tag:'Portrait', url:'' },
      { id:'g3', tag:'Candid', url:'' }
    ],
    bts: [
      { id:'b1', caption:'On location — Indore', url:'' },
      { id:'b2', caption:'Golden hour scout', url:'' }
    ]
  };

  function galItemHTML(p){
    const img = p.url ? `<img src="${p.url}" alt="${p.tag}" loading="lazy">` : '';
    return `<div class="gal-item" data-id="${p.id}">${img}<span class="gal-tag">${p.tag}</span></div>`;
  }
  function btsItemHTML(b){
    const img = b.url ? `<img src="${b.url}" alt="${b.caption}" loading="lazy">` : '';
    return `<div class="bts-item" data-id="${b.id}">${img}<div class="cap">${b.caption}</div></div>`;
  }

  function renderGallery(){
    const grid = document.getElementById('galGrid');
    if(grid) grid.innerHTML = photos.length ? photos.map(galItemHTML).join('') : `<div class="pf-empty">No photos yet — add some from the Studio Dashboard.</div>`;
  }
  function renderBTS(){
    const strip = document.getElementById('btsStrip');
    if(strip) strip.innerHTML = bts.length ? bts.map(btsItemHTML).join('') : '';
  }

  /* ---------- Supabase reads ---------- */
  async function fetchPhotos(){
    if(!SUPABASE_READY) return FALLBACK.gallery;
    const { data, error } = await sb.from('gallery_photos').select('*').order('created_at', {ascending:false});
    if(error){ console.error(error); return FALLBACK.gallery; }
    return data;
  }
  async function fetchBTS(){
    if(!SUPABASE_READY) return FALLBACK.bts;
    const { data, error } = await sb.from('bts_photos').select('*').order('created_at', {ascending:false});
    if(error){ console.error(error); return FALLBACK.bts; }
    return data;
  }

  /* ---------- public API used by ui.js ---------- */
  function getPhotos(){ return photos; }
  function getBTS(){ return bts; }

  async function addPhoto(tag, url){
    if(!SUPABASE_READY) throw new Error('Supabase not connected — add credentials in js/config.js.');
    const { error } = await sb.from('gallery_photos').insert({ tag, url });
    if(error) throw error;
  }
  async function removePhoto(id){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('gallery_photos').delete().eq('id', id);
    if(error) throw error;
  }
  async function addBTS(caption, url){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('bts_photos').insert({ caption, url });
    if(error) throw error;
  }
  async function removeBTS(id){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('bts_photos').delete().eq('id', id);
    if(error) throw error;
  }

  /* ---------- realtime ---------- */
  function initRealtime(){
    if(!SUPABASE_READY) return;
    sb.channel('gallery-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'gallery_photos' }, async ()=>{
        photos = await fetchPhotos(); renderGallery();
        if(window.UI) window.UI.refreshGalleryPane();
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'bts_photos' }, async ()=>{
        bts = await fetchBTS(); renderBTS();
        if(window.UI) window.UI.refreshGalleryPane();
      })
      .subscribe();
  }

  async function init(){
    photos = await fetchPhotos();
    bts = await fetchBTS();
    renderGallery();
    renderBTS();
    initRealtime();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getPhotos, getBTS, addPhoto, removePhoto, addBTS, removeBTS };
})();
