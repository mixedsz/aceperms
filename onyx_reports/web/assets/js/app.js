/* ═══════════════════════════════════════════════════════════
   ONYX REPORTS  —  NUI JavaScript
═══════════════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────────────── */
const esc = s => String(s ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* ── SVG icon system — no emojis anywhere ─────────────────── */
const SVG_PATHS = {
  user    : '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bug     : '<path d="M8 2l1.88 1.88"/><path d="M14.12 3.88L16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>',
  card    : '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  file    : '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  ban     : '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  shield  : '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  edit    : '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  bell    : '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  check   : '<polyline points="20 6 9 17 4 12"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  'x-circle'    : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  info    : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  warning : '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  list    : '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  clock   : '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  lock    : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  award   : '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>',
};

function icon(name, size = 16, cls = '') {
  const d = SVG_PATHS[name] || SVG_PATHS.edit;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="${cls}">${d}</svg>`;
}

function categoryIcon(catId, size = 16) {
  const map = { player:'user', bug:'bug', purchase:'card', tos:'file', cheating:'ban', staff:'shield', other:'edit' };
  return icon(map[catId] ?? 'edit', size);
}

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

/* ── Theme color ──────────────────────────────────────────── */
function applyThemeColor(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const dr = Math.max(0, Math.floor(r * 0.80));
  const dg = Math.max(0, Math.floor(g * 0.80));
  const db = Math.max(0, Math.floor(b * 0.80));
  const accentD = '#' + [dr,dg,db].map(v => v.toString(16).padStart(2,'0')).join('');
  const root = document.documentElement;
  root.style.setProperty('--accent',       hex);
  root.style.setProperty('--accent-d',     accentD);
  root.style.setProperty('--accent-bg',    `rgba(${r},${g},${b},0.14)`);
  root.style.setProperty('--accent-bd',    `rgba(${r},${g},${b},0.28)`);
  root.style.setProperty('--bd-focus',     `rgba(${r},${g},${b},0.65)`);
  root.style.setProperty('--accent-glow',  `rgba(${r},${g},${b},0.35)`);
}

/* ── State ────────────────────────────────────────────────── */
const S = {
  isAdmin        : false,
  categories     : [],
  priorities     : [],
  myReports      : {},
  allReports     : {},
  selectedMy     : null,
  selectedAdmin  : null,
  activeTab      : 'my-reports',
  activeFilter   : 'all',
  activeCatFilter: 'all',
  searchQuery    : '',
  showResolved   : false,
  activeMsgTab   : 'chat',
  selectedCat    : null,
  pendingClose   : null,
};

/* ════════════════════════════════════════════════════════════
   INBOUND  —  messages from Lua
════════════════════════════════════════════════════════════ */
window.addEventListener('message', ({ data }) => {
  switch (data.action) {
    case 'openPanel':          openPanel(data);                          break;
    case 'reportCreated':      onReportCreated(data.report);             break;
    case 'yourReportCreated':  onYourReportCreated(data.report);         break;
    case 'reportUpdated':      onReportUpdated(data.report);             break;
    case 'receiveMessage':     onReceiveMsg(data.reportId, data.message);break;
    case 'closeUI':            closeAll();                               break;
    case 'setThemeColor':      applyThemeColor(data.color);              break;
    case 'adminNotification':  showAdminToast(data.data);                break;
    case 'notify':             showUserToast(data.message, data.nType);  break;
    case 'reportDeleted':      onReportDeleted(data.reportId);           break;
  }
});

/* ── ESC to close panel ────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const cp = document.getElementById('claim-prompt');
  const rp = document.getElementById('close-prompt');
  const sf = document.getElementById('submit-form');
  const mp = document.getElementById('main-panel');
  if (cp && !cp.classList.contains('hidden')) { closeClaimPrompt(); return; }
  if (rp && !rp.classList.contains('hidden')) { closeClosePrompt(); return; }
  if (sf && !sf.classList.contains('hidden')) { closeSubmitForm();  return; }
  if (mp && !mp.classList.contains('hidden')) { closeAll(); nuiFetch('closeUI'); }
});

/* ════════════════════════════════════════════════════════════
   ADMIN NOTIFICATION TOAST  (no NUI focus — appears over game)
════════════════════════════════════════════════════════════ */
function showAdminToast(data) {
  if (!data) return;
  const area  = document.getElementById('notif-area');
  const toast = document.createElement('div');
  toast.className = 'notif-toast';

  toast.innerHTML = `
    <div class="notif-icon">${icon('bell', 16)}</div>
    <div class="notif-body">
      <div class="notif-title">New Report Submitted</div>
      <div class="notif-reporter">${esc(data.playerName ?? 'Unknown')}</div>
      <div class="notif-cat">${esc(data.category ?? 'Report')}</div>
      <div class="notif-hint">Type <code>/reports</code> to manage</div>
    </div>
    <button class="notif-close" aria-label="Dismiss">${icon('x-circle', 11)}</button>
    <div class="notif-progress"></div>`;

  const dismiss = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.notif-close').addEventListener('click', dismiss);
  area.appendChild(toast);
  setTimeout(dismiss, 5200);
}

/* ════════════════════════════════════════════════════════════
   USER NOTIFICATION TOAST  (success / error / inform / warning)
════════════════════════════════════════════════════════════ */
function showUserToast(message, nType) {
  if (!message) return;
  const cfg = {
    success : { color: 'var(--green)',   iconName: 'check-circle', title: 'Success'  },
    error   : { color: 'var(--red)',     iconName: 'x-circle',     title: 'Error'    },
    warning : { color: '#f59e0b',        iconName: 'warning',      title: 'Warning'  },
    inform  : { color: 'var(--accent)',  iconName: 'info',         title: 'Info'     },
  };
  const c = cfg[nType] ?? cfg.inform;

  const area  = document.getElementById('notif-area');
  const toast = document.createElement('div');
  toast.className = 'notif-toast';
  toast.style.borderLeftColor = c.color;

  toast.innerHTML = `
    <div class="notif-icon" style="color:${c.color};background:color-mix(in srgb,${c.color} 14%,transparent)">${icon(c.iconName, 16)}</div>
    <div class="notif-body">
      <div class="notif-title">${c.title}</div>
      <div class="notif-reporter" style="color:var(--txt-2);font-weight:400">${esc(message)}</div>
    </div>
    <button class="notif-close" aria-label="Dismiss">${icon('x-circle', 11)}</button>
    <div class="notif-progress" style="background:${c.color}"></div>`;

  const dismiss = () => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  };
  toast.querySelector('.notif-close').addEventListener('click', dismiss);
  area.appendChild(toast);
  setTimeout(dismiss, 4200);
}

/* ════════════════════════════════════════════════════════════
   OPEN PANEL
════════════════════════════════════════════════════════════ */
function openPanel(data) {
  S.isAdmin   = !!data.isAdmin;
  S.activeTab = data.defaultTab ?? 'my-reports';

  if (data.uiColor) applyThemeColor(data.uiColor);

  if (data.categories) {
    S.categories = data.categories;
    const catSel = document.getElementById('f-category');
    catSel.innerHTML = '<option value="all">All Categories</option>';
    S.categories.forEach(c => {
      const o = document.createElement('option');
      o.value       = c.id;
      o.textContent = c.label;
      catSel.appendChild(o);
    });
  }

  if (data.priorities) S.priorities = data.priorities;

  document.querySelectorAll('.admin-only').forEach(el =>
    el.classList.toggle('hidden', !S.isAdmin));

  S.allReports    = {};
  S.myReports     = {};
  S.selectedMy    = null;
  S.selectedAdmin = null;
  (data.reports ?? []).forEach(r => { S.allReports[r.id] = r; });
  if (data.myReports) data.myReports.forEach(r => { S.myReports[r.id] = r; });

  // Reset detail panes so stale content from a prior session isn't visible
  const myContent = document.getElementById('my-detail-content');
  const myEmpty   = document.getElementById('my-empty');
  if (myContent) myContent.classList.add('hidden');
  if (myEmpty)   myEmpty.classList.remove('hidden');
  const admContent = document.getElementById('admin-detail-content');
  const admEmpty   = document.getElementById('admin-empty');
  if (admContent) admContent.classList.add('hidden');
  if (admEmpty)   admEmpty.classList.remove('hidden');

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
      // Re-render the selected report's messages so anything that arrived
      // while on another tab is visible immediately on switch-back
      if (S.selectedMy) {
        const rm = S.myReports[S.selectedMy];
        if (rm) renderMyReportMessages(rm);
      }
      break;
    case 'admin':
      document.getElementById('view-admin').classList.remove('hidden');
      renderAdminList();
      // Re-render selected report detail so updates that arrived on another tab show
      if (S.selectedAdmin) {
        const ra = S.allReports[S.selectedAdmin];
        if (ra) renderAdminDetail(ra);
      }
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
  let reports = Object.values(S.myReports).filter(r => !r.deleted);

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
  const empty   = document.getElementById('my-empty');
  const content = document.getElementById('my-detail-content');

  if (empty)   empty.classList.add('hidden');
  if (content) {
    content.classList.remove('hidden');
    content.innerHTML = buildPlayerDetail(r);
    wirePlayerReply(r.id);
    const chatList = document.getElementById('my-chat-list');
    if (chatList) chatList.scrollTop = chatList.scrollHeight;
  }
}

function buildPlayerDetail(r) {
  const msgs = (r.messages ?? []).map(m => `
    <div class="msg-bubble ${m.senderType}">
      <div class="bubble-meta">${esc(m.sender)}<span class="bubble-time">${fmtTime(m.timestamp)}</span></div>
      ${esc(m.message)}
    </div>`).join('') || '<span class="no-msgs">No messages yet — a staff member will reply shortly</span>';

  const canReply = r.status !== 'closed';

  return `
    <div class="detail-hdr">
      <div class="detail-hdr-top">
        <div class="detail-hdr-badges">
          <span class="pill pill-${r.status}">${statusLabel(r.status)}</span>
          ${r.status !== 'closed' ? `<span class="pill pill-${r.priority ?? 'normal'}">${priorityLabel(r.priority ?? 'normal')}</span>` : ''}
          <span class="pill pill-cat">${esc(r.categoryLabel ?? r.category)}</span>
        </div>
      </div>
      <h2 class="detail-title">${esc(r.categoryLabel ?? r.category)} — ${esc(r.id)}</h2>
      <div class="detail-meta-row">
        <div class="meta-item">Submitted ${timeAgo(r.createdAt)}</div>
        ${r.handledBy ? `<div class="meta-item"><span class="meta-handler">${icon('shield',11)} Handled by ${esc(r.handledBy)}</span></div>` : ''}
        ${r.closeReason ? `<div class="meta-item">Closed: ${esc(r.closeReason)}</div>` : ''}
      </div>
    </div>
    <div class="detail-body">
      <div class="detail-desc-box">${esc(r.description)}</div>
      <div class="msg-tabs">
        <button class="msg-tab active">Chat with Staff</button>
      </div>
      <div class="msg-view">
        <div class="msg-list" id="my-chat-list">${msgs}</div>
        ${canReply ? `
        <div class="msg-composer">
          <input class="msg-inp" id="my-reply-inp" type="text"
                 placeholder="Reply to staff…" maxlength="200" />
          <button class="send-btn" id="my-reply-send">${icon('check',13)}</button>
        </div>` : ''}
      </div>
    </div>`;
}

function wirePlayerReply(reportId) {
  const inp = document.getElementById('my-reply-inp');
  const btn = document.getElementById('my-reply-send');
  if (!inp || !btn) return;

  const send = () => {
    const msg = inp.value.trim();
    if (!msg) return;
    nuiFetch('replyMessage', { reportId, message: msg });
    inp.value = '';
  };
  btn.addEventListener('click', send);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
}


/* ════════════════════════════════════════════════════════════
   ADMIN PANEL TAB
════════════════════════════════════════════════════════════ */
function renderAdminList() {
  const list = document.getElementById('admin-report-list');
  let reports = Object.values(S.allReports).filter(r => !r.deleted);

  if (S.activeFilter !== 'all')    reports = reports.filter(r => r.status   === S.activeFilter);
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
  const el  = document.createElement('div');
  el.className = `r-card${(mode==='admin'?S.selectedAdmin:S.selectedMy)===r.id?' active':''}`;
  el.dataset.id = r.id;

  const prio = r.priority ?? 'normal';

  el.innerHTML = `
    <div class="rc-top">
      <span class="rc-id">${esc(r.id)}</span>
      ${r.status !== 'closed' ? `<span class="pill pill-${prio}">${priorityLabel(prio)}</span>` : ''}
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

  document.getElementById('admin-empty')          .classList.add('hidden');
  document.getElementById('admin-detail-content') .classList.remove('hidden');

  // Reset to chat tab
  document.querySelectorAll('.msg-tab').forEach(b => b.classList.toggle('active', b.dataset.msgtab === 'chat'));
  document.getElementById('msg-view-chat') .classList.remove('hidden');
  document.getElementById('msg-view-notes').classList.add('hidden');

  renderAdminDetail(r);
}

function renderAdminDetail(r) {
  const prio   = r.priority ?? 'normal';
  const online = r.playerOnline !== false;

  // Badges — hide priority on resolved reports
  document.getElementById('d-badges').innerHTML = `
    <span class="pill pill-${r.status}">${statusLabel(r.status)}</span>
    ${r.status !== 'closed' ? `<span class="pill pill-${prio}">${priorityLabel(prio)}</span>` : ''}
    <span class="pill pill-cat">${esc(r.categoryLabel ?? r.category)}</span>`;

  // Priority selector — hide on closed reports
  const prioSel = document.getElementById('prio-sel');
  if (r.status === 'closed') {
    prioSel.style.display = 'none';
  } else {
    prioSel.style.display = '';
    document.getElementById('prio-label').textContent = priorityLabel(prio);
    wirePrioDropdown(r.id);
  }

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

  // Messages + count badges
  renderMsgTabs(r);

  // Action buttons
  const btnClaim   = document.getElementById('btn-claim');
  const btnResolve = document.getElementById('btn-resolve');
  const btnDelete  = document.getElementById('btn-delete');

  btnClaim.disabled   = false;
  btnResolve.disabled = false;
  btnClaim.innerHTML  = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Claim`;

  if (r.status === 'closed') {
    btnClaim.disabled   = true;
    btnResolve.disabled = true;
  } else if (r.status === 'active') {
    btnClaim.disabled  = true;
    btnClaim.innerHTML = `✓ Claimed`;
  }

  btnClaim.onclick   = () => { if (r.status === 'open') openClaimPrompt(r.id); };
  btnResolve.onclick = () => { if (r.status !== 'closed') openClosePrompt(r.id); };
  btnDelete.onclick  = () => { nuiFetch('deleteReport', { reportId: r.id }); };
}

/* ── Priority dropdown wiring ─────────────────── */
function wirePrioDropdown(reportId) {
  const trigger = document.getElementById('prio-trigger');
  const menu    = document.getElementById('prio-menu');
  if (!trigger || !menu) return;

  // Clone both elements to wipe all accumulated event listeners
  const newTrigger = trigger.cloneNode(true);
  trigger.parentNode.replaceChild(newTrigger, trigger);
  const newMenu = menu.cloneNode(true);
  menu.parentNode.replaceChild(newMenu, menu);

  newTrigger.addEventListener('click', e => {
    e.stopPropagation();
    newMenu.classList.toggle('hidden');
  });

  newMenu.querySelectorAll('.prio-opt').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      const newPrio = opt.dataset.prio;
      nuiFetch('setPriority', { reportId, priority: newPrio });
      document.getElementById('prio-label').textContent = priorityLabel(newPrio);
      newMenu.classList.add('hidden');
    });
  });
}

// Close prio menu on outside click (re-query each time so clone-and-replace is respected)
document.addEventListener('click', e => {
  const prioSel = document.getElementById('prio-sel');
  const menu    = document.getElementById('prio-menu');
  if (prioSel && menu && !prioSel.contains(e.target)) menu.classList.add('hidden');
});

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
  const list  = document.getElementById('d-chat-list');
  const badge = document.getElementById('chat-count');
  const msgs  = r.messages ?? [];

  if (badge) badge.textContent = msgs.length > 0 ? msgs.length : '';

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
  const list  = document.getElementById('d-notes-list');
  const badge = document.getElementById('notes-count');
  const notes = r.adminNotes ?? [];

  if (badge) badge.textContent = notes.length > 0 ? notes.length : '';

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
  const all    = Object.values(S.allReports);
  const total  = all.length;
  const open   = all.filter(r => r.status === 'open').length;
  const active = all.filter(r => r.status === 'active').length;
  const closed = all.filter(r => r.status === 'closed').length;

  const resolved = all.filter(r => r.status==='closed' && r.closedAt && r.createdAt);
  const avgMins  = resolved.length
    ? Math.round(resolved.reduce((a,r) => a + (r.closedAt - r.createdAt), 0) / resolved.length / 60)
    : 0;
  const avgStr = avgMins >= 60
    ? `${Math.floor(avgMins/60)}h avg resolution`
    : avgMins ? `${avgMins}m avg resolution` : '';

  /* ── Stat cards ─────────── */
  document.getElementById('stat-cards').innerHTML = `
    ${statCard(icon('list',16),        '#3b82f6',        'rgba(59,130,246,.13)',  total,  'Total Reports', '')}
    ${statCard(icon('clock',16),       'var(--s-open)',   'var(--s-open-bg)',      open,   'Open',          '')}
    ${statCard(icon('lock',16),        'var(--s-active)', 'var(--s-active-bg)',    active, 'Claimed',       '')}
    ${statCard(icon('check-circle',16),'var(--green)',    'var(--green-bg)',       closed, 'Resolved',      avgStr)}`;

  /* ── Staff of the Month ─── */
  const now        = new Date();
  const monthStart = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
  const monthEnd   = Math.floor(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime() / 1000);
  const monthName  = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const sotmMap = {};
  all.filter(r => r.status==='closed' && r.closedBy && r.closedAt >= monthStart && r.closedAt <= monthEnd)
     .forEach(r => { sotmMap[r.closedBy] = (sotmMap[r.closedBy] ?? 0) + 1; });
  const sotmEntries = Object.entries(sotmMap).sort((a,b) => b[1] - a[1]);
  const sotm = sotmEntries[0];

  document.getElementById('sotm-wrap').innerHTML = `
    <div class="sotm-card">
      <div class="sotm-trophy">${icon('award', 26)}</div>
      <div>
        <div class="sotm-label">Staff of the Month — ${monthName}</div>
        <div class="sotm-name" style="${sotm ? '' : 'color:var(--txt-3);font-size:15px'}">
          ${sotm ? esc(sotm[0]) : 'No resolutions recorded yet this month'}
        </div>
        ${sotm ? `<div class="sotm-stat">${sotm[1]} report${sotm[1] > 1 ? 's' : ''} resolved this month</div>` : ''}
      </div>
      <div class="sotm-badge" style="color:var(--gold)">${icon('award', 36)}</div>
    </div>`;

  /* ── Charts ─────────────── */
  const grid = document.getElementById('charts-grid');
  grid.innerHTML = '';

  // Priority breakdown
  const prioData = [
    { id:'normal',     label:'Normal',           color:'var(--p-normal)' },
    { id:'higher_up',  label:'Need a Higher Up', color:'var(--p-higher)' },
    { id:'management', label:'Need Management',  color:'var(--p-mgmt)' },
  ];
  const prioCounts = { normal:0, higher_up:0, management:0 };
  all.forEach(r => { const p = r.priority ?? 'normal'; if (prioCounts[p] !== undefined) prioCounts[p]++; });
  const prioMax = Math.max(...Object.values(prioCounts), 1);

  grid.appendChild(buildChart('Reports by Priority',
    prioData.map(p => barRow(p.label, prioCounts[p.id], prioMax, p.color))));

  // Category breakdown
  const catCounts = {};
  all.forEach(r => { const l = r.categoryLabel ?? r.category; catCounts[l] = (catCounts[l] ?? 0) + 1; });
  const catMax  = Math.max(...Object.values(catCounts), 1);
  const catRows = Object.entries(catCounts)
    .sort((a,b) => b[1] - a[1])
    .map(([l,n]) => barRow(l, n, catMax, 'var(--accent)'));

  grid.appendChild(buildChart('Reports by Category',
    catRows.length ? catRows : ['<p class="chart-nodata">No data yet</p>']));

  // Status breakdown
  grid.appendChild(buildChart('Reports by Status', [
    barRow('Open',     open,   total || 1, 'var(--s-open)'),
    barRow('Claimed',  active, total || 1, 'var(--s-active)'),
    barRow('Resolved', closed, total || 1, 'var(--green)'),
  ]));

  // Leaderboard
  const lbMap = {};
  all.filter(r => r.status==='closed' && r.closedBy)
     .forEach(r => { lbMap[r.closedBy] = (lbMap[r.closedBy] ?? 0) + 1; });
  const lbRows = Object.entries(lbMap).sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([name, count], i) => {
      const rankClass = ['gold','silver','bronze'][i] ?? '';
      return `<div class="lb-row">
        <div class="lb-rank ${rankClass}">${i+1}</div>
        <div class="lb-name">${esc(name)}</div>
        <div class="lb-count">${count} resolved</div>
      </div>`;
    });

  grid.appendChild(buildChart('Admin Leaderboard',
    lbRows.length ? lbRows : ['<p class="chart-nodata">No resolutions yet</p>']));
}

function buildChart(title, rows) {
  const div = document.createElement('div');
  div.className = 'chart-card';
  div.innerHTML = `<div class="chart-title">${esc(title)}</div>${rows.join('')}`;
  return div;
}

function statCard(icon, color, bg, num, label, hint) {
  return `<div class="stat-card">
    <div class="stat-icon" style="background:${bg};color:${color}">${icon}</div>
    <div>
      <div class="stat-num">${num}</div>
      <div class="stat-lbl">${label}</div>
      ${hint ? `<div class="stat-hint">${hint}</div>` : ''}
    </div>
  </div>`;
}

function barRow(label, count, max, color) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return `<div class="bar-row">
    <div class="bar-lbl">${esc(label)}</div>
    <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
    <div class="bar-val">${count}</div>
  </div>`;
}


/* ════════════════════════════════════════════════════════════
   SUBMIT FORM
════════════════════════════════════════════════════════════ */
document.getElementById('open-submit-btn').addEventListener('click', openSubmitForm);

function openSubmitForm() {
  S.selectedCat = null;
  document.getElementById('sf-desc').value         = '';
  document.getElementById('sf-player').value       = '';
  document.getElementById('sf-chars').textContent  = '0';
  document.getElementById('sf-submit').disabled    = true;
  document.getElementById('sf-player-field').classList.add('hidden');
  resetCselTrigger();
  document.getElementById('csel-dd').classList.add('hidden');
  document.getElementById('csel-trigger').classList.remove('open');

  const dd = document.getElementById('csel-dd');
  dd.innerHTML = '';
  S.categories.forEach(cat => {
    const el = document.createElement('div');
    el.className    = 'csel-opt';
    el.dataset.id   = cat.id;
    el.innerHTML = `
      <div class="csel-opt-icon">${categoryIcon(cat.id, 17)}</div>
      <div>
        <div class="csel-opt-lbl">${esc(cat.label)}</div>
        <div class="csel-opt-desc">${esc(cat.description ?? '')}</div>
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
    <div class="csel-val">${categoryIcon(cat.id, 15)}<span>${esc(cat.label)}</span></div>
    <svg class="csel-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
  document.getElementById('csel-dd').classList.add('hidden');
  document.getElementById('sf-player-field').classList.toggle('hidden', !cat.showPlayerField);
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
  document.getElementById('sf-submit').disabled = !S.selectedCat || desc.length < 1;
}

document.getElementById('sf-submit').addEventListener('click', () => {
  const desc   = document.getElementById('sf-desc').value.trim();
  const target = document.getElementById('sf-player').value.trim();
  if (!S.selectedCat || desc.length < 1) return;

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
   CLAIM CONFIRM PROMPT
════════════════════════════════════════════════════════════ */
let pendingClaimId = null;

function openClaimPrompt(reportId) {
  pendingClaimId = reportId;
  document.getElementById('claim-prompt').classList.remove('hidden');
}

function closeClaimPrompt() {
  document.getElementById('claim-prompt').classList.add('hidden');
  pendingClaimId = null;
}

document.getElementById('claim-prompt-x').addEventListener('click', closeClaimPrompt);
document.getElementById('claim-cancel')   .addEventListener('click', closeClaimPrompt);

document.getElementById('claim-goto').addEventListener('click', () => {
  if (!pendingClaimId) return;
  nuiFetch('claimReport', { reportId: pendingClaimId, action: 'goto' });
  closeClaimPrompt();
});

document.getElementById('claim-bring').addEventListener('click', () => {
  if (!pendingClaimId) return;
  nuiFetch('claimReport', { reportId: pendingClaimId, action: 'bring' });
  closeClaimPrompt();
});


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

function onReportDeleted(id) {
  // Keep in state for statistics but mark deleted so lists filter it out
  if (S.allReports[id]) S.allReports[id].deleted = true;
  if (S.myReports[id])  S.myReports[id].deleted  = true;

  if (S.selectedAdmin === id) {
    S.selectedAdmin = null;
    document.getElementById('admin-empty')         .classList.remove('hidden');
    document.getElementById('admin-detail-content').classList.add('hidden');
  }
  if (S.selectedMy === id) {
    S.selectedMy = null;
    document.getElementById('my-empty')         .classList.remove('hidden');
    document.getElementById('my-detail-content').classList.add('hidden');
  }
  if (S.activeTab === 'admin')      renderAdminList();
  if (S.activeTab === 'my-reports') renderMyList();
}

function onYourReportCreated(r) {
  S.myReports[r.id] = r;
  if (S.activeTab === 'my-reports') renderMyList();
}

function onReportUpdated(r) {
  S.allReports[r.id] = r;
  if (S.myReports[r.id] !== undefined) S.myReports[r.id] = r;

  // Always push message updates to whichever pane is currently visible,
  // regardless of active tab, so nothing is missed when tabs differ.
  if (S.selectedAdmin === r.id) {
    renderChatList(r);
    renderNotesList(r);
  }
  if (S.selectedMy === r.id) {
    renderMyReportMessages(r);
    if (r.status === 'closed') {
      const c = document.querySelector('#my-detail-content .msg-composer');
      if (c) c.remove();
    }
  }

  // Full re-renders for status / priority / button state changes
  if (S.activeTab === 'admin') {
    renderAdminList();
    if (S.selectedAdmin === r.id) renderAdminDetail(r);
  } else if (S.activeTab === 'my-reports') {
    renderMyList();
  }
}

// Renders only the message list inside the My Reports detail pane.
// Intentionally leaves the composer untouched so the player can keep typing.
function renderMyReportMessages(r) {
  const list = document.getElementById('my-chat-list');
  if (!list) return;
  const msgs = r.messages ?? [];
  if (msgs.length === 0) {
    list.innerHTML = '<span class="no-msgs">No messages yet — a staff member will reply shortly</span>';
    return;
  }
  list.innerHTML = '';
  msgs.forEach(m => {
    const b = document.createElement('div');
    b.className = `msg-bubble ${m.senderType}`;
    b.innerHTML = `<div class="bubble-meta">${esc(m.sender)}<span class="bubble-time">${fmtTime(m.timestamp)}</span></div>${esc(m.message)}`;
    list.appendChild(b);
  });
  list.scrollTop = list.scrollHeight;
}

function onReceiveMsg(reportId, msgData) {
  // Admin panel is kept in sync exclusively by onReportUpdated → renderAdminDetail.
  // Adding a second render path here causes duplicates when both reportUpdated and
  // receiveMessage arrive for the same message (race-condition order not guaranteed).
  // My-reports updates also flow through onReportUpdated → renderMyReportMessages.
  // receiveMessage is kept in client/main.lua only for the notification toast (Notify call).
  void reportId; void msgData;
}


/* ════════════════════════════════════════════════════════════
   CLOSE / MISC
════════════════════════════════════════════════════════════ */
document.getElementById('close-panel').addEventListener('click', () => {
  closeAll(); nuiFetch('closeUI');
});

function closeAll() {
  document.getElementById('main-panel')   .classList.add('hidden');
  document.getElementById('submit-form')  .classList.add('hidden');
  document.getElementById('close-prompt') .classList.add('hidden');
  document.getElementById('claim-prompt') .classList.add('hidden');
  pendingClaimId = null;
}


/* ── Utils ────────────────────────────────────── */
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function statusLabel(s) {
  return { open:'Open', active:'Claimed', closed:'Resolved' }[s] ?? capitalize(s);
}

function priorityLabel(p) {
  return {
    normal    : 'Normal',
    higher_up : 'Need a Higher Up',
    management: 'Need Management',
  }[p] ?? 'Normal';
}
