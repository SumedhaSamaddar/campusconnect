// ============================================
// PROFILE + AUTH + MODERATION QUEUE
// ============================================

const SESSION_KEY = 'cc_session_unlocked';
const LOCKOUT_KEY = 'cc_lockout_until';
const USER_KEY = 'cc_user_profile';

let failedAttempts = 0;

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function getCurrentUser() { return Storage.getOne(USER_KEY); }
function isSessionUnlocked() { return sessionStorage.getItem(SESSION_KEY) === '1'; }
function unlockSession() { sessionStorage.setItem(SESSION_KEY, '1'); }
function lockSession() { sessionStorage.removeItem(SESSION_KEY); failedAttempts = 0; }
function isLockedOut() {
  const until = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
  return Date.now() < until;
}
function lockoutSecondsLeft() {
  const until = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

function computeStats() {
  const help = Storage.get('help');
  const feed = Storage.get('feed');
  const teacher = Storage.get('teacher');
  const posted = help.length;
  const given = help.filter(h => h.helper).length;
  const pending = help.filter(h => !h.helper).length;
  const feedPosts = feed.length;
  const teacherReqs = teacher.length;
  let trust = 4.0 + (given * 0.2);
  trust = Math.min(trust, 5.0);
  return { posted, given, pending, feedPosts, teacherReqs, trust };
}

function buildActivity() {
  const help = Storage.get('help').map(h => ({ icon: '🆘', text: `Posted: ${h.title}`, time: h.time, id: h.id }));
  const feed = Storage.get('feed').map(f => ({ icon: '📸', text: `Shared: ${f.title}`, time: f.time, id: f.id }));
  const teacher = Storage.get('teacher').map(t => ({
    icon: '👨‍🏫',
    text: `Asked ${t.dept}: ${t.msg.slice(0, 40)}${t.msg.length > 40 ? '…' : ''}`,
    time: t.time, id: t.id
  }));
  return [...help, ...feed, ...teacher].sort((a, b) => b.id - a.id).slice(0, 5);
}

function renderProfile() {
  const el = document.getElementById('content-profile');
  if (!el) return;
  const user = getCurrentUser();
  if (!user) return renderCreateForm(el);
  if (!isSessionUnlocked()) return renderLockScreen(el);
  renderFullProfile(el, user);
}

// ---------- 1. Create Profile ----------
function renderCreateForm(el) {
  el.innerHTML = `
    <div class="glass-strong rounded-2xl p-6 max-w-md mx-auto">
      <div class="text-center mb-5">
        <div class="text-5xl mb-2">👤</div>
        <h2 class="text-lg font-bold text-white">Create Your Profile</h2>
        <p class="text-xs text-white/60 mt-1">Set up your identity on CampusConnect</p>
      </div>
      <input id="reg-name" placeholder="Full name" class="glass-input w-full rounded-xl px-4 py-2.5 mb-3 text-sm">
      <input id="reg-email" placeholder="Email" type="email" class="glass-input w-full rounded-xl px-4 py-2.5 mb-3 text-sm">
      <select id="reg-dept" class="glass-input w-full rounded-xl px-4 py-2.5 mb-3 text-sm">
        <option>Computer Science</option><option>Mathematics</option><option>Physics</option>
        <option>Management</option><option>Other</option>
      </select>
      <input id="reg-pin" placeholder="Set 4-digit PIN" type="password" maxlength="4" inputmode="numeric"
             class="glass-input w-full rounded-xl px-4 py-2.5 mb-3 text-sm tracking-widest text-center text-lg">
      <input id="reg-pin2" placeholder="Confirm PIN" type="password" maxlength="4" inputmode="numeric"
             class="glass-input w-full rounded-xl px-4 py-2.5 mb-4 text-sm tracking-widest text-center text-lg">
      <button onclick="createProfile()" class="btn-glow w-full text-white py-3 rounded-xl text-sm font-semibold">
        🔐 Create Profile
      </button>
      <p class="text-xs text-white/40 text-center mt-3">Your PIN protects your profile on this device.</p>
    </div>
  `;
}

function createProfile() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const dept = document.getElementById('reg-dept').value;
  const pin = document.getElementById('reg-pin').value.trim();
  const pin2 = document.getElementById('reg-pin2').value.trim();
  if (!name) return alert('Enter your name');
  if (!email || !email.includes('@')) return alert('Enter a valid email');
  if (!/^\d{4}$/.test(pin)) return alert('PIN must be exactly 4 digits');
  if (pin !== pin2) return alert('PINs do not match');
  Storage.set(USER_KEY, {
    name, email, dept,
    pinHash: hashPin(pin),
    joined: new Date().toLocaleDateString()
  });
  unlockSession();
  renderProfile();
}

// ---------- 2. Lock Screen ----------
function renderLockScreen(el) {
  const user = getCurrentUser();
  const locked = isLockedOut();
  const initials = getInitials(user.name);
  el.innerHTML = `
    <div class="glass-strong rounded-2xl p-6 max-w-md mx-auto text-center">
      <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3"
           style="background: linear-gradient(135deg, #667eea, #764ba2, #f093fb); box-shadow: 0 8px 32px rgba(168,85,247,0.5);">
        ${initials}
      </div>
      <h2 class="text-lg font-bold text-white">${user.name}</h2>
      <p class="text-xs text-white/60 mb-5">🔒 Profile locked — enter your PIN</p>
      ${locked
        ? `<div class="glass rounded-xl p-4 mb-4">
             <p class="text-sm text-red-200">Too many wrong attempts.</p>
             <p class="text-xs text-white/60 mt-1">Try again in <span id="lockout-timer">${lockoutSecondsLeft()}</span>s</p>
           </div>`
        : `<input id="login-pin" type="password" maxlength="4" inputmode="numeric" placeholder="••••"
                  class="glass-input w-full rounded-xl px-4 py-3 mb-3 text-center text-2xl tracking-[0.5em]">
           <button onclick="tryUnlock()" class="btn-glow w-full text-white py-3 rounded-xl text-sm font-semibold">
             🔓 Unlock
           </button>`}
      <button onclick="forgetProfile()" class="text-xs text-red-300/70 hover:text-red-200 mt-4 underline">
        Forgot PIN? Reset profile
      </button>
    </div>
  `;
  if (locked) {
    const timer = setInterval(() => {
      const left = lockoutSecondsLeft();
      const el2 = document.getElementById('lockout-timer');
      if (el2) el2.textContent = left;
      if (left <= 0) { clearInterval(timer); renderProfile(); }
    }, 1000);
  } else {
    setTimeout(() => {
      const pinEl = document.getElementById('login-pin');
      if (pinEl) {
        pinEl.focus();
        pinEl.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
      }
    }, 50);
  }
}

function tryUnlock() {
  if (isLockedOut()) return;
  const user = getCurrentUser();
  const entered = document.getElementById('login-pin').value.trim();
  if (hashPin(entered) === user.pinHash) {
    failedAttempts = 0;
    unlockSession();
    renderProfile();
  } else {
    failedAttempts++;
    if (failedAttempts >= 3) {
      localStorage.setItem(LOCKOUT_KEY, String(Date.now() + 30000));
      failedAttempts = 0;
      renderProfile();
      alert('Too many wrong attempts. Locked for 30 seconds.');
    } else {
      alert(`Wrong PIN. ${3 - failedAttempts} attempts left.`);
      document.getElementById('login-pin').value = '';
    }
  }
}

function lockProfileNow() { lockSession(); renderProfile(); }

function forgetProfile() {
  if (!confirm('This will delete your profile (but keep your posts). Continue?')) return;
  Storage.deleteKey(USER_KEY);
  Storage.deleteKey(LOCKOUT_KEY);
  lockSession();
  renderProfile();
}

// ---------- 3. Full Profile ----------
function renderFullProfile(el, user) {
  const stats = computeStats();
  const activity = buildActivity();
  const initials = getInitials(user.name);
  const verified = isVerifiedUser(user.name);
  const modQueue = getModerationQueue();

  el.innerHTML = `
    <div class="glass-strong rounded-2xl p-6 mb-5">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
             style="background: linear-gradient(135deg, #667eea, #764ba2, #f093fb); box-shadow: 0 8px 32px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.3);">
          ${initials}
        </div>
        <div class="flex-1 min-w-[180px]">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            ${user.name} ${verified ? '<span class="verified-badge">✅ Verified</span>' : ''}
          </h2>
          <p class="text-sm text-white/60">${user.email}</p>
          <p class="text-xs text-white/40 mt-1">${user.dept} · Joined ${user.joined}</p>
        </div>
        <div class="glass rounded-2xl px-4 py-3 text-center min-w-[110px]">
          <p class="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
            ${stats.trust.toFixed(1)}
          </p>
          <p class="text-xs text-white/60">⭐ Trust Score</p>
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button onclick="lockProfileNow()" class="text-xs glass-input px-4 py-2 rounded-xl text-white/80 hover:bg-white/10">
          🔒 Lock Profile
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-white">${stats.posted}</p>
        <p class="text-xs text-white/60 mt-1">🆘 Requests Posted</p>
      </div>
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-white">${stats.given}</p>
        <p class="text-xs text-white/60 mt-1">🤝 Help Given</p>
      </div>
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-white">${stats.pending}</p>
        <p class="text-xs text-white/60 mt-1">⏳ Pending</p>
      </div>
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-white">${stats.feedPosts}</p>
        <p class="text-xs text-white/60 mt-1">📸 Feed Posts</p>
      </div>
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold text-white">${stats.teacherReqs}</p>
        <p class="text-xs text-white/60 mt-1">👨‍🏫 Teacher Qs</p>
      </div>
      <div class="card glass rounded-2xl p-4 text-center">
        <p class="text-2xl font-bold bg-gradient-to-r from-green-300 to-cyan-300 bg-clip-text text-transparent">
          ${stats.given > 0 ? 'Active' : 'New'}
        </p>
        <p class="text-xs text-white/60 mt-1">🎯 Status</p>
      </div>
    </div>

    ${modQueue.length ? `
      <div class="glass-strong rounded-2xl p-5 mb-5">
        <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
          🛡 Moderation Queue
          <span class="badge text-xs bg-red-500/30 text-red-100 px-2 py-0.5 rounded-full">${modQueue.length}</span>
        </h3>
        <div class="space-y-2">
          ${modQueue.map(m => `
            <div class="glass rounded-xl p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-white/40 uppercase tracking-wide">${m.type}</p>
                  <p class="text-sm text-white truncate">${m.item.title || m.item.msg || ''}</p>
                  <p class="text-xs text-red-300 mt-1">🚩 ${m.count} report${m.count > 1 ? 's' : ''} · ${m.reasons.join(', ')}</p>
                </div>
                <button onclick="deletePost('${m.type}', ${m.item.id})"
                        class="flag-btn whitespace-nowrap">🗑 Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <div class="glass-strong rounded-2xl p-5 mb-5">
      <h3 class="font-semibold text-white mb-3">Recent Activity</h3>
      ${activity.length
        ? `<div class="space-y-2">
            ${activity.map(a => `
              <div class="flex items-center gap-3 glass rounded-xl p-3">
                <span class="text-lg">${a.icon}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-white truncate">${a.text}</p>
                  <p class="text-xs text-white/40">${a.time}</p>
                </div>
              </div>
            `).join('')}
           </div>`
        : '<p class="text-sm text-white/40 text-center py-4">No activity yet. Start posting!</p>'}
    </div>

    <div class="glass rounded-2xl p-4 text-center">
      <p class="text-xs text-white/50 mb-2">Demo controls</p>
      <button onclick="resetAllData()"
              class="text-xs px-4 py-2 rounded-xl glass-input hover:bg-red-500/20 text-red-200 border border-red-400/30">
        🗑 Reset All Data
      </button>
    </div>
  `;
}

function deletePost(type, id) {
  if (!confirm('Delete this post permanently?')) return;
  Storage.remove(type, id);
  Storage.deleteKey(getFlagKey(type));
  if (type === 'help') renderHelp();
  if (type === 'feed') renderFeed();
  if (type === 'teacher') renderTeacher();
  renderProfile();
}

