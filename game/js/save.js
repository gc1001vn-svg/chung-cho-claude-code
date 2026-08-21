// ============================================================
//  LƯU / TẢI GAME (localStorage — chạy hoàn toàn offline)
// ============================================================
const KEY = 'condoungtolua.save.v1';

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.name ? d : null;
  } catch { return null; }
}

export function writeSave(G) {
  const p = G.player;
  if (!p) return false;
  const data = {
    v: 1, savedAt: Date.now(),
    name: p.name, race: p.race, main: p.main, sub: p.sub,
    level: p.level, exp: p.exp, str: p.str, int: p.int,
    statPoints: p.statPoints, skillPoints: p.skillPoints,
    hp: Math.max(1, Math.round(p.hp)), mp: Math.round(p.mp),
    gold: p.gold, inventory: p.inventory, equip: p.equip,
    ranks: p.ranks, quests: p.quests, kills: p.kills,
    job: { ...p.job, active: false, cargo: p.job.active ? [] : p.job.cargo },
    playtime: Math.round(p.playtime),
    pos: { x: p.x, z: p.z, yaw: p.yaw },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Không lưu được:', e);
    return false;
  }
}

export function wipeSave() {
  try { localStorage.removeItem(KEY); } catch {}
}

export function saveInfo() {
  const d = loadSave();
  if (!d) return null;
  const mins = Math.round((d.playtime || 0) / 60);
  return { ...d, mins };
}
