/* ============================================================
   2BCLICKS — ADMIN UI (Studio Dashboard)
   Real Supabase Auth login (email + password), then a dashboard
   to manage hero videos, portfolio videos, gallery photos, BTS
   photos and available dates. Visitors never see or need this —
   only "Studio Login" in the footer touches auth at all.

   Admin accounts are created by you in the Supabase dashboard
   (Authentication → Users) — there is no sign-up form here and
   never will be. See supabase/schema.sql for the one-time setup.
   ============================================================ */

const UI = (function(){

  const adminOverlay = document.getElementById('adminOverlay');
  const dashOverlay = document.getElementById('dashOverlay');
  let session = null;

  function openLogin(){ adminOverlay.classList.add('show'); }
  function closeLogin(){ adminOverlay.classList.remove('show'); document.getElementById('adminLoginErr').classList.remove('show'); }
  function openDash(){ dashOverlay.classList.add('show'); refreshAll(); }
  function closeDash(){ dashOverlay.classList.remove('show'); }

  function showErr(msg){
    const err = document.getElementById('adminLoginErr');
    err.textContent = msg; err.classList.add('show');
  }

  async function initLoginFlow(){
    document.getElementById('adminOpenBtn').addEventListener('click', ()=>{
      if(!SUPABASE_READY){
        openLogin();
        showErr('Supabase is not connected yet. Add supabaseUrl/supabaseAnonKey in js/config.js, run supabase/schema.sql, then create your admin account under Authentication → Users.');
        return;
      }
      openLogin();
    });
    document.querySelectorAll('[data-close-admin]').forEach(b=>b.addEventListener('click', closeLogin));
    document.querySelectorAll('[data-close-dash]').forEach(b=>b.addEventListener('click', closeDash));
    [adminOverlay, dashOverlay].forEach(o=>o.addEventListener('click', (e)=>{ if(e.target===o) o.classList.remove('show'); }));

    document.getElementById('adminLoginBtn').addEventListener('click', async ()=>{
      if(!SUPABASE_READY) return;
      const email = document.getElementById('adminEmail').value.trim();
      const pass = document.getElementById('adminPass').value;
      if(!email || !pass){ showErr('Enter both email and password.'); return; }

      const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
      if(error){ showErr(error.message || 'Login failed — check your email/password, or that this account exists in Supabase → Authentication → Users.'); return; }

      session = data.session;
      document.getElementById('adminEmail').value=''; document.getElementById('adminPass').value='';
      closeLogin(); openDash();
    });

    document.getElementById('adminSignOutBtn').addEventListener('click', async ()=>{
      if(SUPABASE_READY) await sb.auth.signOut();
      session = null;
      closeDash();
    });

    // keep `session` in sync if it changes elsewhere (e.g. token refresh, expiry)
    if(SUPABASE_READY){
      sb.auth.onAuthStateChange((_event, s)=>{ session = s; });
      const { data: { session: existing } } = await sb.auth.getSession();
      session = existing;
    }
  }

  function initTabs(){
    document.querySelectorAll('.admin-tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.admin-pane').forEach(p=>p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('pane-'+tab.dataset.tab).classList.add('active');
      });
    });
  }

  /* ---------- overview stats ---------- */
  function refreshOverview(){
    document.getElementById('statPortfolio').textContent = Portfolio.getItems().length;
    document.getElementById('statHero').textContent = Portfolio.getHeroVideos().length;
    document.getElementById('statPhotos').textContent = Gallery.getPhotos().length;
    document.getElementById('statAvail').textContent = Availability.getDates().filter(d=>d.status==='available').length;
    document.getElementById('statEquip').textContent = Site.getEquipment().length;
  }

  /* ---------- hero videos pane ---------- */
  function refreshHeroPane(){
    const list = document.getElementById('heroList');
    const vids = Portfolio.getHeroVideos();
    list.innerHTML = vids.length ? vids.map(v=>`
      <div class="mini-row"><span class="grow">${v.url}</span><button class="del" data-id="${v.id}">Delete</button></div>
    `).join('') : `<p class="sub">No hero background videos yet — add a direct .mp4 URL, or upload a file, above.</p>`;
    list.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Portfolio.removeHeroVideo(btn.dataset.id); }catch(e){ alert(e.message); }
    }));
  }
  function initHeroPane(){
    document.getElementById('heroAddBtn').addEventListener('click', async ()=>{
      const urlInput = document.getElementById('heroUrlInput');
      const fileInput = document.getElementById('heroFileInput');
      const btn = document.getElementById('heroAddBtn');
      try{
        let url = urlInput.value.trim();
        if(!url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'hero');
        }
        if(!url) return;
        await Portfolio.addHeroVideo(url);
        urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Add'; btn.disabled = false; }
    });
  }

  /* ---------- portfolio pane ---------- */
  function refreshPortfolioPane(){
    const list = document.getElementById('pfList');
    list.innerHTML = Portfolio.getItems().map(p=>`
      <div class="mini-row"><span class="grow">${p.title} — <em>${p.category}</em></span><button class="del" data-id="${p.id}">Delete</button></div>
    `).join('');
    list.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Portfolio.removeItem(btn.dataset.id); }catch(e){ alert(e.message); }
    }));
  }
  function initPortfolioPane(){
    document.getElementById('pfAddBtn').addEventListener('click', async ()=>{
      const title = document.getElementById('pfTitleInput').value.trim();
      const cat = document.getElementById('pfCatInput').value;
      const urlInput = document.getElementById('pfUrlInput');
      const fileInput = document.getElementById('pfFileInput');
      const btn = document.getElementById('pfAddBtn');
      if(!title) return;
      try{
        let url = urlInput.value.trim();
        if(fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'portfolio'); // uploaded .mp4 takes priority over a pasted embed URL
        }
        await Portfolio.addItem(title, cat, url);
        document.getElementById('pfTitleInput').value=''; urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Add'; btn.disabled = false; }
    });
  }

  /* ---------- gallery photos pane ---------- */
  function refreshGalleryPane(){
    const list = document.getElementById('galList');
    list.innerHTML = Gallery.getPhotos().map(p=>`
      <div class="mini-row">
        <span class="grow">${p.url?`<img class="thumb" src="${p.url}" alt="">`:''}${p.tag}</span>
        <button class="del" data-id="${p.id}">Delete</button>
      </div>`).join('');
    list.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Gallery.removePhoto(btn.dataset.id); }catch(e){ alert(e.message); }
    }));

    const btsList = document.getElementById('btsList');
    btsList.innerHTML = Gallery.getBTS().map(b=>`
      <div class="mini-row">
        <span class="grow">${b.url?`<img class="thumb" src="${b.url}" alt="">`:''}${b.caption}</span>
        <button class="del" data-id="${b.id}">Delete</button>
      </div>`).join('');
    btsList.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Gallery.removeBTS(btn.dataset.id); }catch(e){ alert(e.message); }
    }));
  }
  function initGalleryPane(){
    document.getElementById('galAddBtn').addEventListener('click', async ()=>{
      const tag = document.getElementById('galTagInput').value.trim() || 'Untitled';
      const urlInput = document.getElementById('galUrlInput');
      const fileInput = document.getElementById('galFileInput');
      const btn = document.getElementById('galAddBtn');
      try{
        let url = urlInput.value.trim();
        if(!url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'gallery');
        }
        await Gallery.addPhoto(tag, url);
        document.getElementById('galTagInput').value=''; urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Add'; btn.disabled = false; }
    });
    document.getElementById('btsAddBtn').addEventListener('click', async ()=>{
      const caption = document.getElementById('btsCapInput').value.trim() || 'Untitled';
      const urlInput = document.getElementById('btsUrlInput');
      const fileInput = document.getElementById('btsFileInput');
      const btn = document.getElementById('btsAddBtn');
      try{
        let url = urlInput.value.trim();
        if(!url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'bts');
        }
        await Gallery.addBTS(caption, url);
        document.getElementById('btsCapInput').value=''; urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Add'; btn.disabled = false; }
    });
  }

  /* ---------- availability pane ---------- */
  function refreshAvailPane(){
    const list = document.getElementById('availList');
    const sorted = Availability.getDates().slice().sort((a,b)=> new Date(a.date) - new Date(b.date));
    list.innerHTML = sorted.map(d=>`
      <div class="mini-row">
        <span class="grow">${Availability.fmt(d.date)}</span>
        <div class="admin-status-toggle">
          <button type="button" class="toggle-status ${d.status==='available'?'on':''}" data-date="${d.date}">Available</button>
        </div>
        <button class="del" data-date="${d.date}">Delete</button>
      </div>`).join('') || `<p class="sub">No dates added yet.</p>`;

    list.querySelectorAll('.toggle-status').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Availability.toggleStatus(btn.dataset.date); }catch(e){ alert(e.message); }
    }));
    list.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Availability.removeDate(btn.dataset.date); }catch(e){ alert(e.message); }
    }));
  }
  function initAvailPane(){
    document.getElementById('availAddBtn').addEventListener('click', async ()=>{
      const dateInput = document.getElementById('availDateInput');
      if(!dateInput.value) return;
      try{
        await Availability.addDate(dateInput.value, 'available');
        dateInput.value='';
      }catch(e){ alert(e.message); }
    });
  }

  /* ---------- about pane: founders photo/caption + equipment ---------- */
  function refreshSitePane(){
    const equipList = document.getElementById('equipList');
    equipList.innerHTML = Site.getEquipment().map(e=>`
      <div class="mini-row">
        <span class="grow">${e.photo_url?`<img class="thumb" src="${e.photo_url}" alt="">`:''}${e.label}</span>
        <button class="del" data-id="${e.id}">Delete</button>
      </div>`).join('') || `<p class="sub">No equipment added yet.</p>`;
    equipList.querySelectorAll('.del').forEach(btn=>btn.addEventListener('click', async ()=>{
      try{ await Site.removeEquipment(btn.dataset.id); }catch(e){ alert(e.message); }
    }));
    if(document.getElementById('statEquip')) document.getElementById('statEquip').textContent = Site.getEquipment().length;
  }
  function initAboutPane(){
    document.getElementById('foundersSaveBtn').addEventListener('click', async ()=>{
      const urlInput = document.getElementById('foundersUrlInput');
      const fileInput = document.getElementById('foundersFileInput');
      const btn = document.getElementById('foundersSaveBtn');
      try{
        let url = urlInput.value.trim();
        if(!url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'founders');
        }
        if(!url) return;
        await Site.setSetting('founders_photo', url);
        urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Save Photo'; btn.disabled = false; }
    });

    document.getElementById('foundersCapSaveBtn').addEventListener('click', async ()=>{
      const input = document.getElementById('foundersCapInput');
      if(!input.value.trim()) return;
      try{ await Site.setSetting('founders_caption', input.value.trim()); input.value=''; }
      catch(e){ alert(e.message); }
    });

    document.getElementById('equipAddBtn').addEventListener('click', async ()=>{
      const labelInput = document.getElementById('equipLabelInput');
      const urlInput = document.getElementById('equipUrlInput');
      const fileInput = document.getElementById('equipFileInput');
      const btn = document.getElementById('equipAddBtn');
      const label = labelInput.value.trim();
      if(!label) return;
      try{
        let url = urlInput.value.trim();
        if(!url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          url = await App.uploadMedia(fileInput.files[0], 'equipment');
        }
        await Site.addEquipment(label, url);
        labelInput.value=''; urlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Add'; btn.disabled = false; }
    });
  }

  /* ---------- showreel pane ---------- */
  function initShowreelPane(){
    document.getElementById('showreelSaveBtn').addEventListener('click', async ()=>{
      const embed = document.getElementById('showreelEmbedInput').value.trim();
      const mp4UrlInput = document.getElementById('showreelMp4UrlInput');
      const fileInput = document.getElementById('showreelFileInput');
      const btn = document.getElementById('showreelSaveBtn');
      try{
        let mp4Url = mp4UrlInput.value.trim();
        if(!mp4Url && fileInput.files[0]){
          btn.textContent = 'Uploading…'; btn.disabled = true;
          mp4Url = await App.uploadMedia(fileInput.files[0], 'showreel');
        }
        // an uploaded/pasted .mp4 takes priority over a pasted embed URL
        if(mp4Url){
          await Site.setSetting('showreel_type', 'mp4');
          await Site.setSetting('showreel_url', mp4Url);
        } else if(embed){
          await Site.setSetting('showreel_type', 'embed');
          await Site.setSetting('showreel_url', embed);
        } else {
          return;
        }
        document.getElementById('showreelEmbedInput').value=''; mp4UrlInput.value=''; fileInput.value='';
      }catch(e){ alert(e.message); }
      finally{ btn.textContent = 'Save Showreel'; btn.disabled = false; }
    });

    document.getElementById('showreelClearBtn').addEventListener('click', async ()=>{
      if(!confirm('Remove the current showreel and go back to the placeholder?')) return;
      try{
        await Site.setSetting('showreel_type', '');
        await Site.setSetting('showreel_url', '');
      }catch(e){ alert(e.message); }
    });
  }

  function refreshAll(){
    refreshOverview();
    refreshHeroPane();
    refreshPortfolioPane();
    refreshGalleryPane();
    refreshAvailPane();
    refreshSitePane();
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    await initLoginFlow();
    initTabs();
    initHeroPane();
    initPortfolioPane();
    initGalleryPane();
    initAvailPane();
    initAboutPane();
    initShowreelPane();
  });

  // exposed so portfolio.js / gallery.js / availability.js / site.js can
  // refresh the open dashboard immediately when realtime pushes a change
  return { refreshOverview, refreshHeroPane, refreshPortfolioPane, refreshGalleryPane, refreshAvailPane, refreshSitePane };
})();