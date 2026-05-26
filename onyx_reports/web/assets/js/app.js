/* ═══════════════════════════════════════════════════════════
   ONYX REPORTS  —  NUI JavaScript
═══════════════════════════════════════════════════════════ */

/* ── Helpers ──────────────────────────────────────────────── */
const esc = s =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const timeAgo = ts => {
  if (!ts) return '—';
  const d = Math.floor(Date.now() / 1000) - ts;
  if (d < 60)    return 'Just now';
  if (d < 3600)  return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const nuiFetch = (cb, body = {}) =>
  fetch(`https://${GetParentResourceName?.() ?? 'onyx_reports'}/${cb}`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(body),
  });


/* ── App state ────────────────────────────────────────────── */
const state = {
  categories    : [],
  selectedCat   : null,
  reports       : {},       // id → report
  selectedReport: null,
  filter        : 'all',
  pendingClose  : null,
};


/* ════════════════════════════════════════════════════════════
   INBOUND  —  messages from Lua
════════════════════════════════════════════════════════════ */
window.addEventListener('message', ({ data }) => {
  switch (data.action) {
    case 'openUserReport': openUserReport(data.categories); break;
    case 'openAdminPanel': openAdminPanel(data.reports);    break;
    case 'reportCreated' : onReportCreated(data.report);    break;
    case 'reportUpdated' : onReportUpdated(data.report);    break;
    case 'receiveMessage': onReceiveMsg(data.reportId, data.message); break;
    case 'closeUI'       : closeAll(); break;
  }
});


/* ════════════════════════════════════════════════════════════
   USER  REPORT  MODAL
════════════════════════════════════════════════════════════ */
function openUserReport(categories) {
  state.categories  = categories ?? [];
  state.selectedCat = null;

  // Reset form
  document.getElementById('report-desc').value    = '';
  document.getElementById('player-input').value   = '';
  document.getElementById('char-count').textContent = '0';
  document.getElementById('submit-report').disabled = true;
  document.getElementById('player-field').classList.add('hidden');

  // Reset dropdown trigger
  setTriggerPlaceholder();

  // Build dropdown options
  const dd = document.getElementById('cat-dropdown');
  dd.innerHTML = '';
  (categories ?? []).forEach(cat => {
    const el = document.createElement('div');
    el.className = 'c-opt';
    el.dataset.id = cat.id;
    el.innerHTML = `
      <div class="c-opt__icon">${esc(cat.icon ?? '📋')}</div>
      <div>
        <div class="c-opt__label">${esc(cat.label)}</div>
        <div class="c-opt__desc">${esc(cat.description ?? '')}</div>
      </div>`;
    el.addEventListener('click', () => pickCategory(cat));
    dd.appendChild(el);
  });

  document.getElementById('user-overlay').classList.remove('hidden');
}

function setTriggerPlaceholder() {
  document.getElementById('cat-trigger').innerHTML = `
    <span class="c-select__placeholder">Choose a category…</span>
    <svg class="c-select__arrow" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
}

function pickCategory(cat) {
  state.selectedCat = cat;

  const trigger = document.getElementById('cat-trigger');
  trigger.classList.remove('open');
  trigger.innerHTML = `
    <div class="c-select__val">
      <span>${esc(cat.icon ?? '📋')}</span>
      <span>${esc(cat.label)}</span>
    </div>
    <svg class="c-select__arrow" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
         viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

  document.getElementById('cat-dropdown').classList.add('hidden');

  // Show player field based on category config
  const pf = document.getElementById('player-field');
  cat.showPlayerField ? pf.classList.remove('hidden') : pf.classList.add('hidden');

  checkSubmit();
}

// Toggle dropdown
document.getElementById('cat-trigger').addEventListener('click', function () {
  const dd   = document.getElementById('cat-dropdown');
  const open = !dd.classList.contains('hidden');
  dd.classList.toggle('hidden', open);
  this.classList.toggle('open', !open);
});

// Close dropdown on outside click
document.addEventListener('click', e => {
  const sel = document.getElementById('cat-select');
  if (sel && !sel.contains(e.target)) {
    document.getElementById('cat-dropdown').classList.add('hidden');
    document.getElementById('cat-trigger').classList.remove('open');
  }
});

// Char counter + submit gate
document.getElementById('report-desc').addEventListener('input', function () {
  document.getElementById('char-count').textContent = this.value.length;
  checkSubmit();
});

function checkSubmit() {
  const desc = document.getElementById('report-desc').value.trim();
  document.getElementById('submit-report').disabled =
    !state.selectedCat || desc.length < 10;
}

// Submit
document.getElementById('submit-report').addEventListener('click', () => {
  const desc   = document.getElementById('report-desc').value.trim();
  const target = document.getElementById('player-input').value.trim();
  if (!state.selectedCat || desc.length < 10) return;

  nuiFetch('submitReport', {
    category     : state.selectedCat.id,
    categoryLabel: state.selectedCat.label,
    description  : desc,
    targetName   : target || null,
  });
  closeAll();
});

document.getElementById('cancel-report')   .addEventListener('click', closeUserModal);
document.getElementById('close-user-modal').addEventListener('click', closeUserModal);

function closeUserModal() {
  document.getElementById('user-overlay').classList.add('hidden');
  nuiFetch('closeUI');
}


/* ════════════════════════════════════════════════════════════
   ADMIN  PANEL
════════════════════════════════════════════════════════════ */
function openAdminPanel(reports) {
  state.reports        = {};
  state.selectedReport = null;
  state.filter         = 'all';

  (reports ?? []).forEach(r => { state.reports[r.id] = r; });

  document.querySelectorAll('.a-filter').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === 'all'));

  renderList();
  showEmptyDetail();

  document.getElementById('admin-panel').classList.remove('hidden');
}

/* ── Report list ────────────────────────────── */
function renderList() {
  const list   = document.getElementById('a-list');
  const filter = state.filter;

  let items = Object.values(state.reports);
  if (filter !== 'all') items = items.filter(r => r.status === filter);

  const order = { open: 0, active: 1, closed: 2 };
  items.sort((a, b) =>
    order[a.status] !== order[b.status]
      ? order[a.status] - order[b.status]
      : b.createdAt - a.createdAt);

  const n = items.length;
  document.getElementById('a-count').textContent =
    n === 0 ? 'No reports' : `${n} report${n !== 1 ? 's' : ''}`;

  if (n === 0) {
    list.innerHTML = `
      <div class="list-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h4>No reports here</h4>
        <p>All clear ✓</p>
      </div>`;
    return;
  }

  list.innerHTML = '';
  items.forEach(r => list.appendChild(buildCard(r)));
}

function buildCard(r) {
  const el = document.createElement('div');
  el.className = `r-card${state.selectedReport === r.id ? ' active' : ''}`;
  el.dataset.id = r.id;
  el.innerHTML = `
    <div class="r-card__top">
      <span class="r-card__id">${esc(r.id)}</span>
      ${badgeHTML(r.status)}
    </div>
    <div class="r-card__cat">${esc(r.categoryLabel ?? r.category)}</div>
    <div class="r-card__by">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      ${esc(r.playerName)}
    </div>
    <div class="r-card__time">${timeAgo(r.createdAt)}</div>`;
  el.addEventListener('click', () => selectReport(r.id));
  return el;
}

function badgeHTML(status) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge badge-${status}">${label}</span>`;
}

/* ── Detail pane ────────────────────────────── */
function selectReport(id) {
  state.selectedReport = id;
  document.querySelectorAll('.r-card').forEach(c =>
    c.classList.toggle('active', c.dataset.id === id));
  renderDetail(state.reports[id]);
}

function showEmptyDetail() {
  document.getElementById('a-empty').classList.remove('hidden');
  document.getElementById('a-content').classList.add('hidden');
}

function renderDetail(r) {
  if (!r) return;
  document.getElementById('a-empty').classList.add('hidden');
  document.getElementById('a-content').classList.remove('hidden');

  document.getElementById('d-id').textContent   = r.id;
  document.getElementById('d-cat').textContent  = r.categoryLabel ?? r.category;
  document.getElementById('d-meta').textContent =
    `Submitted ${timeAgo(r.createdAt)}` +
    (r.handledBy ? ` · Handled by ${r.handledBy}` : '');

  const badge = document.getElementById('d-badge');
  badge.className   = `badge badge-${r.status}`;
  badge.textContent = r.status.charAt(0).toUpperCase() + r.status.slice(1);

  // Reporter card
  const init   = (r.playerName ?? 'U')[0].toUpperCase();
  const online = r.playerOnline !== false;
  document.getElementById('d-reporter').innerHTML = `
    <div class="r-avatar">${esc(init)}</div>
    <div>
      <div class="r-name">${esc(r.playerName)}</div>
      <div class="r-sid">Server ID: ${r.source}</div>
    </div>
    <div class="r-dot ${online ? 'online' : 'offline'}" title="${online ? 'Online' : 'Offline'}"></div>`;

  document.getElementById('d-desc').textContent = r.description;

  renderMessages(r);
  renderActions(r);
}

function renderMessages(r) {
  const list = document.getElementById('d-msgs');
  const msgs = r.messages ?? [];

  if (msgs.length === 0) {
    list.innerHTML = '<span class="msg-empty">No messages yet</span>';
    return;
  }
  list.innerHTML = '';
  msgs.forEach(m => {
    const b = document.createElement('div');
    b.className = `msg-bubble ${m.senderType}`;
    b.innerHTML = `<div class="msg-sender">${esc(m.sender)}</div>${esc(m.message)}`;
    list.appendChild(b);
  });
  list.scrollTop = list.scrollHeight;
}

function renderActions(r) {
  const handle   = document.getElementById('btn-handle');
  const closeBtn = document.getElementById('btn-close-report');
  const composer = document.getElementById('d-composer');

  const closed = r.status === 'closed';
  closeBtn.style.display  = closed ? 'none' : '';
  composer.style.display  = closed ? 'none' : '';

  if (closed) {
    handle.style.display = 'none';
  } else if (r.status === 'active') {
    handle.style.display = '';
    handle.disabled      = true;
    handle.innerHTML     = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Being Handled`;
  } else {
    handle.style.display = '';
    handle.disabled      = false;
    handle.innerHTML     = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
           fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Handle`;
  }

  handle.onclick = () => {
    if (r.status !== 'open') return;
    nuiFetch('handleReport', { reportId: r.id });
  };

  closeBtn.onclick = () => openCloseModal(r.id);
}

/* ── Filters ────────────────────────────────── */
document.querySelectorAll('.a-filter').forEach(btn =>
  btn.addEventListener('click', function () {
    document.querySelectorAll('.a-filter').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    state.filter = this.dataset.filter;
    renderList();
  })
);

/* ── Send message ───────────────────────────── */
document.getElementById('send-msg-btn').addEventListener('click', sendAdminMsg);
document.getElementById('msg-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendAdminMsg();
});

function sendAdminMsg() {
  const input = document.getElementById('msg-input');
  const msg   = input.value.trim();
  if (!msg || !state.selectedReport) return;

  nuiFetch('sendMessage', { reportId: state.selectedReport, message: msg });
  input.value = '';
}

/* ── Close admin panel ──────────────────────── */
document.getElementById('close-admin').addEventListener('click', () => {
  document.getElementById('admin-panel').classList.add('hidden');
  nuiFetch('closeUI');
});


/* ════════════════════════════════════════════════════════════
   CLOSE REASON  MODAL
════════════════════════════════════════════════════════════ */
function openCloseModal(reportId) {
  state.pendingClose = reportId;
  document.getElementById('close-reason').value = '';
  document.getElementById('reason-overlay').classList.remove('hidden');
}

function closeCloseModal() {
  document.getElementById('reason-overlay').classList.add('hidden');
  state.pendingClose = null;
}

document.getElementById('close-reason-modal').addEventListener('click', closeCloseModal);
document.getElementById('cancel-close')       .addEventListener('click', closeCloseModal);

document.getElementById('confirm-close').addEventListener('click', () => {
  if (!state.pendingClose) return;
  const reason = document.getElementById('close-reason').value.trim() || 'No reason provided';
  nuiFetch('closeReport', { reportId: state.pendingClose, reason });
  closeCloseModal();
});


/* ════════════════════════════════════════════════════════════
   REAL-TIME  UPDATES  (server pushes)
════════════════════════════════════════════════════════════ */
function onReportCreated(r) {
  state.reports[r.id] = r;
  renderList();
}

function onReportUpdated(r) {
  state.reports[r.id] = r;
  renderList();
  if (state.selectedReport === r.id) renderDetail(r);
}

function onReceiveMsg(reportId, msgData) {
  const r = state.reports[reportId];
  if (!r) return;
  r.messages = r.messages ?? [];
  r.messages.push(msgData);
  if (state.selectedReport === reportId) renderMessages(r);
}


/* ════════════════════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════════════════════ */
function closeAll() {
  document.getElementById('user-overlay').classList.add('hidden');
  document.getElementById('admin-panel') .classList.add('hidden');
  document.getElementById('reason-overlay').classList.add('hidden');
}
