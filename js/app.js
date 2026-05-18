// ============================================================
// WeekLog — js/app.js
// ============================================================

import { addEntry } from './data.js';
import { renderEntries, renderWeekEntries, updateStats, renderPDFPreviewEntries, switchPanel, selectChip } from './ui.js';
import { generateDraft } from './ai.js';
import { generatePDF } from './pdf.js';
 
let currentType = 'done';
let appInitialized = false;
 
document.addEventListener('DOMContentLoaded', () => {
  const saved = loadProfile();
  if (saved) {
    applyProfile(saved);
    showApp();
  } else {
    showOnboarding();
  }
  document.getElementById('ob-submit').addEventListener('click', handleSubmit);
});
 
function handleSubmit() {
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
  setEl('sidebar-name', p.name);
  setEl('sidebar-dept', p.dept);
  setEl('sidebar-role', p.role);
  setEl('pdf-name', p.name);
  setEl('pdf-dept', p.dept + ' · ' + p.role);
  setEl('sched-manager-email', p.email || 'No manager email set');
  const weekStr = new Date().toLocaleDateString('en-ZA', { day:'numeric', month:'short', year:'numeric' });
  setEl('report-title', 'Weekly journal — w/e ' + weekStr);
 
  const editBtn = document.getElementById('edit-profile-btn');
  if (editBtn) {
    editBtn.onclick = () => {
      showOnboarding();
      document.getElementById('ob-name').value  = p.name;
      document.getElementById('ob-dept').value  = p.dept;
      document.getElementById('ob-role').value  = p.role;
      document.getElementById('ob-email').value = p.email || '';
    };
  }
}
 
function showOnboarding() {
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}
 
function showApp() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'grid';
  if (!appInitialized) {
    appInitialized = true;
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
  }
}
 
function saveProfile(p) {
  try { localStorage.setItem('weeklog_profile', JSON.stringify(p)); } catch(e) {}
}
 
function loadProfile() {
  try {
    const raw = localStorage.getItem('weeklog_profile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
 
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
 
function bindChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentType = chip.dataset.type;
      selectChip(currentType);
    });
  });
}
 
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
  const time      = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today     = DAY_NAMES[now.getDay()];
  addEntry({ text, type: currentType, day: today, time });
  input.value = '';
  renderEntries();
  updateStats();
  renderPDFPreviewEntries();
}
 
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
    const ps = document.getElementById('pdf-summary-text');
    if (ps) ps.textContent = text.split('\n')[0];
  } catch (err) {
    body.innerHTML = '<span style="color:var(--danger)">Failed: ' + err.message + '</span>';
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
 
function bindPDF() {
  document.getElementById('gen-btn')?.addEventListener('click', handleGeneratePDF);
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
    const profile = loadProfile() || {};
    await generatePDF(profile);
    const time = new Date().toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
    if (status) { status.textContent = '✓ PDF downloaded at ' + time; status.style.color = 'var(--emerald-dark)'; }
  } catch (err) {
    if (status) { status.textContent = 'PDF failed: ' + err.message; status.style.color = 'var(--danger)'; }
  }
  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-download"></i> Generate & download now';
}
 
function bindSchedule() {
  document.querySelectorAll('.toggle').forEach(tog => {
    tog.addEventListener('click', () => tog.classList.toggle('on'));
  });
}
 
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}