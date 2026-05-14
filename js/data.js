// ============================================================
// WeekLog — js/data.js
// Central state: entries store + mutation helpers
// ============================================================

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday'
};

export const DOT_COLORS = {
  done:  '#1D9E75',
  prog:  '#EF9F27',
  block: '#E24B4A',
  meet:  '#7F77DD'
};

// Seed data (same as original prototype)
let entries = [
  { id: 1,  text: 'Q2 data model review with Lebo',                   tag: 'Meeting', type: 'meet',  day: 'Mon', time: '9:30'  },
  { id: 2,  text: 'Deployed hotfix for login timeout bug to production', tag: '',       type: 'done',  day: 'Mon', time: '14:15' },
  { id: 3,  text: 'Code review: auth refactor PR #142',               tag: '',        type: 'done',  day: 'Mon', time: '16:00' },
  { id: 4,  text: 'Retro meeting — noted 3 action items',             tag: 'Meeting', type: 'meet',  day: 'Mon', time: '10:00' },
  { id: 5,  text: 'Dashboard redesign wireframes completed',           tag: '',        type: 'done',  day: 'Tue', time: '11:00' },
  { id: 6,  text: 'Reviewed Figma handoff with design team',          tag: 'Meeting', type: 'meet',  day: 'Tue', time: '14:00' },
  { id: 7,  text: 'Updated unit tests for auth module',               tag: '',        type: 'done',  day: 'Tue', time: '16:30' },
  { id: 8,  text: 'API integration — blocked on vendor sandbox creds', tag: '',        type: 'block', day: 'Wed', time: '9:00'  },
  { id: 9,  text: 'Wrote technical spec for new search feature',       tag: '',        type: 'done',  day: 'Wed', time: '11:30' },
  { id: 10, text: 'Synced with PM on Q2 scope changes',               tag: 'Meeting', type: 'meet',  day: 'Wed', time: '13:00' },
  { id: 11, text: 'CI pipeline fix — flaky test suite resolved',       tag: '',        type: 'done',  day: 'Wed', time: '15:00' },
  { id: 12, text: 'Onboarding doc update for new devs',               tag: '',        type: 'prog',  day: 'Wed', time: '16:30' },
];

let nextId = 13;

// ── Getters ──────────────────────────────────────────────
export function getEntries()           { return [...entries]; }
export function getEntriesForDay(day)  { return entries.filter(e => e.day === day); }

export function getStats() {
  return {
    total: entries.length,
    done:  entries.filter(e => e.type === 'done').length,
    prog:  entries.filter(e => e.type === 'prog').length,
    block: entries.filter(e => e.type === 'block').length,
    meet:  entries.filter(e => e.type === 'meet').length,
  };
}

export function getDayCounts() {
  const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
  entries.forEach(e => { if (counts[e.day] !== undefined) counts[e.day]++; });
  return counts;
}

// ── Mutations ─────────────────────────────────────────────
export function addEntry({ text, type, day, time }) {
  const tag = type === 'meet' ? 'Meeting' : '';
  const entry = { id: nextId++, text, tag, type, day, time };
  entries.unshift(entry);
  return entry;
}

export function removeEntry(id) {
  entries = entries.filter(e => e.id !== id);
}

// ── Serialise for AI prompt ───────────────────────────────
export function entriesToPromptText() {
  return entries
    .map(e => `[${e.day} ${e.time}] [${e.type.toUpperCase()}] ${e.text}`)
    .join('\n');
}