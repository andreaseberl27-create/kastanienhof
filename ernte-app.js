// ── VORKONFIGURATION ─────────────────────────────────────────
// Werte kommen aus config.js (per Netlify-Build gesetzt)
const PRESET_URL = window.RIPELOG_CONFIG.supabaseUrl;
const PRESET_KEY = window.RIPELOG_CONFIG.supabaseKey;
// ─────────────────────────────────────────────────────────────

let BETRIEB_ID = localStorage.getItem('sb_betrieb_id') || null;

let FELDER   = JSON.parse(localStorage.getItem('sb_felder')      || 'null') || ['Feld A','Feld B','Feld C','Feld Nord','Feld Süd'];
let SORTEN   = JSON.parse(localStorage.getItem('sb_sorten')      || 'null') || ['Elsanta','Honeoye','Senga Sengana','Malling Centenary','Rumba','Polka'];
let PFLÜCKER = JSON.parse(localStorage.getItem('sb_pfluecker')   || 'null') || ['Anna','Bernd','Carlos','Daria','Erika','Fatima','Georg','Hana'];
// nr → name lookup für QR-Scanner: { 42: 'Anna', 7: 'Bernd', … }
let PFLÜCKER_NR_MAP = JSON.parse(localStorage.getItem('sb_pfluecker_nr') || 'null') || {};
let QUALITAETEN = JSON.parse(localStorage.getItem('sb_qualitaeten') || 'null') || [
  {code:'A', label:'Klasse A', emoji:'🟢', sort_order:1},
  {code:'B', label:'Klasse B', emoji:'🟡', sort_order:2},
  {code:'C', label:'Klasse C', emoji:'⚪', sort_order:3}
];
let GEBINDE = JSON.parse(localStorage.getItem('sb_gebinde') || 'null') || [
  {label:'Steige 2kg',  gewicht_kg:2.0,  sort_order:1},
  {label:'Steige 5kg',  gewicht_kg:5.0,  sort_order:2},
  {label:'Steige 10kg', gewicht_kg:10.0, sort_order:3},
  {label:'Manuell',     gewicht_kg:null, sort_order:4}
];

// Schicht-Kontext (einmalig je Schicht gesetzt, persisted)
let FELDER_DATA      = JSON.parse(localStorage.getItem('sb_felder_data')      || 'null') || [];
let SORTEN_DATA      = JSON.parse(localStorage.getItem('sb_sorten_data')      || 'null') || [];
let FRUCHTARTEN      = JSON.parse(localStorage.getItem('sb_fruchtarten')      || 'null') || [];
let PFLÜCKER_DATA    = JSON.parse(localStorage.getItem('sb_pfluecker_data')   || 'null') || [];
let PFLÜCKER_NR_ID_MAP = JSON.parse(localStorage.getItem('sb_pfluecker_nr_id') || 'null') || {};
let SCHICHT = {
  feld:      localStorage.getItem('schicht_feld')      || null,
  fruchtart: JSON.parse(localStorage.getItem('schicht_fruchtart') || 'null'),
  sorte:     localStorage.getItem('schicht_sorte')     || null,
  gebinde:   JSON.parse(localStorage.getItem('schicht_gebinde')   || 'null'),
};
let scanMenge = 1.0;
let state = { pflücker: null, _etikettenId: null };

const todayStr = new Date().toISOString().slice(0,10);
let entries = JSON.parse(localStorage.getItem('ernteEntries')||'[]').filter(e=>e.datum===todayStr).map(rehydrateEntry);

function showPage(name) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='statistik') renderStatistik();
  if(name==='protokoll') renderProtokoll();
  if(name==='erfassung') renderRecentScans();
  if(name==='einstellungen') {
    updateSettingsStatus();
  }
}

async function init() {
  const ds = new Date().toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric'});
  const dateBadge = document.getElementById('dateBadge');
  if (dateBadge) dateBadge.textContent = ds;
  document.getElementById('statDateBadge').textContent = ds;

  updateContextStrip();
  renderRecentScans();
  updateSummary();
  updateLoginHint();
  await checkAuth();
}

function saveEntries(){
  const all=JSON.parse(localStorage.getItem('ernteEntries')||'[]').filter(e=>e.datum!==todayStr);
  localStorage.setItem('ernteEntries',JSON.stringify([...entries,...all]));
}

function updateSummary(){
  const total = entries.reduce((s,e) => s + e.gewicht_kg, 0);
  document.getElementById('totalKg').textContent = total.toFixed(1) + ' kg';
  document.getElementById('totalEntries').textContent = entries.length;
}

function renderProtokoll(){
  const el=document.getElementById('protokoll');
  if(!entries.length){el.innerHTML='<div class="empty"><div class="empty-icon">📭</div><p>Noch keine Einträge heute</p></div>';return;}
  el.innerHTML=entries.slice(0,60).map(e=>`
    <div class="proto-item">
      <div style="flex:1;min-width:0">
        <div class="proto-name">${e.pflücker}</div>
        <div class="proto-meta">${e.feld}${e.sorte ? ' · ' + e.sorte : ''}${e.etiketten_id ? ' · <span style="color:var(--accent)">#' + String(e.etiketten_id).padStart(5,'0') + '</span>' : ''} · ${e.uhrzeit} Uhr</div>
      </div>
      <div class="proto-actions">
        <div class="proto-weight">${e.gewicht_kg.toFixed(1)} kg</div>
        <button class="proto-action-btn" onclick="openEditModal(${e.id})" title="Bearbeiten">✏️</button>
        <button class="proto-action-btn del" onclick="deleteEntry(${e.id})" title="Löschen">🗑</button>
      </div>
    </div>`).join('');
}

function renderStatistik(){
  if(!entries.length){
    ['s-totalKg','s-count','s-avg','s-pickers','s-qA','s-qB','s-qC'].forEach(id=>document.getElementById(id).textContent='–');
    document.getElementById('s-pickerBars').innerHTML='<div style="color:var(--text-dim);font-size:13px;padding:8px 0">Noch keine Daten</div>';
    ['s-feldTable','s-sorteTable'].forEach(id=>document.querySelector('#'+id+' tbody').innerHTML='<tr><td colspan="3" style="color:var(--text-dim);padding:10px 8px">Keine Daten</td></tr>');
    document.getElementById('s-hourChart').innerHTML='';
    return;
  }
  const total=entries.reduce((s,e)=>s+e.gewicht_kg,0);
  document.getElementById('s-totalKg').innerHTML=total.toFixed(1)+'<span class="card-unit">kg</span>';
  document.getElementById('s-count').innerHTML=entries.length+'<span class="card-unit">Stk</span>';
  document.getElementById('s-avg').innerHTML=(total/entries.length).toFixed(1)+'<span class="card-unit">kg</span>';
  document.getElementById('s-pickers').textContent=new Set(entries.map(e=>e.pflücker)).size;

  ['A','B','C'].forEach(q=>{
    const kg=entries.filter(e=>e.qualität===q).reduce((s,e)=>s+e.gewicht_kg,0);
    document.getElementById('s-q'+q).textContent=kg.toFixed(1)+' kg';
  });

  // Pflücker bars
  const byP={};
  entries.forEach(e=>byP[e.pflücker]=(byP[e.pflücker]||0)+e.gewicht_kg);
  const sorted=Object.entries(byP).sort((a,b)=>b[1]-a[1]);
  const maxKg=sorted[0][1];
  const colors=['var(--rot)','var(--accent)','var(--gruen-hell)','var(--blau)','#9c6cd5','#5bbfd4'];
  document.getElementById('s-pickerBars').innerHTML=sorted.map(([name,kg],i)=>`
    <div class="bar-row">
      <div class="bar-label">${name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(kg/maxKg*100).toFixed(1)}%;background:${colors[i%colors.length]}">
        <span class="bar-val">${kg.toFixed(1)} kg</span>
      </div></div>
    </div>`).join('');

  renderGroupTable('s-feldTable','feld');
  renderGroupTable('s-sorteTable','sorte');

  // Stundenverteilung
  const byH={};
  entries.forEach(e=>{const h=e.stunde!==undefined?e.stunde:parseInt(e.uhrzeit);byH[h]=(byH[h]||0)+e.gewicht_kg;});
  const hours=Array.from({length:19},(_,i)=>i+4);
  const maxH=Math.max(...hours.map(h=>byH[h]||0),0.1);
  document.getElementById('s-hourChart').innerHTML=hours.map(h=>{
    const v=byH[h]||0;
    return `<div class="hour-col">
      <div class="hour-bar${v>0?' has':''}" style="height:${(v/maxH*100).toFixed(0)}%" title="${h}:00 – ${v.toFixed(1)}kg"></div>
      <div class="hour-tick">${(h-4)%3===0?String(h).padStart(2,'0'):''}</div>
    </div>`;
  }).join('');
}

function renderGroupTable(tableId,field){
  const map={};
  entries.forEach(e=>{if(!map[e[field]])map[e[field]]={cnt:0,kg:0};map[e[field]].cnt++;map[e[field]].kg+=e.gewicht_kg;});
  const rows=Object.entries(map).sort((a,b)=>b[1].kg-a[1].kg);
  document.querySelector('#'+tableId+' tbody').innerHTML=rows.length
    ?rows.map(([k,v])=>`<tr><td>${k}</td><td>${v.cnt}</td><td>${v.kg.toFixed(1)} kg</td></tr>`).join('')
    :'<tr><td colspan="3" style="color:var(--text-dim);padding:10px 8px">Keine Daten</td></tr>';
}

function exportCSV(){
  if(!entries.length){showToast('Keine Daten','var(--braun)');return;}
  const h=['ID','Datum','Uhrzeit','Feld','Sorte','Pflücker','Qualität','Korbtyp','Gewicht_kg'];
  const rows=entries.map(e=>[e.id,e.datum,e.uhrzeit,e.feld,e.sorte,e.pflücker,e.qualität,e.korbtyp||'',e.gewicht_kg].join(';'));
  download([h.join(';'),...rows].join('\n'),`ernte_${todayStr}.csv`,'text/csv;charset=utf-8;');
  showToast('📥 CSV exportiert!');
}
function exportJSON(){
  if(!entries.length){showToast('Keine Daten','var(--braun)');return;}
  const total=entries.reduce((s,e)=>s+e.gewicht_kg,0);
  const byQ={'A':0,'B':0,'C':0};entries.forEach(e=>byQ[e.qualität]+=e.gewicht_kg);
  download(JSON.stringify({
    exportiert_am:new Date().toISOString(),datum:todayStr,eintraege:entries,
    zusammenfassung:{gesamt_kg:total.toFixed(2),anzahl:entries.length,nach_qualität:Object.fromEntries(Object.entries(byQ).map(([k,v])=>[k,v.toFixed(2)]))}
  },null,2),`ernte_${todayStr}.json`,'application/json');
  showToast('📥 JSON exportiert!');
}
function exportClipboard(){
  if(!entries.length){showToast('Keine Daten','var(--braun)');return;}
  const total=entries.reduce((s,e)=>s+e.gewicht_kg,0);
  let t=`🍓 ERNTE ${todayStr}\n${'─'.repeat(38)}\n`;
  entries.forEach(e=>t+=`${e.uhrzeit} | ${e.pflücker.padEnd(7)} | ${e.feld.padEnd(7)} | ${e.sorte.substring(0,10).padEnd(10)} | Kl.${e.qualität} | ${e.gewicht_kg.toFixed(1)} kg\n`);
  t+=`${'─'.repeat(38)}\nGesamt: ${total.toFixed(1)} kg | ${entries.length} Einträge`;
  navigator.clipboard.writeText(t).then(()=>showToast('📋 Kopiert!'));
}
function download(c,n,t){const b=new Blob([c],{type:t});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=n;a.click();URL.revokeObjectURL(u);}
function clearToday(){
  if(!entries.length)return;
  if(confirm(`Alle ${entries.length} Einträge von heute löschen?`)){entries=[];saveEntries();updateSummary();renderProtokoll();renderRecentScans();showToast('🗑️ Gelöscht','var(--braun)');}
}
function showToast(msg,bg){const t=document.getElementById('toast');t.textContent=msg;t.style.background=bg||'var(--gruen)';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400);}
function pflFullName(p) {
  return [p?.vorname, p?.nachname].filter(Boolean).join(' ') || p?.name || '–';
}

// ── AUTH ──────────────────────────────────────────────────────


function getSession()      { try { return JSON.parse(localStorage.getItem('sb_session') || 'null'); } catch { return null; } }
function setSession(s)     { localStorage.setItem('sb_session', JSON.stringify(s)); }
function clearSession()    { localStorage.removeItem('sb_session'); localStorage.removeItem('sb_betrieb_id'); BETRIEB_ID = null; }
function authToken()       { return getSession()?.access_token || null; }

async function logActivity(aktion, email, userId, fehler = null) {
  try {
    const token = authToken();
    if (!token) return; // kein Token = kein authenticated insert möglich
    await fetch(`${CONFIG.url}/rest/v1/activity_log`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.key,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        user_id:    userId  || null,
        betrieb_id: BETRIEB_ID || null,
        email:      email   || null,
        aktion,
        app:        'ernte-app',
        fehler:     fehler  || null,
        user_agent: navigator.userAgent.substring(0, 200)
      })
    });
  } catch { /* Logging darf App nie blockieren */ }
}

async function loginUser() {
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  errEl.textContent = '';
  if (!username || !password) { errEl.textContent = 'Bitte alle Felder ausfüllen.'; return; }
  if (!CONFIG.url || !CONFIG.key) { errEl.textContent = 'Supabase nicht konfiguriert – bitte zuerst einrichten.'; return; }
  btn.textContent = 'Anmelden…'; btn.disabled = true;
  try {
    const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': CONFIG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Anmeldung fehlgeschlagen');
    const userId = data.user?.id || null;
    setSession({ access_token: data.access_token, refresh_token: data.refresh_token, username, user_id: userId });
    if (typeof Sentry !== 'undefined') Sentry.setUser({ email: username, id: userId });
    await logActivity('login_success', username, userId);
    showApp(username);
  } catch(e) {
    errEl.textContent = e.message;
    if (typeof Sentry !== 'undefined') Sentry.captureMessage('login_fehler', { level: 'info', extra: { email: username, fehler: e.message } });
  } finally {
    btn.textContent = 'Anmelden'; btn.disabled = false;
  }
}

async function logoutUser() {
  if (!confirm('Abmelden?')) return;
  const s = getSession();
  await logActivity('logout', s?.username, s?.user_id);
  try {
    await fetch(`${CONFIG.url}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'apikey': CONFIG.key, 'Authorization': `Bearer ${authToken()}` }
    });
  } catch {}
  if (typeof Sentry !== 'undefined') Sentry.setUser(null);
  clearSession();
  document.getElementById('userSection').style.display   = 'none';
  document.getElementById('noUserSection').style.display = 'block';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginOverlay').classList.remove('hidden');
}

async function refreshSession() {
  const s = getSession();
  if (!s?.refresh_token || !CONFIG.url || !CONFIG.key) return false;
  try {
    const res = await fetch(`${CONFIG.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': CONFIG.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!res.ok) return false;
    const data = await res.json();
    setSession({ ...s, access_token: data.access_token, refresh_token: data.refresh_token });
    return true;
  } catch { return false; }
}

async function loadBetriebId() {
  try {
    const res = await fetch(`${CONFIG.url}/rest/v1/betrieb_mitglieder?select=betrieb_id&limit=1`, { headers: sbHeaders() });
    if (!res.ok) return;
    const rows = await res.json();
    if (rows.length) {
      BETRIEB_ID = rows[0].betrieb_id;
      localStorage.setItem('sb_betrieb_id', BETRIEB_ID);
    }
  } catch {}
}

async function showApp(username) {
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('loggedInUser').textContent    = username;
  document.getElementById('userSection').style.display   = 'block';
  document.getElementById('noUserSection').style.display = 'none';
  if (CONFIG.url && CONFIG.key) {
    await loadBetriebId();
    setSyncUI('idle');
    loadMetadata();
    if (localStorage.getItem('sb_pending')) showToast('🔄 Offline-Einträge werden synchronisiert…','var(--blau)');
    syncFromSupabase();
  }
}


async function checkAuth() {
  if (!CONFIG.url || !CONFIG.key) {
    // Nicht konfiguriert → App direkt öffnen (Ersteinrichtung)
    document.getElementById('loginOverlay').classList.add('hidden');
    return;
  }
  const s = getSession();
  if (s?.access_token) {
    const ok = await refreshSession();
    if (ok) { showApp(getSession().username); return; }
    clearSession();
  }
  // Login-Overlay zeigen (ist per Default sichtbar)
}

// ── SUPABASE INTEGRATION ──────────────────────────────────────

const CONFIG = {
  get url() { return (PRESET_URL || localStorage.getItem('sb_url') || '').replace(/\/$/, ''); },
  get key() { return PRESET_KEY || localStorage.getItem('sb_key') || ''; },
  table: 'ernteeintraege'
};

let isSyncing = false;

function sbHeaders() {
  const token = authToken() || CONFIG.key;
  return { 'apikey': CONFIG.key, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// Zeilen aus DB → App-Objekt (IDs + aufgelöste Anzeigenamen)
function rowToEntry(r) {
  const gb    = GEBINDE.find(g => g.id === r.gebinde_id);
  const menge = r.menge ?? 1;
  return {
    id: r.id, datum: r.datum, uhrzeit: r.uhrzeit, stunde: r.stunde, reihe: r.reihe ?? null,
    menge,
    gewicht_kg: gb?.gewicht_kg != null ? parseFloat((menge * gb.gewicht_kg).toFixed(3)) : 0,
    // IDs (für DB-Schreibzugriffe)
    feld_id:      r.feld_id      ?? null,
    sorte_id:     r.sorte_id     ?? null,
    pfluecker_id: r.pfluecker_id ?? null,
    qualitaet_id: r.qualitaet_id ?? null,
    gebinde_id:   r.gebinde_id   ?? null,
    etiketten_id: r.etiketten_id ?? null,
    // Anzeigenamen (aus Metadaten aufgelöst)
    feld:     FELDER_DATA.find(f => f.id === r.feld_id)?.name        || '–',
    sorte:    SORTEN_DATA.find(s => s.id === r.sorte_id)?.name       || '',
    pflücker: pflFullName(PFLÜCKER_DATA.find(p => p.id === r.pfluecker_id)) ,
    qualität: QUALITAETEN.find(q => q.id === r.qualitaet_id)?.code   || null,
    korbtyp:  gb?.label        || '–',
  };
}

// App-Objekt → DB-Zeile (nur FK-Spalten)
function entryToRow(e) {
  return {
    id: e.id, datum: e.datum, uhrzeit: e.uhrzeit, stunde: e.stunde, reihe: e.reihe ?? null,
    menge:        e.menge        ?? 1,
    betrieb_id:   BETRIEB_ID     ?? null,
    feld_id:      e.feld_id      ?? null,
    sorte_id:     e.sorte_id     ?? null,
    pfluecker_id: e.pfluecker_id ?? null,
    qualitaet_id: e.qualitaet_id ?? null,
    gebinde_id:   e.gebinde_id   ?? null,
    etiketten_id: e.etiketten_id ?? null,
  };
}

// Nach localStorage-Reload: gewicht_kg aus menge + gebinde neu berechnen
function rehydrateEntry(e) {
  const gb = GEBINDE.find(g => g.id === e.gebinde_id);
  e.gewicht_kg = gb?.gewicht_kg != null ? parseFloat(((e.menge ?? 1) * gb.gewicht_kg).toFixed(3)) : 0;
  return e;
}

function setSyncUI(status, label) {
  const pill = document.getElementById('syncPill');
  if (!pill) return;
  if (!CONFIG.url || !CONFIG.key) { pill.className = 'sync-pill hidden'; return; }
  const icons  = { idle:'○', syncing:'↻', synced:'✓', offline:'⚠', error:'✗' };
  const labels = { idle:'Supabase', syncing:'Sync…', synced:'Synchronisiert', offline:'Offline', error:'Fehler' };
  pill.className = 'sync-pill ' + status;
  pill.textContent = (icons[status]||'') + ' ' + (label || labels[status] || status);
}

// Heutige Einträge aus Supabase laden
async function loadFromSupabase(date) {
  const res = await fetch(
    `${CONFIG.url}/rest/v1/${CONFIG.table}?datum=eq.${date}&order=id.desc`,
    { headers: sbHeaders() }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).map(rowToEntry);
}

// Einen Eintrag in Supabase einfügen
async function insertToSupabase(entry) {
  const res = await fetch(`${CONFIG.url}/rest/v1/${CONFIG.table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
    body: JSON.stringify(entryToRow(entry))
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
}

// Offline-Queue: ausstehende Einträge hochladen
async function flushPending() {
  const pending = JSON.parse(localStorage.getItem('sb_pending') || '[]');
  if (!pending.length) return;
  for (const entry of pending) {
    await insertToSupabase(entry);
  }
  localStorage.removeItem('sb_pending');
}

// Beim Start: DB laden + Offline-Queue leeren
async function syncFromSupabase() {
  if (!CONFIG.url || !CONFIG.key) return;
  if (isSyncing) return;
  isSyncing = true;
  setSyncUI('syncing');
  try {
    await flushPending();
    const dbEntries = await loadFromSupabase(todayStr);
    // Nach erfolgreichem Sync ist die DB die einzige Wahrheitsquelle
    entries = dbEntries;
    // Lokal speichern (andere Tage behalten)
    const localAll  = JSON.parse(localStorage.getItem('ernteEntries') || '[]');
    const otherDays = localAll.filter(e => e.datum !== todayStr);
    localStorage.setItem('ernteEntries', JSON.stringify([...entries, ...otherDays]));
    updateSummary();
    renderRecentScans();
    const activePage = document.querySelector('.page.active');
    if (activePage?.id === 'page-protokoll') renderProtokoll();
    if (activePage?.id === 'page-statistik') renderStatistik();
    setSyncUI('synced');
    setTimeout(() => setSyncUI('idle'), 3000);
  } catch(e) {
    console.error('Supabase sync failed:', e);
    setSyncUI(navigator.onLine ? 'error' : 'offline');
    setTimeout(() => setSyncUI('idle'), 5000);
  } finally {
    isSyncing = false;
  }
}

// Neuen Eintrag direkt in Supabase schreiben (oder in Pending-Queue)
async function pushEntry(entry) {
  if (!CONFIG.url || !CONFIG.key) return;
  setSyncUI('syncing');
  try {
    await insertToSupabase(entry);
    setSyncUI('synced');
    setTimeout(() => setSyncUI('idle'), 2000);
  } catch(e) {
    console.error('Supabase insert failed:', e);
    // Offline-Queue
    const pending = JSON.parse(localStorage.getItem('sb_pending') || '[]');
    pending.push(entry);
    localStorage.setItem('sb_pending', JSON.stringify(pending));
    setSyncUI('offline');
    setTimeout(() => setSyncUI('idle'), 5000);
  }
}

window.addEventListener('online', () => {
  if (CONFIG.url && CONFIG.key && (localStorage.getItem('sb_pending'))) {
    showToast('🔄 Verbindung wiederhergestellt – synchronisiere…', 'var(--blau)');
    syncFromSupabase();
  }
});

async function loadMetadata() {
  if (!CONFIG.url || !CONFIG.key) return;
  try {
    const headers = sbHeaders();
    const [fR, sR, pR, qR, gR, faR] = await Promise.all([
      fetch(`${CONFIG.url}/rest/v1/felder?aktiv=eq.true&order=name`,             {headers}),
      fetch(`${CONFIG.url}/rest/v1/sorten?aktiv=eq.true&order=name`,             {headers}),
      fetch(`${CONFIG.url}/rest/v1/pfluecker?aktiv=eq.true&order=nachname`,          {headers}),
      fetch(`${CONFIG.url}/rest/v1/qualitaeten?aktiv=eq.true&order=sort_order`,  {headers}),
      fetch(`${CONFIG.url}/rest/v1/gebinde?aktiv=eq.true&order=sort_order`,      {headers}),
      fetch(`${CONFIG.url}/rest/v1/fruchtarten?aktiv=eq.true&order=sort_order`,  {headers}),
    ]);
    if (fR.ok) {
      FELDER_DATA = await fR.json();
      FELDER = FELDER_DATA.map(r => r.name);
      localStorage.setItem('sb_felder', JSON.stringify(FELDER));
      localStorage.setItem('sb_felder_data', JSON.stringify(FELDER_DATA));
    }
    if (sR.ok) {
      SORTEN_DATA = await sR.json();
      SORTEN = SORTEN_DATA.map(r => r.name);
      localStorage.setItem('sb_sorten', JSON.stringify(SORTEN));
      localStorage.setItem('sb_sorten_data', JSON.stringify(SORTEN_DATA));
    }
    if (pR.ok) {
      PFLÜCKER_DATA = await pR.json();
      PFLÜCKER = PFLÜCKER_DATA.map(r => pflFullName(r));
      PFLÜCKER_NR_MAP    = Object.fromEntries(PFLÜCKER_DATA.filter(r => r.mitarbeiter_nr != null).map(r => [r.mitarbeiter_nr, pflFullName(r)]));
      PFLÜCKER_NR_ID_MAP = Object.fromEntries(PFLÜCKER_DATA.filter(r => r.mitarbeiter_nr != null).map(r => [r.mitarbeiter_nr, r.id]));
      localStorage.setItem('sb_pfluecker',       JSON.stringify(PFLÜCKER));
      localStorage.setItem('sb_pfluecker_nr',    JSON.stringify(PFLÜCKER_NR_MAP));
      localStorage.setItem('sb_pfluecker_nr_id', JSON.stringify(PFLÜCKER_NR_ID_MAP));
      localStorage.setItem('sb_pfluecker_data',  JSON.stringify(PFLÜCKER_DATA));
    }
    if (qR.ok)  { QUALITAETEN = await qR.json();  localStorage.setItem('sb_qualitaeten', JSON.stringify(QUALITAETEN)); }
    if (gR.ok)  { GEBINDE     = await gR.json();  localStorage.setItem('sb_gebinde',     JSON.stringify(GEBINDE)); }
    if (faR.ok) {
      FRUCHTARTEN = await faR.json();
      localStorage.setItem('sb_fruchtarten', JSON.stringify(FRUCHTARTEN));
      // Fruchtart im SCHICHT nachschärfen falls Feld bereits gesetzt aber Fruchtart noch null
      if (SCHICHT.feld && !SCHICHT.fruchtart) {
        const feldObj = FELDER_DATA.find(f => f.name === SCHICHT.feld);
        if (feldObj?.fruchtart_id) {
          SCHICHT.fruchtart = FRUCHTARTEN.find(f => f.id === feldObj.fruchtart_id) || null;
          saveSchicht();
        }
      }
    }
    // Update context strip with fresh data
    updateContextStrip();
    // If setup sheet is open, re-render it
    if (!document.getElementById('setupOverlay').classList.contains('hidden')) renderSetupSheet();
  } catch(e) {
    console.warn('Metadaten-Load fehlgeschlagen, nutze Cache/Defaults:', e);
  }
}

// ── QR SCANNER ────────────────────────────────────────────────

let scanStream = null;
let scanAF     = null;

async function openScan() {
  if (typeof jsQR === 'undefined') {
    showToast('⚠️ Scanner nicht verfügbar (offline?)', 'var(--braun)'); return;
  }
  document.getElementById('scanOverlay').classList.remove('hidden');
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.getElementById('scanVideo');
    video.srcObject = scanStream;
    await video.play();
    scanFrame();
  } catch(e) {
    showToast('❌ Kamerazugriff verweigert', 'var(--rot-dunkel)');
    closeScan();
  }
}

function closeScan() {
  if (scanAF)     { cancelAnimationFrame(scanAF); scanAF = null; }
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
  scanLocked = false;
  document.getElementById('scanOverlay').classList.add('hidden');
}

let scanLocked = false;

function scanFrame() {
  const video  = document.getElementById('scanVideo');
  const canvas = document.getElementById('scanCanvas');
  if (!scanStream) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA && !scanLocked) {
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code) {
      scanLocked = true;
      handleScan(code.data.trim());
      return;
    }
  }
  scanAF = requestAnimationFrame(scanFrame);
}

async function handleScan(raw) {
  const nrMatch = raw.match(/^(\d+)\/(\d+)$/);
  if (!nrMatch) {
    showToast('⚠️ Ungültiger QR-Code', 'var(--braun)');
    scanLocked = false; scanAF = requestAnimationFrame(scanFrame); return;
  }
  const pflueckerNr = parseInt(nrMatch[1]);
  const lfdNr       = parseInt(nrMatch[2]);
  const pickerName  = PFLÜCKER_NR_MAP[pflueckerNr];
  if (!pickerName) {
    showToast(`⚠️ Unbekannte Mitarbeiter-Nr: ${pflueckerNr}`, 'var(--braun)');
    scanLocked = false; scanAF = requestAnimationFrame(scanFrame); return;
  }

  // Offline: Prüfung nicht möglich, trotzdem erfassen (ohne etiketten_id)
  if (!CONFIG.url || !CONFIG.key || !navigator.onLine) {
    showToast('⚠️ Offline – keine Duplikat-Prüfung', 'var(--braun)');
    state._etikettenId = null;
    closeScan();
    await addEntryFromScan(pickerName);
    playBeep();
    showScanSuccess(pickerName);
    return;
  }

  try {
    // Atomares PATCH: nur wenn gescannt_am noch NULL → verhindert Race Condition
    const patchRes = await fetch(
      `${CONFIG.url}/rest/v1/etiketten?pfluecker_nr=eq.${pflueckerNr}&lfd_nr=eq.${lfdNr}&gescannt_am=is.null`,
      {
        method: 'PATCH',
        headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
        body: JSON.stringify({ gescannt_am: new Date().toISOString() })
      }
    );
    if (!patchRes.ok) throw new Error(`HTTP ${patchRes.status}`);
    const patched = await patchRes.json();

    if (!patched.length) {
      // 0 Zeilen aktualisiert → Etikett unbekannt oder bereits gescannt
      const checkRes = await fetch(
        `${CONFIG.url}/rest/v1/etiketten?pfluecker_nr=eq.${pflueckerNr}&lfd_nr=eq.${lfdNr}&select=id,gescannt_am`,
        { headers: sbHeaders() }
      );
      const rows = await checkRes.json();
      if (!rows.length) {
        showToast('⚠️ Etikett unbekannt – bitte neu drucken', 'var(--braun)');
      } else {
        const d = new Date(rows[0].gescannt_am).toLocaleString('de-DE',
          { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        closeScan(); playErrorBeep();
        showToast(`❌ Doppelerfassung! Bereits gescannt: ${d}`, 'var(--rot-dunkel)');
        return;
      }
      scanLocked = false; scanAF = requestAnimationFrame(scanFrame); return;
    }

    // Erstscan – etiketten.id für Rückverlinkung merken
    state._etikettenId = patched[0].id;
    closeScan();
    await addEntryFromScan(pickerName);

    // eintrag_id im Etikett setzen (fire & forget)
    if (entries[0]?.id) {
      fetch(`${CONFIG.url}/rest/v1/etiketten?id=eq.${patched[0].id}`, {
        method: 'PATCH',
        headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ eintrag_id: entries[0].id })
      }).catch(() => {});
    }
    playBeep();
    showScanSuccess(pickerName);
  } catch(e) {
    showToast('❌ Fehler bei Prüfung: ' + e.message, 'var(--rot-dunkel)');
    scanLocked = false; scanAF = requestAnimationFrame(scanFrame);
  }
}

// ── QR-CODES DRUCKEN ──────────────────────────────────────────

function printQRCodes() {
  const win = window.open('', '_blank');
  if (!win) { showToast('⚠️ Popup blockiert – bitte erlauben', 'var(--braun)'); return; }
  const names = JSON.stringify(PFLÜCKER);
  win.document.write(`<!DOCTYPE html><html lang="de"><head>
<meta charset="UTF-8">
<title>Pflücker QR-Codes</title>
<script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
<style>
  body { font-family: sans-serif; padding: 16px; background: #fff; color: #000; }
  h2 { margin-bottom: 16px; font-size: 18px; }
  .grid { display: flex; flex-wrap: wrap; gap: 16px; }
  .card { border: 1px solid #ccc; border-radius: 8px; padding: 12px; text-align: center; width: 140px; page-break-inside: avoid; }
  .name { font-size: 13px; font-weight: 700; margin-top: 8px; word-break: break-word; }
  canvas { display: block; margin: 0 auto; }
  @media print { body { padding: 6mm; } h2 { display: none; } @page { margin: 8mm; } }
</style></head><body>
<h2>🍓 Pflücker QR-Codes</h2>
<div class="grid" id="grid"></div>
<script>
  const pickers = ${names};
  const grid = document.getElementById('grid');
  pickers.forEach(name => {
    const card = document.createElement('div');
    card.className = 'card';
    const canvas = document.createElement('canvas');
    const label  = document.createElement('div');
    label.className = 'name';
    label.textContent = name;
    card.appendChild(canvas);
    card.appendChild(label);
    grid.appendChild(card);
    QRCode.toCanvas(canvas, name, { width: 116, margin: 1 });
  });
  setTimeout(() => window.print(), 800);
<\/script></body></html>`);
  win.document.close();
}

// ── PROTOKOLL EDIT / DELETE ───────────────────────────────────

function saveEntriesToLocal() {
  const localAll = JSON.parse(localStorage.getItem('ernteEntries') || '[]');
  const others   = localAll.filter(e => e.datum !== todayStr);
  localStorage.setItem('ernteEntries', JSON.stringify([...entries, ...others]));
}

async function deleteEntry(id) {
  if (!confirm('Eintrag löschen?')) return;
  entries = entries.filter(e => e.id !== id);
  saveEntriesToLocal();
  updateSummary();
  renderProtokoll();
  renderRecentScans();
  if (CONFIG.url && CONFIG.key) {
    try {
      await fetch(`${CONFIG.url}/rest/v1/${CONFIG.table}?id=eq.${id}`, {
        method: 'DELETE',
        headers: sbHeaders()
      });
    } catch(e) { console.warn('DELETE fehlgeschlagen:', e); }
  }
}

let editEntryId = null;

function openEditModal(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;
  editEntryId = id;
  document.getElementById('editInfo').textContent = `${e.pflücker} · ${e.feld} · ${e.uhrzeit} Uhr`;
  document.getElementById('editMenge').value = e.menge ?? 1;
  document.getElementById('editOverlay').classList.remove('hidden');
  document.getElementById('editMenge').focus();
}

function closeEditModal() {
  editEntryId = null;
  document.getElementById('editOverlay').classList.add('hidden');
}

async function saveEditEntry() {
  const e = entries.find(x => x.id === editEntryId);
  if (!e) return;
  const menge = parseFloat(document.getElementById('editMenge').value);
  if (isNaN(menge) || menge <= 0) { showToast('⚠️ Ungültige Menge', 'var(--braun)'); return; }
  e.menge = menge;
  rehydrateEntry(e); // gewicht_kg neu berechnen
  saveEntriesToLocal();
  updateSummary();
  renderProtokoll();
  renderRecentScans();
  closeEditModal();
  if (CONFIG.url && CONFIG.key) {
    try {
      await fetch(`${CONFIG.url}/rest/v1/${CONFIG.table}?id=eq.${editEntryId}`, {
        method: 'PATCH',
        headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ menge })
      });
    } catch(e) { console.warn('PATCH fehlgeschlagen:', e); }
  }
}

// ── EINSTELLUNGEN HANDLER ──────────────────────────────────────

async function testConnection() {
  if (!CONFIG.url || !CONFIG.key) { showToast('⚠️ Erst konfigurieren!', 'var(--braun)'); return; }
  updateSettingsStatus('syncing', 'Teste Verbindung…', '');
  try {
    const res = await fetch(`${CONFIG.url}/rest/v1/${CONFIG.table}?limit=1`, { headers: sbHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const host = new URL(CONFIG.url).hostname;
    updateSettingsStatus('synced', 'Verbindung OK ✓', host);
    showToast('✅ Verbindung erfolgreich!');
  } catch(e) {
    updateSettingsStatus('error', 'Verbindung fehlgeschlagen', e.message);
    showToast('❌ ' + e.message, 'var(--rot-dunkel)');
  }
}

function updateSettingsStatus(status, text, sub) {
  const dot   = document.getElementById('statusDot');
  const txt   = document.getElementById('statusText');
  const subEl = document.getElementById('statusSub');
  if (!dot) return;
  if (!status) {
    const ok = CONFIG.url && CONFIG.key;
    status = ok ? 'synced' : 'offline';
    text   = ok ? 'Konfiguriert' : 'Nicht konfiguriert';
    sub    = ok ? new URL(CONFIG.url).hostname : '';
  }
  dot.className     = 'status-dot ' + status;
  txt.textContent   = text;
  subEl.textContent = sub !== undefined ? sub : '';
}

// ── SCAN-FIRST WORKFLOW FUNCTIONS ─────────────────────────────

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}
function playErrorBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Zwei absteigende Töne: 440 Hz → 220 Hz
    [{ f:440, t:0 }, { f:280, t:0.2 }].forEach(({ f, t }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = f; osc.type = 'square';
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.18);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.18);
    });
  } catch {}
}

function showScanSuccess(name) {
  const popup = document.getElementById('scanSuccess');
  const { gebinde } = SCHICHT;
  const kg = gebinde?.gewicht_kg != null ? (scanMenge * gebinde.gewicht_kg).toFixed(1) + ' kg · ' + scanMenge + '×' : '';
  document.getElementById('sucName').textContent = '✅ ' + name;
  document.getElementById('sucWeight').textContent = kg;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 2000);
  // reset menge to 1 after scan
  scanMenge = 1.0;
  document.querySelectorAll('.menge-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById('mengeCustom').value = '';
}

async function addEntryFromScan(pickerName) {
  const { feld, sorte, gebinde } = SCHICHT;
  if (!feld || !gebinde) return;
  const feldObj  = FELDER_DATA.find(f => f.name === feld);
  const sorteObj = SORTEN_DATA.find(s => s.name === sorte);
  const pflObj   = PFLÜCKER_DATA.find(p => pflFullName(p) === pickerName);
  const menge    = scanMenge;
  const entry = {
    id: Date.now(), datum: todayStr,
    uhrzeit: new Date().toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'}),
    stunde: new Date().getHours(), reihe: null,
    menge,
    // IDs
    feld_id:      feldObj?.id  ?? null,
    sorte_id:     sorteObj?.id ?? null,
    pfluecker_id: pflObj?.id   ?? null,
    gebinde_id:   gebinde.id   ?? null,
    qualitaet_id: null,
    etiketten_id: state._etikettenId ?? null,
    // Anzeigenamen
    feld, sorte: sorte || '', pflücker: pickerName, qualität: null, korbtyp: gebinde.label,
    gewicht_kg: gebinde.gewicht_kg != null ? parseFloat((menge * gebinde.gewicht_kg).toFixed(3)) : 0,
  };
  state._etikettenId = null;
  entries.unshift(entry);
  saveEntries(); updateSummary(); renderRecentScans();
  pushEntry(entry);
}

function startScanOrWarn() {
  if (!SCHICHT.feld || !SCHICHT.gebinde) { openSetup(); return; }
  openScan();
}

// ── MANUELLE ERFASSUNG ────────────────────────────────────────
let manualSelectedPicker = null;
let setupFeldFilterId = null; // Fruchtart-Filter im Schicht-Setup

function openManualEntry() {
  if (!SCHICHT.feld || !SCHICHT.gebinde) { openSetup(); return; }
  manualSelectedPicker = null;
  const btn = document.getElementById('manualConfirmBtn');
  btn.disabled = true; btn.style.opacity = '.4';
  renderManualPflückerList();
  document.getElementById('manualOverlay').classList.remove('hidden');
}

function closeManualEntry() {
  document.getElementById('manualOverlay').classList.add('hidden');
  manualSelectedPicker = null;
}

function renderManualPflückerList() {
  const el = document.getElementById('manualPflückerList');
  if (!el) return;
  el.innerHTML = PFLÜCKER.map(name => {
    const safe = name.replace(/'/g, '&#39;');
    const active = manualSelectedPicker === name ? 'active-green' : '';
    return `<div class="chip ${active}" onclick="selectManualPicker('${safe}')">${name}</div>`;
  }).join('');
}

function selectManualPicker(name) {
  manualSelectedPicker = name;
  const btn = document.getElementById('manualConfirmBtn');
  btn.disabled = false; btn.style.opacity = '1';
  renderManualPflückerList();
}

async function confirmManualEntry() {
  if (!manualSelectedPicker) return;
  const pickerName = manualSelectedPicker;
  const pflObj = PFLÜCKER_DATA.find(p => pflFullName(p) === pickerName);
  if (!pflObj?.mitarbeiter_nr) {
    showToast('⚠️ Mitarbeiter hat keine Nummer – bitte im Admin-Panel prüfen', 'var(--braun)');
    return;
  }
  closeManualEntry();

  // Offline-Fallback: kein Etikett-Eintrag, nur Erfassung
  if (!CONFIG.url || !CONFIG.key || !navigator.onLine) {
    state._etikettenId = null;
    await addEntryFromScan(pickerName);
    playBeep(); showScanSuccess(pickerName); return;
  }

  try {
    // Nächste lfd_nr für diesen Pflücker ermitteln
    const maxRes = await fetch(
      `${CONFIG.url}/rest/v1/etiketten?pfluecker_nr=eq.${pflObj.mitarbeiter_nr}&order=lfd_nr.desc&limit=1&select=lfd_nr`,
      { headers: sbHeaders() }
    );
    if (!maxRes.ok) throw new Error(`HTTP ${maxRes.status}`);
    const maxRows = await maxRes.json();
    const nextLfd = maxRows.length ? maxRows[0].lfd_nr + 1 : 1;

    // Neues Etikett direkt als gescannt anlegen
    const insRes = await fetch(`${CONFIG.url}/rest/v1/etiketten`, {
      method: 'POST',
      headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify({
        pfluecker_nr: pflObj.mitarbeiter_nr,
        lfd_nr: nextLfd,
        gescannt_am: new Date().toISOString()
      })
    });
    if (!insRes.ok) throw new Error(`HTTP ${insRes.status}`);
    const inserted = await insRes.json();
    const newEtikettenId = inserted[0]?.id ?? null;

    state._etikettenId = newEtikettenId;
    await addEntryFromScan(pickerName);

    // eintrag_id zurückschreiben (fire & forget)
    if (newEtikettenId && entries[0]?.id) {
      fetch(`${CONFIG.url}/rest/v1/etiketten?id=eq.${newEtikettenId}`, {
        method: 'PATCH',
        headers: { ...sbHeaders(), 'Prefer': 'return=minimal' },
        body: JSON.stringify({ eintrag_id: entries[0].id })
      }).catch(() => {});
    }

    playBeep(); showScanSuccess(pickerName);
  } catch(e) {
    showToast('❌ Fehler: ' + e.message, 'var(--rot-dunkel)');
  }
}

function selectMenge(m, btn) {
  scanMenge = m;
  document.getElementById('mengeCustom').value = '';
  document.querySelectorAll('.menge-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function selectMengeCustom(m) {
  scanMenge = m;
  document.querySelectorAll('.menge-btn').forEach(b => b.classList.remove('active'));
}

function saveSchicht() {
  localStorage.setItem('schicht_feld',      SCHICHT.feld      || '');
  localStorage.setItem('schicht_fruchtart', JSON.stringify(SCHICHT.fruchtart));
  localStorage.setItem('schicht_sorte',     SCHICHT.sorte     || '');
  localStorage.setItem('schicht_gebinde',   JSON.stringify(SCHICHT.gebinde));
}

function updateContextStrip() {
  const { feld, fruchtart, sorte, gebinde } = SCHICHT;
  const isSet = !!(feld && gebinde);
  const mainEl  = document.getElementById('ctxMain');
  const subEl   = document.getElementById('ctxSub');
  const heroBtn = document.getElementById('scanHeroBtn');
  const heroSub = document.getElementById('heroSub');
  if (isSet) {
    const emoji = fruchtart?.emoji ? fruchtart.emoji + ' ' : '';
    const sorteStr = sorte ? '  ·  ' + sorte : '';
    mainEl.textContent = emoji + feld + sorteStr;
    subEl.textContent  = gebinde.label + (gebinde.gewicht_kg != null ? '  ·  ' + gebinde.gewicht_kg + ' kg/Stk' : '  ·  Manuell');
    heroBtn?.classList.remove('disabled');
    if (heroSub) heroSub.textContent = gebinde.gewicht_kg != null ? gebinde.gewicht_kg + ' kg / Stück' : 'Manuelles Gewicht';
  } else {
    mainEl.textContent = 'Schicht einrichten';
    subEl.textContent  = 'Feld und Gebinde wählen ⟶';
    heroBtn?.classList.add('disabled');
    if (heroSub) heroSub.textContent = 'Erst Schicht einrichten ↑';
  }
}

function openSetup() {
  setupFeldFilterId = null;
  document.getElementById('setupOverlay').classList.remove('hidden');
  renderSetupSheet();
}
function closeSetup() {
  document.getElementById('setupOverlay').classList.add('hidden');
  updateContextStrip();
}

function renderSetupSheet() {
  const el = document.getElementById('setupContent');

  // Sorten gefiltert nach aktuell gewählter Fruchtart
  let filteredSorten = SORTEN;
  if (SCHICHT.fruchtart && SORTEN_DATA.length) {
    const fs = SORTEN_DATA.filter(s => s.fruchtart_id === SCHICHT.fruchtart.id).map(s => s.name);
    if (fs.length) filteredSorten = fs;
  }

  function chips(items, selected, fn) {
    return items.map(item => {
      const active = item === selected ? ' active-orange' : '';
      return `<div class="chip${active}" onclick="${fn}('${item.replace(/'/g,"\\'")}', this)" style="margin-bottom:4px">${item}</div>`;
    }).join('');
  }
  function fruchtartChips() {
    if (!FRUCHTARTEN.length) return '<span style="color:var(--text-dim);font-size:13px">Keine Fruchtarten geladen</span>';
    return FRUCHTARTEN.map(f => {
      const active = SCHICHT.fruchtart?.id === f.id ? ' active-orange' : '';
      return `<div class="chip${active}" onclick="selectSchichtFruchtart(${f.id})">${f.emoji} ${f.name}</div>`;
    }).join('');
  }
  function gebindeChips() {
    return GEBINDE.map(g => {
      const active = SCHICHT.gebinde?.label === g.label ? ' active-orange' : '';
      const sub = g.gewicht_kg != null ? g.gewicht_kg + ' kg' : 'Manuell';
      return `<div class="chip${active}" onclick="selectSchichtGebinde('${g.label.replace(/'/g,"\\'")}', this)">${g.label}<br><span style="font-size:10px;opacity:.7">${sub}</span></div>`;
    }).join('');
  }

  const fruchtartBlock = SCHICHT.feld ? `
    <div class="setup-section">
      <div class="section-title" style="display:flex;align-items:center;gap:6px">🌱 Fruchtart
        <span style="font-size:10px;color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0;margin-left:2px">(änderbar falls falsch)</span>
      </div>
      <div class="chip-wrap">${fruchtartChips()}</div>
    </div>` : '';

  const sorteBlock = SCHICHT.feld ? `
    <div class="setup-section">
      <div class="section-title" style="display:flex;align-items:center;gap:6px">🍓 Sorte
        <span style="font-size:10px;color:var(--text-dim);font-weight:400;text-transform:none;letter-spacing:0;margin-left:2px">(optional)</span>
      </div>
      <div class="chip-wrap">
        <div class="chip${!SCHICHT.sorte ? ' active-orange' : ''}" onclick="selectSchichtSorte(null)" style="margin-bottom:4px">– keine –</div>
        ${filteredSorten.length ? chips(filteredSorten, SCHICHT.sorte, 'selectSchichtSorte') : '<span style="color:var(--text-dim);font-size:13px">Keine Sorten für diese Fruchtart</span>'}
      </div>
    </div>` : '';

  // Felder nach aktuellem Filter einschränken
  const fruchtartenMitFeld = FRUCHTARTEN.filter(f =>
    FELDER_DATA.some(fd => fd.fruchtart_id === f.id)
  );
  const filteredFelder = setupFeldFilterId
    ? FELDER_DATA.filter(f => f.fruchtart_id === setupFeldFilterId).map(f => f.name)
    : FELDER;

  function feldFilterChips() {
    if (fruchtartenMitFeld.length < 2) return '';
    const btns = [
      `<button class="seg-btn${!setupFeldFilterId ? ' active' : ''}" onclick="setSetupFeldFilter(null)">Alle</button>`,
      ...fruchtartenMitFeld.map(f =>
        `<button class="seg-btn${setupFeldFilterId === f.id ? ' active' : ''}" onclick="setSetupFeldFilter(${f.id})">${f.emoji} ${f.name}</button>`
      )
    ].join('');
    return `<div class="seg-control">${btns}</div>`;
  }

  const canClose = SCHICHT.feld && SCHICHT.gebinde;
  el.innerHTML = `
    <div class="setup-section">
      <div class="section-title">🗺️ Feld <span style="color:var(--rot-hell);font-size:11px">*</span></div>
      ${feldFilterChips()}
      <div class="chip-wrap">${filteredFelder.length ? chips(filteredFelder, SCHICHT.feld, 'selectSchichtFeld') : '<span style="color:var(--text-dim);font-size:13px">Keine Felder für diese Fruchtart</span>'}</div>
    </div>
    ${fruchtartBlock}
    ${sorteBlock}
    <div class="setup-section">
      <div class="section-title">🧺 Gebinde (Standard) <span style="color:var(--rot-hell);font-size:11px">*</span></div>
      <div class="chip-wrap">${gebindeChips()}</div>
    </div>
    <button onclick="${canClose ? 'closeSetup()' : ''}"
      style="width:100%;padding:14px;background:${canClose ? 'var(--rot)' : 'rgba(255,255,255,.08)'};border:none;border-radius:12px;font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:${canClose ? '#fff' : 'var(--text-dim)'};cursor:${canClose ? 'pointer' : 'default'};margin-top:6px">
      ${canClose ? '✅ Übernehmen' : '⚠️ Feld und Gebinde wählen'}
    </button>
  `;
}

function setSetupFeldFilter(id) {
  setupFeldFilterId = id;
  renderSetupSheet();
}
function selectSchichtFeld(name) {
  SCHICHT.feld = name;
  SCHICHT.sorte = null;
  // Fruchtart automatisch aus FELDER_DATA ermitteln
  const feldObj = FELDER_DATA.find(f => f.name === name);
  SCHICHT.fruchtart = feldObj?.fruchtart_id
    ? (FRUCHTARTEN.find(f => f.id === feldObj.fruchtart_id) || null)
    : null;
  saveSchicht(); renderSetupSheet();
}
function selectSchichtFruchtart(id) {
  SCHICHT.fruchtart = FRUCHTARTEN.find(f => f.id === id) || null;
  SCHICHT.sorte = null;
  saveSchicht(); renderSetupSheet();
}
function selectSchichtSorte(name) {
  SCHICHT.sorte = name; // null = "keine"
  saveSchicht(); renderSetupSheet();
}
function selectSchichtGebinde(label) {
  SCHICHT.gebinde = GEBINDE.find(g => g.label === label) || null;
  saveSchicht(); renderSetupSheet();
}

function renderRecentScans() {
  const el = document.getElementById('recentList');
  if (!el) return;
  if (!entries.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><p>Noch keine Erfassungen heute</p></div>';
    return;
  }
  el.innerHTML = entries.slice(0, 8).map(e => `
    <div class="proto-item">
      <div style="flex:1;min-width:0">
        <div class="proto-name">${e.pflücker}</div>
        <div class="proto-meta">${e.korbtyp || ''} · ${e.feld}${e.etiketten_id ? ' · <span style="color:var(--accent)">#' + String(e.etiketten_id).padStart(5,'0') + '</span>' : ''} · ${e.uhrzeit} Uhr</div>
      </div>
      <div class="proto-actions">
        <div class="proto-weight">${e.gewicht_kg.toFixed(1)} kg</div>
        <button class="proto-action-btn" onclick="openEditModal(${e.id})">✏️</button>
        <button class="proto-action-btn del" onclick="deleteEntry(${e.id})">🗑</button>
      </div>
    </div>`).join('');
}

// ──────────────────────────────────────────────────────────────

init();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          // Neuer SW wartet → Banner anzeigen
          showUpdateBanner();
        }
      });
    });
  }).catch(() => {});
}

function showUpdateBanner() {
  const existing = document.getElementById('updateBanner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'updateBanner';
  banner.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:var(--gruen); color:#fff; border-radius:12px;
    padding:10px 16px; display:flex; align-items:center; gap:12px;
    font-size:13px; font-weight:700; z-index:9999;
    box-shadow:0 4px 16px rgba(0,0,0,.4); white-space:nowrap;
  `;
  banner.innerHTML = `
    <span>🆕 Update verfügbar</span>
    <button onclick="applyUpdate()" style="background:rgba(255,255,255,.25);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-weight:800;cursor:pointer;font-size:13px;">Jetzt laden</button>
    <button onclick="this.closest('#updateBanner').remove()" style="background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:18px;line-height:1;padding:0;">×</button>
  `;
  document.body.appendChild(banner);
}

function applyUpdate() {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg?.waiting) {
      reg.waiting.postMessage('skipWaiting');
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
    } else {
      location.reload();
    }
  });
}
