/* =========================================================
   SalesUncut — Composants JS partagés
   Chargé après data.js sur toutes les pages
   ========================================================= */

/* ---------- Render Trading Card ---------- */
function renderCard(c, opts = {}) {
  const compact = opts.compact || false;
  const fam     = SU_DATA.getFamilyById(c.family);
  const level   = c.level || SU_DATA.getLevel(c.score);
  const dims    = SU_DATA.dimensions;

  const statsHtml = dims.map(d => {
    const val  = c.stats[d.key] || 0;
    const pct  = Math.round((val / d.max) * 100);
    return `
      <div class="tcard-stat">
        <span class="lbl">${d.label}</span>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span class="val">${val}</span>
      </div>`;
  }).join('');

  const displayName = c.anonymous ? 'Anonyme' : c.name;
  const rolePrefix = c.role_type ? `<span class="tcard-role">${c.role_type}</span> · ` : '';

  return `
    <div class="tcard ${level} ${compact ? 'sm' : ''}" data-candidate-id="${c.id}">
      <div class="holo"></div>
      <div class="tcard-inner">
        <div class="tcard-header">
          <div>
            <div class="tcard-name">${displayName}</div>
            <div class="tcard-handle">DISPO · ${c.availability}</div>
          </div>
          <div class="tcard-score">${c.score}<small>/100</small></div>
        </div>
        <div class="tcard-portrait">
          <div class="tcard-family-badge">${c.location}</div>
          ${c.photo
            ? `<img class="tcard-photo" src="${c.photo}" alt="${displayName}" loading="lazy">`
            : `<span class="silhouette">${fam.icon}</span>`
          }
          <div class="tcard-rarity-stamp">${level.toUpperCase()}</div>
        </div>
        <div class="tcard-stats">${statsHtml}</div>
        <div class="tcard-footer">
          <span>${rolePrefix}${fam.name}</span>
        </div>
      </div>
    </div>`;
}

/* ---------- Nav : marquer le lien actif ---------- */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop();
    link.classList.toggle('active', href === path);
  });
}

/* ---------- Navigation vers profil au clic carte ---------- */
function bindCardClicks(container) {
  (container || document).addEventListener('click', e => {
    const card = e.target.closest('.tcard');
    if (card && card.dataset.candidateId) {
      window.location.href = `profil.html?id=${card.dataset.candidateId}`;
    }
  });
}

/* ---------- Menu mobile (hamburger + drawer) ---------- */
function setupMobileMenu() {
  const nav = document.querySelector('.nav');
  if (!nav || nav.querySelector('.nav-burger')) return;

  // Bouton hamburger inséré à la fin du nav
  const burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Ouvrir le menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(burger);

  // Drawer (overlay plein écran avec panneau à droite)
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="nav-drawer-inner" role="dialog" aria-label="Menu de navigation">
      <button class="nav-drawer-close" aria-label="Fermer le menu">×</button>
      <a class="nav-drawer-logo" href="index.html"><span class="dot"></span>SalesUncut</a>
      <nav class="nav-drawer-links">
        <a href="index.html">Accueil</a>
        <a href="candidat.html">Pour candidats</a>
        <a href="marketplace.html">Pour recruteurs</a>
        <a href="profil.html?id=c001">Voir un profil</a>
      </nav>
      <div class="nav-drawer-cta">
        <a href="candidat.html" class="btn gold">▶ Passer le test</a>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  // Marquer le lien actif dans le drawer
  const path = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];
  drawer.querySelectorAll('.nav-drawer-links a').forEach(link => {
    const href = link.getAttribute('href').split('/').pop().split('?')[0];
    if (href === path) link.classList.add('active');
  });

  // Toggle helpers
  const open = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-locked');
  };
  const close = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-locked');
  };

  burger.addEventListener('click', open);
  drawer.querySelector('.nav-drawer-close').addEventListener('click', close);
  drawer.addEventListener('click', e => {
    if (e.target === drawer) close();
  });

  // Esc pour fermer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });
}

/* ---------- Charger le footer commun ---------- */
function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <a class="nav-logo" href="index.html" style="color:var(--cream)">
              <span class="dot"></span>SalesUncut
            </a>
            <p style="margin-top:16px;opacity:.7;font-size:14px;max-width:320px;">
              La première marketplace qui certifie les commerciaux par l’oreille, pas par le papier. Made in Nice.
            </p>
          </div>
          <div>
            <h4>Produit</h4>
            <a href="candidat.html">Passer le test</a>
            <a href="marketplace.html">Marketplace</a>
            <a href="profil.html?id=c001">Exemple de profil</a>
          </div>
          <div>
            <h4>Société</h4>
            <a href="#">À propos</a>
            <a href="#">Manifeste</a>
            <a href="#">Contact</a>
          </div>
          <div>
            <h4>Légal</h4>
            <a href="#">CGV</a>
            <a href="#">RGPD</a>
            <a href="#">Mentions légales</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© 2026 SalesUncut · Tous droits réservés</span>
          <span>v0.1 · Nice, FR</span>
        </div>
      </div>
    </footer>`;
}

/* ---------- Init globale ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    .tcard-portrait { position: relative; overflow: hidden; }
    .tcard-photo {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover; object-position: center top;
      display: block;
    }
    .tcard-photo + .tcard-rarity-stamp { z-index: 2; }
    .tcard-family-badge { z-index: 2; }
    .tcard-role {
      font-weight: 800; color: var(--rust, #b34e2a);
      letter-spacing: .08em;
    }
  `;
  document.head.appendChild(style);

  setActiveNav();
  setupMobileMenu();
  renderFooter();
  bindCardClicks();
});
