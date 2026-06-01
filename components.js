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

/* ============ VS : checkboxes sur les cards shortlist ============ */
function showVSCheckboxes(container) {
  const CA = '#c9a86a', CB = '#4a8fa3';
  container.querySelectorAll('.tcard[data-candidate-id]').forEach(card => {
    if (card.querySelector('.vs-cb')) return;
    const id = card.dataset.candidateId;
    const portrait = card.querySelector('.tcard-portrait');
    const target = portrait || card;
    const cb = document.createElement('div');
    cb.className = 'vs-cb';
    cb.dataset.id = id;
    const idx = SU_VS.selected.indexOf(id);
    cb.style.cssText = 'position:absolute;top:8px;right:8px;z-index:20;width:24px;height:24px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;line-height:1;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.35);user-select:none;'
      + (idx === 0 ? 'background:'+CA+';color:#1a2222;border:2px solid '+CA+';'
       : idx === 1 ? 'background:'+CB+';color:#fff;border:2px solid '+CB+';'
       : 'background:rgba(26,34,34,.55);color:rgba(255,255,255,.65);border:1.5px solid rgba(255,255,255,.25);');
    cb.innerHTML = idx >= 0 ? '\u2713' : '+';
    cb.title = 'Sélectionner pour comparer';
    target.appendChild(cb);
    cb.addEventListener('click', e => {
      e.stopPropagation();
      if (!SU_VS.has(id) && SU_VS.count() >= SU_VS.MAX) return;
      SU_VS.toggle(id);
    });
  });
}

function updateVSCheckboxes() {
  const CA = '#c9a86a', CB = '#4a8fa3';
  document.querySelectorAll('.vs-cb[data-id]').forEach(cb => {
    const id = cb.dataset.id;
    const idx = SU_VS.selected.indexOf(id);
    if (idx === 0) {
      Object.assign(cb.style, { background: CA, color: '#1a2222', borderColor: CA });
      cb.innerHTML = '\u2713';
    } else if (idx === 1) {
      Object.assign(cb.style, { background: CB, color: '#fff', borderColor: CB });
      cb.innerHTML = '\u2713';
    } else {
      Object.assign(cb.style, { background: 'rgba(26,34,34,.55)', color: 'rgba(255,255,255,.65)', borderColor: 'rgba(255,255,255,.25)' });
      cb.innerHTML = '+';
    }
  });
}

/* ============ VS MODAL ============ */
function openVSModal() {
  const cands = SU_VS.getSelected();
  if (cands.length < 2) return;
  const a = cands[0], b = cands[1];
  const dims = SU_DATA.dimensions;
  const CA = '#c9a86a', CB = '#4a8fa3';
  const nameA = a.anonymous ? 'Anonyme' : a.name;
  const nameB = b.anonymous ? 'Anonyme' : b.name;
  const shortA = nameA.split(' ')[0];
  const shortB = nameB.split(' ')[0];
  const famA = SU_DATA.getFamilyById(a.family);
  const famB = SU_DATA.getFamilyById(b.family);
  const lvA = (a.level || SU_DATA.getLevel(a.score)).toUpperCase();
  const lvB = (b.level || SU_DATA.getLevel(b.score)).toUpperCase();

  // ===== RADAR SVG superposé =====
  const cx=265,cy=215,maxR=130,lOff=50;
  const ang = i => -Math.PI/2 + i*2*Math.PI/dims.length;
  const pt = (r,i) => ({ x: cx+r*Math.cos(ang(i)), y: cy+r*Math.sin(ang(i)) });
  const ptStr = r => dims.map((_,i)=>{ const p=pt(r,i); return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ');
  let rsvg = '';
  [.25,.5,.75,1].forEach(r => { rsvg += '<polygon points="'+ptStr(maxR*r)+'" fill="'+(r===1?'rgba(201,168,106,.05)':'none')+'" stroke="rgba(201,168,106,.2)" stroke-width="1"/>'; });
  dims.forEach((_,i) => { const p=pt(maxR,i); rsvg += '<line x1="'+cx+'" y1="'+cy+'" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'" stroke="rgba(201,168,106,.2)" stroke-width="1"/>'; });
  rsvg += '<polygon points="'+dims.map((d,i)=>{ const r=maxR*((b.stats[d.key]||0)/d.max); const p=pt(r,i); return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ')+'" fill="rgba(74,143,163,.18)" stroke="'+CB+'" stroke-width="2.5" stroke-linejoin="round"/>';
  rsvg += '<polygon points="'+dims.map((d,i)=>{ const r=maxR*((a.stats[d.key]||0)/d.max); const p=pt(r,i); return p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ')+'" fill="rgba(201,168,106,.2)" stroke="'+CA+'" stroke-width="2.5" stroke-linejoin="round"/>';
  dims.forEach((d,i) => {
    const va=a.stats[d.key]||0, vb=b.stats[d.key]||0;
    const dpa=pt(maxR*(va/d.max),i), dpb=pt(maxR*(vb/d.max),i), lp=pt(maxR+lOff,i);
    rsvg += '<circle cx="'+dpa.x.toFixed(1)+'" cy="'+dpa.y.toFixed(1)+'" r="4" fill="'+CA+'"/>';
    rsvg += '<circle cx="'+dpb.x.toFixed(1)+'" cy="'+dpb.y.toFixed(1)+'" r="4" fill="'+CB+'"/>';
    const axr=ang(i); let anchor='middle';
    if(Math.cos(axr)>0.3) anchor='start'; else if(Math.cos(axr)<-0.3) anchor='end';
    const words=d.label.toUpperCase().split(' ');
    if(words.length>2){
      const l1=words.slice(0,2).join(' '), l2=words.slice(2).join(' ');
      rsvg += '<text text-anchor="'+anchor+'" font-family="\'Big Shoulders Display\',sans-serif" font-weight="700" font-size="10" fill="#1a2222"><tspan x="'+lp.x.toFixed(1)+'" y="'+(lp.y-6).toFixed(1)+'">'+l1+'</tspan><tspan x="'+lp.x.toFixed(1)+'" dy="12">'+l2+'</tspan></text>';
      rsvg += '<text x="'+lp.x.toFixed(1)+'" y="'+(lp.y+20).toFixed(1)+'" text-anchor="'+anchor+'" font-family="\'JetBrains Mono\',monospace" font-size="9"><tspan fill="'+CA+'">'+va+'</tspan><tspan fill="#aaa"> \u00b7 </tspan><tspan fill="'+CB+'">'+vb+'</tspan></text>';
    } else {
      rsvg += '<text x="'+lp.x.toFixed(1)+'" y="'+(lp.y-4).toFixed(1)+'" text-anchor="'+anchor+'" font-family="\'Big Shoulders Display\',sans-serif" font-weight="700" font-size="10" fill="#1a2222">'+d.label.toUpperCase()+'</text>';
      rsvg += '<text x="'+lp.x.toFixed(1)+'" y="'+(lp.y+12).toFixed(1)+'" text-anchor="'+anchor+'" font-family="\'JetBrains Mono\',monospace" font-size="9"><tspan fill="'+CA+'">'+va+'</tspan><tspan fill="#aaa"> \u00b7 </tspan><tspan fill="'+CB+'">'+vb+'</tspan></text>';
    }
  });
  const radarSVG = '<svg viewBox="0 0 550 440" style="width:100%;max-width:500px;display:block;margin:0 auto;overflow:visible">'+rsvg+'</svg>';

  // ===== TABLEAU : bouton audio dans la colonne du candidat =====
  const dimsA = dims.filter(d => (a.stats[d.key]||0) > (b.stats[d.key]||0));
  const dimsB = dims.filter(d => (b.stats[d.key]||0) > (a.stats[d.key]||0));

  const tableRows = dims.map(d => {
    const va=a.stats[d.key]||0, vb=b.stats[d.key]||0;
    const pa=Math.round(va/d.max*100), pb=Math.round(vb/d.max*100);
    const winner = va>vb?'a':vb>va?'b':'';
    const rowBg = winner==='a'?'rgba(201,168,106,.07)':winner==='b'?'rgba(74,143,163,.07)':'';
    const rowBorder = winner==='a'?'border-left:3px solid '+CA:winner==='b'?'border-left:3px solid '+CB:'border-left:3px solid transparent';
    // Bouton audio dans la colonne de son candidat
    const playA = '<button class="vs-audio-btn" data-cid="'+a.id+'" data-dim="'+d.key+'" data-color="'+CA+'" style="flex-shrink:0;width:24px;height:24px;border-radius:50%;border:none;background:rgba(201,168,106,.18);cursor:pointer;font-size:9px;color:#7a5c2a;transition:all .2s;display:flex;align-items:center;justify-content:center" title="\u00c9couter '+shortA+'">\u25b6</button>';
    const playB = '<button class="vs-audio-btn" data-cid="'+b.id+'" data-dim="'+d.key+'" data-color="'+CB+'" style="flex-shrink:0;width:24px;height:24px;border-radius:50%;border:none;background:rgba(74,143,163,.18);cursor:pointer;font-size:9px;color:#2d6b7f;transition:all .2s;display:flex;align-items:center;justify-content:center" title="\u00c9couter '+shortB+'">\u25b6</button>';
    const cellA = '<td style="padding:10px 12px"><div style="display:flex;align-items:center;gap:7px">'
      +'<div style="flex:1;height:5px;background:var(--cream-3);border-radius:3px;overflow:hidden;min-width:40px"><div style="width:'+pa+'%;height:100%;background:'+CA+';border-radius:3px"></div></div>'
      +'<span style="font-family:var(--font-mono);font-size:10px;color:'+CA+';font-weight:700;white-space:nowrap">'+va+'/'+d.max+'</span>'
      +(winner==='a'?'<span style="font-size:8px;color:'+CA+'">\u25b2</span>':'')
      +playA+'</div></td>';
    const cellB = '<td style="padding:10px 12px"><div style="display:flex;align-items:center;gap:7px">'
      +'<div style="flex:1;height:5px;background:var(--cream-3);border-radius:3px;overflow:hidden;min-width:40px"><div style="width:'+pb+'%;height:100%;background:'+CB+';border-radius:3px"></div></div>'
      +'<span style="font-family:var(--font-mono);font-size:10px;color:'+CB+';font-weight:700;white-space:nowrap">'+vb+'/'+d.max+'</span>'
      +(winner==='b'?'<span style="font-size:8px;color:'+CB+'">\u25b2</span>':'')
      +playB+'</div></td>';
    return '<tr style="background:'+rowBg+';'+rowBorder+'">'
      +'<td style="padding:10px 16px;font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-2);white-space:nowrap">'+d.label+'</td>'
      +cellA+cellB+'</tr>';
  }).join('');

  // ===== VERDICT =====
  const diff = a.score - b.score;
  let summaryText = '';
  if (Math.abs(diff) > 10) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB, wl=(diff>0?dimsA:dimsB).length;
    summaryText = '<span style="color:'+wc+';font-weight:900">'+wn+'</span> m\u00e8ne de '+Math.abs(diff)+' points. Avantage sur '+wl+'/6 dimensions.';
  } else if (Math.abs(diff) > 3) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB;
    summaryText = '<span style="color:'+wc+'">'+wn+'</span> l\u00e9g\u00e8rement devant (+'+Math.abs(diff)+' pts). Le contexte du poste doit trancher.';
  } else if (diff !== 0) {
    summaryText = 'Profils tr\u00e8s proches ('+Math.abs(diff)+' pt'+(Math.abs(diff)>1?'s':'')+' d\'\u00e9cart). Chaque dimension compte pour d\u00e9partager.';
  } else {
    summaryText = 'Scores \u00e0 \u00e9galit\u00e9 parfaite. D\u00e9partager sur le terrain et la culture d\'\u00e9quipe.';
  }

  function buildContextCard(c, color, dimsWon) {
    const hunt = c.hunting_pct || 50;
    const short = (c.anonymous ? 'Anonyme' : c.name).split(' ')[0];
    const famC = SU_DATA.getFamilyById(c.family);
    const items = [];
    if (hunt >= 75) items.push('\u00c9quipe <strong>pure outbound</strong> (chasse '+hunt+'%)');
    else if (hunt >= 50) items.push('\u00c9quipe <strong>mixte</strong> chasse\/fid\u00e9lisation ('+hunt+'/'+(100-hunt)+'%)');
    else items.push('Profil <strong>farming</strong> \/AM ('+hunt+'% chasse)');
    if (c.deal_size) items.push('Deals de <strong>'+c.deal_size+'</strong>');
    if (c.sales_cycle) items.push('Cycles <strong>'+c.sales_cycle+'</strong>');
    if (c.experience_years) items.push(c.experience_years+' ans \u00b7 <strong>'+(c.experience_level||'')+'</strong>');
    items.push('Expertise <strong>'+famC.name+'</strong>');
    const domStr = dimsWon.length > 0 ? dimsWon.map(d=>d.label).join(' \u00b7 ') : 'Aucune sup\u00e9riorit\u00e9 nette';
    return '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:16px">'
      +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:'+color+';margin-bottom:10px">Recruter '+short+' si\u2026</div>'
      +items.map(t=>'<div style="font-size:12px;color:rgba(255,248,231,.8);padding:4px 0;border-bottom:1px solid rgba(255,248,231,.05);line-height:1.45">\u2192 '+t+'</div>').join('')
      +'<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.07)">'
        +'<div style="font-family:var(--font-mono);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,248,231,.3);margin-bottom:4px">Dimensions fortes</div>'
        +'<div style="font-family:var(--font-mono);font-size:9px;color:'+color+'">'+domStr+'</div>'
      +'</div>'
      +'</div>';
  }

  let finalReco = '';
  if (Math.abs(diff) > 5) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB, on2=diff>0?shortB:shortA, oc=diff>0?CB:CA;
    finalReco = '<span style="color:'+wc+'">'+wn+'</span> est le choix naturel pour un poste g\u00e9n\u00e9raliste. Envisager <span style="color:'+oc+'">'+on2+'</span> uniquement si le profil sectoriel prime sur la performance orale.';
  } else if (diff !== 0) {
    const wn=diff>0?shortA:shortB, wc=diff>0?CA:CB;
    finalReco = 'Avantage marginal pour <span style="color:'+wc+'">'+wn+'</span>. Compl\u00e9tez l\'analyse avec un entretien structur\u00e9 ou un deuxi\u00e8me test SalesUncut sur un autre sc\u00e9nario.';
  } else {
    finalReco = 'Profils \u00e9quivalents sur les crit\u00e8res SalesUncut. La d\u00e9cision appartient au manager sur la base du feeling terrain et de la culture d\'\u00e9quipe.';
  }

  const verdictHTML =
    '<div style="background:var(--ink);color:var(--cream);padding:28px 32px;border-radius:0 0 12px 12px">'
    +'<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">'
      +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:var(--gold)">Verdict IA</div>'
      +'<div style="flex:1;height:1px;background:rgba(255,248,231,.1)"></div>'
    +'</div>'
    +'<div style="font-family:var(--font-display);font-weight:900;font-size:clamp(17px,2.2vw,24px);text-transform:uppercase;letter-spacing:-.01em;color:var(--cream);margin-bottom:20px;line-height:1.2">'+summaryText+'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">'
      +buildContextCard(a, CA, dimsA)
      +buildContextCard(b, CB, dimsB)
    +'</div>'
    +'<div style="background:rgba(255,248,231,.05);border:1px solid rgba(255,248,231,.1);border-radius:6px;padding:14px;margin-bottom:18px">'
      +'<div style="font-family:var(--font-mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,248,231,.35);margin-bottom:6px">Recommandation recruteur</div>'
      +'<div style="font-size:13px;color:rgba(255,248,231,.8);line-height:1.55">'+finalReco+'</div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +'<a href="profil.html?id='+a.id+'" style="display:block;text-align:center;background:'+CA+';color:#1a2222;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:11px;border-radius:6px;text-decoration:none">Profil de '+shortA+' \u2192</a>'
      +'<a href="profil.html?id='+b.id+'" style="display:block;text-align:center;background:'+CB+';color:#fff;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:11px;border-radius:6px;text-decoration:none">Profil de '+shortB+' \u2192</a>'
    +'</div>'
    +'</div>';

  // Photos
  const photoA = a.photo ? '<img src="'+a.photo+'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2.5px solid '+CA+';">'
    : '<div style="width:60px;height:60px;border-radius:50%;background:var(--cream-2);display:flex;align-items:center;justify-content:center;font-size:22px;border:2.5px solid '+CA+'">'+famA.icon+'</div>';
  const photoB = b.photo ? '<img src="'+b.photo+'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;object-position:center top;border:2.5px solid '+CB+';">'
    : '<div style="width:60px;height:60px;border-radius:50%;background:var(--cream-2);display:flex;align-items:center;justify-content:center;font-size:22px;border:2.5px solid '+CB+'">'+famB.icon+'</div>';

  const existing = document.getElementById('su-vs-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'su-vs-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:600;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:20px 16px;box-sizing:border-box';

  modal.innerHTML =
    '<div onclick="document.getElementById(\'su-vs-modal\').remove()" style="position:fixed;inset:0;background:rgba(26,34,34,.82);backdrop-filter:blur(8px);z-index:-1"></div>'
    +'<div style="background:var(--cream);border-radius:12px;width:100%;max-width:860px;box-shadow:0 32px 80px rgba(26,34,34,.5);position:relative;margin:auto">'
    +'<button onclick="document.getElementById(\'su-vs-modal\').remove()" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:1.5px solid var(--cream-3);background:var(--cream-2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;line-height:1">\u2715</button>'
    // Header
    +'<div style="padding:24px 28px 20px;border-bottom:1px solid var(--cream-3)">'
      +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:var(--gold-deep);margin-bottom:14px">Comparaison de profils</div>'
      +'<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px">'
        +'<div style="display:flex;align-items:center;gap:14px">'+photoA+'<div>'
          +'<div style="font-family:var(--font-display);font-weight:900;font-size:19px;text-transform:uppercase;color:var(--ink)">'+nameA+'</div>'
          +'<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:'+CA+';font-weight:700;margin-top:2px">'+lvA+' \u00b7 '+a.score+'/100</div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;color:var(--teal-3);margin-top:3px">'+famA.name+' \u00b7 '+a.location+'</div>'
        +'</div></div>'
        +'<div style="font-family:var(--font-display);font-weight:900;font-size:22px;color:var(--ink);background:var(--cream-2);border:1.5px solid var(--cream-3);border-radius:50%;width:52px;height:52px;display:flex;align-items:center;justify-content:center;flex-shrink:0">VS</div>'
        +'<div style="display:flex;align-items:center;gap:14px;flex-direction:row-reverse">'+photoB+'<div style="text-align:right">'
          +'<div style="font-family:var(--font-display);font-weight:900;font-size:19px;text-transform:uppercase;color:var(--ink)">'+nameB+'</div>'
          +'<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:'+CB+';font-weight:700;margin-top:2px">'+lvB+' \u00b7 '+b.score+'/100</div>'
          +'<div style="font-family:var(--font-mono);font-size:9px;color:var(--teal-3);margin-top:3px">'+famB.name+' \u00b7 '+b.location+'</div>'
        +'</div></div>'
      +'</div>'
    +'</div>'
    // Radar
    +'<div style="padding:24px 28px;border-bottom:1px solid var(--cream-3);background:var(--cream-2)">'
      +'<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">'
        +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--teal-3)">Radar superposé</div>'
        +'<span style="display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:9px;color:'+CA+'"><span style="width:10px;height:10px;border-radius:50%;background:'+CA+';display:inline-block"></span>'+shortA+'</span>'
        +'<span style="display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:9px;color:'+CB+'"><span style="width:10px;height:10px;border-radius:50%;background:'+CB+';display:inline-block"></span>'+shortB+'</span>'
      +'</div>'
      +radarSVG
    +'</div>'
    // Table
    +'<div style="padding:20px 28px">'
      +'<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--teal-3);margin-bottom:12px">Scores par dimension</div>'
      +'<table style="width:100%;border-collapse:collapse">'
        +'<thead><tr style="border-bottom:1.5px solid var(--cream-3)">'
          +'<th style="text-align:left;padding:8px 16px;font-family:var(--font-mono);font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--teal-3);font-weight:400">Dimension</th>'
          +'<th style="text-align:left;padding:8px 12px;font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:'+CA+';font-weight:700">\u25a0 '+shortA+'</th>'
          +'<th style="text-align:left;padding:8px 12px;font-family:var(--font-mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:'+CB+';font-weight:700">\u25a0 '+shortB+'</th>'
        +'</tr></thead>'
        +'<tbody>'+tableRows+'</tbody>'
      +'</table>'
    +'</div>'
    // Verdict (dark)
    +verdictHTML
    +'</div>';

  document.body.appendChild(modal);

  // Audio
  let vsAudio = null;
  modal.querySelectorAll('.vs-audio-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const cid=btn.dataset.cid, dim=btn.dataset.dim, color=btn.dataset.color;
      if (vsAudio) {
        vsAudio.pause(); vsAudio.currentTime=0; vsAudio=null;
        modal.querySelectorAll('.vs-audio-btn').forEach(b=>{ b.innerHTML='\u25b6'; b.style.background=b.dataset.color===CA?'rgba(201,168,106,.18)':'rgba(74,143,163,.18)'; });
      }
      const audio = new Audio('/audio/'+cid+'_'+dim+'.mp3');
      audio.addEventListener('error', ()=>{ btn.innerHTML='\u2014'; btn.disabled=true; btn.style.opacity='.35'; }, {once:true});
      audio.addEventListener('playing', ()=>{ vsAudio=audio; btn.innerHTML='\u23f8'; btn.style.background=color; btn.style.color=color===CA?'#1a2222':'#fff'; }, {once:true});
      audio.onended = ()=>{ btn.innerHTML='\u25b6'; btn.style.background=cid===a.id?'rgba(201,168,106,.18)':'rgba(74,143,163,.18)'; btn.style.color=cid===a.id?'#7a5c2a':'#2d6b7f'; vsAudio=null; };
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
  const fam   = SU_DATA.getFamilyById(c.family);
  const level = c.level || SU_DATA.getLevel(c.score);
  const dims  = SU_DATA.dimensions;
  const isImm = c.availability === 'Immédiat';
  const name  = c.anonymous ? 'Anonyme' : c.name;
  const rolePrefix = c.role_type ? '<span class="tcard-role">' + c.role_type + '</span> \u00b7 ' : '';
  const inSL  = SU_SHORTLIST.has(c.id);
  const stats = dims.map(d => {
    const v=c.stats[d.key]||0; const p=Math.round(v/d.max*100);
    return '<div class="tcard-stat"><span class="lbl">' + d.label + '</span><div class="bar"><i style="width:' + p + '%"></i></div><span class="val">' + v + '</span></div>';
  }).join('');
  const photo = c.photo
    ? '<img class="tcard-photo" src="' + c.photo + '" alt="' + name + '" loading="lazy">'
    : '<span class="silhouette">' + fam.icon + '</span>';
  const slBtn = '<button class="tcard-sl-btn' + (inSL ? ' active' : '') + '" data-id="' + c.id + '">'
    + (inSL ? '\u2713 SHORTLIST' : '+ SHORTLIST') + '</button>';
  return '<div class="tcard ' + level + (compact?' sm':'') + '" data-candidate-id="' + c.id + '">'
    + '<div class="holo"></div><div class="tcard-inner">'
    + '<div class="tcard-header"><div><div class="tcard-name">' + name + '</div>'
    + '<div class="tcard-handle">' + (isImm ? '<span class="dispo-dot"></span>' : '') + 'DISPO \u00b7 ' + c.availability + '</div></div>'
    + '<div class="tcard-score">' + c.score + '<small>/100</small></div></div>'
    + '<div class="tcard-portrait"><div class="tcard-family-badge">' + c.location + '</div>'
    + photo + '<div class="tcard-rarity-stamp">' + level.toUpperCase() + '</div>' + slBtn + '</div>'
    + '<div class="tcard-stats">' + stats + '</div>'
    + '<div class="tcard-footer"><span>' + rolePrefix + fam.name + '</span></div>'
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
    + '</div><div class="footer-bottom"><span>\u00a9 2026 SalesUncut \u00b7 Tous droits réservés</span><span>v0.1 \u00b7 Nice, FR</span></div></div></footer>';
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
    .dispo-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e; margin-right: 4px; vertical-align: middle; animation: pulse-dot 1.6s ease-in-out infinite; }
    @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
    .vs-cb { position: absolute; top: 8px; right: 8px; z-index: 20; }
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
  document.addEventListener('vsChanged', updateVSCheckboxes);
  document.addEventListener('click', e => {
    const slBtn = e.target.closest('.tcard-sl-btn');
    if (slBtn) {
      e.stopPropagation();
      const id = slBtn.dataset.id;
      SU_SHORTLIST.toggle(id);
      const isNow = SU_SHORTLIST.has(id);
      document.querySelectorAll('.tcard-sl-btn[data-id="' + id + '"]').forEach(b => {
        b.classList.toggle('active', isNow);
        b.textContent = isNow ? '\u2713 SHORTLIST' : '+ SHORTLIST';
      });
      const slCount = document.getElementById('sl-count');
      if (slCount) slCount.textContent = SU_SHORTLIST.count() || '';
      return;
    }
    const card = e.target.closest('.tcard');
    if (card && card.dataset.candidateId && !e.target.closest('.vs-cb')) {
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
  const thumbs = cands.map(c => { const n=(c.anonymous?'Anonyme':c.name).split(' ')[0]; const img=c.photo?'<img src="'+c.photo+'" alt="">'+'':'<span>'+n[0]+'</span>'; return '<div class="cbar-thumb">'+img+'<div class="cbar-tname">'+n+'</div></div>'; }).join('');
  bar.innerHTML = '<div class="cbar-left"><span class="cbar-count">'+count+'</span><span class="cbar-lbl"> en comparaison</span></div>'
    +'<div class="cbar-thumbs">'+thumbs+'</div>'
    +(count>=2?'<button class="cbar-btn" onclick="openCompareModal()">Comparer \u2736</button>':'<span class="cbar-hint">Ajoute '+(2-count)+' profil de plus</span>')
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
    return '<div class="cmp-col"><div style="text-align:center;margin-bottom:20px">'+photo+'<div style="font-family:var(--font-display);font-weight:900;font-size:20px;text-transform:uppercase;margin-top:10px">'+name+'</div><div style="display:inline-block;background:var(--ink);color:var(--gold);font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;padding:4px 10px;border-radius:4px;margin-top:4px">'+level.toUpperCase()+' \u00b7 '+c.score+'/100</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--teal-3);margin-top:8px">'+fam.name+' \u00b7 '+c.location+'</div></div><div style="margin-bottom:16px">'+bars+'</div><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal-3);margin-bottom:6px">Points forts</div>'+(c.strengths||[]).map(s=>'<div style="font-size:13px;color:var(--teal-2);padding:5px 0;border-bottom:1px dashed var(--cream-3)">→ '+s+'</div>').join('')+'<div style="margin-top:16px"><a href="profil.html?id='+c.id+'" style="display:block;text-align:center;background:var(--gold-deep);color:var(--cream);font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:10px;border-radius:4px;text-decoration:none">Voir le profil complet \u2192</a></div></div>';
  };
  modal.innerHTML='<div class="cmp-overlay" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'">'+'</div><div class="cmp-inner"><div class="cmp-header"><div style="font-family:var(--font-display);font-weight:900;font-size:24px;text-transform:uppercase">Comparaison</div><button class="cmp-close" onclick="document.getElementById(\'su-cmp-modal\').style.display=\'none\'">✕</button></div><div class="cmp-cols">'+cands.map(col).join('')+'</div></div>';
  modal.style.display='flex';
}
