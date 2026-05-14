// ============================================================
// WeekLog — js/ui.js
// Pure rendering helpers — build DOM from data, update stats
// ============================================================

import { getEntries, getEntriesForDay, getStats, getDayCounts, DAY_FULL, DOT_COLORS, DAYS } from './data.js';

// ── Entry list (Log panel) ────────────────────────────────
export function renderEntries() {
  const list = document.getElementById('entry-list');
  list.innerHTML = '';

  const entries = getEntries(); // already newest-first (unshift)
  entries.forEach(entry => {
    list.appendChild(buildEntryEl(entry));
  });
}

function buildEntryEl(entry) {
  const el = document.createElement('div');
  el.className = 'entry';
  el.dataset.id = entry.id;

  el.innerHTML = `
    <div class="dot dot-${entry.type}"></div>
    <div style="flex:1;min-width:0">
      <div class="entry-text">
        ${escHtml(entry.text)}
        ${entry.tag ? `<span class="entry-tag">${escHtml(entry.tag)}</span>` : ''}
      </div>
      <div class="entry-meta">${entry.day} · ${entry.time}</div>
    </div>
  `;
  return el;
}

// ── Week-view entries (grouped by day) ───────────────────
export function renderWeekEntries() {
  const container = document.getElementById('week-entries');
  container.innerHTML = '';

  ['Mon', 'Tue', 'Wed'].forEach(day => {
    const dayEntries = getEntriesForDay(day);
    if (!dayEntries.length) return;

    const hdr = document.createElement('div');
    hdr.className = 'day-header';
    hdr.textContent = DAY_FULL[day];
    container.appendChild(hdr);

    const list = document.createElement('div');
    list.className = 'entry-list';

    dayEntries.forEach(entry => {
      const el = document.createElement('div');
      el.className = 'entry';
      el.innerHTML = `
        <div class="dot dot-${entry.type}"></div>
        <div style="flex:1;min-width:0">
          <div class="entry-text">
            ${escHtml(entry.text)}
            ${entry.tag ? `<span class="entry-tag">${escHtml(entry.tag)}</span>` : ''}
          </div>
          <div class="entry-meta">${entry.time}</div>
        </div>
      `;
      list.appendChild(el);
    });

    container.appendChild(list);
  });
}

// ── Stats (shared across panels) ─────────────────────────
export function updateStats() {
  const stats = getStats();
  const counts = getDayCounts();

  setTextSafe('stat-total',  stats.total);
  setTextSafe('stat-done',   stats.done);
  setTextSafe('stat-block',  stats.block);
  setTextSafe('entry-count-sidebar', `${stats.total} entries logged`);

  // Day pill counts in week view
  ['mon', 'tue', 'wed'].forEach(d => {
    const key = d.charAt(0).toUpperCase() + d.slice(1);
    setTextSafe(`wc-${d}`, counts[key] || '—');
  });

  // PDF preview stats
  setTextSafe('pdf-s-total', stats.total);
  setTextSafe('pdf-s-done',  stats.done);
  setTextSafe('pdf-s-block', stats.block);
}

// ── PDF preview entries ───────────────────────────────────
export function renderPDFPreviewEntries() {
  const container = document.getElementById('pdf-entries-preview');
  if (!container) return;
  container.innerHTML = '';

  ['Mon', 'Tue', 'Wed'].forEach(day => {
    const dayEntries = getEntriesForDay(day);
    if (!dayEntries.length) return;

    const section = document.createElement('div');
    section.innerHTML = `<div class="pdf-day-label">${DAY_FULL[day]}</div>`;

    dayEntries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'pdf-entry-row';
      row.innerHTML = `
        <span class="pdf-entry-dot" style="background:${DOT_COLORS[entry.type]}"></span>
        <span class="pdf-entry-text">${escHtml(entry.text)}</span>
      `;
      section.appendChild(row);
    });

    container.appendChild(section);
  });
}

// ── Topbar titles per panel ───────────────────────────────
const PANEL_TITLES = {
  log:    ['Log an entry',    'Entries auto-save as you go'],
  week:   ['Week view',       'Mon–Wed · 12 entries'],
  report: ['Draft report',    'AI-generated from your entries'],
  pdf:    ['PDF export',      'Auto-published every Friday at 17:00'],
  sched:  ['Schedule',        'Configure reminders & auto-publish'],
};

export function setTopbar(panel) {
  const [title, sub] = PANEL_TITLES[panel] || ['', ''];
  setTextSafe('panel-title', title);
  setTextSafe('panel-sub', sub);
}

// ── Panel switcher ────────────────────────────────────────
export function switchPanel(id) {
  document.querySelectorAll('.panel').forEach(p =>
    p.classList.toggle('active', p.id === `panel-${id}`)
  );
  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.panel === id)
  );
  setTopbar(id);
}

// ── Chip selection ────────────────────────────────────────
export function selectChip(type) {
  document.querySelectorAll('.chip').forEach(c =>
    c.classList.toggle('selected', c.dataset.type === type)
  );
}

// ── Helpers ───────────────────────────────────────────────
function setTextSafe(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}