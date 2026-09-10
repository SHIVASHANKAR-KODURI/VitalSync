export const requiredFields = ['sleep_hrs', 'breakfast', 'lunch', 'dinner', 'walk_km', 'mood'];
export const shortLabels = {
  sleep_hrs: 'Sleep',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  walk_km: 'Walk (km)',
  mood: 'Mood'
};

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"'`]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  }[c]));
}

export function formatAISummary(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return '<p class="ai-empty">No AI response was generated.</p>';

  const lines = raw.split('\n');
  const html = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    const heading = trimmed.replace(/^#{1,4}\s*/, '').trim();
    if (/^(summary|key findings?|next step|advice|recommendations?|what (?:this|the results) may indicate)$/i.test(heading)) {
      closeList();
      html.push(`<h3 class="ai-section-title">${escapeHTML(heading)}</h3>`);
      continue;
    }

    const bullet = trimmed.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      if (!listOpen) {
        html.push('<ul class="ai-list">');
        listOpen = true;
      }
      html.push(`<li>${formatInlineAI(bullet[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInlineAI(trimmed)}</p>`);
  }

  closeList();
  return html.join('');
}

function formatInlineAI(value) {
  let s = escapeHTML(value);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  return s;
}

export function toast(message, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    el.className = 'toast';
  }, 3500);
}

export function getAppUrl() {
  return window.location.origin + window.location.pathname;
}
