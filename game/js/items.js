// ============================================================
//  VẬT PHẨM: sinh trang bị theo bậc (degree), túi đồ, cường hóa
// ============================================================
import { DEGREE_NAMES, RARITY, ARMOR_NAMES, WEAPONS, ALL_SIMPLE, degreeForLevel } from './data.js';
import { randInt, chance, pick, clamp } from './util.js';

let uid = 1;
export const newUid = () => 'i' + (uid++);
export function seedUid(inv) {
  for (const it of inv || []) {
    const n = parseInt(String(it.uid || '').slice(1));
    if (n >= uid) uid = n + 1;
  }
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/** Tạo một món trang bị */
export function makeGear(slot, deg, rarity = 0, weaponType = 'sword') {
  deg = clamp(deg, 1, 12);
  rarity = clamp(rarity, 0, 3);
  const R = RARITY[rarity];
  const it = {
    uid: newUid(), kind: 'gear', slot, deg, rarity, enh: 0,
    reqLv: Math.max(1, (deg - 1) * 8 + 1),
  };
  if (slot === 'weapon') {
    it.type = weaponType;
    const w = WEAPONS[weaponType];
    it.em = w.em;
    it.name = `${w.name} ${DEGREE_NAMES[deg]}`;
    it.atk = Math.round(11 * Math.pow(deg, 1.85) * R.mul);
  } else {
    it.em = { helm: '🎓', armor: '🥋', boots: '🥾', acc: '💍' }[slot];
    it.name = `${ARMOR_NAMES[slot]} ${DEGREE_NAMES[deg]}`;
    it.def = Math.round((slot === 'acc' ? 3 : 7) * Math.pow(deg, 1.78) * R.mul);
    if (slot === 'acc') {
      it.hp = Math.round(38 * Math.pow(deg, 1.5) * R.mul);
      it.mp = Math.round(26 * Math.pow(deg, 1.5) * R.mul);
      it.crit = rarity >= 2 ? 2 + rarity : 0;
    } else if (rarity >= 1) {
      it.hp = Math.round(20 * Math.pow(deg, 1.4) * rarity);
    }
  }
  if (rarity > 0) it.name = `${it.name} ${ROMAN[deg] ? '' : ''}[${R.name}]`;
  it.price = gearPrice(it);
  return it;
}

export function gearPrice(it) {
  const base = (it.atk || 0) * 22 + (it.def || 0) * 26 + (it.hp || 0) * 2 + (it.mp || 0) * 2;
  return Math.round((base + 120) * RARITY[it.rarity].mul * (1 + it.enh * 0.25));
}
export const sellPrice = (it) => Math.max(10, Math.round((it.kind === 'gear' ? gearPrice(it) : (ALL_SIMPLE[it.id]?.price || 20)) * 0.32));

/** Chỉ số sau khi cộng cường hóa (+n) */
export function withEnh(it) {
  const k = 1 + it.enh * 0.09;
  return {
    ...it,
    atk: it.atk ? Math.round(it.atk * k) : 0,
    def: it.def ? Math.round(it.def * k) : 0,
    hp: it.hp ? Math.round(it.hp * k) : 0,
    mp: it.mp ? Math.round(it.mp * k) : 0,
  };
}
export const fullName = (it) => (it.kind === 'gear'
  ? (it.enh > 0 ? `+${it.enh} ${it.name}` : it.name)
  : (ALL_SIMPLE[it.id]?.name || it.id));

export function itemDesc(it) {
  if (it.kind !== 'gear') {
    const d = ALL_SIMPLE[it.id] || {};
    if (d.heal) return `Hồi ${d.heal} sinh lực`;
    if (d.mana) return `Hồi ${d.mana} nội lực`;
    if (d.kind === 'recall') return 'Dịch chuyển về thành gần nhất';
    if (d.kind === 'enhance') return 'Dùng để cường hóa trang bị';
    if (d.kind === 'goods') return 'Hàng hoá thương đoàn';
    return 'Nguyên liệu';
  }
  const e = withEnh(it);
  const parts = [];
  if (e.atk) parts.push(`Công ${e.atk}`);
  if (e.def) parts.push(`Thủ ${e.def}`);
  if (e.hp) parts.push(`HP +${e.hp}`);
  if (e.mp) parts.push(`MP +${e.mp}`);
  if (e.crit) parts.push(`Chí mạng +${e.crit}%`);
  return `Bậc ${it.deg} · Yêu cầu Lv.${it.reqLv} · ${parts.join(' · ')}`;
}

// ---------------- TÚI ĐỒ ----------------
export const BAG_SIZE = 40;

export function bagCount(p) {
  return p.inventory.length;
}
export function addGear(p, it) {
  if (p.inventory.length >= BAG_SIZE) return false;
  p.inventory.push(it);
  return true;
}
export function addSimple(p, id, qty = 1) {
  const def = ALL_SIMPLE[id];
  if (!def) return false;
  const ex = p.inventory.find(i => i.kind !== 'gear' && i.id === id);
  if (ex) { ex.qty += qty; return true; }
  if (p.inventory.length >= BAG_SIZE) return false;
  p.inventory.push({ uid: newUid(), kind: def.kind, id, qty, em: def.em });
  return true;
}
export function countSimple(p, id) {
  const ex = p.inventory.find(i => i.kind !== 'gear' && i.id === id);
  return ex ? ex.qty : 0;
}
export function removeSimple(p, id, qty = 1) {
  const i = p.inventory.findIndex(x => x.kind !== 'gear' && x.id === id);
  if (i < 0) return false;
  const it = p.inventory[i];
  if (it.qty < qty) return false;
  it.qty -= qty;
  if (it.qty <= 0) p.inventory.splice(i, 1);
  return true;
}
export function removeUid(p, uidv) {
  const i = p.inventory.findIndex(x => x.uid === uidv);
  if (i >= 0) return p.inventory.splice(i, 1)[0];
  return null;
}

/** Mặc trang bị, trả về món cũ (nếu có) */
export function equipItem(p, it) {
  if (it.kind !== 'gear') return null;
  if (p.level < it.reqLv) return 'lowlv';
  if (it.slot === 'weapon' && it.type !== p.weaponType) return 'wrongtype';
  const old = p.equip[it.slot] || null;
  removeUid(p, it.uid);
  p.equip[it.slot] = withEnhLive(it);
  if (old) p.inventory.push(strip(old));
  p.recalc();
  return old;
}
export function unequip(p, slot) {
  const old = p.equip[slot];
  if (!old) return false;
  if (p.inventory.length >= BAG_SIZE) return 'full';
  delete p.equip[slot];
  p.inventory.push(strip(old));
  p.recalc();
  return true;
}
// trang bị đang mặc lưu chỉ số đã cộng cường hóa để tính nhanh
function withEnhLive(it) { const e = withEnh(it); e.base = { atk: it.atk, def: it.def, hp: it.hp, mp: it.mp }; return e; }
function strip(it) {
  if (!it.base) return it;
  const o = { ...it, ...it.base };
  delete o.base;
  return o;
}

/** Rơi đồ từ quái */
export function rollDrop(mobLv, elite) {
  const deg = clamp(degreeForLevel(mobLv + randInt(-2, 3)), 1, 12);
  let rarity = 0;
  const r = Math.random();
  if (elite) rarity = r < 0.35 ? 3 : r < 0.75 ? 2 : 1;
  else if (r < 0.02) rarity = 2;
  else if (r < 0.16) rarity = 1;
  const slot = pick(['weapon', 'weapon', 'helm', 'armor', 'boots', 'acc']);
  const wt = pick(Object.keys(WEAPONS));
  return makeGear(slot, deg, rarity, wt);
}

/** Tỉ lệ thành công khi cường hóa */
export const enhanceRate = (n) => clamp(0.95 - n * 0.085, 0.12, 0.95);
