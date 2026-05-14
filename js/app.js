// ============================================================
// WeekLog — js/app.js
// Main controller: wires up all events, orchestrates modules
// ============================================================

import { addEntry, getStats } from './data.js';
import { renderEntries, renderWeekEntries, updateStats, renderPDFPreviewEntries, switchPanel, selectChip } from './ui.js';
import { generateDraft } from './ai.js';
import { generatePDF } from './pdf.js';

// ── State ─────────────────────────────────────────────────
let currentType = 'done';

// ── Boot ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
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
});

// ── Navigation ────────────────────────────────────────────
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const panel = item.dataset.panel;
      if (!panel) return;
      switchPanel(panel);

      // Refresh week view data when switching to it
      if (panel === 'week') {
        renderWeekEntries();
        updateStats();
      }
    });
  });
}

// ── Status chips ──────────────────────────────────────────
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
  const input  = document.getElementById('entry-input');
  const addBtn = document.getElementById('add-btn');

  addBtn.addEventListener('click', submitEntry);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitEntry();
    }
  });
}

function submitEntry() {
  const input = document.getElementById('entry-input');
  const text  = input.value.trim();
  if (!text) return;

  const now  = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = DAYS[new Date().getDay()];
  addEntry({ text, type: currentType, day: today, time });
  input.value = '';

  renderEntries();
  updateStats();
  renderPDFPreviewEntries();
}

// ── Report panel ──────────────────────────────────────────
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
    body.innerHTML = text
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

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
    setTimeout(() => {
      btn.innerHTML = '<i class="ti ti-copy"></i> Copy';
    }, 2000);
  });
}

// ── PDF panel ─────────────────────────────────────────────
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

  // Small delay for UX feedback
  await new Promise(r => setTimeout(r, 400));

  try {
    await generatePDF();
    const time = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    if (status) {
      status.textContent = `PDF generated at ${time} · Next auto-export: Friday 15 May at 17:00`;
      status.style.color = 'var(--emerald-dark)';
    }
  } catch (err) {
    if (status) {
      status.textContent = `PDF generation failed: ${err.message}`;
      status.style.color = 'var(--danger)';
    }
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-download"></i> Generate & download now';
}

// ── Schedule toggles ──────────────────────────────────────
function bindSchedule() {
  document.querySelectorAll('.toggle').forEach(tog => {
    tog.addEventListener('click', () => tog.classList.toggle('on'));
  });
}