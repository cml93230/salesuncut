/* SalesUncut — Composants JS partagés */

/* ============ SHORTLIST ============ */
const SU_SHORTLIST = {
  KEY: 'SU_SL_V1',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY)||'[]'); } catch(e){return[];} },
  has(id) { return this.get().includes(id); },
  toggle(id) {
    const l=this.get(); const i=l.indexOf(id);
    if(i>=0) l.splice(i,1); else l.push(id);
    localStorage.setItem(this.KEY,JSON.stringify(l));
    document.dispatchEvent(new CustomEvent('shortlistChanged',{detail:{id,list:l}}));
    return l;
  },
  count() { return this.get().length; },
  getCandidates() { return this.get().map(id=>SU_DATA.candidates.find(c=>c.id===id)).filter(Boolean); },
};

/* ============ COMPARE (modal uniquement — pas de bouton sur les cards) ============ */
const SU_COMPARE = {
  ids: [], MAX: 3,
  has(id) { return this.ids.includes(id); },
  toggle(id) {
    const i=this.ids.indexOf(id);
    if(i>=0){this.ids.splice(i,1); document.dispatchEvent(new CustomEvent('compareChanged')); return true;}
    if(this.ids.length>=this.MAX) return false;
    this.ids.push(id); document.dispatchEvent(new CustomEvent('compareChanged')); return true;
  },
  clear() { this.ids=[]; document.dispatchEvent(new CustomEvent('compareChanged')); },
  count() { return this.ids.length; },
  getCandidates() { return this.ids.map(id=>SU_DATA.candidates.find(c=>c.id===id)).filter(Boolean); },
};

/* ============ POOL NAVIGATION ============ */
function navigateWithPool(candidateId, poolIds) {
  try { sessionStorage.setItem('SU_POOL', JSON.stringify(poolIds)); } catch(e){}
  window.location.href = 'profil.html?id=' + candidateId;
}
function getPoolFromSession() {
  try { return JSON.parse(sessionStorage.getItem('SU_POOL')||'[]'); } catch(e){return[];}
}

/* ============ RENDER CARD ============ */
function renderCard(c, opts) {
  opts = opts || {};
  const compact = opts.compact || false;
  const fam   = SU_DATA.getFamilyById(c.family);
  const level = c.level || SU_DATA.getLevel(c.score);
  const dims  = SU_DATA.dimensions;
  const isImm = c.availability === 'Immédiat';
  const name  = c.anonymous ? 'Anonyme' : c.name;
  const rolePrefix = c.role_type ? '<span class="tcard-role">' + c.role_type + '</span> · ' : '';
  const inSL  = SU_SHORTLIST.has(c.id);

  const stats = dims.map(d => {
    const v=c.stats[d.key]||0; const p=Math.round(v/d.max*100);
    return '<div class="tcard-stat"><span class="lbl">' + d.label + '</span><div class="bar"><i style="width:' + p + '%"></i></div><span class="val">' + v + '</span></div>';
  }).join('');

  const photo = c.photo
    ? '<img class="tcard-photo" src="' + c.photo + '" alt="' + name + '" loading="lazy">'
    : '<span class="silhouette">' + fam.icon + '</span>';

  // Bouton shortlist positionné en bas-gauche de la photo
  const slBtn = '<button class="tcard-sl-btn' + (inSL ? ' active' : '') + '" data-id="' + c.id + '">'
    + (inSL ? '\u2713 SHORTLIST' : '+ SHORTLIST')
    + '</button>';

  return '<div class="tcard ' + level + (compact?' sm':'') + '" data-candidate-id="' + c.id + '">'
    + '<div class="holo"></div>'
    + '<div class="tcard-inner">'
    + '<div class="tcard-header">'
    +   '<div><div class="tcard-name">' + name + '</div>'
    +   '<div class="tcard-handle">' + (isImm ? '<span class="dispo-dot"></span>' : '') + 'DISPO · ' + c.availability + '</div></div>'
    +   '<div class="tcard-score">' + c.score + '<small>/100</small></div>'
    + '</div>'
    + '<div class="tcard-portrait">'
    +   '<div class="tcard-family-badge">' + c.location + '</div>'
    +   photo
    +   '<div class="tcard-rarity-stamp">' + level.toUpperCase() + '</div>'
    +   slBtn
    + '</div>'
    + '<div class="tcard-stats">' + stats + '</div>'
    + '<div class="tcard-footer"><span>' + rolePrefix + fam.name + '</span></div>'
    + '</div></div>';
}

/* ============ COMPARE BAR ============ */
function updateCompareBar() {
  let bar = document.getElementById('su-compare-bar');
  const count = SU_COMPARE.count();
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'su-compare-bar';
    bar.className = 'su-compare-bar';
    document.body.appendChild(bar);
  }
  if (count === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const cands = SU_COMPARE.getCandidates();
  const thumbs = cands.map(c => {
    const n = (c.anonymous ? 'Anonyme' : c.name).split(' ')[0];
    const img = c.photo ? '<img src="' + c.photo + '" alt="">' : '<span>' + n[0] + '</span>';
    return '<div class="cbar-thumb">' + img + '<div class="cbar-tname">' + n + '</div></div>';
  }).join('');
  bar.innerHTML = '<div class="cbar-left"><span class="cbar-count">' + count + '</span><span class="cbar-lbl"> en comparaison</span></div>'
    + '<div class="cbar-thumbs">' + thumbs + '</div>'
    + (count >= 2 ? '<button class="cbar-btn" onclick="openCompareModal()">Comparer ✦</button>' : '<span class="cbar-hint">Ajoute ' + (2-count) + ' profil de plus</span>')
    + '<button class="cbar-clear" onclick="SU_COMPARE.clear()">✕</button>';
}

function openCompareModal() {
  const cands = SU_COMPARE.getCandidates();
  if (cands.length < 2) return;
  let modal = document.getElementById('su-cmp-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'su-cmp-modal';
    modal.className = 'su-cmp-modal';
    document.body.appendChild(modal);
  }
  const dims = SU_DATA.dimensions;
  const col = c => {
    const fam = SU_DATA.getFamilyById(c.family);
    const name = c.anonymous ? 'Anonyme' : c.name;
    const level = c.level || SU_DATA.getLevel(c.score);
    const photo = c.photo
      ? '<img src="' + c.photo + '" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:2px solid var(--gold)">'
      : '<div style="width:80px;height:80px;border-radius:50%;background:var(--cream-3);display:flex;align-items:center;justify-content:center;font-size:32px">' + fam.icon + '</div>';
    const bars = dims.map(d => {
      const v=c.stats[d.key]||0; const p=Math.round(v/d.max*100);
      return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-3)">' + d.label + '</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--gold-deep);font-weight:700">' + v + '/' + d.max + '</span></div><div style="height:4px;background:var(--cream-3);border-radius:2px;overflow:hidden"><div style="width:' + p + '%;height:100%;background:var(--gold-deep);border-radius:2px"></div></div></div>';
    }).join('');
    return '<div class="cmp-col">'
      + '<div style="text-align:center;margin-bottom:20px">' + photo
      + '<div style="font-family:var(--font-display);font-weight:900;font-size:20px;text-transform:uppercase;margin-top:10px">' + name + '</div>'
      + '<div style="display:inline-block;background:var(--ink);color:var(--gold);font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;padding:4px 10px;border-radius:4px;margin-top:4px">' + level.toUpperCase() + ' · ' + c.score + '/100</div>'
      + '<div style="font-family:var(--font-mono);font-size:10px;color:var(--teal-3);margin-top:8px">' + fam.name + ' · ' + c.location + '</div></div>'
      + '<div style="margin-bottom:16px">' + bars + '</div>'
      + '<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-3);margin-bottom:6px">Points forts</div>'
      + (c.strengths||[]).map(s => '<div style="font-size:13px;color:var(--teal-2);padding:5px 0;border-bottom:1px dashed var(--cream-3)">→ ' + s + '</div>').join('')
      + '<div style="margin-top:16px"><a href="profil.html?id=' + c.id + '" style="display:block;text-align:center;background:var(--gold-deep);color:var(--cream);font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px;border-radius:4px;text-decoration:none">Voir le profil complet →</a></div>'
      + '</div>';
  };
  modal.innerHTML = '<div class="cmp-overlay" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'"></div>'
    + '<div class="cmp-inner">'
    + '<div class="cmp-header"><div style="font-family:var(--font-display);font-weight:900;font-size:24px;text-transform:uppercase">Comparaison</div><button class="cmp-close" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'">✕</button></div>'
    + '<div class="cmp-cols">' + cands.map(col).join('') + '</div>'
    + '</div>';
  modal.style.display = 'flex';
}

/* ============ NAV ============ */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href').split('/').pop() === path);
  });
}

function setupMobileMenu() {
  const nav = document.querySelector('.nav');
  if (!nav || nav.querySelector('.nav-burger')) return;
  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Ouvrir le menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(burger);
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer'; drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML = '<div class="nav-drawer-inner" role="dialog">'
    + '<button class="nav-drawer-close" aria-label="Fermer le menu">×</button>'
    + '<a class="nav-drawer-logo" href="index.html"><span class="dot"></span>SalesUncut</a>'
    + '<nav class="nav-drawer-links"><a href="index.html">Accueil</a><a href="candidat.html">Pour candidats</a><a href="marketplace.html">Pour recruteurs</a><a href="profil.html?id=c001">Voir un profil</a></nav>'
    + '<div class="nav-drawer-cta"><a href="candidat.html" class="btn gold">▶ Passer le test</a></div>'
    + '</div>';
  document.body.appendChild(drawer);
  const path = (window.location.pathname.split('/').pop()||'index.html').split('?')[0];
  drawer.querySelectorAll('.nav-drawer-links a').forEach(a => {
    if (a.getAttribute('href').split('/').pop().split('?')[0] === path) a.classList.add('active');
  });
  const open  = () => { drawer.classList.add('open'); burger.setAttribute('aria-expanded','true'); document.body.classList.add('nav-locked'); };
  const close = () => { drawer.classList.remove('open'); burger.setAttribute('aria-expanded','false'); document.body.classList.remove('nav-locked'); };
  burger.addEventListener('click', open);
  drawer.querySelector('.nav-drawer-close').addEventListener('click', close);
  drawer.addEventListener('click', e => { if(e.target===drawer) close(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') close(); });
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = '<footer class="footer"><div class="container"><div class="footer-grid">'
    + '<div><a class="nav-logo" href="index.html" style="color:var(--cream)"><span class="dot"></span>SalesUncut</a><p style="margin-top:16px;opacity:.7;font-size:14px;max-width:320px">La premiere marketplace qui certifie les commerciaux par l\'oreille, pas par le papier. Made in Nice.</p></div>'
    + '<div><h4>Produit</h4><a href="candidat.html">Passer le test</a><a href="marketplace.html">Marketplace</a><a href="profil.html?id=c001">Exemple de profil</a></div>'
    + '<div><h4>Société</h4><a href="#">À propos</a><a href="#">Manifeste</a><a href="#">Contact</a></div>'
    + '<div><h4>Légal</h4><a href="#">CGV</a><a href="#">RGPD</a><a href="#">Mentions légales</a></div>'
    + '</div><div class="footer-bottom"><span>© 2026 SalesUncut · Tous droits réservés</span><span>v0.1 · Nice, FR</span></div></div></footer>';
}

/* ============ INIT ============ */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .tcard { position: relative; }
    .tcard-portrait { position: relative; overflow: hidden; }
    .tcard-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; }
    .tcard-photo + .tcard-rarity-stamp, .tcard-family-badge { z-index: 2; }
    .tcard-role { font-weight: 800; color: var(--rust); letter-spacing: .08em; }

    /* Bouton shortlist — bas-gauche de la photo */
    .tcard-sl-btn {
      position: absolute;
      bottom: 10px;
      left: 10px;
      z-index: 10;
      background: rgba(255,248,231,.92);
      color: var(--ink);
      font-family: var(--font-mono);
      font-size: 8px;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      padding: 5px 10px;
      border-radius: 3px;
      border: 1.5px solid rgba(26,34,34,.15);
      cursor: pointer;
      transition: all .2s;
      backdrop-filter: blur(4px);
      white-space: nowrap;
      line-height: 1;
    }
    .tcard-sl-btn:hover {
      background: var(--ink);
      color: var(--cream);
      border-color: var(--ink);
    }
    .tcard-sl-btn.active {
      background: var(--rust);
      color: var(--cream);
      border-color: var(--rust);
    }

    /* Pastille dispo immédiate */
    .dispo-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 4px; vertical-align: middle; animation: pulse-dot 1.6s ease-in-out infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

    /* Compare bar */
    .su-compare-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 300; background: var(--ink); color: var(--cream); padding: 14px 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 -4px 24px rgba(26,34,34,.4); }
    .cbar-count { font-family: var(--font-display); font-weight: 900; font-size: 28px; color: var(--gold); line-height: 1; }
    .cbar-lbl { font-family: var(--font-mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,248,231,.5); }
    .cbar-thumbs { display: flex; gap: 8px; flex: 1; }
    .cbar-thumb { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .cbar-thumb img, .cbar-thumb span { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--gold); object-fit: cover; background: var(--teal); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .cbar-tname { font-family: var(--font-mono); font-size: 8px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,248,231,.5); }
    .cbar-btn { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 10px 20px; border-radius: 4px; border: none; background: var(--gold-deep); color: var(--cream); cursor: pointer; transition: background .2s; white-space: nowrap; }
    .cbar-btn:hover { background: var(--gold-glow); }
    .cbar-hint { font-family: var(--font-mono); font-size: 10px; color: rgba(255,248,231,.4); white-space: nowrap; }
    .cbar-clear { width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid rgba(255,248,231,.2); background: transparent; color: rgba(255,248,231,.5); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0; }
    .cbar-clear:hover { border-color: var(--cream); color: var(--cream); }

    /* Compare modal */
    .su-cmp-modal { position: fixed; inset: 0; z-index: 500; display: flex; align-items: center; justify-content: center; }
    .cmp-overlay { position: absolute; inset: 0; background: rgba(26,34,34,.7); backdrop-filter: blur(8px); }
    .cmp-inner { position: relative; z-index: 2; background: var(--cream); border-radius: 12px; max-width: min(960px, 94vw); width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(26,34,34,.5); }
    .cmp-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--cream-3); }
    .cmp-close { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--cream-3); background: var(--cream-2); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
    .cmp-close:hover { background: var(--ink); color: var(--cream); }
    .cmp-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 0; }
    .cmp-col { padding: 24px 28px; border-right: 1px solid var(--cream-3); }
    .cmp-col:last-child { border-right: none; }
    @media(max-width:600px){ .su-compare-bar { flex-wrap: wrap; gap: 10px; } .cbar-thumbs { order: -1; } }
  `;
  document.head.appendChild(style);

  setActiveNav();
  setupMobileMenu();
  renderFooter();

  // Délégation de clics
  document.addEventListener('click', e => {
    // Shortlist
    const slBtn = e.target.closest('.tcard-sl-btn');
    if (slBtn) {
      e.stopPropagation();
      const id = slBtn.dataset.id;
      SU_SHORTLIST.toggle(id);
      const isNow = SU_SHORTLIST.has(id);
      // Mettre à jour tous les boutons de cette card
      document.querySelectorAll('.tcard-sl-btn[data-id="' + id + '"]').forEach(b => {
        b.classList.toggle('active', isNow);
        b.textContent = isNow ? '\u2713 SHORTLIST' : '+ SHORTLIST';
      });
      // Mettre à jour le compteur dans le tab marketplace
      const slCount = document.getElementById('sl-count');
      if (slCount) slCount.textContent = SU_SHORTLIST.count() || '';
      return;
    }

    // Navigation vers le profil (clic sur la card)
    const card = e.target.closest('.tcard');
    if (card && card.dataset.candidateId) {
      const allCards = [...document.querySelectorAll('.tcard[data-candidate-id]')];
      const poolIds  = allCards.map(c => c.dataset.candidateId);
      navigateWithPool(card.dataset.candidateId, poolIds);
    }
  });

  document.addEventListener('compareChanged', updateCompareBar);
});
