// Auto-load demo data on first visit
if (typeof autoSeedIfEmpty === 'function') autoSeedIfEmpty();

const TABS = ['help', 'feed', 'teacher', 'profile'];
const TABS = ['help', 'feed', 'teacher', 'profile'];

function showTab(t) {
  TABS.forEach(x => {
    document.getElementById('content-' + x).classList.toggle('hidden', x !== t);
  });

  TABS.forEach(x => {
    const btn = document.getElementById('tab-' + x);
    if (!btn) return;
    btn.className = x === t
      ? 'tab-btn tab-active flex-1 py-2.5 rounded-xl text-sm font-medium'
      : 'tab-btn flex-1 py-2.5 rounded-xl text-sm font-medium';
  });

  TABS.forEach(x => {
    const btn = document.getElementById('bnav-' + x);
    if (!btn) return;
    btn.classList.toggle('active', x === t);
  });

  history.replaceState(null, '', '#' + t);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize all renderers
renderHelp();
renderFeed();
renderTeacher();
renderProfile();

// Restore tab from URL hash
const initial = (location.hash || '#help').substring(1);
showTab(TABS.includes(initial) ? initial : 'help');