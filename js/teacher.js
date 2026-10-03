function addTeacher() {
  const msg = document.getElementById('t-msg').value.trim();
  if (!msg) return alert('Enter a message');
  Storage.push('teacher', {
    id: Date.now(),
    name: document.getElementById('t-name').value.trim() || 'Anonymous Student',
    dept: document.getElementById('t-dept').value,
    msg,
    time: new Date().toLocaleTimeString()
  });
  document.getElementById('t-name').value = '';
  document.getElementById('t-msg').value = '';
  renderTeacher();
  if (typeof renderProfile === 'function') renderProfile();
}

function renderTeacher() {
  const items = Storage.get('teacher');
  const el = document.getElementById('teacher-list');
  if (!items.length) {
    el.innerHTML = '<p class="text-center text-white/40 text-sm py-8">No teacher requests yet.</p>';
    return;
  }
  el.innerHTML = items.map(i => {
    const count = flagCount('teacher', i.id);
    const hidden = isHiddenByFlags('teacher', i.id);
    return `
    <div class="card glass rounded-2xl p-4 ${hidden?'hidden-post':''}">
      ${hidden ? `<div class="hidden-label mod-warning mb-2">⚠ Hidden — ${count} reports</div>` : ''}
      <div class="flex items-center gap-2 mb-2 flex-wrap">
        <span class="badge text-xs bg-teal-500/30 text-teal-100 px-2.5 py-0.5 rounded-full">${i.dept}</span>
        <span class="text-xs text-white/60">from ${i.name}</span>
        ${verifiedBadge(i.name)}
      </div>
      <p class="text-sm text-white">${i.msg}</p>
      <div class="flex items-center justify-between mt-2">
        <p class="text-xs text-white/40">${i.time}</p>
        <button class="flag-btn" onclick="openFlagModal('teacher', ${i.id})">
          🚩 ${count > 0 ? count : ''} Report
        </button>
      </div>
    </div>
  `;
  }).join('');
}