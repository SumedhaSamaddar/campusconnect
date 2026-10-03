function addHelp() {
  const title = document.getElementById('help-title').value.trim();
  if (!title) return alert('Enter a title');
  Storage.push('help', {
    id: Date.now(),
    title,
    desc: document.getElementById('help-desc').value,
    cat: document.getElementById('help-cat').value,
    anon: document.getElementById('help-anon').checked,
    helper: null,
    time: new Date().toLocaleTimeString()
  });
  document.getElementById('help-title').value = '';
  document.getElementById('help-desc').value = '';
  document.getElementById('help-anon').checked = false;
  renderHelp();
  if (typeof renderProfile === 'function') renderProfile();
}

function claimHelp(id) {
  Storage.update('help', id, { helper: 'A kind student' });
  renderHelp();
  if (typeof renderProfile === 'function') renderProfile();
}

function renderHelp() {
  const items = Storage.get('help');
  const el = document.getElementById('help-list');
  if (!items.length) {
    el.innerHTML = '<p class="text-center text-white/40 text-sm py-8">No requests yet. Be the first to post!</p>';
    return;
  }

  el.innerHTML = items.map(i => {
    const count = flagCount('help', i.id);
    const hidden = isHiddenByFlags('help', i.id);

    return `
    <div class="card glass rounded-2xl p-4 ${i.cat==='Emergency'?'border-l-4 border-red-400':''} ${hidden?'hidden-post':''}">
      ${hidden ? `<div class="hidden-label mod-warning mb-2">⚠ Hidden — ${count} reports (under review)</div>` : ''}
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="badge text-xs px-2.5 py-0.5 rounded-full ${i.cat==='Emergency'?'bg-red-500/30 text-red-100':'bg-indigo-500/30 text-indigo-100'}">${i.cat}</span>
            ${i.anon ? '<span class="badge text-xs bg-purple-500/30 text-purple-100 px-2.5 py-0.5 rounded-full">🕵️ Anonymous</span>' : ''}
            ${!i.anon ? verifiedBadge('student') : ''}
          </div>
          <h3 class="font-semibold text-sm text-white">${i.title}</h3>
          <p class="text-xs text-white/60 mt-1">${i.desc || ''}</p>
          <p class="text-xs text-white/40 mt-2">${i.time} ${i.helper ? '· ✅ Claimed by ' + i.helper : ''}</p>
        </div>
        ${!i.helper
          ? `<button onclick="claimHelp(${i.id})" class="btn-glow btn-green text-xs px-4 py-2 rounded-xl font-semibold whitespace-nowrap">I can help</button>`
          : '<span class="text-xs text-green-300 font-medium whitespace-nowrap">Resolved</span>'}
      </div>
      <div class="flex justify-end mt-2">
        <button class="flag-btn" onclick="openFlagModal('help', ${i.id})">
          🚩 ${count > 0 ? count : ''} Report
        </button>
      </div>
    </div>
  `;
  }).join('');
}