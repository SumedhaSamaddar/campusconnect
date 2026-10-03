// ============================================
// TRUST & SAFETY: flagging, verification, mod queue
// ============================================

const FLAG_REASONS = [
  { id: 'fake',      label: '📰 Fake news / misinformation' },
  { id: 'abuse',     label: '💢 Derogatory / abusive' },
  { id: 'spam',      label: '📢 Spam or advertisement' },
  { id: 'mislead',   label: '🎭 Misleading / impersonation' },
  { id: 'other',     label: '❓ Other concern' }
];

const FLAG_THRESHOLD = 3;  // auto-hide at 3 flags

// --- Verified user check (demo rules) ---
function isVerifiedUser(identifier) {
  if (!identifier) return false;
  const name = (typeof identifier === 'string' ? identifier : identifier.name || '').toLowerCase();
  if (!name) return false;

  // Rule 1: known verified names for demo
  const KNOWN = ['priya', 'arjun', 'dr. ', 'prof.', 'admin'];
  if (KNOWN.some(k => name.includes(k))) return true;

  // Rule 2: trust score >= 4.5 based on activity
  const help = Storage.get('help');
  const given = help.filter(h => h.helper).length;
  const trust = Math.min(4.0 + given * 0.2, 5.0);
  return trust >= 4.5;
}

function verifiedBadge(name) {
  if (!isVerifiedUser(name)) return '';
  return `<span class="verified-badge">✅ Verified</span>`;
}

// --- Flag state management ---
function getFlagKey(type) {
  return 'flags_' + type;   // e.g. flags_help, flags_feed
}

function getFlags(type, id) {
  const all = Storage.get(getFlagKey(type));
  const entry = all.find(f => f.id === id);
  return entry ? entry.reasons : [];
}

function hasFlagged(type, id, reason) {
  return getFlags(type, id).includes(reason);
}

function toggleFlag(type, id, reason) {
  const key = getFlagKey(type);
  let all = Storage.get(key);
  let entry = all.find(f => f.id === id);
  if (!entry) {
    entry = { id, reasons: [] };
    all.push(entry);
  }
  if (entry.reasons.includes(reason)) {
    entry.reasons = entry.reasons.filter(r => r !== reason);
  } else {
    entry.reasons.push(reason);
  }
  all = all.filter(e => e.reasons.length > 0);
  Storage.set(key, all);
}

function flagCount(type, id) {
  return getFlags(type, id).length;
}

function isHiddenByFlags(type, id) {
  return flagCount(type, id) >= FLAG_THRESHOLD;
}

// --- Modal UI ---
let flagTarget = null;
let selectedReasons = [];

function openFlagModal(type, id) {
  flagTarget = { type, id };
  selectedReasons = [...getFlags(type, id)];

  const reasonsEl = document.getElementById('flag-reasons');
  reasonsEl.innerHTML = FLAG_REASONS.map(r => `
    <div class="flag-reason ${selectedReasons.includes(r.id) ? 'selected' : ''}"
         onclick="toggleReason('${r.id}')" data-reason="${r.id}">
      <span>${r.label}</span>
    </div>
  `).join('');

  const modal = document.getElementById('flag-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function toggleReason(id) {
  if (selectedReasons.includes(id)) {
    selectedReasons = selectedReasons.filter(r => r !== id);
  } else {
    selectedReasons.push(id);
  }
  document.querySelectorAll('.flag-reason').forEach(el => {
    el.classList.toggle('selected', selectedReasons.includes(el.dataset.reason));
  });
}

function closeFlagModal() {
  const modal = document.getElementById('flag-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  flagTarget = null;
  selectedReasons = [];
}

function submitFlag() {
  if (!flagTarget) return;
  if (selectedReasons.length === 0) return alert('Pick at least one reason');

  const { type, id } = flagTarget;

  // Save current selections
  const key = getFlagKey(type);
  let all = Storage.get(key);
  let entry = all.find(f => f.id === id);
  if (!entry) { entry = { id, reasons: [] }; all.push(entry); }
  entry.reasons = [...selectedReasons];
  all = all.filter(e => e.reasons.length > 0);
  Storage.set(key, all);

  const count = entry.reasons.length;
  closeFlagModal();

  // Re-render the affected list
  if (type === 'help') renderHelp();
  if (type === 'feed') renderFeed();
  if (type === 'teacher') renderTeacher();
  if (typeof renderProfile === 'function') renderProfile();

  if (count >= FLAG_THRESHOLD) {
    alert(`This post has ${count} reports and has been auto-hidden for review.`);
  } else {
    alert(`Reported. Thank you for keeping CampusConnect safe.`);
  }
}

// --- Moderation queue for profile ---
function getModerationQueue() {
  const result = [];
  ['help', 'feed', 'teacher'].forEach(type => {
    const items = Storage.get(type);
    items.forEach(item => {
      const count = flagCount(type, item.id);
      if (count > 0) {
        result.push({
          type,
          item,
          count,
          reasons: getFlags(type, item.id)
        });
      }
    });
  });
  return result.sort((a, b) => b.count - a.count);
}