/**
 * Contact Search App — app.js
 * Pure vanilla JS, zero dependencies, optimized for 50k records.
 */

/* =========================================
   STATE
   ========================================= */
const state = {
  allContacts: [],
  filteredContacts: [],
  selectedContact: null,
  selectedIndex: -1,
  query: '',
  debounceTimer: null,
  loaded: false,
};

/* =========================================
   DOM REFS (cached once on DOMContentLoaded)
   ========================================= */
let DOM = {};

function cacheDom() {
  DOM = {
    searchInput:     document.getElementById('search-input'),
    clearBtn:        document.getElementById('clear-btn'),
    resultsGrid:     document.getElementById('results-grid'),
    loadingState:    document.getElementById('loading-state'),
    emptyState:      document.getElementById('empty-state'),
    statsBar:        document.getElementById('stats-bar'),
    statsCount:      document.getElementById('stats-count'),
    statsLabel:      document.getElementById('stats-label'),
    statsQuery:      document.getElementById('stats-query'),
    themeToggle:     document.getElementById('theme-toggle'),

    // Desktop panel
    detailsPanel:    document.getElementById('details-panel'),
    panelEmptyHint:  document.getElementById('panel-empty-hint'),
    panelContent:    document.getElementById('panel-content'),
    panelAvatar:     document.getElementById('panel-avatar'),
    panelName:       document.getElementById('panel-name'),
    panelSno:        document.getElementById('panel-sno'),
    panelFields:     document.getElementById('panel-fields'),
    panelCopyJson:   document.getElementById('panel-copy-json'),
    panelClose:      document.getElementById('panel-close'),

    // Mobile drawer
    drawerOverlay:   document.getElementById('drawer-overlay'),
    mobileDrawer:    document.getElementById('mobile-drawer'),
    drawerAvatar:    document.getElementById('drawer-avatar'),
    drawerName:      document.getElementById('drawer-name'),
    drawerSno:       document.getElementById('drawer-sno'),
    drawerFields:    document.getElementById('drawer-fields'),
    drawerCopyJson:  document.getElementById('drawer-copy-json'),
    drawerClose:     document.getElementById('drawer-close'),
  };
}

/* =========================================
   THEME
   ========================================= */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  DOM.themeToggle.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  DOM.themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
}

/* =========================================
   DATA LOADING
   ========================================= */
async function loadContacts() {
  showLoading(true);
  try {
    const resp = await fetch('./contacts.json');
    if (!resp.ok) throw new Error('Failed to fetch contacts.json');
    const data = await resp.json();
    state.allContacts = Array.isArray(data) ? data : [];
    state.filteredContacts = [...state.allContacts];
    state.loaded = true;
    showLoading(false);
    renderResults(state.filteredContacts, '');
    updateStats(state.filteredContacts.length, '');
  } catch (e) {
    showLoading(false);
    DOM.resultsGrid.innerHTML = '';
    DOM.emptyState.classList.remove('hidden');
    DOM.emptyState.querySelector('.empty-title').textContent = 'Could not load data';
    DOM.emptyState.querySelector('.empty-subtitle').textContent =
      'Make sure contacts.json is in the same folder as index.html and you are using a local server.';
    DOM.emptyState.querySelector('.empty-illustration').textContent = '⚠️';
    console.error(e);
  }
}

/* =========================================
   SEARCH (debounced)
   ========================================= */
function onSearchInput(e) {
  const raw = e.target.value;
  DOM.clearBtn.classList.toggle('visible', raw.length > 0);

  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(() => {
    runSearch(raw);
  }, 200);
}

function runSearch(raw) {
  state.query = raw.trim();
  state.selectedIndex = -1;

  if (!state.query) {
    state.filteredContacts = state.allContacts;
  } else {
    const q = state.query.toLowerCase();
    state.filteredContacts = state.allContacts.filter(c => {
      const name = (c['VARSHIK MEMBER NAME'] || '').toLowerCase();
      const phone = String(c['MOBILE'] || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }

  renderResults(state.filteredContacts, state.query);
  updateStats(state.filteredContacts.length, state.query);
}

function clearSearch() {
  DOM.searchInput.value = '';
  DOM.clearBtn.classList.remove('visible');
  runSearch('');
  DOM.searchInput.focus();
}

/* =========================================
   RENDER RESULTS (virtualized chunk rendering)
   ========================================= */
const RENDER_CHUNK = 100; // render in batches to keep UI responsive

function renderResults(contacts, query) {
  DOM.emptyState.classList.add('hidden');
  DOM.resultsGrid.innerHTML = '';

  if (contacts.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    if (query) {
      DOM.emptyState.querySelector('.empty-illustration').textContent = '🔍';
      DOM.emptyState.querySelector('.empty-title').textContent = 'No results found';
      DOM.emptyState.querySelector('.empty-subtitle').textContent =
        `No contacts match "${query}". Try a different name or number.`;
    } else {
      DOM.emptyState.querySelector('.empty-illustration').textContent = '📋';
      DOM.emptyState.querySelector('.empty-title').textContent = 'No contacts available';
      DOM.emptyState.querySelector('.empty-subtitle').textContent =
        'The contacts list appears to be empty.';
    }
    return;
  }

  // Use DocumentFragment for batch DOM insert
  renderChunk(contacts, query, 0);
}

function renderChunk(contacts, query, start) {
  const frag = document.createDocumentFragment();
  const end = Math.min(start + RENDER_CHUNK, contacts.length);

  for (let i = start; i < end; i++) {
    frag.appendChild(createCard(contacts[i], i, query));
  }

  DOM.resultsGrid.appendChild(frag);

  // Schedule next chunk (allows browser to breathe)
  if (end < contacts.length) {
    requestAnimationFrame(() => renderChunk(contacts, query, end));
  }
}

/* =========================================
   CARD CREATION
   ========================================= */
function createCard(contact, index, query) {
  const card = document.createElement('div');
  card.className = 'contact-card';
  card.setAttribute('data-index', index);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${contact['VARSHIK MEMBER NAME'] || 'Unknown'}`);

  const name = contact['VARSHIK MEMBER NAME'] || '—';
  const phone = String(contact['MOBILE'] || '');
  const mno = contact['M.No.'] || '';
  const initials = getInitials(name);

  const highlightedName = highlight(name, query);
  const highlightedPhone = highlight(phone || '—', query);

  card.innerHTML = `
    <div class="contact-avatar">${initials}</div>
    <div class="contact-info">
      <div class="contact-name">${highlightedName}</div>
      <div class="contact-phone">${phone ? '📞 ' + highlightedPhone : '<span style="color:var(--text-muted);font-style:italic">No phone</span>'}</div>
      ${mno ? `<div class="contact-mno">M.No. ${mno}</div>` : ''}
    </div>
    <span class="contact-card-badge">#${contact['S.No.'] || index + 1}</span>
  `;

  card.addEventListener('click', () => selectContact(contact, index));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectContact(contact, index);
    }
  });

  return card;
}

/* =========================================
   HIGHLIGHT
   ========================================= */
function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const escapedQ = escapeHtml(query);
  const regex = new RegExp(`(${escapedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =========================================
   CONTACT SELECTION
   ========================================= */
function selectContact(contact, index) {
  state.selectedContact = contact;
  state.selectedIndex = index;

  // Highlight selected card
  document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('selected'));
  const card = DOM.resultsGrid.querySelector(`[data-index="${index}"]`);
  if (card) {
    card.classList.add('selected');
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    populateDrawer(contact);
    openDrawer();
  } else {
    populatePanel(contact);
  }
}

/* =========================================
   POPULATE DETAILS
   ========================================= */
function populatePanel(contact) {
  const name = contact['VARSHIK MEMBER NAME'] || '—';
  DOM.panelAvatar.textContent = getInitials(name);
  DOM.panelName.textContent = name;
  DOM.panelSno.textContent = `S.No. ${contact['S.No.'] || '—'} · M.No. ${contact['M.No.'] || '—'}`;
  DOM.panelFields.innerHTML = buildFieldsHtml(contact);

  // Show content, hide hint
  DOM.panelEmptyHint.classList.add('hidden');
  DOM.panelContent.style.display = 'flex';
  DOM.detailsPanel.classList.remove('empty');

  // Bind copy JSON
  DOM.panelCopyJson.onclick = () => copyJson(contact, DOM.panelCopyJson);
  // Bind copy phone button
  bindCopyPhone(DOM.panelFields, contact);
}

function populateDrawer(contact) {
  const name = contact['VARSHIK MEMBER NAME'] || '—';
  DOM.drawerAvatar.textContent = getInitials(name);
  DOM.drawerName.textContent = name;
  DOM.drawerSno.textContent = `S.No. ${contact['S.No.'] || '—'} · M.No. ${contact['M.No.'] || '—'}`;
  DOM.drawerFields.innerHTML = buildFieldsHtml(contact);
  DOM.drawerCopyJson.onclick = () => copyJson(contact, DOM.drawerCopyJson);
  bindCopyPhone(DOM.drawerFields, contact);
}

function buildFieldsHtml(contact) {
  const fieldLabels = {
    'S.No.': 'Serial Number',
    'M.No.': 'Member Number',
    'VARSHIK MEMBER NAME': 'Full Name',
    'ADDRESS': 'Address',
    'MOBILE': 'Mobile Number',
  };

  // Build in order, then any extra keys
  const knownKeys = Object.keys(fieldLabels);
  const extraKeys = Object.keys(contact).filter(k => !knownKeys.includes(k));
  const allKeys = [...knownKeys, ...extraKeys];

  return allKeys.map(key => {
    const val = contact[key];
    if (val === undefined) return '';
    const label = fieldLabels[key] || key;
    const isPhone = key === 'MOBILE';
    const isEmpty = val === '' || val === null || val === undefined;

    if (isPhone) {
      const phoneStr = String(val || '');
      return `
        <div class="field-row phone-row">
          <span class="field-label">${label}</span>
          <div class="field-value">
            <span class="phone-number-text">${phoneStr || '<em style="color:var(--text-muted)">Not available</em>'}</span>
            ${phoneStr ? `<button class="copy-phone-btn" data-phone="${escapeHtml(phoneStr)}">📋 Copy</button>` : ''}
          </div>
        </div>`;
    }

    return `
      <div class="field-row">
        <span class="field-label">${label}</span>
        <div class="field-value ${isEmpty ? 'empty-val' : ''}">${isEmpty ? 'Not available' : escapeHtml(String(val))}</div>
      </div>`;
  }).join('');
}

function bindCopyPhone(container, contact) {
  container.querySelectorAll('.copy-phone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = btn.dataset.phone;
      copyToClipboard(phone).then(() => {
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

/* =========================================
   DRAWER (mobile)
   ========================================= */
function openDrawer() {
  DOM.drawerOverlay.classList.add('active');
  DOM.mobileDrawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  DOM.drawerOverlay.classList.remove('active');
  DOM.mobileDrawer.classList.remove('active');
  document.body.style.overflow = '';
}

/* =========================================
   COPY UTILITIES
   ========================================= */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function copyJson(contact, btn) {
  const json = JSON.stringify(contact, null, 2);
  copyToClipboard(json).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = '✅ Copied JSON!';
    btn.classList.add('copied-json');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('copied-json');
    }, 2500);
  });
}

/* =========================================
   KEYBOARD NAVIGATION
   ========================================= */
function handleKeyboard(e) {
  const focused = document.activeElement;
  const cards = Array.from(DOM.resultsGrid.querySelectorAll('.contact-card'));

  if (e.key === 'Escape') {
    if (document.getElementById('mobile-drawer').classList.contains('active')) {
      closeDrawer();
    } else if (state.query) {
      clearSearch();
    }
    return;
  }

  // If search input focused
  if (focused === DOM.searchInput) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cards.length > 0) {
        state.selectedIndex = 0;
        updateKeyboardFocus(cards);
      }
    }
    return;
  }

  // If a card is focused
  if (focused && focused.classList.contains('contact-card')) {
    const currentIdx = parseInt(focused.dataset.index, 10);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // find next card in DOM
      const currentDomIdx = cards.indexOf(focused);
      const next = cards[currentDomIdx + 1];
      if (next) { next.focus(); removeKeyboardFocusStyle(cards); next.classList.add('keyboard-focused'); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentDomIdx = cards.indexOf(focused);
      if (currentDomIdx === 0) {
        DOM.searchInput.focus();
        removeKeyboardFocusStyle(cards);
      } else {
        const prev = cards[currentDomIdx - 1];
        if (prev) { prev.focus(); removeKeyboardFocusStyle(cards); prev.classList.add('keyboard-focused'); }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      focused.click();
    }
  }
}

function updateKeyboardFocus(cards) {
  removeKeyboardFocusStyle(cards);
  const target = cards[0];
  if (target) { target.focus(); target.classList.add('keyboard-focused'); }
}

function removeKeyboardFocusStyle(cards) {
  cards.forEach(c => c.classList.remove('keyboard-focused'));
}

/* =========================================
   STATS BAR
   ========================================= */
function updateStats(count, query) {
  DOM.statsCount.textContent = count.toLocaleString();
  DOM.statsLabel.textContent = count === 1 ? 'contact' : 'contacts';
  DOM.statsQuery.textContent = query ? `matching "${query}"` : 'total';
}

/* =========================================
   LOADING STATE
   ========================================= */
function showLoading(show) {
  DOM.loadingState.classList.toggle('hidden', !show);
  if (show) {
    DOM.resultsGrid.innerHTML = '';
    DOM.emptyState.classList.add('hidden');
  }
}

/* =========================================
   HELPERS
   ========================================= */
function getInitials(name) {
  if (!name || name === '—') return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

/* =========================================
   EVENT BINDINGS
   ========================================= */
function bindEvents() {
  DOM.searchInput.addEventListener('input', onSearchInput);
  DOM.clearBtn.addEventListener('click', clearSearch);
  DOM.themeToggle.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', handleKeyboard);

  // Drawer close
  DOM.drawerClose.addEventListener('click', closeDrawer);
  DOM.drawerOverlay.addEventListener('click', closeDrawer);

  // Panel close
  DOM.panelClose && DOM.panelClose.addEventListener('click', () => {
    DOM.panelContent.style.display = 'none';
    DOM.panelEmptyHint.classList.remove('hidden');
    DOM.detailsPanel.classList.add('empty');
    // Deselect card
    document.querySelectorAll('.contact-card').forEach(c => c.classList.remove('selected'));
    state.selectedContact = null;
  });
}

/* =========================================
   INIT
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
  cacheDom();
  initTheme();
  bindEvents();
  loadContacts();
  DOM.searchInput.focus();
});
