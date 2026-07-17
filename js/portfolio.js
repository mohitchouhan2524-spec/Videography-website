/* ============================================================
   2BCLICKS — PORTFOLIO + HERO VIDEOS  (Supabase-backed)
   Reads/writes the `portfolio_items` and `hero_videos` tables.
   Public visitors only ever SELECT (read); INSERT/DELETE from the
   Studio Dashboard require a logged-in admin session — enforced
   by the RLS policies in supabase/schema.sql, not just by hiding
   the UI.
   ============================================================ */

const Portfolio = (function(){

  let items = [];
  let heroVideos = [];

  const FALLBACK_PORTFOLIO = [
    { id:'p1', title:'A Monsoon Wedding, Indore', category:'Weddings', url:'' },
    { id:'p2', title:'Haldi Mornings', category:'Weddings', url:'' },
    { id:'p3', title:'Skyline — Brand Film', category:'Commercial', url:'' }
  ];

  function pfCardHTML(item){
    return `<div class="pf-card" data-cat="${item.category}" data-id="${item.id}">
      <div class="pf-scrim"></div>
      <span class="pf-cat">${item.category}</span>
      <div class="aperture pf-play"></div>
      <div class="pf-title"><h4>${item.title}</h4><span>${item.url? 'Watch film':'Add video via Studio Dashboard'}</span></div>
    </div>`;
  }

  function renderGrid(filter){
    const grid = document.getElementById('pfGrid');
    if(!grid) return;
    const list = filter && filter!=='all' ? items.filter(i=>i.category===filter) : items;
    grid.innerHTML = list.length ? list.map(pfCardHTML).join('') : `<div class="pf-empty">No films in this category yet — check back soon.</div>`;
    App.injectApertures(grid);
    grid.querySelectorAll('.pf-card').forEach(card=>{
      card.addEventListener('click', ()=>{
        const item = items.find(i=>i.id===card.dataset.id);
        App.openLightbox(item);
      });
    });
  }
  function currentFilter(){
    const active = document.querySelector('.filter-btn.active');
    return active ? active.dataset.filter : 'all';
  }

  function initFilters(){
    const row = document.getElementById('filterRow');
    if(!row) return;
    row.addEventListener('click', (e)=>{
      const btn = e.target.closest('.filter-btn'); if(!btn) return;
      row.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(btn.dataset.filter);
    });
  }

  /* ---------- hero background video(s) ---------- */
  function renderHeroMedia(){
    const wrap = document.getElementById('heroMedia');
    const fallback = document.getElementById('heroFallback');
    if(!wrap || !fallback) return;
    wrap.querySelectorAll('video').forEach(v=>v.remove());
    if(heroVideos.length){
      const v = document.createElement('video');
      v.src = heroVideos[0].url; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true; v.preload='none';
      wrap.insertBefore(v, fallback);
      fallback.style.display='none';
    } else {
      fallback.style.display='block';
    }
  }

  /* ---------- Supabase reads ---------- */
  async function fetchPortfolio(){
    if(!SUPABASE_READY) return FALLBACK_PORTFOLIO;
    const { data, error } = await sb.from('portfolio_items').select('*').order('created_at', {ascending:false});
    if(error){ console.error(error); return FALLBACK_PORTFOLIO; }
    return data;
  }
  async function fetchHeroVideos(){
    if(!SUPABASE_READY) return [];
    const { data, error } = await sb.from('hero_videos').select('*').order('created_at', {ascending:false});
    if(error){ console.error(error); return []; }
    return data;
  }

  /* ---------- public API used by ui.js (Studio Dashboard) ----------
     These require an authenticated Supabase session — the RLS
     policies will reject the write otherwise, so this is safe even
     if called outside the dashboard. */
  function getItems(){ return items; }
  function getHeroVideos(){ return heroVideos; }

  async function addItem(title, category, url){
    if(!SUPABASE_READY) throw new Error('Supabase not connected — add credentials in js/config.js.');
    const { error } = await sb.from('portfolio_items').insert({ title, category, url });
    if(error) throw error;
  }
  async function removeItem(id){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('portfolio_items').delete().eq('id', id);
    if(error) throw error;
  }
  async function addHeroVideo(url){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('hero_videos').insert({ url });
    if(error) throw error;
  }
  async function removeHeroVideo(id){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('hero_videos').delete().eq('id', id);
    if(error) throw error;
  }

  /* ---------- realtime: keep every open tab in sync ---------- */
  function initRealtime(){
    if(!SUPABASE_READY) return;
    sb.channel('portfolio-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'portfolio_items' }, async ()=>{
        items = await fetchPortfolio(); renderGrid(currentFilter());
        if(window.UI) window.UI.refreshPortfolioPane();
      })
      .on('postgres_changes', { event:'*', schema:'public', table:'hero_videos' }, async ()=>{
        heroVideos = await fetchHeroVideos(); renderHeroMedia();
        if(window.UI) window.UI.refreshHeroPane();
      })
      .subscribe();
  }

  async function init(){
    items = await fetchPortfolio();
    heroVideos = await fetchHeroVideos();
    renderGrid('all');
    initFilters();
    renderHeroMedia();
    initRealtime();

    const watchBtn = document.getElementById('watchShowreelBtn');
    if(watchBtn) watchBtn.addEventListener('click', ()=>{
      const reel = document.getElementById('showreel');
      if(reel) reel.scrollIntoView({behavior:'smooth'});
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getItems, getHeroVideos, addItem, removeItem, addHeroVideo, removeHeroVideo, renderGrid, currentFilter };
})();
