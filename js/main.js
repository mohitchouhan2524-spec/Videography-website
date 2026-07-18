/* ============================================================
   2BCLICKS — MAIN
   Shared utilities used by every other script. Load this file
   AFTER config.js + supabaseClient.js, and BEFORE portfolio.js /
   gallery.js / availability.js / ui.js.
   ============================================================ */

const App = (function(){

  /* ---------- upload a file to Supabase Storage, get back a public URL ----------
     Used by the admin dashboard (js/ui.js) whenever someone
     uploads a video/photo instead of pasting a URL. */
  async function uploadMedia(file, folder){
    if(!SUPABASE_READY){
      throw new Error('Supabase is not connected yet — add supabaseUrl/supabaseAnonKey in js/config.js first.');
    }
    const path = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
    const { error } = await sb.storage.from('media').upload(path, file, { cacheControl:'3600', upsert:false });
    if(error) throw error;
    const { data } = sb.storage.from('media').getPublicUrl(path);
    return data.publicUrl;
  }

  /* ---------- aperture SVG (the site's signature motif) ---------- */
  function apertureSVG(blades){
    blades = blades || 8;
    let paths = '';
    for(let i=0;i<blades;i++){
      const angle = (360/blades)*i;
      paths += `<path class="aperture-blade" d="M50 50 L50 6 A6 6 0 0 1 58 8 L66 34 Z" fill="var(--bg)" stroke="var(--gold)" stroke-width="1" style="transform:rotate(${angle}deg)"></path>`;
    }
    return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="none" stroke="var(--gold-dim)" stroke-width="1"></circle>${paths}<circle cx="50" cy="50" r="14" fill="none" stroke="var(--gold)" stroke-width="1.4"></circle></svg>`;
  }
  function apertureDotSVG(){
    return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="6"></circle><circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="6"></circle></svg>`;
  }
  function injectApertures(scope){
    const root = scope || document;
    root.querySelectorAll('.aperture').forEach(el=>{ if(!el.innerHTML.trim()) el.innerHTML = apertureSVG(8); });
    root.querySelectorAll('[data-ap]').forEach(el=>{ el.innerHTML = apertureDotSVG(); el.style.color='var(--gold)'; });
  }

  /* ---------- intro loader (aperture opens on first paint) ---------- */
  function initIntro(){
    window.addEventListener('load', ()=>{
      const blades = document.querySelectorAll('#introAperture .aperture-blade');
      requestAnimationFrame(()=>{
        blades.forEach((b,i)=>{ b.style.transitionDelay = (i*35)+'ms'; b.style.transform += ' scale(0)'; b.style.opacity='0'; });
      });
      setTimeout(()=>{ const intro=document.getElementById('intro'); if(intro) intro.classList.add('hide'); const hero=document.getElementById('hero'); if(hero) hero.classList.add('boxed'); }, 1300);
      setTimeout(()=>{ const intro=document.getElementById('intro'); if(intro) intro.remove(); }, 2200);
    });
    setTimeout(()=>{
      const i=document.getElementById('intro');
      if(i && !i.classList.contains('hide')){ i.classList.add('hide'); const hero=document.getElementById('hero'); if(hero) hero.classList.add('boxed'); }
    }, 2600);
  }

  /* ---------- header scroll state + scroll-progress aperture ---------- */
  function initHeaderScroll(){
    const header = document.getElementById('siteHeader');
    const scrollAp = document.getElementById('scroll-ap');
    if(!header || !scrollAp) return;
    function onScroll(){
      const y = window.scrollY;
      header.classList.toggle('scrolled', y>40);
      scrollAp.classList.toggle('show', y>500);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h>0 ? y/h : 0;
      document.querySelectorAll('#scrollAperture .aperture-blade').forEach(b=>{
        const openAmt = pct*0.9;
        b.style.transform = b.style.transform.replace(/ scale\([^)]*\)/,'') + ` scale(${1-openAmt})`;
      });
    }
    document.addEventListener('scroll', onScroll, {passive:true});
    scrollAp.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
  }

  /* ---------- mobile nav toggle ---------- */
  function initMobileNav(){
    const navToggle = document.getElementById('navToggle');
    const primaryNav = document.getElementById('primaryNav');
    if(!navToggle || !primaryNav) return;
    navToggle.addEventListener('click', ()=>{
      navToggle.classList.toggle('open');
      primaryNav.classList.toggle('open');
    });
    primaryNav.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
      navToggle.classList.remove('open'); primaryNav.classList.remove('open');
    }));
  }

  /* ---------- reveal-on-scroll ---------- */
  function initReveal(){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    },{threshold:0.15});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  }
  function observeNew(selector){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    },{threshold:0.15});
    document.querySelectorAll(selector).forEach(el=>io.observe(el));
  }

  /* ---------- hero letterbox slate marquee text ---------- */
  function initMarquee(){
    const text = `REEL 2BC-001 • ${CONFIG.studioName.toUpperCase()} STUDIO • ${CONFIG.foundersLine.toUpperCase()} • ${CONFIG.citiesServed.join(' — ').toUpperCase()} •`;
    ['marqueeTop','marqueeBottom'].forEach(id=>{
      const el = document.getElementById(id);
      if(el) el.innerHTML = `<span>${text}</span><span>${text}</span>`;
    });
  }

  /* ---------- lightbox (shared by portfolio.js) ---------- */
  function isDirectVideoFile(url){
    return /\.(mp4|webm|mov)(\?.*)?$/i.test(url || '');
  }
  function openLightbox(item){
    const lightbox = document.getElementById('lightbox');
    const frame = document.getElementById('lightboxFrame');
    document.getElementById('lbTitle').textContent = item.title;
    document.getElementById('lbCat').textContent = item.category || '';
    if(item.url && isDirectVideoFile(item.url)){
      frame.innerHTML = `<video src="${item.url}" controls autoplay playsinline></video>`;
    } else if(item.url){
      frame.innerHTML = `<iframe src="${item.url}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe>`;
    } else {
      frame.innerHTML = `<div class="reel-placeholder"><div class="aperture"></div><span>Video coming soon</span></div>`;
      injectApertures(frame);
    }
    lightbox.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeLightbox(){
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('show');
    document.getElementById('lightboxFrame').innerHTML='';
    document.body.style.overflow='';
  }
  function initLightbox(){
    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lightbox').addEventListener('click', (e)=>{ if(e.target.id==='lightbox') closeLightbox(); });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLightbox(); });
  }

  /* ---------- contact section + floating WhatsApp + footer (driven by CONFIG) ---------- */
  const ICO = {
    phone: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.4"/>`,
    mail: `<path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.4"/><path d="M4 6l8 7 8-7" stroke="currentColor" stroke-width="1.4"/>`,
    insta: `<rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>`,
    wa: `<path d="M20.5 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l.9-5.2a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.4"/>`
  };
  function waLink(prefilledText){
    const text = prefilledText ? ('?text='+prefilledText) : '';
    return CONFIG.whatsappNumber ? `https://wa.me/${CONFIG.whatsappNumber}${text}` : `https://wa.me/${text}`;
  }
  function contactRow(iconPath, label, value, href, isPlaceholder){
    return `<a class="contact-row" href="${href||'#'}" ${href?'target="_blank" rel="noopener"':''}>
      <svg class="ico" viewBox="0 0 24 24" fill="none">${iconPath}</svg>
      <div><span class="lbl">${label}</span><span class="val ${isPlaceholder?'placeholder':''}">${value}</span></div>
    </a>`;
  }
  function renderContact(){
    const list = document.getElementById('contactList');
    if(list){
      list.innerHTML =
        contactRow(ICO.wa,'WhatsApp', CONFIG.whatsappNumber||'Add your number in js/config.js', CONFIG.whatsappNumber?waLink():'', !CONFIG.whatsappNumber) +
        contactRow(ICO.phone,'Phone', CONFIG.phone||'Add your number in js/config.js', CONFIG.phone?('tel:'+CONFIG.phone):'', !CONFIG.phone) +
        contactRow(ICO.mail,'Email', CONFIG.email||'Add your Gmail in js/config.js', CONFIG.email?('mailto:'+CONFIG.email):'', !CONFIG.email) +
        contactRow(ICO.insta,'Instagram', CONFIG.instagram? '@'+CONFIG.studioName.toLowerCase():'Add your handle in js/config.js', CONFIG.instagram, !CONFIG.instagram);
    }
    const social = document.getElementById('socialRow');
    if(social){
      social.innerHTML = `
        <a class="social-btn" href="${CONFIG.instagram||'#'}" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none">${ICO.insta}</svg></a>
        <a class="social-btn" href="${CONFIG.youtube||'#'}" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" stroke-width="1.4"/><path d="M10 9l6 3-6 3z" fill="currentColor"/></svg></a>
        <a class="social-btn" href="${CONFIG.facebook||'#'}" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="none"><path d="M15 8h2V4h-2a4 4 0 0 0-4 4v2H9v4h2v6h4v-6h2.5l.5-4H15V8z" stroke="currentColor" stroke-width="1.3"/></svg></a>`;
    }
    const waFloat = document.getElementById('wa-float');
    if(waFloat) waFloat.href = waLink(encodeURIComponent(`Hi ${CONFIG.studioName}! I'd like to know more about booking a shoot.`));

    const footWa = document.getElementById('footWa');
    if(footWa) footWa.textContent = CONFIG.whatsappNumber ? 'WhatsApp: '+CONFIG.whatsappNumber : 'WhatsApp — add number in js/config.js';
    const footInsta = document.getElementById('footInsta');
    if(footInsta) footInsta.textContent = CONFIG.instagram ? 'Instagram: @'+CONFIG.studioName.toLowerCase() : 'Instagram — add handle in js/config.js';
    const footEmail = document.getElementById('footEmail');
    if(footEmail) footEmail.textContent = CONFIG.email ? CONFIG.email : 'Email — add Gmail in js/config.js';

    const mapFrame = document.getElementById('mapIframe');
    if(mapFrame) mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(CONFIG.mapsQuery)}&output=embed`;

    const areas = document.getElementById('areasRow');
    if(areas) areas.innerHTML = CONFIG.citiesServed.map(c=>`<span class="area-chip">${c}</span>`).join('');
  }

  function initFooterYear(){
    const y = document.getElementById('year');
    if(y) y.textContent = new Date().getFullYear();
  }

  /* ---------- services + testimonials ----------
     Static content, not tied to Supabase. Edit the arrays below
     directly to change wording. */
  const SERVICES = [
    {t:'Wedding Films', d:"Full-day cinematic coverage crafted into a film you'll watch for decades."},
    {t:'Pre-Wedding', d:'Concept shoots across Indore, Dewas, Dhar & Ujjain — your story, your locations.'},
    {t:'Drone Shoot', d:'Sweeping aerial coverage for venues, landscapes and grand entries.'},
    {t:'Product Ads', d:'Commercial films that make brands look as good as they perform.'},
    {t:'Event Coverage', d:'Corporate events, launches and celebrations, covered start to finish.'},
    {t:'Corporate Videos', d:'Brand films, testimonials and internal comms with a cinematic finish.'},
    {t:'Editing Services', d:'Bring us your raw footage — colour, sound design and pacing, handled.'},
    {t:'Social Reels', d:'Short-form cuts optimised for Instagram & YouTube Shorts.'}
  ];
  const TESTIMONIALS = [
    {q:'Our wedding film felt like a movie, not a video. Ankit and Mohit understood exactly what we wanted before we even said it.', n:'Priya & Rohan', r:'Wedding Client, Indore'},
    {q:'Professional, punctual, and the final brand film exceeded what we briefed. Would book 2Bclicks again in a heartbeat.', n:'Meera Nair', r:'Marketing Lead, Dewas'},
    {q:'The drone shots of our venue alone were worth it. The full film brought our whole family to tears.', n:'Karan Verma', r:'Wedding Client, Ujjain'},
    {q:'They turned three days of chaos into an eight-minute film that still gives me chills.', n:'Ayesha Khan', r:'Wedding Client, Dhar'},
    {q:'Fast turnaround, sharp editing, and they genuinely cared about getting our brand tone right.', n:'Studio Kaaya', r:'Corporate Client, Indore'}
  ];
  function renderServices(){
    const grid = document.getElementById('svcGrid');
    if(grid) grid.innerHTML = SERVICES.map(s=>`<div class="svc-cell"><span class="ap-dot" data-ap></span><h4>${s.t}</h4><p>${s.d}</p></div>`).join('');
  }
  function tCardHTML(t){
    return `<div class="t-card"><div class="stars">★★★★★</div><p>"${t.q}"</p><div class="who"><div class="t-avatar"></div><div><div class="t-who-name">${t.n}</div><div class="t-who-role">${t.r}</div></div></div></div>`;
  }
  function renderTestimonials(){
    const track = document.getElementById('tTrack');
    if(track) track.innerHTML = TESTIMONIALS.concat(TESTIMONIALS).map(tCardHTML).join('');
  }

  function init(){
    injectApertures();
    initIntro();
    initHeaderScroll();
    initMobileNav();
    initReveal();
    initMarquee();
    initLightbox();
    renderContact();
    initFooterYear();
    renderServices();
    renderTestimonials();
    App.injectApertures();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    uploadMedia, apertureSVG, apertureDotSVG, injectApertures,
    observeNew, openLightbox, closeLightbox, waLink, renderContact
  };
})();