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
 
// Empty — each user starts fresh
let entries = [];
let nextId  = 1;
 
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
 