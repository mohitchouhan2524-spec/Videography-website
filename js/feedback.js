const Feedback = (function(){

  let reviews = [];
  let isAdmin = false;

  const FALLBACK = [
    { id:'r1', name:'Aisha Malhotra', rating:5, message:'Loved working with 2Bclicks — our wedding film felt like a movie.', created_at:new Date().toISOString() }
  ];

  function starsHTML(n){
    let s = '';
    for(let i=1;i<=5;i++) s += `<span class="star ${i<=n?'filled':''}">★</span>`;
    return s;
  }

  function renderSummary(){
    const el = document.getElementById('reviewSummary');
    if(!el) return;
    if(!reviews.length){
      el.innerHTML = `<div class="review-avg-num">—</div><div>${starsHTML(0)}</div><div class="review-count">No reviews yet — be the first.</div>`;
      return;
    }
    const avg = reviews.reduce((sum,r)=>sum+r.rating,0) / reviews.length;
    el.innerHTML = `
      <div class="review-avg-num">${avg.toFixed(1)}</div>
      <div>${starsHTML(Math.round(avg))}</div>
      <div class="review-count">${reviews.length} review${reviews.length===1?'':'s'}</div>`;
  }

  function reviewCardHTML(r){
    const date = new Date(r.created_at).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
    return `<div class="review-card" data-id="${r.id}">
      <div class="review-card-top">
        <div>${starsHTML(r.rating)}</div>
        ${isAdmin ? `<button class="review-del" data-id="${r.id}" title="Delete review">Delete</button>` : ''}
      </div>
      ${r.message ? `<p class="review-msg">"${r.message}"</p>` : ''}
      <div class="review-who"><span>${r.name || 'Anonymous'}</span><span class="review-date">${date}</span></div>
    </div>`;
  }

  function renderList(){
    const el = document.getElementById('reviewList');
    if(!el) return;
    const sorted = reviews.slice().sort((a,b)=> new Date(b.created_at) - new Date(a.created_at));
    el.innerHTML = sorted.length ? sorted.map(reviewCardHTML).join('') : `<div class="pf-empty">No reviews yet — add yours below.</div>`;
    el.querySelectorAll('.review-del').forEach(btn=>btn.addEventListener('click', async ()=>{
      if(!confirm('Delete this review?')) return;
      try{
        const { error } = await sb.from('feedback').delete().eq('id', btn.dataset.id);
        if(error) throw error;
      }catch(e){ alert(e.message); }
    }));
  }

  function renderAll(){ renderSummary(); renderList(); }

  /* ---------- submit form ---------- */
  function initForm(){
    const form = document.getElementById('reviewForm');
    if(!form) return;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const msgEl = document.getElementById('reviewFormMsg');
      const ratingInput = form.querySelector('input[name="rating"]:checked');
      const name = document.getElementById('revName').value.trim();
      const message = document.getElementById('revMessage').value.trim();

      if(!ratingInput){
        msgEl.textContent = 'Please pick a star rating.'; msgEl.className = 'form-msg show'; return;
      }
      if(!SUPABASE_READY){
        msgEl.textContent = 'Reviews aren\'t connected yet — add Supabase credentials in js/config.js.'; msgEl.className = 'form-msg show'; return;
      }
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true; submitBtn.textContent = 'Submitting…';
      try{
        const { error } = await sb.from('feedback').insert({
          name: name || 'Anonymous',
          rating: Number(ratingInput.value),
          message
        });
        if(error) throw error;
        form.reset();
        msgEl.textContent = 'Thanks for the feedback!'; msgEl.className = 'form-msg show ok';
      }catch(err){
        msgEl.textContent = err.message || 'Something went wrong — please try again.'; msgEl.className = 'form-msg show';
      }finally{
        submitBtn.disabled = false; submitBtn.textContent = 'Submit Review';
      }
    });
  }

  /* ---------- Supabase reads + admin check + realtime ---------- */
  async function fetchReviews(){
    if(!SUPABASE_READY) return FALLBACK;
    const { data, error } = await sb.from('feedback').select('*').order('created_at', {ascending:false});
    if(error){ console.error(error); return FALLBACK; }
    return data;
  }

  async function refreshAdminFlag(){
    if(!SUPABASE_READY) return;
    const { data: { session } } = await sb.auth.getSession();
    isAdmin = !!session;
  }

  function initRealtime(){
    if(!SUPABASE_READY) return;
    sb.channel('feedback-changes')
      .on('postgres_changes', { event:'*', schema:'public', table:'feedback' }, async ()=>{
        reviews = await fetchReviews(); renderAll();
      })
      .subscribe();
    sb.auth.onAuthStateChange(async (_event, session)=>{
      isAdmin = !!session;
      renderAll();
    });
  }

  async function init(){
    reviews = await fetchReviews();
    await refreshAdminFlag();
    renderAll();
    initForm();
    initRealtime();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { getReviews: ()=>reviews };
})();