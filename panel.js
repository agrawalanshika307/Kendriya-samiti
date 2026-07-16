/**
 * panel.js — श्री अग्रसेन सनातन पेनल
 * All logic: splash, tabs, members, search, modals
 */

/* ══════════════════════════════════════
   CANDIDATE DATA
══════════════════════════════════════ */

const PURUSH_MEMBERS = [
  { name: 'अभिषेक मित्तल', initials: 'अमि', color: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  { name: 'अमन सिंघल', initials: 'असिं', color: 'linear-gradient(135deg,#0369a1,#38bdf8)' },
  { name: 'आशीष गर्ग', initials: 'आगर्', color: 'linear-gradient(135deg,#065f46,#34d399)' },
  { name: 'गौरव अग्रवाल', initials: 'गअ', color: 'linear-gradient(135deg,#9f1239,#fb7185)' },
  { name: 'हितेश गोयल', initials: 'हिगो', color: 'linear-gradient(135deg,#713f12,#fbbf24)' },
  { name: 'नितिन अग्रवाल', initials: 'निअ', color: 'linear-gradient(135deg,#1e3a5f,#60a5fa)' },
  { name: 'राम तायल', initials: 'रात', color: 'linear-gradient(135deg,#4c1d95,#c084fc)' },
  { name: 'संजय धन्नालाल गोयल', initials: 'संगो', color: 'linear-gradient(135deg,#7f1d1d,#fca5a5)' },
  { name: 'सुरेन्द्रकुमार अग्रवाल', initials: 'सुअ', color: 'linear-gradient(135deg,#164e63,#67e8f9)' },
  { name: 'विशाल अग्रवाल', initials: 'विअ', color: 'linear-gradient(135deg,#3b0764,#e879f9)' },
];

const MAHILA_MEMBERS = [
  { name: 'अंजली अग्रवाल', initials: 'अंअ', color: 'linear-gradient(135deg,#831843,#f472b6)' },
  { name: 'ज्योति गर्ग', initials: 'ज्यो', color: 'linear-gradient(135deg,#7c2d12,#fb923c)' },
  { name: 'शशि ऐरन', initials: 'शऐ', color: 'linear-gradient(135deg,#1e1b4b,#818cf8)' },
];

/* ══════════════════════════════════════
   SPLASH → APP TRANSITION
══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    const app = document.getElementById('app');
    app.classList.remove('hidden');
    app.style.opacity = '0';
    requestAnimationFrame(() => {
      app.style.transition = 'opacity 0.5s ease';
      app.style.opacity = '1';
    });
  }, 3000);

  renderMemberGrid('purushGrid', PURUSH_MEMBERS);
  renderMemberGrid('mahilaGrid', MAHILA_MEMBERS);
  loadContacts();
  bindSearchEvents();
});

/* ══════════════════════════════════════
   RENDER GRIDS
══════════════════════════════════════ */
function renderMemberGrid(gridId, members) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  const isMahila = gridId === 'mahilaGrid';

  grid.innerHTML = members.map(m => `
    <div class="member-card" onclick="showMemberCard('${esc(m.name)}','${esc(m.initials)}','${esc(m.color)}','${isMahila ? 'महिला' : 'पुरुष'} कार्यकारिणी')">
      <div class="member-avatar" style="background:${m.color}">${m.initials}</div>
      <div class="member-name">${m.name}</div>
      <div class="member-gender-badge">${isMahila ? '👩 महिला' : '👨 पुरुष'}</div>
    </div>
  `).join('');
}

/* ══════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════ */
function switchTab(tabId) {
  // Sections
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');

  // Buttons
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  // When search tab opens, focus input
  if (tabId === 'search') {
    setTimeout(() => {
      document.getElementById('searchInput')?.focus();
    }, 100);
  }
}

/* ══════════════════════════════════════
   OFFICER DETAIL SHEET
══════════════════════════════════════ */
function showDetail(name, post, postShort, color, initials) {
  const content = document.getElementById('sheetContent');
  content.innerHTML = `
    <div style="text-align:center; margin-bottom:12px;">
      <div class="sheet-avatar-big" style="background:linear-gradient(135deg,${color},${lighten(color)})">${initials}</div>
      <div class="sheet-post-badge">${post}</div>
      <div class="sheet-name">${name}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">पद</div>
      <div class="sheet-field-value">${postShort}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">पेनल</div>
      <div class="sheet-field-value">श्री अग्रसेन सनातन पेनल</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">संस्था</div>
      <div class="sheet-field-value">श्री अग्रवाल समाज केन्द्रीय समिति (रजि.), इन्दौर</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">चुनाव</div>
      <div class="sheet-field-value">द्विवार्षिक चुनाव 2026 — 26 जुलाई 2026</div>
    </div>
  `;
  document.getElementById('detailOverlay').classList.remove('hidden');
  document.getElementById('detailSheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.add('hidden');
  document.getElementById('detailSheet').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════
   KARYAKARINI MEMBER CARD SHEET
══════════════════════════════════════ */
function showMemberCard(name, initials, color, category) {
  const content = document.getElementById('memberSheetContent');
  content.innerHTML = `
    <div style="text-align:center; margin-bottom:12px;">
      <div class="sheet-avatar-big" style="background:${color}">${initials}</div>
      <div class="sheet-post-badge">${category}</div>
      <div class="sheet-name">${name}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">श्रेणी</div>
      <div class="sheet-field-value">${category}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">पेनल</div>
      <div class="sheet-field-value">श्री अग्रसेन सनातन पेनल</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">संस्था</div>
      <div class="sheet-field-value">श्री अग्रवाल समाज केन्द्रीय समिति (रजि.), इन्दौर</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">चुनाव</div>
      <div class="sheet-field-value">26 जुलाई 2026, रविवार</div>
    </div>
  `;
  document.getElementById('memberOverlay').classList.remove('hidden');
  document.getElementById('memberSheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMemberDetail() {
  document.getElementById('memberOverlay').classList.add('hidden');
  document.getElementById('memberSheet').classList.add('hidden');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════
   MEMBER SEARCH (contacts.json)
══════════════════════════════════════ */
let allContacts = [];
let debounceTimer = null;

async function loadContacts() {
  try {
    const res = await fetch('./contacts.json');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    allContacts = Array.isArray(data) ? data : [];
    document.getElementById('loadingState').classList.add('hidden');
    renderResults(allContacts, '');
    updateStats(allContacts.length, '');
  } catch (e) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('noResults').classList.remove('hidden');
    document.querySelector('#noResults .state-title').textContent = 'डेटा लोड नहीं हुआ';
    document.querySelector('#noResults .state-sub').textContent = 'कृपया local server पर खोलें';
  }
}

function bindSearchEvents() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');

  input.addEventListener('input', () => {
    const val = input.value;
    clearBtn.classList.toggle('hidden', val.length === 0);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => doSearch(val), 200);
  });
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('clearBtn').classList.add('hidden');
  doSearch('');
  input.focus();
}

function doSearch(raw) {
  const q = raw.trim();
  let results;
  if (!q) {
    results = allContacts;
  } else {
    const ql = q.toLowerCase();
    results = allContacts.filter(c => {
      const name = (c['VARSHIK MEMBER NAME'] || '').toLowerCase();
      const phone = String(c['MOBILE'] || '').toLowerCase();
      return name.includes(ql) || phone.includes(ql);
    });
  }
  renderResults(results, q);
  updateStats(results.length, q);
}

function updateStats(count, query) {
  const bar = document.getElementById('searchStats');
  const text = document.getElementById('statsText');
  if (!bar || !text) return;
  if (allContacts.length === 0) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  text.textContent = query
    ? `"${query}" के लिए ${count.toLocaleString('hi-IN')} सदस्य मिले`
    : `कुल ${count.toLocaleString('hi-IN')} सदस्य`;
}

let renderChunkId = 0;

function renderResults(contacts, query) {
  const list = document.getElementById('resultsList');
  const noRes = document.getElementById('noResults');
  if (!list) return;

  list.innerHTML = '';
  noRes.classList.add('hidden');

  if (contacts.length === 0 && allContacts.length > 0) {
    noRes.classList.remove('hidden');
    return;
  }
  if (allContacts.length === 0) return;

  renderChunkId++;
  const myId = renderChunkId;
  renderChunk(contacts, query, 0, myId);
}

function renderChunk(contacts, query, start, chunkId) {
  if (chunkId !== renderChunkId) return; // stale chunk
  const list = document.getElementById('resultsList');
  if (!list) return;

  const CHUNK = 80;
  const end = Math.min(start + CHUNK, contacts.length);
  const frag = document.createDocumentFragment();

  for (let i = start; i < end; i++) {
    frag.appendChild(buildResultCard(contacts[i], query));
  }
  list.appendChild(frag);

  if (end < contacts.length) {
    requestAnimationFrame(() => renderChunk(contacts, query, end, chunkId));
  }
}

function buildResultCard(contact, query) {
  const name = contact['VARSHIK MEMBER NAME'] || '—';
  const phone = String(contact['MOBILE'] || '');
  const sno = contact['S.No.'] || '';
  const initials = getInitials(name);

  const div = document.createElement('div');
  div.className = 'result-card';
  div.innerHTML = `
    <div class="result-avatar">${initials}</div>
    <div class="result-info">
      <div class="result-name">${hlText(name, query)}</div>
      ${phone
        ? `<div class="result-phone">📞 ${hlText(phone, query)}</div>`
        : `<div class="result-phone" style="opacity:0.4;font-style:italic">मोबाइल नहीं</div>`}
    </div>
    ${sno ? `<span class="result-sno">#${sno}</span>` : ''}
  `;
  div.addEventListener('click', () => showMemberSearchDetail(contact));
  return div;
}

function showMemberSearchDetail(contact) {
  const name = contact['VARSHIK MEMBER NAME'] || '—';
  const phone = String(contact['MOBILE'] || '');
  const address = contact['ADDRESS'] || '';
  const mno = contact['M.No.'] || '';
  const sno = contact['S.No.'] || '';
  const initials = getInitials(name);

  const content = document.getElementById('memberSheetContent');
  content.innerHTML = `
    <div style="text-align:center;margin-bottom:14px;">
      <div class="sheet-avatar-big" style="background:linear-gradient(135deg,#b45309,#d97706)">${initials}</div>
      <div class="sheet-name">${esc(name)}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">सदस्य क्रमांक (S.No.)</div>
      <div class="sheet-field-value">${esc(String(sno)) || 'उपलब्ध नहीं'}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">सदस्य संख्या (M.No.)</div>
      <div class="sheet-field-value">${esc(String(mno)) || 'उपलब्ध नहीं'}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">पता</div>
      <div class="sheet-field-value ${address ? '' : 'empty'}">${address ? esc(address) : 'उपलब्ध नहीं'}</div>
    </div>
    <div class="sheet-field">
      <div class="sheet-field-label">मोबाइल नंबर</div>
      <div class="sheet-field-value ${phone ? '' : 'empty'}">${phone || 'उपलब्ध नहीं'}</div>
    </div>
    ${phone ? `
    <button id="copyPhoneBtn" class="copy-phone-big" onclick="copyPhoneHandler('${esc(phone)}')">
      📋 मोबाइल नंबर कॉपी करें
    </button>` : ''}
  `;

  document.getElementById('memberOverlay').classList.remove('hidden');
  document.getElementById('memberSheet').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function copyPhoneHandler(phone) {
  copyToClipboard(phone).then(() => {
    const btn = document.getElementById('copyPhoneBtn');
    if (btn) {
      btn.textContent = '✅ कॉपी हो गया!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = '📋 मोबाइल नंबर कॉपी करें';
        btn.classList.remove('copied');
      }, 2500);
    }
  });
}

/* ══════════════════════════════════════
   HELPERS
══════════════════════════════════════ */
function getInitials(name) {
  if (!name || name === '—') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hlText(text, query) {
  if (!query) return esc(text);
  const escaped = esc(text);
  const escapedQ = esc(query);
  const regex = new RegExp(`(${escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

function lighten(color) {
  // crude lighten: just return a lighter shade indicator
  return color.split(',')[1] || '#f59e0b';
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}
