  // ---------- Tabs ----------
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');
  tabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabBtns.forEach(b=>b.classList.remove('active'));
      panels.forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    });
  });

  // ---------- Dates: 10 to 17 July 2027 ----------
  const EVENT_START = new Date(2027,6,10,0,0,0);
  const dayNumbers = [10,11,12,13,14,15,16,17];

  function fmtWeekday(d){
    return new Date(2027,6,d).toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','');
  }

  // date chips
  const datebar = document.getElementById('datebar');
  dayNumbers.forEach((d,i)=>{
    const chip = document.createElement('div');
    chip.className = 'day-chip' + (i===0 ? ' first' : i===dayNumbers.length-1 ? ' last' : '');
    chip.innerHTML = `<span class="wd">${fmtWeekday(d)}</span><span class="num">${d}</span>`;
    datebar.appendChild(chip);
  });

  // garland flags — pastel palette
  const flagColors = ['#F3B9C4','#A7DCC5','#C9B7E8','#F6D67E','#EE8266'];
  const flagsG = document.getElementById('flags');
  const flagCount = 16;
  for(let i=0;i<flagCount;i++){
    const x = (1200/(flagCount-1))*i;
    const t = i/(flagCount-1);
    const y = 4 + Math.sin(Math.PI*t)*46;
    const tri = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    const w=14,h=20;
    tri.setAttribute('points', `${x-w/2},${y} ${x+w/2},${y} ${x},${y+h}`);
    tri.setAttribute('fill', flagColors[i%flagColors.length]);
    tri.setAttribute('opacity','0.9');
    flagsG.appendChild(tri);
  }

  // balloons
  const balloonColors = ['#F3B9C4','#A7DCC5','#C9B7E8','#F6D67E','#EE8266'];
  const balloonField = document.getElementById('balloon-field');
  const balloonSpots = [
    {left:'4%', top:'8%', size:1},
    {left:'12%', top:'46%', size:0.75},
    {left:'90%', top:'6%', size:0.85},
    {left:'84%', top:'44%', size:1.1},
    {left:'50%', top:'2%', size:0.7},
  ];
  balloonSpots.forEach((spot,i)=>{
    const b = document.createElement('div');
    const color = balloonColors[i%balloonColors.length];
    b.className = 'balloon';
    b.style.left = spot.left;
    b.style.top = spot.top;
    b.style.background = `radial-gradient(circle at 35% 30%, #fff8, ${color})`;
    b.style.borderColor = color;
    b.style.transform = `scale(${spot.size})`;
    b.style.animationDelay = (i*0.6)+'s';
    b.style.setProperty('border-top-color', color);
    balloonField.appendChild(b);
  });

  // day toggles in form
  const daysGrid = document.getElementById('days-grid');
  dayNumbers.forEach(d=>{
    const wrap = document.createElement('label');
    wrap.className = 'day-toggle';
    wrap.innerHTML = `<input type="checkbox" value="${d}"><span class="box">${fmtWeekday(d)}<br>${d}</span>`;
    daysGrid.appendChild(wrap);
  });

  // ---------- Countdown ----------
  function updateCountdown(){
    const now = new Date();
    let diff = EVENT_START - now;
    if(diff < 0) diff = 0;
    const days = Math.floor(diff/86400000);
    const hours = Math.floor((diff%86400000)/3600000);
    const mins = Math.floor((diff%3600000)/60000);
    const secs = Math.floor((diff%60000)/1000);
    document.getElementById('cd-days').textContent = days;
    document.getElementById('cd-hours').textContent = String(hours).padStart(2,'0');
    document.getElementById('cd-mins').textContent = String(mins).padStart(2,'0');
    document.getElementById('cd-secs').textContent = String(secs).padStart(2,'0');
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ---------- Configuration Supabase ----------
  // Toutes les requêtes SQL de configuration (création des tables "guests" et
  // "lodgings", policies, données d'exemple) sont dans le fichier dédié
  // "supabase_setup.sql" fourni à côté de cette page — voir ce fichier pour
  // la marche à suivre complète.
  //
  // Résumé rapide :
  // 1. Crée un projet gratuit sur https://supabase.com
  // 2. Exécute le contenu de supabase_setup.sql dans le "SQL Editor"
  // 3. Dans "Project Settings > API", copie l'URL du projet et la clé "anon public"
  //    dans le fichier "supabase_access.txt" placé à côté de cette page HTML :
  //    { "supabase_url": "https://xxxx.supabase.co", "supabase_anon_key": "xxxx", "invite_code": "xxxx" }
  //    Le champ "invite_code" est un simple mot de passe partagé en famille (pas une
  //    vraie sécurité) pour décourager le spam sur le formulaire.
  //
  // Remarque : le fichier est chargé via fetch(), il faut donc servir la page en
  // http(s) (GitHub Pages, un serveur local, etc.) — ouvrir le .html directement
  // depuis le disque (file://) ne fonctionnera pas.
  //
  // Compte admin : voir supabase_setup.sql pour la marche à suivre (création
  // du compte dans Authentication > Users, et désactivation des inscriptions
  // publiques).
  let dbClient = null;
  let inviteCode = null;
  let isAdmin = false;

  async function loadSupabaseConfig(){
    try{
      const res = await fetch('supabase_access.txt');
      if(!res.ok) throw new Error('fichier introuvable');
      const cfg = await res.json();
      if(!cfg.supabase_url || !cfg.supabase_anon_key) throw new Error('champs manquants');
      dbClient = window.supabase.createClient(cfg.supabase_url, cfg.supabase_anon_key);
      inviteCode = cfg.invite_code || null;

      const { data: { session } } = await dbClient.auth.getSession();
      applyAdminState(session);
      dbClient.auth.onAuthStateChange((_event, session)=>{
        applyAdminState(session);
        refreshGuestList();
        refreshLodgings();
        refreshArticles();
      });
    }catch(e){
      console.error('Config Supabase invalide ou introuvable:', e);
      dbClient = null;
    }
  }

  // ---------- Admin : connexion / déconnexion ----------
  const adminBtn = document.getElementById('admin-btn');
  const adminModal = document.getElementById('admin-modal');
  const adminModalClose = document.getElementById('admin-modal-close');
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminLoginStatus = document.getElementById('admin-login-status');
  const adminLoginSubmit = document.getElementById('admin-login-submit');

  function applyAdminState(session){
    isAdmin = !!session;
    document.body.classList.toggle('is-admin', isAdmin);
    adminBtn.textContent = isAdmin ? `🔓 ${session.user.email} · déconnexion` : '🔒 Admin';
  }

  function openAdminModal(){
    adminLoginForm.reset();
    adminLoginStatus.textContent = '';
    adminLoginStatus.className = 'status-msg';
    adminModal.classList.remove('hidden');
  }
  function closeAdminModal(){ adminModal.classList.add('hidden'); }

  adminBtn.addEventListener('click', async ()=>{
    if(!dbClient){
      alert('Base de données non configurée : vérifie le fichier supabase_access.txt.');
      return;
    }
    if(isAdmin){
      await dbClient.auth.signOut();
    }else{
      openAdminModal();
    }
  });
  adminModalClose.addEventListener('click', closeAdminModal);
  adminModal.addEventListener('click', (e)=>{ if(e.target === adminModal) closeAdminModal(); });

  adminLoginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    adminLoginSubmit.disabled = true;
    adminLoginStatus.textContent = 'Connexion...';
    adminLoginStatus.className = 'status-msg';
    try{
      const { error } = await dbClient.auth.signInWithPassword({ email, password });
      if(error) throw error;
      closeAdminModal();
    }catch(err){
      console.error(err);
      adminLoginStatus.textContent = 'Connexion refusée : email ou mot de passe incorrect.';
      adminLoginStatus.className = 'status-msg err';
    }finally{
      adminLoginSubmit.disabled = false;
    }
  });

  // ---------- RSVP storage ----------
  const form = document.getElementById('rsvp-form');
  const statusMsg = document.getElementById('status-msg');
  const submitBtn = document.getElementById('submit-btn');
  const guestList = document.getElementById('guest-list');
  const totalCount = document.getElementById('total-count');

  async function loadGuests(){
    if(!dbClient) return [];
    const { data, error } = await dbClient
      .from('guests')
      .select('*')
      .order('created_at', { ascending: true });
    if(error){ console.error(error); return []; }
    return data;
  }

  async function saveGuest(guest){
    const { error } = await dbClient.from('guests').insert([guest]);
    if(error) throw error;
  }

  function renderGuests(guests){
    if(!guests.length){
      guestList.innerHTML = '<p class="empty-note">Personne n\'a encore répondu — sois le premier·ère !</p>';
      totalCount.textContent = '0 personne';
      return;
    }
    let total = 0;
    guestList.innerHTML = guests.slice().reverse().map(g=>{
      total += Number(g.count)||0;
      const daysLabel = g.days.length === 8
        ? 'Toute la semaine'
        : g.days.map(d=>d+' juil.').join(', ');
      return `<div class="guest-row" data-id="${g.id}">
        <div>
          <div class="who">${escapeHtml(g.name)}</div>
          <div class="days">${daysLabel}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${g.sleep ? '<span class="sleep-tag">⛺ dort en tente</span>' : ''}
          <span class="cnt">${g.count} pers.</span>
          <button type="button" class="guest-delete-btn" data-id="${g.id}" title="Supprimer cette réponse">🗑</button>
        </div>
      </div>`;
    }).join('');
    totalCount.textContent = total + (total>1 ? ' personnes' : ' personne');
  }

  guestList.addEventListener('click', async (e)=>{
    const btn = e.target.closest('.guest-delete-btn');
    if(!btn || !isAdmin) return;
    if(!confirm('Supprimer cette réponse de présence ?')) return;
    try{
      const { error } = await dbClient.from('guests').delete().eq('id', btn.dataset.id);
      if(error) throw error;
      await refreshGuestList();
    }catch(err){
      console.error(err);
      alert('Erreur lors de la suppression.');
    }
  });

  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  async function refreshGuestList(){
    const guests = await loadGuests();
    renderGuests(guests);
  }

  // ---------- Lodgings (logements) ----------
  const lodgingOnplaceEl = document.getElementById('lodging-onplace');
  const lodgingNearbyEl = document.getElementById('lodging-nearby');
  let currentLodgings = [];

  async function loadLodgings(){
    if(!dbClient) return [];
    const { data, error } = await dbClient
      .from('lodgings')
      .select('*')
      .order('sort_order', { ascending: true });
    if(error){ console.error(error); return []; }
    return data;
  }

  function lodgeCardHtml(l){
    const cls = 'lodge-card' + (l.priority ? ' priority' : '');
    return `<div class="${cls}" data-id="${l.id}">
      <div class="lodge-admin-actions">
        <button type="button" class="edit-lodging" data-id="${l.id}" title="Modifier">✎</button>
        <button type="button" class="delete-lodging" data-id="${l.id}" title="Supprimer">🗑</button>
      </div>
      <div class="lodge-icon">${escapeHtml(l.icon || '🏠')}</div>
      <div>
        <h4>${escapeHtml(l.title)}</h4>
        ${l.meta ? `<div class="lodge-meta">${escapeHtml(l.meta)}</div>` : ''}
        <p>${escapeHtml(l.description)}</p>
        ${l.tag ? `<span class="tag">${escapeHtml(l.tag)}</span>` : ''}
        ${l.link ? `<div><a class="lodge-link" href="${escapeHtml(l.link)}" target="_blank" rel="noopener noreferrer">🔗 Voir le site</a></div>` : ''}
      </div>
    </div>`;
  }

  function renderLodgings(lodgings){
    currentLodgings = lodgings;
    const onplace = lodgings.filter(l=>l.category === 'onplace');
    const nearby = lodgings.filter(l=>l.category === 'nearby');

    lodgingOnplaceEl.innerHTML = onplace.length
      ? onplace.map(lodgeCardHtml).join('')
      : '<p class="empty-note">Aucun logement sur place renseigné pour l\'instant.</p>';

    lodgingNearbyEl.innerHTML = nearby.length
      ? nearby.map(lodgeCardHtml).join('')
      : '<p class="empty-note">Aucun logement à proximité renseigné pour l\'instant.</p>';
  }

  async function refreshLodgings(){
    if(!dbClient){
      const msg = '<p class="empty-note">Base de données non configurée : vérifie le fichier supabase_access.txt.</p>';
      lodgingOnplaceEl.innerHTML = msg;
      lodgingNearbyEl.innerHTML = msg;
      return;
    }
    const lodgings = await loadLodgings();
    renderLodgings(lodgings);
  }

  // ---------- Admin : ajout / édition / suppression de logement ----------
  const lodgingModal = document.getElementById('lodging-modal');
  const lodgingModalClose = document.getElementById('lodging-modal-close');
  const lodgingModalTitle = document.getElementById('lodging-modal-title');
  const lodgingForm = document.getElementById('lodging-form');
  const lodgingFormStatus = document.getElementById('lodging-form-status');
  const lodgingFormSubmit = document.getElementById('lodging-form-submit');

  function openLodgingModal(lodging, defaultCategory){
    lodgingForm.reset();
    lodgingFormStatus.textContent = '';
    lodgingFormStatus.className = 'status-msg';
    document.getElementById('lf-id').value = lodging ? lodging.id : '';
    document.getElementById('lf-category').value = lodging ? lodging.category : (defaultCategory || 'onplace');
    document.getElementById('lf-icon').value = lodging ? (lodging.icon || '') : '';
    document.getElementById('lf-title').value = lodging ? lodging.title : '';
    document.getElementById('lf-meta').value = lodging ? (lodging.meta || '') : '';
    document.getElementById('lf-description').value = lodging ? lodging.description : '';
    document.getElementById('lf-tag').value = lodging ? (lodging.tag || '') : '';
    document.getElementById('lf-link').value = lodging ? (lodging.link || '') : '';
    document.getElementById('lf-priority').checked = lodging ? !!lodging.priority : false;
    document.getElementById('lf-sort').value = lodging ? (lodging.sort_order ?? 0) : 0;
    lodgingModalTitle.textContent = lodging ? 'Modifier le logement' : 'Ajouter un logement';
    lodgingModal.classList.remove('hidden');
  }
  function closeLodgingModal(){ lodgingModal.classList.add('hidden'); }

  lodgingModalClose.addEventListener('click', closeLodgingModal);
  lodgingModal.addEventListener('click', (e)=>{ if(e.target === lodgingModal) closeLodgingModal(); });

  document.querySelectorAll('.add-lodging-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!isAdmin) return;
      openLodgingModal(null, btn.dataset.category);
    });
  });

  async function handleLodgingCardClick(e){
    const editBtn = e.target.closest('.edit-lodging');
    const deleteBtn = e.target.closest('.delete-lodging');
    if(!isAdmin || (!editBtn && !deleteBtn)) return;

    if(editBtn){
      const lodging = currentLodgings.find(l=>String(l.id) === editBtn.dataset.id);
      if(lodging) openLodgingModal(lodging);
    }
    if(deleteBtn){
      if(!confirm('Supprimer ce logement ?')) return;
      try{
        const { error } = await dbClient.from('lodgings').delete().eq('id', deleteBtn.dataset.id);
        if(error) throw error;
        await refreshLodgings();
      }catch(err){
        console.error(err);
        alert('Erreur lors de la suppression.');
      }
    }
  }
  lodgingOnplaceEl.addEventListener('click', handleLodgingCardClick);
  lodgingNearbyEl.addEventListener('click', handleLodgingCardClick);

  lodgingForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id = document.getElementById('lf-id').value;
    const payload = {
      category: document.getElementById('lf-category').value,
      icon: document.getElementById('lf-icon').value.trim() || '🏠',
      title: document.getElementById('lf-title').value.trim(),
      meta: document.getElementById('lf-meta').value.trim() || null,
      description: document.getElementById('lf-description').value.trim(),
      tag: document.getElementById('lf-tag').value.trim() || null,
      link: document.getElementById('lf-link').value.trim() || null,
      priority: document.getElementById('lf-priority').checked,
      sort_order: Number(document.getElementById('lf-sort').value) || 0
    };

    lodgingFormSubmit.disabled = true;
    lodgingFormStatus.textContent = 'Enregistrement...';
    lodgingFormStatus.className = 'status-msg';
    try{
      const { error } = id
        ? await dbClient.from('lodgings').update(payload).eq('id', id)
        : await dbClient.from('lodgings').insert([payload]);
      if(error) throw error;
      closeLodgingModal();
      await refreshLodgings();
    }catch(err){
      console.error(err);
      lodgingFormStatus.textContent = 'Erreur lors de l\'enregistrement.';
      lodgingFormStatus.className = 'status-msg err';
    }finally{
      lodgingFormSubmit.disabled = false;
    }
  });

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();

    if(!dbClient){
      statusMsg.textContent = 'Base de données non configurée : vérifie le fichier supabase_access.txt.';
      statusMsg.className = 'status-msg err';
      return;
    }

    const name = document.getElementById('f-name').value.trim();
    const count = document.getElementById('f-count').value;
    const msg = document.getElementById('f-msg').value.trim();
    const sleep = document.getElementById('f-sleep').checked;
    const code = document.getElementById('f-code').value.trim();
    const checked = Array.from(daysGrid.querySelectorAll('input:checked')).map(i=>Number(i.value));

    if(!name){
      statusMsg.textContent = 'Merci d\'indiquer ton nom.';
      statusMsg.className = 'status-msg err';
      return;
    }
    if(checked.length === 0){
      statusMsg.textContent = 'Coche au moins un jour de présence.';
      statusMsg.className = 'status-msg err';
      return;
    }
    if(inviteCode && code.toLowerCase() !== inviteCode.toLowerCase()){
      statusMsg.textContent = 'Code d\'invitation incorrect.';
      statusMsg.className = 'status-msg err';
      return;
    }

    submitBtn.disabled = true;
    statusMsg.textContent = 'Envoi en cours...';
    statusMsg.className = 'status-msg';

    try{
      await saveGuest({
        name, count: Number(count), msg, sleep,
        days: checked.sort((a,b)=>a-b)
      });
      const guests = await loadGuests();
      renderGuests(guests);
      statusMsg.textContent = 'Réponse enregistrée, merci !';
      statusMsg.className = 'status-msg';
      form.reset();
    }catch(err){
      console.error(err);
      statusMsg.textContent = 'Une erreur est survenue, réessaie.';
      statusMsg.className = 'status-msg err';
    }finally{
      submitBtn.disabled = false;
    }
  });

  // ---------- Articles ----------
  const articleListEl = document.getElementById('article-list');
  const addArticleBtn = document.getElementById('add-article-btn');
  let currentArticles = [];

  async function loadArticles(){
    if(!dbClient) return [];
    const { data, error } = await dbClient
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false });
    if(error){ console.error(error); return []; }
    return data;
  }

  function fmtArticleDate(dateStr){
    const d = new Date(dateStr + 'T00:00:00');
    if(isNaN(d)) return dateStr;
    return d.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  }

  function articleCardHtml(a){
    return `<div class="article-card" data-id="${a.id}">
      <div class="article-admin-actions">
        <button type="button" class="edit-article" data-id="${a.id}" title="Modifier">✎</button>
        <button type="button" class="delete-article" data-id="${a.id}" title="Supprimer">🗑</button>
      </div>
      <div class="article-date">${escapeHtml(fmtArticleDate(a.published_at))}</div>
      <h4>${escapeHtml(a.title)}</h4>
      <p class="article-text">${escapeHtml(a.content)}</p>
    </div>`;
  }

  function renderArticles(articles){
    currentArticles = articles;
    articleListEl.innerHTML = articles.length
      ? articles.map(articleCardHtml).join('')
      : '<p class="empty-note">Aucun article pour l\'instant.</p>';
  }

  async function refreshArticles(){
    if(!dbClient){
      articleListEl.innerHTML = '<p class="empty-note">Base de données non configurée : vérifie le fichier supabase_access.txt.</p>';
      return;
    }
    const articles = await loadArticles();
    renderArticles(articles);
  }

  // ---------- Admin : ajout / édition / suppression d'article ----------
  const articleModal = document.getElementById('article-modal');
  const articleModalClose = document.getElementById('article-modal-close');
  const articleModalTitle = document.getElementById('article-modal-title');
  const articleForm = document.getElementById('article-form');
  const articleFormStatus = document.getElementById('article-form-status');
  const articleFormSubmit = document.getElementById('article-form-submit');

  function todayIso(){
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0,10);
  }

  function openArticleModal(article){
    articleForm.reset();
    articleFormStatus.textContent = '';
    articleFormStatus.className = 'status-msg';
    document.getElementById('af-id').value = article ? article.id : '';
    document.getElementById('af-title').value = article ? article.title : '';
    document.getElementById('af-date').value = article ? article.published_at : todayIso();
    document.getElementById('af-content').value = article ? article.content : '';
    articleModalTitle.textContent = article ? 'Modifier l\'article' : 'Ajouter un article';
    articleModal.classList.remove('hidden');
  }
  function closeArticleModal(){ articleModal.classList.add('hidden'); }

  articleModalClose.addEventListener('click', closeArticleModal);
  articleModal.addEventListener('click', (e)=>{ if(e.target === articleModal) closeArticleModal(); });

  addArticleBtn.addEventListener('click', ()=>{
    if(!isAdmin) return;
    openArticleModal(null);
  });

  articleListEl.addEventListener('click', async (e)=>{
    const editBtn = e.target.closest('.edit-article');
    const deleteBtn = e.target.closest('.delete-article');
    if(!isAdmin || (!editBtn && !deleteBtn)) return;

    if(editBtn){
      const article = currentArticles.find(a=>String(a.id) === editBtn.dataset.id);
      if(article) openArticleModal(article);
    }
    if(deleteBtn){
      if(!confirm('Supprimer cet article ?')) return;
      try{
        const { error } = await dbClient.from('articles').delete().eq('id', deleteBtn.dataset.id);
        if(error) throw error;
        await refreshArticles();
      }catch(err){
        console.error(err);
        alert('Erreur lors de la suppression.');
      }
    }
  });

  articleForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const id = document.getElementById('af-id').value;
    const payload = {
      title: document.getElementById('af-title').value.trim(),
      published_at: document.getElementById('af-date').value,
      content: document.getElementById('af-content').value.trim()
    };

    articleFormSubmit.disabled = true;
    articleFormStatus.textContent = 'Enregistrement...';
    articleFormStatus.className = 'status-msg';
    try{
      const { error } = id
        ? await dbClient.from('articles').update(payload).eq('id', id)
        : await dbClient.from('articles').insert([payload]);
      if(error) throw error;
      closeArticleModal();
      await refreshArticles();
    }catch(err){
      console.error(err);
      articleFormStatus.textContent = 'Erreur lors de l\'enregistrement.';
      articleFormStatus.className = 'status-msg err';
    }finally{
      articleFormSubmit.disabled = false;
    }
  });

  (async function initApp(){
    await loadSupabaseConfig();
    if(!dbClient){
      statusMsg.textContent = 'Base de données non configurée : vérifie le fichier supabase_access.txt.';
      statusMsg.className = 'status-msg err';
    }
    refreshGuestList();
    refreshLodgings();
    refreshArticles();
  })();
