const Storage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  },
  getOne(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); }
    catch { return null; }
  },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  remove(key, id) {
    const items = this.get(key).filter(x => x.id !== id);
    this.set(key, items);
    return items;
  },
  update(key, id, patch) {
    const items = this.get(key).map(x => x.id === id ? { ...x, ...patch } : x);
    this.set(key, items);
    return items;
  },
  deleteKey(key) { localStorage.removeItem(key); }
};

function hashPin(pin) {
  let hash = 0;
  const salt = 'campusconnect_v1_';
  const str = salt + pin + salt;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}