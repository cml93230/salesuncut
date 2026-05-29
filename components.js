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
          <span>${fam.name}</span>
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
  `;
  document.head.appendChild(style);

  setActiveNav();
  renderFooter();
  bindCardClicks();
});
