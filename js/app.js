// ============================================================
// WeekLog — js/app.js
// Main controller: wires up all events, orchestrates modules
// ============================================================

// ============================================================
// WeekLog — js/app.js
// ============================================================

import { addEntry } from './data.js';
import { renderEntries, renderWeekEntries, updateStats, renderPDFPreviewEntries, switchPanel, selectChip } from './ui.js';
import { generateDraft } from './ai.js';
import { generatePDF } from './pdf.js';
import { emailReport } from './email.js';

let currentType = 'done';

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const saved = loadProfile();
  if (saved) {
    applyProfile(saved);
    showApp();
  } else {
    showOnboarding();
  }

  document.getElementById('ob-submit').addEventListener('click', handleOnboardingSubmit);
  document.getElementById('edit-profile-btn').addEventListener('click', () => {
    showOnboarding();
    const p = loadProfile();
    if (p) {
      document.getElementById('ob-name').value  = p.name;
      document.getElementById('ob-dept').value  = p.dept;
      document.getElementById('ob-role').value  = p.role;
      document.getElementById('ob-email').value = p.email || '';
    }
  });
});

// ── Onboarding ───────────────────────────────────────────
function handleOnboardingSubmit() {
  const name  = document.getElementById('ob-name').value.trim();
  const dept  = document.getElementById('ob-dept').value;
  const role  = document.getElementById('ob-role').value.trim();
  const email = document.getElementById('ob-email').value.trim();
  const err   = document.getElementById('ob-error');

  if (!name || !dept || !role) {
    err.style.display = 'flex';
    return;
  }
  err.style.display = 'none';

  const profile = { name, dept, role, email };
  saveProfile(profile);
  applyProfile(profile);
  showApp();
}

function applyProfile(p) {
  // Sidebar
  setEl('sidebar-name', p.name);
  setEl('sidebar-dept', p.dept);
  setEl('sidebar-role', p.role);

  // PDF preview
  setEl('pdf-name', p.name);
  setEl('pdf-dept', `${p.dept} · ${p.role}`);

  // Report title
  const weekStr = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  setEl('report-title', `Weekly journal — w/e ${weekStr}`);

  // Schedule email label
  setEl('sched-manager-email', p.email || 'No manager email set');
}

function showOnboarding() {
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'grid';

  // Init app once
  renderEntries();
  renderWeekEntries();
  renderPDFPreviewEntries();
  updateStats();
  switchPanel('log');

  bindNav();
  bindChips();
  bindAddEntry();
  bindReport();
  bindPDF();
  bindSchedule();
  startFridayScheduler();
}

// ── Profile storage ───────────────────────────────────────
function saveProfile(p) {
  localStorage.setItem('weeklog_profile', JSON.stringify(p));
}
function loadProfile() {
  try {
    const raw = localStorage.getItem('weeklog_profile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Navigation ────────────────────────────────────────────
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      if (!panel) return;
      switchPanel(panel);
      if (panel === 'week') { renderWeekEntries(); updateStats(); }
    });
  });
}

// ── Chips ─────────────────────────────────────────────────
function bindChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentType = chip.dataset.type;
      selectChip(currentType);
    });
  });
}

// ── Add entry ─────────────────────────────────────────────
function bindAddEntry() {
  const input = document.getElementById('entry-input');
  const btn   = document.getElementById('add-btn');
  btn.addEventListener('click', submitEntry);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEntry(); }
  });
}

function submitEntry() {
  const input = document.getElementById('entry-input');
  const text  = input.value.trim();
  if (!text) return;

  const now       = new Date();
  const time      = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today     = DAY_NAMES[now.getDay()];

  addEntry({ text, type: currentType, day: today, time });
  input.value = '';
  renderEntries();
  updateStats();
  renderPDFPreviewEntries();
}

// ── Report ────────────────────────────────────────────────
function bindReport() {
  document.getElementById('regen-btn')?.addEventListener('click', handleRegenerate);
  document.getElementById('copy-btn')?.addEventListener('click', handleCopy);
  document.getElementById('goto-pdf-btn')?.addEventListener('click', () => switchPanel('pdf'));
}

async function handleRegenerate() {
  const btn   = document.getElementById('regen-btn');
  const body  = document.getElementById('draft-body');
  const badge = document.getElementById('ai-badge');

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating…';
  badge.innerHTML = '<span class="spinner spinner-dark"></span> Writing…';

  try {
    const text = await generateDraft();
    body.innerHTML = text.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
    const pdfSummary = document.getElementById('pdf-summary-text');
    if (pdfSummary) pdfSummary.textContent = text.split('\n')[0];
  } catch (err) {
    body.innerHTML = `<span style="color:var(--danger)">Failed to connect to Claude API. ${err.message}</span>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-sparkles"></i> Regenerate with Claude';
  badge.innerHTML = '<i class="ti ti-sparkles"></i> AI drafted';
}

function handleCopy() {
  const text = document.getElementById('draft-body')?.innerText || '';
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<i class="ti ti-check"></i> Copied';
    setTimeout(() => { btn.innerHTML = '<i class="ti ti-copy"></i> Copy'; }, 2000);
  });
}

// ── PDF ───────────────────────────────────────────────────
function bindPDF() {
  document.getElementById('gen-btn')?.addEventListener('click', handleGeneratePDF);
  document.getElementById('send-btn')?.addEventListener('click', handleSendEmail);
  document.getElementById('preview-btn')?.addEventListener('click', () => switchPanel('pdf'));
}

async function handleGeneratePDF() {
  const btn    = document.getElementById('gen-btn');
  const status = document.getElementById('pdf-status');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Generating PDF…';
  if (status) status.textContent = 'Generating PDF…';
  await new Promise(r => setTimeout(r, 400));
  try {
    const profile = loadProfile();
    await generatePDF(profile);
    const time = new Date().toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
    if (status) { status.textContent = `PDF downloaded at ${time}`; status.style.color = 'var(--emerald-dark)'; }
  } catch (err) {
    if (status) { status.textContent = `PDF failed: ${err.message}`; status.style.color = 'var(--danger)'; }
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-download"></i> Generate & download now';
}

async function handleSendEmail() {
  const btn    = document.getElementById('send-btn');
  const status = document.getElementById('pdf-status');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending…';
  if (status) status.textContent = 'Generating PDF and sending emails…';
  try {
    const profile = loadProfile();
    const doc     = await generatePDF(profile);
    const summary = document.getElementById('draft-body')?.innerText?.split('\n')[0] || '';
    const result  = await emailReport(doc, summary);
    const time    = new Date().toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
    if (status) { status.textContent = `✓ ${result.message} at ${time}`; status.style.color = 'var(--emerald-dark)'; }
  } catch (err) {
    if (status) { status.textContent = `Send failed: ${err.message}`; status.style.color = 'var(--danger)'; }
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-send"></i> Send to managers now';
}

// ── Friday scheduler ──────────────────────────────────────
function startFridayScheduler() {
  checkAndAutoSend();
  setInterval(checkAndAutoSend, 60 * 1000);
}

async function checkAndAutoSend() {
  const toggle = document.querySelector('.toggle[data-id="friday"]');
  if (toggle && !toggle.classList.contains('on')) return;
  const now = new Date();
  if (now.getDay() !== 5 || now.getHours() !== 17 || now.getMinutes() !== 0) return;
  const thisSlot = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-17:00`;
  if (localStorage.getItem('weeklog_last_auto_send') === thisSlot) return;
  localStorage.setItem('weeklog_last_auto_send', thisSlot);
  const status = document.getElementById('pdf-status');
  if (status) { status.textContent = '⏰ Auto-publish triggered…'; status.style.color = 'var(--indigo-dark)'; }
  try {
    const profile = loadProfile();
    const doc     = await generatePDF(profile);
    const summary = document.getElementById('draft-body')?.innerText?.split('\n')[0] || '';
    const result  = await emailReport(doc, summary);
    if (status) { status.textContent = `✓ Auto-published: ${result.message}`; status.style.color = 'var(--emerald-dark)'; }
  } catch (err) {
    if (status) { status.textContent = `Auto-publish failed: ${err.message}`; status.style.color = 'var(--danger)'; }
  }
}

// ── Schedule toggles ──────────────────────────────────────
function bindSchedule() {
  document.querySelectorAll('.toggle').forEach(tog => {
    tog.addEventListener('click', () => tog.classList.toggle('on'));
  });
}

// ── Helpers ───────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}