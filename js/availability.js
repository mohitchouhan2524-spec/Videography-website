/* ============================================================
   2BCLICKS — AVAILABILITY + BOOK-VIA-CONTACT  (Supabase-backed)
   Reads/writes the `availability_dates` table. Visitors pick an
   open date and go straight to WhatsApp with it pre-filled, or
   DM Instagram / call directly — no forms anywhere.
   ============================================================ */

const Availability = (function(){

  let dates = [];

  const FALLBACK = [
    { date:'2026-08-02', status:'available' },
    { date:'2026-08-09', status:'booked' },
    { date:'2026-08-16', status:'available' }
  ];

  function fmt(d){
    const dt = new Date(d+'T00:00:00');
    return dt.toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  }

  function chipHTML(item){
    if(item.status === 'available'){
      return `<div class="avail-chip available" data-date="${item.date}">
        <span class="d">${fmt(item.date)}</span>
        <span class="s">Available</span>
        <button type="button" class="book-date-btn" data-date="${item.date}">Book this date on WhatsApp</button>
      </div>`;
    }
    return `<div class="avail-chip booked" data-date="${item.date}">
      <span class="d">${fmt(item.date)}</span>
      <span class="s">Already booked</span>
    </div>`;
  }

  function render(){
    const grid = document.getElementById('availGrid');
    if(!grid) return;
    const upcoming = dates
      .filter(d => new Date(d.date+'T00:00:00') >= new Date(new Date().toDateString()))
      .sort((a,b)=> new Date(a.date) - new Date(b.date));
    grid.innerHTML = upcoming.length ? upcoming.map(chipHTML).join('') : `<div class="avail-empty">No dates published yet — message us directly to check availability.</div>`;

    grid.querySelectorAll('.book-date-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const msg = encodeURIComponent(`Hi ${CONFIG.studioName}! I'd like to check booking for ${fmt(btn.dataset.date)}.`);
        window.open(App.waLink(msg), '_blank');
      });
    });
  }

  function initCtaRow(){
    const row = document.getElementById('bookCtaRow');
    if(!row) return;
    const genericMsg = encodeURIComponent(`Hi ${CONFIG.studioName}! I'd like to enquire about booking a shoot.`);
    row.innerHTML = `
      <a class="book-cta-btn" href="${App.waLink(genericMsg)}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none"><path d="M20.5 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 20l.9-5.2a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="1.4"/></svg>
        <span>WhatsApp Us</span>
      </a>
      <a class="book-cta-btn" href="${CONFIG.instagram || '#'}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        <span>DM Instagram</span>
      </a>
      <a class="book-cta-btn" href="${CONFIG.phone ? 'tel:'+CONFIG.phone : '#'}">
        <svg viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" stroke-width="1.4"/></svg>
        <span>Call Now</span>
      </a>`;
  }

  /* ---------- Supabase reads ---------- */
  async function fetchDates(){
    if(!SUPABASE_READY) return FALLBACK;
    const { data, error } = await sb.from('availability_dates').select('*').order('date', {ascending:true});
    if(error){ console.error(error); return FALLBACK; }
    return data;
  }

  /* ---------- public API used by ui.js ---------- */
  function getDates(){ return dates; }

  async function addDate(date, status){
    if(!SUPABASE_READY) throw new Error('Supabase not connected — add credentials in js/config.js.');
    // upsert on the unique `date` column — re-adding an existing date just updates its status
    const { error } = await sb.from('availability_dates').upsert({ date, status }, { onConflict:'date' });
    if(error) throw error;
  }
  async function toggleStatus(date){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const current = dates.find(d=>d.date===date);
    if(!current) return;
    const next = current.status === 'available' ? 'booked' : 'available';
    const { error } = await sb.from('availability_dates').update({ status: next }).eq('date', date);
    if(error) throw error;
  }
  async function removeDate(date){
    if(!SUPABASE_READY) throw new Error('Supabase not connected.');
    const { error } = await sb.from('availability_dates').delete().eq('date', date);
    if(error) throw error;
  }

  /* ---------- realtime ---------- */
  function initRealtime(){
    if(!SUPABASE_READY) return;
    sb.channel('availability-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'availability_dates' }, async ()=>{
        dates = await fetchDates(); render();
        if(window.UI) window.UI.refreshAvailPane();
      })
      .subscribe();
  }

  async function init(){
    dates = await fetchDates();
    render();
    initCtaRow();
    initRealtime();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getDates, addDate, toggleStatus, removeDate, render, fmt };
})();
