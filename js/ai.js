// ============================================================
// WeekLog — js/ai.js
// Claude API calls: draft report generation
// ============================================================

import { entriesToPromptText } from './data.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-sonnet-4-20250514';

/**
 * Calls Claude to generate a weekly draft report from current entries.
 * Returns plain-text string.
 * Throws on network / API error.
 */
export async function generateDraft() {
  const entrySummary = entriesToPromptText();

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: `You write concise, professional weekly work journal summaries for employees. 
Write in first person, 3-4 short paragraphs. Group by theme or day. 
End with highlights (tasks completed, in-progress, blocked counts) and a brief "next week" line. 
Plain text only, no markdown symbols.`,
      messages: [{
        role: 'user',
        content: `Write a weekly journal summary from these work log entries:\n\n${entrySummary}`
      }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.find(b => b.type === 'text')?.text;
  if (!text) throw new Error('Empty response from Claude.');
  return text;
}