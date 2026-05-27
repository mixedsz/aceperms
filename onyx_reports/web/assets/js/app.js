/* ═══════════════════════════════════════════════════════════
   ONYX REPORTS  —  NUI JavaScript
═══════════════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────────────── */
const esc = s => String(s ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const timeAgo = ts => {
  if (!ts) return '—';
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60)    return 'Just now';
  if (d < 3600)  return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
};

const fmtTime = ts => {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
};

const nuiFetch = (cb, body = {}) =>
  fetch(`https://${GetParentResourceName?.() ?? 'onyx_reports'}/${cb}`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(body),
  }).catch(() => {});

/* ── State ────────────────────────────────────────────────── */
const S = {
  isAdmin      : false,
  categories   : [],
  myReports    : {},
  allReports   : {},
  selectedMy   : null,
  selectedAdmin: null,
  activeTab    : 'my-reports',
  activeFilter : 'all',
  activeCatFilter: 'all',
  searchQuery  : '',
  showResolved : false,
  activeMsgTab : 'chat',
  selectedCat  : null,
  pendingClose : null,
};

/* ════════════════════════════════════════════════════════════
   INBOUND  —  messages from Lua
════════════════════════════════════════════════════════════ */
window.addEventListener('message', ({ data }) => {
  switch (data.action) {
    case 'openPanel':     openPanel(data);              break;
    case 'reportCreated': onReportCreated(data.report); break;
    case 'reportUpdated': onReportUpdated(data.report); break;
    case 'receiveMessage':onReceiveMsg(data.reportId, data.message); break;
    case 'closeUI':       closeAll();                   break;
  }
});

/* ════════════════════════════════════════════════════════════
   OPEN PANEL
════════════════════════════════════════════════════════════ */
function openPanel(data) {
  S.isAdmin   = !!data.isAdmin;
  S.activeTab = data.defaultTab ?? 'my-reports';

  // Populate categories in filter dropdown
  if (data.categories) {
    S.categories = data.categories;
    const catSel = document.getElementById('f-category');
    catSel.innerHTML = '<option value="all">All Categories</option>';
    S.categories.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.label;
      catSel.appendChild(o);
    });
  }

  // Show/hide admin-only tabs
  document.querySelectorAll('.admin-only').forEach(el =>
    el.classList.toggle('hidden', !S.isAdmin));

  // Load report data
  S.allReports = {};
  S.myReports  = {};
  (data.reports ?? []).forEach(r => {
    S.allReports[r.id] = r;
    if (data.mySource && r.source === data.mySource) S.myReports[r.id] = r;
  });
  if (data.myReports) data.myReports.forEach(r => { S.myReports[r.id] = r; });

  switchTab(S.activeTab);
  document.getElementById('main-panel').classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════════════════════════ */
document.querySelectorAll('.nav-tab').forEach(btn =>
  btn.addEventListener('click', () => switchTab(btn.dataset.tab))
);

function switchTab(tab) {
  S.activeTab = tab;

  document.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));

  document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));

  switch (tab) {
    case 'my-reports':
      document.getElementById('view-my-reports').classList.remove('hidden');
      renderMyList();
      break;
    case 'admin':
      document.getElementById('view-admin').classList.remove('hidden');
      renderAdminList();
      break;
    case 'stats':
      document.getElementById('view-stats').classList.remove('hidden');
      renderStats();
      break;
  }
}

/* ════════════════════════════════════════════════════════════
   MY REPORTS TAB
════════════════════════════════════════════════════════════ */
function renderMyList() {
  const list = document.getElementById('my-report-list');
  let reports = Object.values(S.myReports);

  if (!S.showResolved) reports = reports.filter(r => r.status !== 'closed');
  reports.sort((a,b) => b.createdAt - a.createdAt);

  if (reports.length === 0) {
    list.innerHTML = `<div class="list-empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No reports yet</p></div>`;
    return;
  }

  list.innerHTML = '';
  reports.forEach(r => list.appendChild(buildCard(r, 'my')));
}

document.getElementById('show-resolved-toggle').addEventListener('change', function() {
  S.showResolved = this.checked;
  renderMyList();
});

function selectMyReport(id) {
  S.selectedMy = id;
  document.querySelectorAll('#my-report-list .r-card').forEach(c =>
    c.classList.toggle('active', c.dataset.id === id));

  const r = S.myReports[id];
  if (!r) return;

  const pane    = document.getElementById('my-detail-pane');
  const empty   = pane.querySelector('.detail-empty-state');
  const content = document.getElementById('my-detail-content');

  empty.classList.add('hidden');
  content.classList.remove('hidden');
  content.innerHTML = buildPlayerDetail(r);
}

function buildPlayerDetail(r) {
  const msgs = (r.messages ?? []).map(m => `
    <div class="msg-bubble ${m.senderType}">
      <div class="bubble-meta">${esc(m.sender)}<span class="bubble-time">${fmtTime(m.timestamp)}</span></div>
      ${esc(m.message)}
    </div>`).join('') || '<span class="no-msgs">No messages yet</span>';

  return `
    <div class="detail-hdr">
      <div class="detail-hdr-badges">
        <span class="pill pill-${r.status}">${statusLabel(r.status)}</span>
        <span class="pill pill-${r.priority ?? 'normal'}">${capitalize(r.priority ?? 'Normal')}</span>
        <span class="pill pill-cat">${esc(r.categoryLabel ?? r.category)}</span>
      </div>
      <h2 class="detail-title">${esc(r.categoryLabel ?? r.category)} — ${esc(r.id)}</h2>
      <div class="detail-meta-row">
        <div class="meta-item">Submitted ${timeAgo(r.createdAt)}</div>
        ${r.handledBy ? `<div class="meta-item"><span class="meta-handler">🛡 Handled by ${esc(r.handledBy)}</span></div>` : ''}
        ${r.closeReason ? `<div class="meta-item">Closed: ${esc(r.closeReason)}</div>` : ''}
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-desc-box">${esc(r.description)}</div>
      <div class="msg-tabs">
        <button class="msg-tab active">Messages from Staff</button>
      </div>
      <div class="msg-view">
        <div class="msg-list">${msgs}</div>
      </div>
    </div>`;
}


/* ════════════════════════════════════════════════════════════
   ADMIN PANEL TAB
════════════════════════════════════════════════════════════ */
function renderAdminList() {
  const list = document.getElementById('admin-report-list');
  let reports = Object.values(S.allReports);

  if (S.activeFilter !== 'all')   reports = reports.filter(r => r.status === S.activeFilter);
  if (S.activeCatFilter !== 'all') reports = reports.filter(r => r.category === S.activeCatFilter);
  if (S.searchQuery)               reports = reports.filter(r =>
    r.playerName?.toLowerCase().includes(S.searchQuery));

  const ord = { open:0, active:1, closed:2 };
  reports.sort((a,b) => ord[a.status] !== ord[b.status]
    ? ord[a.status] - ord[b.status]
    : b.createdAt - a.createdAt);

  if (reports.length === 0) {
    list.innerHTML = `<div class="list-empty">
      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No reports found</p></div>`;
    return;
  }

  list.innerHTML = '';
  reports.forEach(r => list.appendChild(buildCard(r, 'admin')));
}

function buildCard(r, mode) {
  const el = document.createElement('div');
  el.className = `r-card${(mode==='admin'?S.selectedAdmin:S.selectedMy)===r.id?' active':''}`;
  el.dataset.id = r.id;

  const prio = r.priority ?? 'normal';

  el.innerHTML = `
    <div class="rc-top">
      <span class="rc-id">${esc(r.id)}</span>
      <span class="pill pill-${prio}">${capitalize(prio)}</span>
      <span class="pill pill-${r.status}">${statusLabel(r.status)}</span>
    </div>
    <div class="rc-title">${esc(r.categoryLabel ?? r.category)}</div>
    <div class="rc-meta">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      ${esc(r.playerName)} · ${timeAgo(r.createdAt)}
    </div>`;

  el.addEventListener('click', () =>
    mode === 'admin' ? selectAdminReport(r.id) : selectMyReport(r.id));
  return el;
}

/* Filter controls */
document.getElementById('f-status').addEventListener('change', function() {
  S.activeFilter = this.value; renderAdminList();
});
document.getElementById('f-category').addEventListener('change', function() {
  S.activeCatFilter = this.value; renderAdminList();
});
document.getElementById('search-inp').addEventListener('input', function() {
  S.searchQuery = this.value.trim().toLowerCase(); renderAdminList();
});


/* ── Admin detail ─────────────────────────────── */
function selectAdminReport(id) {
  S.selectedAdmin = id;
  S.activeMsgTab  = 'chat';

  document.querySelectorAll('#admin-report-list .r-card').forEach(c =>
    c.classList.toggle('active', c.dataset.id === id));

  const r = S.allReports[id];
  if (!r) return;

  document.getElementById('admin-empty').classList.add('hidden');
  document.getElementById('admin-detail-content').classList.remove('hidden');

  renderAdminDetail(r);
}

function renderAdminDetail(r) {
  const prio   = r.priority ?? 'normal';
  const online = r.playerOnline !== false;
  const init   = (r.playerName ?? 'U')[0].toUpperCase();

  // Badges
  document.getElementById('d-badges').innerHTML = `
    <span class="pill pill-${r.status}">${statusLabel(r.status)}</span>
    <span class="pill pill-${prio}">${capitalize(prio)}</span>
    <span class="pill pill-cat">${esc(r.categoryLabel ?? r.category)}</span>`;

  // Title
  document.getElementById('d-title').textContent =
    r.title || (r.categoryLabel ?? r.category);

  // Meta row
  document.getElementById('d-meta-row').innerHTML = `
    <div class="meta-item">
      <div class="meta-online-dot ${online ? 'online' : 'offline'}"></div>
      <strong>${esc(r.playerName)}</strong>
      <span style="font-family:monospace;font-size:11px;color:var(--txt-3)">ID:${r.source}</span>
    </div>
    <div class="meta-item">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      ${fmtTime(r.createdAt)}
    </div>
    ${r.handledBy ? `<div class="meta-item"><span class="meta-handler">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      ${esc(r.handledBy)}</span></div>` : ''}`;

  // Description
  document.getElementById('d-desc').textContent = r.description;

  // Messages
  renderMsgTabs(r);

  // Action buttons
  const btnClaim   = document.getElementById('btn-claim');
  const btnResolve = document.getElementById('btn-resolve');
  const btnDelete  = document.getElementById('btn-delete');

  if (r.status === 'closed') {
    btnClaim.disabled   = true;
    btnResolve.disabled = true;
  } else if (r.status === 'active') {
    btnClaim.disabled   = true;
    btnClaim.innerHTML  = `✓ Claimed`;
    btnResolve.disabled = false;
  } else {
    btnClaim.disabled   = false;
    btnClaim.innerHTML  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Claim`;
    btnResolve.disabled = false;
  }

  btnClaim.onclick   = () => { if (r.status === 'open') nuiFetch('handleReport', { reportId: r.id }); };
  btnResolve.onclick = () => { if (r.status !== 'closed') openClosePrompt(r.id); };
  btnDelete.onclick  = () => { nuiFetch('closeReport', { reportId: r.id, reason: 'Deleted by staff' }); };
}

/* ── Message tabs ─────────────────────────────── */
document.querySelectorAll('.msg-tab').forEach(btn =>
  btn.addEventListener('click', function() {
    if (!this.dataset.msgtab) return;
    S.activeMsgTab = this.dataset.msgtab;
    document.querySelectorAll('.msg-tab').forEach(b => b.classList.toggle('active', b === this));
    document.getElementById('msg-view-chat') .classList.toggle('hidden', S.activeMsgTab !== 'chat');
    document.getElementById('msg-view-notes').classList.toggle('hidden', S.activeMsgTab !== 'notes');
    const r = S.allReports[S.selectedAdmin];
    if (r) renderMsgTabs(r);
  })
);

function renderMsgTabs(r) {
  renderChatList(r);
  renderNotesList(r);
}

function renderChatList(r) {
  const list = document.getElementById('d-chat-list');
  const msgs = r.messages ?? [];
  if (msgs.length === 0) { list.innerHTML = '<span class="no-msgs">No messages yet</span>'; return; }
  list.innerHTML = '';
  msgs.forEach(m => {
    const b = document.createElement('div');
    b.className = `msg-bubble ${m.senderType}`;
    b.innerHTML = `<div class="bubble-meta">${esc(m.sender)}<span class="bubble-time">${fmtTime(m.timestamp)}</span></div>${esc(m.message)}`;
    list.appendChild(b);
  });
  list.scrollTop = list.scrollHeight;
}

function renderNotesList(r) {
  const list = document.getElementById('d-notes-list');
  const notes = r.adminNotes ?? [];
  if (notes.length === 0) { list.innerHTML = '<span class="no-msgs">No admin notes yet</span>'; return; }
  list.innerHTML = '';
  notes.forEach(n => {
    const b = document.createElement('div');
    b.className = 'msg-bubble note';
    b.innerHTML = `<div class="bubble-meta">${esc(n.sender)}<span class="bubble-time">${fmtTime(n.timestamp)}</span></div>${esc(n.message)}`;
    list.appendChild(b);
  });
  list.scrollTop = list.scrollHeight;
}

/* ── Send message ─────────────────────────────── */
document.getElementById('send-msg-btn').addEventListener('click', sendAdminMsg);
document.getElementById('admin-msg-inp').addEventListener('keydown', e => { if (e.key==='Enter') sendAdminMsg(); });

function sendAdminMsg() {
  const inp = document.getElementById('admin-msg-inp');
  const msg = inp.value.trim();
  if (!msg || !S.selectedAdmin) return;
  nuiFetch('sendMessage', { reportId: S.selectedAdmin, message: msg });
  inp.value = '';
}

document.getElementById('send-note-btn').addEventListener('click', sendAdminNote);
document.getElementById('note-inp').addEventListener('keydown', e => { if (e.key==='Enter') sendAdminNote(); });

function sendAdminNote() {
  const inp = document.getElementById('note-inp');
  const msg = inp.value.trim();
  if (!msg || !S.selectedAdmin) return;
  nuiFetch('addAdminNote', { reportId: S.selectedAdmin, note: msg });
  inp.value = '';
}


/* ════════════════════════════════════════════════════════════
   STATISTICS TAB
════════════════════════════════════════════════════════════ */
function renderStats() {
  const all     = Object.values(S.allReports);
  const total   = all.length;
  const open    = all.filter(r=>r.status==='open').length;
  const active  = all.filter(r=>r.status==='active').length;
  const closed  = all.filter(r=>r.status==='closed').length;

  // Avg resolution time
  const resolved = all.filter(r=>r.status==='closed'&&r.closedAt&&r.createdAt);
  const avgMins  = resolved.length
    ? Math.round(resolved.reduce((a,r)=>a+(r.closedAt-r.createdAt),0)/resolved.length/60)
    : 0;
  const avgStr   = avgMins >= 60 ? `${Math.floor(avgMins/60)}h avg` : avgMins ? `${avgMins}m avg` : '';

  // Metric cards
  document.getElementById('stat-cards').innerHTML = `
    ${statCard('📋', '#3b82f6', 'rgba(59,130,246,.14)', total, 'Total Reports', '')}
    ${statCard('⏳', 'var(--s-open)',   'var(--s-open-bg)',   open,   'Open',     '')}
    ${statCard('🔒', 'var(--s-active)', 'var(--s-active-bg)', active, 'Claimed',  '')}
    ${statCard('✅', 'var(--green)',    'var(--green-bg)',    closed, 'Resolved', avgStr)}`;

  // Priority chart
  const prioCounts = { low:0, normal:0, high:0, urgent:0 };
  all.forEach(r => { const p = r.priority??'normal'; if (prioCounts[p]!==undefined) prioCounts[p]++; });
  const prioMax = Math.max(...Object.values(prioCounts), 1);
  document.getElementById('chart-priority').innerHTML = `
    <div class="chart-title">Reports by Priority</div>
    ${barRow('Urgent', prioCounts.urgent, prioMax, 'var(--p-urgent)')}
    ${barRow('High',   prioCounts.high,   prioMax, 'var(--p-high)')}
    ${barRow('Normal', prioCounts.normal, prioMax, 'var(--p-normal)')}
    ${barRow('Low',    prioCounts.low,    prioMax, 'var(--p-low)')}`;

  // Category chart
  const catCounts = {};
  all.forEach(r => { const l=r.categoryLabel??r.category; catCounts[l]=(catCounts[l]??0)+1; });
  const catMax = Math.max(...Object.values(catCounts), 1);
  const catRows = Object.entries(catCounts)
    .sort((a,b)=>b[1]-a[1])
    .map(([l,n]) => barRow(l, n, catMax, 'var(--accent)'))
    .join('');
  document.getElementById('chart-category').innerHTML = `
    <div class="chart-title">Reports by Category</div>${catRows || '<p style="color:var(--txt-3);font-size:12px">No data yet</p>'}`;

  // Status chart
  document.getElementById('chart-status').innerHTML = `
    <div class="chart-title">Reports by Status</div>
    ${barRow('Open',     open,   total||1, 'var(--s-open)')}
    ${barRow('Claimed',  active, total||1, 'var(--s-active)')}
    ${barRow('Resolved', closed, total||1, 'var(--green)')}`;

  // Leaderboard
  const lbMap = {};
  all.filter(r=>r.status==='closed'&&r.closedBy).forEach(r => {
    lbMap[r.closedBy] = (lbMap[r.closedBy]??0)+1;
  });
  const lbRows = Object.entries(lbMap)
    .sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([name,count],i) => {
      const rankClass = i===0?'gold':i===1?'silver':i===2?'bronze':'';
      return `<div class="lb-row">
        <div class="lb-rank ${rankClass}">${i+1}</div>
        <div class="lb-name">${esc(name)}</div>
        <div class="lb-count">${count} resolved</div>
      </div>`;
    }).join('');
  document.getElementById('chart-leaderboard').innerHTML = `
    <div class="chart-title">Admin Leaderboard</div>
    ${lbRows || '<p style="color:var(--txt-3);font-size:12px">No resolutions yet</p>'}`;
}

function statCard(icon, color, bg, num, label, hint) {
  return `<div class="stat-card">
    <div class="stat-card-icon" style="background:${bg};color:${color}">${icon}</div>
    <div>
      <div class="stat-card-num">${num}</div>
      <div class="stat-card-lbl">${label}</div>
      ${hint ? `<div class="stat-card-hint">${hint}</div>` : ''}
    </div>
  </div>`;
}

function barRow(label, count, max, color) {
  const pct = max > 0 ? Math.round((count/max)*100) : 0;
  return `<div class="bar-row">
    <div class="bar-lbl">${esc(label)}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="bar-count">${count}</div>
  </div>`;
}


/* ════════════════════════════════════════════════════════════
   SUBMIT FORM
════════════════════════════════════════════════════════════ */
document.getElementById('open-submit-btn').addEventListener('click', openSubmitForm);

function openSubmitForm() {
  S.selectedCat = null;
  document.getElementById('sf-desc').value   = '';
  document.getElementById('sf-player').value = '';
  document.getElementById('sf-chars').textContent = '0';
  document.getElementById('sf-submit').disabled   = true;
  document.getElementById('sf-player-field').classList.add('hidden');
  resetCselTrigger();
  document.getElementById('csel-dd').classList.add('hidden');
  document.getElementById('csel-trigger').classList.remove('open');

  // Populate category options
  const dd = document.getElementById('csel-dd');
  dd.innerHTML = '';
  S.categories.forEach(cat => {
    const el = document.createElement('div');
    el.className = 'csel-opt';
    el.dataset.id = cat.id;
    el.innerHTML = `
      <div class="csel-opt-icon">${esc(cat.icon??'📋')}</div>
      <div>
        <div class="csel-opt-lbl">${esc(cat.label)}</div>
        <div class="csel-opt-desc">${esc(cat.description??'')}</div>
      </div>`;
    el.addEventListener('click', () => pickCat(cat));
    dd.appendChild(el);
  });

  document.getElementById('submit-form').classList.remove('hidden');
}

function resetCselTrigger() {
  document.getElementById('csel-trigger').innerHTML = `
    <span class="csel-ph">Choose a category…</span>
    <svg class="csel-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
}

function pickCat(cat) {
  S.selectedCat = cat;
  const trigger = document.getElementById('csel-trigger');
  trigger.classList.remove('open');
  trigger.innerHTML = `
    <div class="csel-val"><span>${esc(cat.icon??'📋')}</span><span>${esc(cat.label)}</span></div>
    <svg class="csel-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  document.getElementById('csel-dd').classList.add('hidden');
  document.getElementById('sf-player-field')
    .classList.toggle('hidden', !cat.showPlayerField);
  checkSfSubmit();
}

document.getElementById('csel-trigger').addEventListener('click', function() {
  const dd   = document.getElementById('csel-dd');
  const open = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', open);
  this.classList.toggle('open', !open);
});

document.addEventListener('click', e => {
  const sel = document.getElementById('csel');
  if (sel && !sel.contains(e.target)) {
    document.getElementById('csel-dd').classList.add('hidden');
    document.getElementById('csel-trigger').classList.remove('open');
  }
});

document.getElementById('sf-desc').addEventListener('input', function() {
  document.getElementById('sf-chars').textContent = this.value.length;
  checkSfSubmit();
});

function checkSfSubmit() {
  const desc = document.getElementById('sf-desc').value.trim();
  document.getElementById('sf-submit').disabled = !S.selectedCat || desc.length < 10;
}

document.getElementById('sf-submit').addEventListener('click', () => {
  const desc   = document.getElementById('sf-desc').value.trim();
  const target = document.getElementById('sf-player').value.trim();
  if (!S.selectedCat || desc.length < 10) return;

  nuiFetch('submitReport', {
    category     : S.selectedCat.id,
    categoryLabel: S.selectedCat.label,
    description  : desc,
    targetName   : target || null,
  });
  closeSubmitForm();
});

document.getElementById('sf-cancel').addEventListener('click', closeSubmitForm);
document.getElementById('close-submit').addEventListener('click', closeSubmitForm);

function closeSubmitForm() {
  document.getElementById('submit-form').classList.add('hidden');
}


/* ════════════════════════════════════════════════════════════
   CLOSE REASON PROMPT
════════════════════════════════════════════════════════════ */
function openClosePrompt(reportId) {
  S.pendingClose = reportId;
  document.getElementById('close-reason-inp').value = '';
  document.getElementById('close-prompt').classList.remove('hidden');
}

document.getElementById('close-prompt-x').addEventListener('click', closeClosePrompt);
document.getElementById('cp-cancel')     .addEventListener('click', closeClosePrompt);

function closeClosePrompt() {
  document.getElementById('close-prompt').classList.add('hidden');
  S.pendingClose = null;
}

document.getElementById('cp-confirm').addEventListener('click', () => {
  if (!S.pendingClose) return;
  const reason = document.getElementById('close-reason-inp').value.trim() || 'No reason provided';
  nuiFetch('closeReport', { reportId: S.pendingClose, reason });
  closeClosePrompt();
});


/* ════════════════════════════════════════════════════════════
   REAL-TIME UPDATES
════════════════════════════════════════════════════════════ */
function onReportCreated(r) {
  S.allReports[r.id] = r;
  if (S.activeTab === 'admin') renderAdminList();
}

function onReportUpdated(r) {
  S.allReports[r.id] = r;
  if (S.myReports[r.id]) S.myReports[r.id] = r;

  if (S.activeTab === 'admin') {
    renderAdminList();
    if (S.selectedAdmin === r.id) renderAdminDetail(r);
  } else if (S.activeTab === 'my-reports') {
    renderMyList();
    if (S.selectedMy === r.id) selectMyReport(r.id);
  }
}

function onReceiveMsg(reportId, msgData) {
  const r = S.allReports[reportId] ?? S.myReports[reportId];
  if (!r) return;
  r.messages = r.messages ?? [];
  r.messages.push(msgData);
  if (S.selectedAdmin === reportId && S.activeTab === 'admin') renderChatList(r);
  if (S.selectedMy    === reportId && S.activeTab === 'my-reports') selectMyReport(reportId);
}


/* ════════════════════════════════════════════════════════════
   CLOSE / MISC
════════════════════════════════════════════════════════════ */
document.getElementById('close-panel').addEventListener('click', () => {
  closeAll(); nuiFetch('closeUI');
});

function closeAll() {
  document.getElementById('main-panel') .classList.add('hidden');
  document.getElementById('submit-form').classList.add('hidden');
  document.getElementById('close-prompt').classList.add('hidden');
}


/* ── Utils ────────────────────────────────────── */
function capitalize(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }

function statusLabel(s) {
  return { open:'Open', active:'Claimed', closed:'Resolved' }[s] ?? capitalize(s);
}
