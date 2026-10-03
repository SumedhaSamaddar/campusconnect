function addFeed() {
  const title = document.getElementById('feed-title').value.trim();
  if (!title) return alert('Enter a title');

  const cat = document.getElementById('feed-cat').value;
  const source = document.getElementById('feed-source').value.trim();

  // Fake-news guard: News category requires source
  if (cat === 'News' && !source) {
    return alert('News posts require a source URL to prevent misinformation.');
  }

  Storage.push('feed', {
    id: Date.now(),
    title,
    img: document.getElementById('feed-img').value,
    cat,
    source,
    time: new Date().toLocaleTimeString()
  });

  document.getElementById('feed-title').value = '';
  document.getElementById('feed-img').value = '';
  document.getElementById('feed-source').value = '';
  document.getElementById('feed-cat').value = 'General';

  renderFeed();
  if (typeof renderProfile === 'function') renderProfile();
}

function renderFeed() {
  const items = Storage.get('feed');
  const el = document.getElementById('feed-list');
  if (!items.length) {
    el.innerHTML = '<p class="text-center text-white/40 text-sm py-8 col-span-2">No posts yet. Share what\'s happening!</p>';
    return;
  }

  el.innerHTML = items.map(i => {
    const count = flagCount('feed', i.id);
    const hidden = isHiddenByFlags('feed', i.id);
    const isNews = i.cat === 'News';

    return `
    <div class="card glass rounded-2xl overflow-hidden ${hidden?'hidden-post':''}">
      ${hidden ? `<div class="hidden-label mod-warning m-3 mb-0">⚠ Hidden — ${count} reports (under review)</div>` : ''}
      ${i.img
        ? `<img src="${i.img}" class="w-full h-40 object-cover" onerror="this.style.display='none'">`
        : '<div class="w-full h-32 bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center text-3xl">📸</div>'}
      <div class="p-4">
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <span class="badge text-xs bg-pink-500/30 text-pink-100 px-2.5 py-0.5 rounded-full">${i.cat || 'General'}</span>
          ${verifiedBadge('student')}
          ${isNews ? '<span class="mod-warning">📰 News</span>' : ''}
        </div>
        <p class="font-medium text-sm text-white">${i.title}</p>
        ${i.source ? `<a href="${i.source}" target="_blank" class="text-xs text-cyan-300 underline mt-1 inline-block">Source ↗</a>` : ''}
        <div class="flex items-center justify-between mt-2">
          <p class="text-xs text-white/40">${i.time}</p>
          <button class="flag-btn" onclick="openFlagModal('feed', ${i.id})">
            🚩 ${count > 0 ? count : ''} Report
          </button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}