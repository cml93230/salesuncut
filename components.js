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

/* ============ VS COMPARE (2 fixes, shortlist uniquement) ============ */
const SU_VS = {
  selected: [],
  MAX: 2,
  toggle(id) {
    const i = this.selected.indexOf(id);
    if (i >= 0) { this.selected.splice(i, 1); }
    else if (this.selected.length < this.MAX) { this.selected.push(id); }
    else { return false; }
    document.dispatchEvent(new CustomEvent('vsChanged', { detail: { selected: [...this.selected] } }));
    return true;
  },
  has(id) { return this.selected.indexOf(id) >= 0; },
  clear() { this.selected = []; document.dispatchEvent(new CustomEvent('vsChanged')); },
  count() { return this.selected.length; },
  getSelected() {
    return this.selected.map(id => SU_DATA.candidates.find(c => c.id === id)).filter(Boolean);
  }
};

/* ============ VS : bouton Comparer visible sur chaque carte shortlist ============ */
function refreshVSBtns(container) {
  container.querySelectorAll('.tcard[data-candidate-id]').forEach(card => {
    const id = card.dataset.candidateId;
    let btn = card.querySelector('.vs-compare-btn');
    if (!btn) return; // bouton injecté par renderCard en mode shortlist
    const isSelected = SU_VS.has(id);
    const isMaxed = SU_VS.count() >= SU_VS.MAX;
    btn.classList.toggle('selected', isSelected);
    btn.disabled = !isSelected && isMaxed;
    btn.textContent = isSelected ? '✓ Sélectionné' : 'Comparer';
  });
}

/* ============ VS MODAL — premium redesign ============ */
function openVSModal() {
  const cands = SU_VS.getSelected();
  if (cands.length < 2) return;
  const a = cands[0], b = cands[1];
  const dims = SU_DATA.dimensions;
  const CA = '#b8922a';
  const CB = '#1a2222';
  const CA_LIGHT = '#fdf3e0';
  const CB_LIGHT = '#f2ede4';
  const nameA = a.anonymous ? 'Anonyme' : a.name;
  const nameB = b.anonymous ? 'Anonyme' : b.name;
  const shortA = nameA.split(' ')[0];
  const shortB = nameB.split(' ')[0];
  const famA = SU_DATA.getFamilyById(a.family);
  const famB = SU_DATA.getFamilyById(b.family);
  const lvA = (a.level || SU_DATA.getLevel(a.score)).toUpperCase();
  const lvB = (b.level || SU_DATA.getLevel(b.score)).toUpperCase();
  const diff = a.score - b.score;
  const dimsA = dims.filter(d => (a.stats[d.key]||0) > (b.stats[d.key]||0));
  const dimsB = dims.filter(d => (b.stats[d.key]||0) > (a.stats[d.key]||0));

  const avatarA = a.photo
    ? '<img src="'+a.photo+'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid '+CA+';box-shadow:0 4px 16px '+CA+'44;">'
    : '<div style="width:80px;height:80px;border-radius:50%;background:'+CA_LIGHT+';display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:'+CA+';border:3px solid '+CA+';font-family:var(--font-display)">'+nameA.slice(0,2).toUpperCase()+'</div>';
  const avatarB = b.photo
    ? '<img src="'+b.photo+'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center top;border:3px solid '+CB+';box-shadow:0 4px 16px rgba(26,34,34,.2);">'
    : '<div style="width:80px;height:80px;border-radius:50%;background:'+CB_LIGHT+';display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:'+CB+';border:3px solid '+CB+';font-family:var(--font-display)">'+nameB.slice(0,2).toUpperCase()+'</div>';

  const topDiffDim = dims.slice().sort((x,y) => Math.abs((b.stats[y.key]||0)-(a.stats[y.key]||0)) - Math.abs((b.stats[x.key]||0)-(a.stats[x.key]||0)))[0];
  const topDiff = topDiffDim ? Math.abs((a.stats[topDiffDim.key]||0)-(b.stats[topDiffDim.key]||0)) : 0;
  const topWinner = topDiffDim && (a.stats[topDiffDim.key]||0) >= (b.stats[topDiffDim.key]||0) ? shortA : shortB;
  const topColor = topWinner === shortA ? CA : CB;
  const closeCount = dims.filter(d => Math.abs((a.stats[d.key]||0)-(b.stats[d.key]||0)) <= 1).length;

  let summaryText = '';
  if (Math.abs(diff) > 10) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB, wl=(diff>0?dimsA:dimsB).length;
    summaryText = '<span style="color:'+wc+';font-weight:900">'+wn+'</span> mène de '+Math.abs(diff)+' points — avantage sur '+wl+'/6 dimensions.';
  } else if (Math.abs(diff) > 3) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB;
    summaryText = '<span style="color:'+wc+'">'+wn+'</span> légèrement devant (+'+Math.abs(diff)+' pts). Le contexte du poste doit trancher.';
  } else if (diff !== 0) {
    summaryText = 'Profils très proches ('+Math.abs(diff)+' pt'+(Math.abs(diff)>1?'s':'')+' d\'écart). Chaque dimension compte pour départager.';
  } else {
    summaryText = 'Scores à égalité parfaite. Départager sur le terrain et la culture d\'équipe.';
  }

  function buildContextCard(c, color, colorLight, dimsWon) {
    const hunt = c.hunting_pct || 50;
    const short = (c.anonymous ? 'Anonyme' : c.name).split(' ')[0];
    const famC = SU_DATA.getFamilyById(c.family);
    const items = [];
    if (hunt >= 75) items.push('Pure outbound — chasse <strong>'+hunt+'%</strong>');
    else if (hunt >= 50) items.push('Profil mixte — chasse <strong>'+hunt+'%</strong> / fidél. '+(100-hunt)+'%');
    else items.push('Profil <strong>farming</strong>/AM — '+hunt+'% chasse');
    if (c.deal_size) items.push('Tickets moyens <strong>'+c.deal_size+'</strong>');
    if (c.sales_cycle) items.push('Cycle <strong>'+c.sales_cycle+'</strong>');
    if (c.experience_years) items.push('<strong>'+c.experience_years+' ans</strong> d\'expérience');
    items.push('Expertise <strong>'+famC.name+'</strong>');
    const domStr = dimsWon.length > 0 ? dimsWon.map(d=>d.label).join(' · ') : 'Aucune supériorité nette';
    return '<div style="background:'+colorLight+';border:1.5px solid '+color+'28;border-radius:12px;overflow:hidden">'
      +'<div style="background:'+color+';padding:10px 14px;display:flex;align-items:center;justify-content:space-between">'
        +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.9);font-weight:700">Recruter '+short+' si…</div>'
        +(dimsWon.length > 0 ? '<div style="font-family:var(--font-mono);font-size:8px;color:rgba(255,255,255,.65);letter-spacing:.06em">'+dimsWon.length+' dim. fortes</div>' : '')
      +'</div>'
      +'<div style="padding:12px 14px">'
        +items.map(t=>'<div style="font-size:12px;color:#333;padding:5px 0;border-bottom:1px solid '+color+'15;line-height:1.5;display:flex;align-items:flex-start;gap:6px"><span style="color:'+color+';margin-top:1px;flex-shrink:0">›</span><span>'+t+'</span></div>').join('')
        +'<div style="margin-top:10px;padding-top:8px">'
          +'<div style="font-family:var(--font-mono);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:'+color+';opacity:.6;margin-bottom:4px">Dimensions fortes</div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;color:'+color+';font-weight:700;line-height:1.4">'+domStr+'</div>'
        +'</div>'
      +'</div>'
    +'</div>';
  }

  let finalReco = '';
  if (Math.abs(diff) > 5) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB, on2=diff>0?shortB:shortA, oc=diff>0?CB:CA;
    finalReco = '<span style="color:'+wc+';font-weight:700">'+wn+'</span> est le choix naturel pour un poste généraliste. Envisager <span style="color:'+oc+'">'+on2+'</span> si le profil sectoriel prime sur la performance orale.';
  } else if (diff !== 0) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB;
    finalReco = 'Avantage marginal pour <span style="color:'+wc+';font-weight:700">'+wn+'</span>. Complétez avec un entretien structuré ou un second test SalesUncut sur un autre scénario.';
  } else {
    finalReco = 'Profils équivalents sur les critères SalesUncut. La décision appartient au manager sur la base du feeling terrain et de la culture d\'équipe.';
  }

  const gaugeColsHTML = dims.map((d, i) => {
    const va=a.stats[d.key]||0, vb=b.stats[d.key]||0;
    const pctA=Math.round(va/d.max*100), pctB=Math.round(vb/d.max*100);
    const d2=va-vb;
    const winner = d2 > 0 ? 'A' : d2 < 0 ? 'B' : null;
    const deltaBg = winner==='A' ? CA : winner==='B' ? CB : '#d8d2c8';
    const deltaTxt = d2>0 ? '+'+d2 : d2<0 ? String(d2) : '=';
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px">'
      +'<div style="font-size:7.5px;color:#999;font-family:var(--font-mono);text-align:center;line-height:1.25;min-height:22px;display:flex;align-items:flex-end;justify-content:center;letter-spacing:.08em;text-transform:uppercase;padding:0 2px">'+d.label+'</div>'
      +'<div style="display:flex;gap:4px;align-items:flex-end;height:100px">'
        +'<div style="width:20px;background:#ede8df;border-radius:4px 4px 2px 2px;height:100px;position:relative;overflow:hidden"><div class="vs-gauge-fill" data-h="'+pctA+'" style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,'+CA+','+CA+'bb);border-radius:3px 3px 0 0;height:0;transition:height .9s cubic-bezier(.4,0,.2,1) '+(i*60)+'ms"></div></div>'
        +'<div style="width:20px;background:#ede8df;border-radius:4px 4px 2px 2px;height:100px;position:relative;overflow:hidden"><div class="vs-gauge-fill" data-h="'+pctB+'" style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,'+CB+',#444);border-radius:3px 3px 0 0;height:0;transition:height .9s cubic-bezier(.4,0,.2,1) '+(i*60+30)+'ms"></div></div>'
      +'</div>'
      +'<div style="display:flex;gap:4px;justify-content:center">'
        +'<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:'+CA+'">'+va+'</span>'
        +'<span style="font-family:var(--font-mono);font-size:8px;color:#ccc">/</span>'
        +'<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:'+CB+'">'+vb+'</span>'
      +'</div>'
      +'<div style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:20px;font-family:var(--font-mono);background:'+deltaBg+';color:#fff8e7;min-width:24px;text-align:center">'+deltaTxt+'</div>'
    +'</div>';
  }).join('');

  const existing = document.getElementById('su-vs-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'su-vs-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 16px 40px;box-sizing:border-box';

  modal.innerHTML =
    '<div onclick="document.getElementById(\'su-vs-modal\').remove()" style="position:fixed;inset:0;background:rgba(8,8,12,.82);backdrop-filter:blur(14px);z-index:-1"></div>'
    +'<div style="background:#faf6ee;border-radius:20px;width:100%;max-width:840px;box-shadow:0 48px 120px rgba(0,0,0,.40),0 0 0 1px rgba(0,0,0,.06);position:relative;margin:auto;overflow:hidden">'

    +'<button onclick="document.getElementById(\'su-vs-modal\').remove()" style="position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;border:1.5px solid #ddd6c4;background:#fff;color:#999;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;line-height:1;transition:all .2s;font-family:monospace">✕</button>'

    +'<div style="display:grid;grid-template-columns:1fr 56px 1fr">'
      +'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px 20px;gap:10px;background:'+CA_LIGHT+'">'
        +avatarA
        +'<div style="text-align:center">'
          +'<div style="font-family:var(--font-display);font-weight:900;font-size:15px;color:#1a2222;text-transform:uppercase;letter-spacing:-.01em;line-height:1.2">'+nameA+'</div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;color:#999;margin-top:3px">'+famA.name+' · '+a.location+'</div>'
        +'</div>'
        +'<div style="font-family:var(--font-display);font-weight:900;font-size:42px;color:'+CA+';line-height:1;letter-spacing:-.03em">'+a.score+'<span style="font-size:14px;color:'+CA+'88;font-weight:500;letter-spacing:0">/100</span></div>'
        +'<div style="background:'+CA+';color:#fff8e7;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.14em;padding:4px 12px;border-radius:20px">'+lvA+'</div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;justify-content:center;background:#faf6ee;border-left:1px solid #e8dfc8;border-right:1px solid #e8dfc8">'
        +'<div style="font-family:var(--font-mono);font-size:11px;font-weight:900;color:#ccc4b0;letter-spacing:.2em;writing-mode:vertical-rl;transform:rotate(180deg)">VS</div>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px 20px;gap:10px;background:'+CB_LIGHT+'">'
        +avatarB
        +'<div style="text-align:center">'
          +'<div style="font-family:var(--font-display);font-weight:900;font-size:15px;color:#1a2222;text-transform:uppercase;letter-spacing:-.01em;line-height:1.2">'+nameB+'</div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;color:#888;margin-top:3px">'+famB.name+' · '+b.location+'</div>'
        +'</div>'
        +'<div style="font-family:var(--font-display);font-weight:900;font-size:42px;color:'+CB+';line-height:1;letter-spacing:-.03em">'+b.score+'<span style="font-size:14px;color:#88827a;font-weight:500;letter-spacing:0">/100</span></div>'
        +'<div style="background:'+CB+';color:#fff8e7;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.14em;padding:4px 12px;border-radius:20px">'+lvB+'</div>'
      +'</div>'
    +'</div>'

    +'<div style="padding:16px 28px 16px;background:#faf6ee">'
      +'<div style="background:#fff;border:1.5px solid #e8dfc8;border-radius:14px;padding:20px;position:relative;box-shadow:inset 0 1px 3px rgba(0,0,0,.03)">'
        +'<div style="position:absolute;top:-1px;left:50%;transform:translateX(-50%);background:#fff;padding:0 12px">'
          +'<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c8bea0;letter-spacing:.22em;text-transform:uppercase;white-space:nowrap">Radar superposé</span>'
        +'</div>'
        +'<div style="display:flex;justify-content:center;align-items:center"><canvas id="vs-modal-radar" width="320" height="240" style="display:block"></canvas></div>'
        +'<div style="display:flex;justify-content:center;gap:20px;margin-top:10px">'
          +'<span style="display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:9px;color:#888"><span style="width:18px;height:2.5px;border-radius:2px;background:'+CA+';display:inline-block"></span>'+shortA+'</span>'
          +'<span style="display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:9px;color:#888"><span style="width:18px;height:2.5px;border-radius:2px;background:'+CB+';display:inline-block"></span>'+shortB+'</span>'
        +'</div>'
      +'</div>'
    +'</div>'

    +'<div style="padding:0 24px 24px;background:#faf6ee">'
      +'<div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#c8bea0;letter-spacing:.22em;text-transform:uppercase;text-align:center;margin-bottom:16px">Scores par dimension</div>'
      +'<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;align-items:end">'+gaugeColsHTML+'</div>'
    +'</div>'

    +'<div style="background:#fff;border-top:1.5px solid #e8dfc8;padding:28px">'
      +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'
        +'<div style="width:3px;height:18px;background:'+CA+';border-radius:2px;flex-shrink:0"></div>'
        +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:'+CA+';font-weight:700">Verdict</div>'
      +'</div>'
      +'<div style="font-family:var(--font-display);font-weight:900;font-size:clamp(14px,1.8vw,19px);text-transform:uppercase;color:#1a2222;margin-bottom:22px;line-height:1.35">'+summaryText+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">'
        +buildContextCard(a, CA, CA_LIGHT, dimsA)
        +buildContextCard(b, CB, CB_LIGHT, dimsB)
      +'</div>'
      +'<div style="background:#faf6ee;border:1.5px solid #e8dfc8;border-radius:10px;padding:16px;margin-bottom:20px">'
        +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'
          +'<div style="width:2px;height:14px;background:#c8bea0;border-radius:2px;flex-shrink:0"></div>'
          +'<div style="font-family:var(--font-mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:#b0a080;font-weight:700">Recommandation recruteur</div>'
        +'</div>'
        +'<div style="font-size:13px;color:#444;line-height:1.65">'+finalReco+'</div>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        +'<a href="profil.html?id='+a.id+'" style="display:flex;align-items:center;justify-content:center;gap:8px;background:'+CA+';color:#fff8e7;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:13px 16px;border-radius:10px;text-decoration:none"><span>Profil de '+shortA+'</span><span style="opacity:.7">→</span></a>'
        +'<a href="profil.html?id='+b.id+'" style="display:flex;align-items:center;justify-content:center;gap:8px;background:'+CB+';color:#fff8e7;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:13px 16px;border-radius:10px;text-decoration:none"><span>Profil de '+shortB+'</span><span style="opacity:.7">→</span></a>'
      +'</div>'
    +'</div>'

    // ══ ANALYSE PAR DIMENSION ══
    +(()=>{
      const daA=SU_DATA.dimAnalysis&&SU_DATA.dimAnalysis[a.id];
      const daB=SU_DATA.dimAnalysis&&SU_DATA.dimAnalysis[b.id];
      if(!daA||!daB)return'';
      return '<div style="background:#fff;border-top:1.5px solid #e8dfc8">'
        +'<div style="padding:20px 28px 0;display:flex;align-items:center;gap:10px">'
          +'<div style="width:3px;height:18px;background:#c8bea0;border-radius:2px;flex-shrink:0"></div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:#b0a080;font-weight:700">Analyse par dimension</div>'
        +'</div>'
        +dims.map(d=>{
          const tA=daA[d.key]||'',tB=daB[d.key]||'';
          if(!tA&&!tB)return'';
          const scA=a.stats[d.key]||0,scB=b.stats[d.key]||0;
          return'<div>'
            +'<div style="background:#faf6ee;padding:7px 28px;margin-top:14px;border-top:1px solid #eee8da;display:flex;align-items:center;gap:10px">'
              +'<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#1a2222">'+d.label+'</span>'
              +'<span style="font-family:var(--font-mono);font-size:8px;color:#c8bea0;background:#ede8df;padding:1px 6px;border-radius:10px">'+scA+'/'+d.max+' · '+scB+'/'+d.max+'</span>'
            +'</div>'
            +'<div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #f4efe6">'
              +'<div style="padding:12px 18px 14px 28px;border-right:1.5px solid #f4efe6">'
                +'<div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:'+CA+';letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px">'+shortA+'</div>'
                +'<div style="font-size:12px;color:#444;line-height:1.65">'+tA+'</div>'
              +'</div>'
              +'<div style="padding:12px 28px 14px 18px">'
                +'<div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:'+CB+';letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px">'+shortB+'</div>'
                +'<div style="font-size:12px;color:#444;line-height:1.65">'+tB+'</div>'
              +'</div>'
            +'</div>'
          +'</div>';
        }).join('')
        +'<div style="height:20px"></div>'
      +'</div>';
    })()

    +'</div>';

  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    setTimeout(() => {
      modal.querySelectorAll('.vs-gauge-fill').forEach(el => {
        el.style.height = el.dataset.h + '%';
      });
    }, 80);
  });

  function initRadar() {
    const canvas = document.getElementById('vs-modal-radar');
    if (!canvas || !window.Chart) return;
    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: dims.map(d => d.label),
        datasets: [
          {
            label: shortA,
            data: dims.map(d => Math.round((a.stats[d.key]||0) / d.max * 100)),
            borderColor: CA, backgroundColor: CA+'1a',
            borderWidth: 2.5, pointBackgroundColor: CA, pointRadius: 4,
            pointBorderColor: '#faf6ee', pointBorderWidth: 1.5,
            borderDash: []
          },
          {
            label: shortB,
            data: dims.map(d => Math.round((b.stats[d.key]||0) / d.max * 100)),
            borderColor: CB, backgroundColor: 'rgba(26,34,34,0.06)',
            borderWidth: 2.5, pointBackgroundColor: CB, pointRadius: 4,
            pointBorderColor: '#faf6ee', pointBorderWidth: 1.5,
            borderDash: []
          }
        ]
      },
      options: {
        responsive: false,
        animation: { duration: 1000, easing: 'easeInOutQuart' },
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: {
              stepSize: 25,
              font: { size: 8 },
              color: '#c8bea0',
              backdropColor: 'transparent',
              callback: function(value) {
                return (value === 25 || value === 50 || value === 100) ? '' : value;
              }
            },
            grid: { color: '#ddd8cc' },
            angleLines: { color: '#ddd8cc' },
            pointLabels: { font: { size: 10.5, weight: '600' }, color: '#555' }
          }
        }
      }
    });
  }

  if (window.Chart) {
    initRadar();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = initRadar;
    document.head.appendChild(s);
  }

  let vsAudio = null;
  modal.querySelectorAll('.vs-audio-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cid=btn.dataset.cid, dim=btn.dataset.dim, color=btn.dataset.color;
      if (vsAudio) {
        vsAudio.pause(); vsAudio.currentTime=0; vsAudio=null;
        modal.querySelectorAll('.vs-audio-btn').forEach(b=>{ b.innerHTML='▶'; b.style.background=b.dataset.color===CA?CA_LIGHT:CB_LIGHT; });
      }
      const audio = new Audio('/audio/'+cid+'_'+dim+'.mp3');
      audio.addEventListener('error', ()=>{ btn.innerHTML='—'; btn.disabled=true; btn.style.opacity='.35'; }, {once:true});
      audio.addEventListener('playing', ()=>{ vsAudio=audio; btn.innerHTML='⏸'; btn.style.background=color; btn.style.color='#fff8e7'; }, {once:true});
      audio.onended = ()=>{ btn.innerHTML='▶'; btn.style.background=cid===a.id?CA_LIGHT:CB_LIGHT; btn.style.color=cid===a.id?CA:CB; vsAudio=null; };
      audio.play().catch(()=>{});
    });
  });
}

/* ============ COMPARE BAR (legacy) ============ */
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
  const showCompareBtn = opts.showCompareBtn || false;
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
  const slBtn = '<button class="tcard-sl-btn' + (inSL ? ' active' : '') + '" data-id="' + c.id + '">'
    + (inSL ? '✓ SHORTLIST' : '+ SHORTLIST') + '</button>';
  // Bouton Comparer — visible uniquement en mode shortlist, positionné en bas de carte
  const isVS = SU_VS.has(c.id);
  const compareBtn = showCompareBtn
    ? '<button class="vs-compare-btn' + (isVS ? ' selected' : '') + '" data-id="' + c.id + '">' + (isVS ? '✓ Sélectionné' : 'Comparer') + '</button>'
    : '';
  return '<div class="tcard ' + level + (compact?' sm':'') + '" data-candidate-id="' + c.id + '">'
    + '<div class="holo"></div><div class="tcard-inner">'
    + '<div class="tcard-header"><div><div class="tcard-name">' + name + '</div>'
    + '<div class="tcard-handle">' + (isImm ? '<span class="dispo-dot"></span>' : '') + 'DISPO · ' + c.availability + '</div></div>'
    + '<div class="tcard-score">' + c.score + '<small>/100</small></div></div>'
    + '<div class="tcard-portrait"><div class="tcard-family-badge">' + c.location + '</div>'
    + photo + '<div class="tcard-rarity-stamp">' + level.toUpperCase() + '</div>' + slBtn + '</div>'
    + '<div class="tcard-stats">' + stats + '</div>'
    + '<div class="tcard-footer"><span>' + rolePrefix + fam.name + '</span>'
    + compareBtn
    + '</div>'
    + '</div></div>';
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
    + '<nav class="nav-drawer-links"><a href="index.html">Accueil</a><a href="candidat.html">Candidats</a><a href="marketplace.html">Recruteurs</a><a href="profil.html?id=c001">Voir un profil</a></nav>'
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
    .tcard-sl-btn {
      position: absolute; bottom: 10px; left: 10px; z-index: 10;
      background: rgba(255,248,231,.92); color: var(--ink);
      font-family: var(--font-mono); font-size: 8px; font-weight: 700;
      letter-spacing: .14em; text-transform: uppercase;
      padding: 5px 10px; border-radius: 3px;
      border: 1.5px solid rgba(26,34,34,.15);
      cursor: pointer; transition: all .2s;
      backdrop-filter: blur(4px); white-space: nowrap; line-height: 1;
    }
    .tcard-sl-btn:hover { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .tcard-sl-btn.active { background: var(--rust); color: var(--cream); border-color: var(--rust); }
    /* Bouton Comparer shortlist */
    .vs-compare-btn {
      font-family: var(--font-mono); font-size: 9px; font-weight: 700;
      letter-spacing: .14em; text-transform: uppercase;
      padding: 8px 0; border-radius: 4px;
      border: 1.5px solid var(--cream-3);
      background: var(--cream-2); color: var(--teal-2);
      cursor: pointer; transition: all .2s;
      width: 100%; margin-top: 6px; line-height: 1;
    }
    .vs-compare-btn:hover:not(:disabled) { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .vs-compare-btn.selected { background: var(--gold-deep); color: var(--cream); border-color: var(--gold-deep); }
    .vs-compare-btn:disabled { opacity: .35; cursor: not-allowed; }
    .dispo-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 4px; vertical-align: middle; animation: pulse-dot 1.6s ease-in-out infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .vs-bar-strip { background: var(--ink); border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .vs-btn-compare { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 9px 18px; border-radius: 4px; border: none; cursor: pointer; transition: all .2s; white-space: nowrap; }
    .vs-btn-compare:disabled { background: rgba(255,255,255,.1); color: rgba(255,255,255,.3); cursor: not-allowed; }
    .vs-btn-compare:not(:disabled) { background: var(--gold-deep); color: var(--cream); }
    .vs-btn-compare:not(:disabled):hover { background: var(--gold-glow); }
    .vs-btn-clear { font-family: var(--font-mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.3); background: none; border: 1px solid rgba(255,255,255,.15); padding: 7px 12px; border-radius: 4px; cursor: pointer; transition: all .2s; }
    .vs-btn-clear:hover { color: rgba(255,255,255,.7); border-color: rgba(255,255,255,.4); }
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
    .su-cmp-modal { position: fixed; inset: 0; z-index: 500; display: flex; align-items: center; justify-content: center; }
    .cmp-overlay { position: absolute; inset: 0; background: rgba(26,34,34,.7); backdrop-filter: blur(8px); }
    .cmp-inner { position: relative; z-index: 2; background: var(--cream); border-radius: 12px; max-width: min(960px, 94vw); width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(26,34,34,.5); }
    .cmp-header { display: flex; justify-content: space-between; align-items: center; padding: 24px 28px; border-bottom: 1px solid var(--cream-3); }
    .cmp-close { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--cream-3); background: var(--cream-2); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .2s; }
    .cmp-close:hover { background: var(--ink); color: var(--cream); }
    .cmp-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 0; }
    .cmp-col { padding: 24px 28px; border-right: 1px solid var(--cream-3); }
    .cmp-col:last-child { border-right: none; }
    @media(max-width:600px) { .vs-bar-strip { flex-direction: column; gap: 10px; } }
  `;
  document.head.appendChild(style);
  setActiveNav();
  setupMobileMenu();
  renderFooter();
  document.addEventListener('vsChanged', () => {
    // Rafraîchir les boutons Comparer dans les cartes shortlist
    const grid = document.getElementById('pool-grid');
    if (grid) refreshVSBtns(grid);
  });
  document.addEventListener('click', e => {
    // Bouton Comparer sur carte shortlist
    const vsBtn = e.target.closest('.vs-compare-btn');
    if (vsBtn) {
      e.stopPropagation();
      const id = vsBtn.dataset.id;
      if (!SU_VS.has(id) && SU_VS.count() >= SU_VS.MAX) return;
      SU_VS.toggle(id);
      return;
    }
    const slBtn = e.target.closest('.tcard-sl-btn');
    if (slBtn) {
      e.stopPropagation();
      const id = slBtn.dataset.id;
      SU_SHORTLIST.toggle(id);
      const isNow = SU_SHORTLIST.has(id);
      document.querySelectorAll('.tcard-sl-btn[data-id="' + id + '"]').forEach(b => {
        b.classList.toggle('active', isNow);
        b.textContent = isNow ? '✓ SHORTLIST' : '+ SHORTLIST';
      });
      const slCount = document.getElementById('sl-count');
      if (slCount) slCount.textContent = SU_SHORTLIST.count() || '';
      return;
    }
    const card = e.target.closest('.tcard');
    if (card && card.dataset.candidateId && !e.target.closest('.vs-compare-btn')) {
      const allCards = [...document.querySelectorAll('.tcard[data-candidate-id]')];
      navigateWithPool(card.dataset.candidateId, allCards.map(c => c.dataset.candidateId));
    }
  });
  document.addEventListener('compareChanged', updateCompareBar);
});

function updateCompareBar() {
  let bar = document.getElementById('su-compare-bar');
  const count = SU_COMPARE.count();
  if (!bar) { bar = document.createElement('div'); bar.id = 'su-compare-bar'; bar.className = 'su-compare-bar'; document.body.appendChild(bar); }
  if (count === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const cands = SU_COMPARE.getCandidates();
  const thumbs = cands.map(c => { const n=(c.anonymous?'Anonyme':c.name).split(' ')[0]; const img=c.photo?'<img src="'+c.photo+'" alt="">':'<span>'+n[0]+'</span>'; return '<div class="cbar-thumb">'+img+'<div class="cbar-tname">'+n+'</div></div>'; }).join('');
  bar.innerHTML = '<div class="cbar-left"><span class="cbar-count">'+count+'</span><span class="cbar-lbl"> en comparaison</span></div>'
    +'<div class="cbar-thumbs">'+thumbs+'</div>'
    +(count>=2?'<button class="cbar-btn" onclick="openCompareModal()">Comparer ✶</button>':'<span class="cbar-hint">Ajoute '+(2-count)+' profil de plus</span>')
    +'<button class="cbar-clear" onclick="SU_COMPARE.clear()">✕</button>';
}

function openCompareModal() {
  const cands = SU_COMPARE.getCandidates();
  if (cands.length < 2) return;
  let modal = document.getElementById('su-cmp-modal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'su-cmp-modal'; modal.className = 'su-cmp-modal'; document.body.appendChild(modal); }
  const dims = SU_DATA.dimensions;
  const col = c => {
    const fam=SU_DATA.getFamilyById(c.family); const name=c.anonymous?'Anonyme':c.name; const level=c.level||SU_DATA.getLevel(c.score);
    const photo=c.photo?'<img src="'+c.photo+'" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:2px solid var(--gold)">':'<div style="width:80px;height:80px;border-radius:50%;background:var(--cream-3);display:flex;align-items:center;justify-content:center;font-size:32px">'+fam.icon+'</div>';
    const bars=dims.map(d=>{ const v=c.stats[d.key]||0; const p=Math.round(v/d.max*100); return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--teal-3)">'+d.label+'</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--gold-deep);font-weight:700">'+v+'/'+d.max+'</span></div><div style="height:4px;background:var(--cream-3);border-radius:2px;overflow:hidden"><div style="width:'+p+'%;height:100%;background:var(--gold-deep);border-radius:2px"></div></div></div>'; }).join('');
    return '<div class="cmp-col"><div style="text-align:center;margin-bottom:20px">'+photo+'<div style="font-family:var(--font-display);font-weight:900;font-size:20px;text-transform:uppercase;margin-top:10px">'+name+'</div><div style="display:inline-block;background:var(--ink);color:var(--gold);font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;padding:4px 10px;border-radius:4px;margin-top:4px">'+level.toUpperCase()+' · '+c.score+'/100</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--teal-3);margin-top:8px">'+fam.name+' · '+c.location+'</div></div><div style="margin-bottom:16px">'+bars+'</div><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-3);margin-bottom:6px">Points forts</div>'+(c.strengths||[]).map(s=>'<div style="font-size:13px;color:var(--teal-2);padding:5px 0;border-bottom:1px dashed var(--cream-3)">→ '+s+'</div>').join('')+'<div style="margin-top:16px"><a href="profil.html?id='+c.id+'" style="display:block;text-align:center;background:var(--gold-deep);color:var(--cream);font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px;border-radius:4px;text-decoration:none">Voir le profil complet →</a></div></div>';
  };
  modal.innerHTML='<div class="cmp-overlay" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'"></div><div class="cmp-inner"><div class="cmp-header"><div style="font-family:var(--font-display);font-weight:900;font-size:24px;text-transform:uppercase">Comparaison</div><button class="cmp-close" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'">✕</button></div><div class="cmp-cols">'+cands.map(col).join('')+'</div></div>';
  modal.style.display='flex';
}
