// ============================================================
//  DỮ LIỆU GAME: chủng tộc, mastery/class, kỹ năng, vật phẩm,
//  quái vật, NPC, nhiệm vụ, hàng hoá thương đoàn
//  (Lấy cảm hứng từ Silkroad Online - bản làm lại độc lập)
// ============================================================

export const WEAPONS = {
  sword:  { name: 'Kiếm',      em: '⚔️', range: 2.6, spd: 0.9,  phy: 1.0,  mag: 0.35 },
  spear:  { name: 'Thương',    em: '🔱', range: 3.4, spd: 1.05, phy: 1.18, mag: 0.35 },
  bow:    { name: 'Cung',      em: '🏹', range: 16,  spd: 1.0,  phy: 1.05, mag: 0.4  },
  dagger: { name: 'Song Đao',  em: '🗡️', range: 2.4, spd: 0.68, phy: 0.85, mag: 0.3  },
  staff:  { name: 'Trượng',    em: '🔮', range: 13,  spd: 1.12, phy: 0.45, mag: 1.25 },
  mace:   { name: 'Chùy',      em: '🔨', range: 2.6, spd: 0.98, phy: 0.9,  mag: 0.8  },
  harp:   { name: 'Đàn',       em: '🎵', range: 11,  spd: 1.02, phy: 0.5,  mag: 1.0  },
};

// ---------------- KỸ NĂNG ----------------
// kind: strike (đơn mục tiêu) | aoe (quanh mình) | bolt (phi tiêu/phép bay)
//       buff | heal | imbue (phụ trợ vũ khí) | debuff
const S = (id, name, em, kind, o) => ({ id, name, em, kind, mp: 8, cd: 5, reqLv: 1, power: 1.5, scale: 'phy', ...o });

export const TREES = {
  // ======== TRUNG HOA · HỆ VŨ KHÍ ========
  bicheon: {
    race: 'china', slot: 'weapon', name: 'Bích Thiên', sub: 'Kiếm / Đao', em: '⚔️', weapon: 'sword',
    desc: 'Cận chiến cân bằng, phòng thủ tốt, đòn chém liên hoàn. Dễ chơi nhất cho người mới.',
    skills: [
      S('bc1', 'Trảm Kích', '⚔️', 'strike', { mp: 6, cd: 3.5, power: 1.9 }),
      S('bc2', 'Bát Quái Trảm', '🌀', 'aoe', { mp: 16, cd: 8, power: 1.5, radius: 5, reqLv: 8 }),
      S('bc3', 'Kim Cang Hộ Thể', '🛡️', 'buff', { mp: 20, cd: 26, dur: 16, stat: 'def', amount: 0.45, reqLv: 14 }),
    ],
  },
  heuksal: {
    race: 'china', slot: 'weapon', name: 'Hắc Sát', sub: 'Thương / Đại Đao', em: '🔱', weapon: 'spear',
    desc: 'Sát thương vật lý cao, tầm đánh xa hơn kiếm, tỉ lệ chí mạng tốt. Máu giấy hơn Bích Thiên.',
    skills: [
      S('hs1', 'Xuyên Tâm Thương', '🔱', 'strike', { mp: 9, cd: 4.5, power: 2.5 }),
      S('hs2', 'Toàn Phong Thương', '🌪️', 'aoe', { mp: 20, cd: 9, power: 1.8, radius: 6, reqLv: 8 }),
      S('hs3', 'Cuồng Bạo', '💢', 'buff', { mp: 18, cd: 24, dur: 14, stat: 'atk', amount: 0.4, reqLv: 14 }),
    ],
  },
  pacheon: {
    race: 'china', slot: 'weapon', name: 'Phá Thiên', sub: 'Cung', em: '🏹', weapon: 'bow',
    desc: 'Đánh xa an toàn, sát thương đơn mục tiêu mạnh. Yếu khi bị áp sát.',
    skills: [
      S('pc1', 'Xạ Kích', '🏹', 'bolt', { mp: 8, cd: 3.2, power: 2.0 }),
      S('pc2', 'Loạn Tiễn', '🎯', 'bolt', { mp: 18, cd: 8, power: 1.2, hits: 3, reqLv: 8 }),
      S('pc3', 'Bộc Phá Tiễn', '💥', 'bolt', { mp: 24, cd: 11, power: 2.2, splash: 5, reqLv: 16 }),
    ],
  },
  // ======== TRUNG HOA · HỆ NGUYÊN KHÍ ========
  fire: {
    race: 'china', slot: 'force', name: 'Hỏa', sub: 'Nguyên khí Hỏa', em: '🔥',
    desc: 'Sát thương bùng nổ, tăng công vật lý, phụ trợ lửa cho vũ khí.',
    skills: [
      S('fi1', 'Hỏa Cầu', '🔥', 'bolt', { mp: 14, cd: 5, power: 2.1, scale: 'mag' }),
      S('fi2', 'Liệt Hỏa Phù', '♨️', 'imbue', { mp: 22, cd: 30, dur: 30, amount: 0.35, reqLv: 10 }),
      S('fi3', 'Hỏa Vũ', '🌋', 'aoe', { mp: 30, cd: 14, power: 2.2, radius: 7, scale: 'mag', reqLv: 20 }),
    ],
  },
  cold: {
    race: 'china', slot: 'force', name: 'Hàn Băng', sub: 'Nguyên khí Băng', em: '❄️',
    desc: 'Làm chậm và đóng băng kẻ địch, tăng máu tối đa và phòng thủ.',
    skills: [
      S('co1', 'Băng Tiễn', '❄️', 'bolt', { mp: 12, cd: 4.5, power: 1.7, scale: 'mag', slow: 0.45, slowDur: 4 }),
      S('co2', 'Hàn Băng Phù', '🧊', 'imbue', { mp: 20, cd: 30, dur: 30, amount: 0.25, slow: 0.3, reqLv: 10 }),
      S('co3', 'Băng Lao', '🥶', 'debuff', { mp: 26, cd: 16, power: 1.4, scale: 'mag', freeze: 3, reqLv: 20 }),
    ],
  },
  light: {
    race: 'china', slot: 'force', name: 'Lôi Điện', sub: 'Nguyên khí Lôi', em: '⚡',
    desc: 'Tốc độ đánh và di chuyển, sát thương phép nhanh, né tránh cao.',
    skills: [
      S('li1', 'Lôi Kích', '⚡', 'bolt', { mp: 11, cd: 3.6, power: 1.75, scale: 'mag' }),
      S('li2', 'Cước Tấn', '💨', 'buff', { mp: 16, cd: 25, dur: 18, stat: 'spd', amount: 0.35, reqLv: 6 }),
      S('li3', 'Lôi Đình Nộ', '🌩️', 'aoe', { mp: 28, cd: 13, power: 2.0, radius: 6.5, scale: 'mag', reqLv: 18 }),
    ],
  },
  force: {
    race: 'china', slot: 'force', name: 'Chân Khí', sub: 'Nguyên khí Lực', em: '☯️',
    desc: 'Hồi máu, tăng sinh lực, giải trạng thái xấu. Cực kỳ hợp để cày một mình.',
    skills: [
      S('fo1', 'Hồi Xuân Thuật', '💚', 'heal', { mp: 18, cd: 9, power: 0.55, scale: 'mag' }),
      S('fo2', 'Hộ Thể Chân Khí', '🌟', 'buff', { mp: 20, cd: 28, dur: 22, stat: 'hp', amount: 0.25, reqLv: 8 }),
      S('fo3', 'Trấn Áp', '☯️', 'strike', { mp: 22, cd: 10, power: 2.0, scale: 'mag', reqLv: 18 }),
    ],
  },

  // ======== CHÂU ÂU · 6 CLASS ========
  warrior: {
    race: 'europe', slot: 'main', name: 'Chiến Binh', sub: 'Warrior · Kiếm hai tay', em: '🛡️', weapon: 'sword', line: 'Cận chiến',
    desc: 'Máu trâu, phòng thủ cao, khiêu khích kéo quái. Trụ cột chống đòn của tổ đội.',
    skills: [
      S('wa1', 'Cường Kích', '⚔️', 'strike', { mp: 8, cd: 3.6, power: 2.0 }),
      S('wa2', 'Khiêu Chiến', '📢', 'aoe', { mp: 14, cd: 10, power: 1.1, radius: 7, taunt: true, reqLv: 6 }),
      S('wa3', 'Thiết Bích', '🛡️', 'buff', { mp: 20, cd: 25, dur: 18, stat: 'def', amount: 0.6, reqLv: 14 }),
    ],
  },
  rogue: {
    race: 'europe', slot: 'main', name: 'Thích Khách', sub: 'Rogue · Song đao / Nỏ', em: '🗡️', weapon: 'dagger', line: 'Cận chiến',
    desc: 'Đánh cực nhanh, chí mạng cao, luồn ra sau lưng kết liễu. Sức chống chịu thấp.',
    skills: [
      S('ro1', 'Ám Sát', '🗡️', 'strike', { mp: 10, cd: 4, power: 2.3, critBonus: 0.35 }),
      S('ro2', 'Nỏ Liên Hoàn', '🎯', 'bolt', { mp: 16, cd: 7, power: 1.1, hits: 4, reqLv: 8 }),
      S('ro3', 'Ẩn Thân', '🌫️', 'buff', { mp: 18, cd: 26, dur: 12, stat: 'spd', amount: 0.5, reqLv: 14 }),
    ],
  },
  wizard: {
    race: 'europe', slot: 'main', name: 'Pháp Sư', sub: 'Wizard · Trượng phép', em: '🔮', weapon: 'staff', line: 'Phép thuật',
    desc: 'Sát thương phép cao nhất game, dọn quái theo bầy. Máu thấp, cần giữ khoảng cách.',
    skills: [
      S('wi1', 'Băng Thương', '🧊', 'bolt', { mp: 13, cd: 3.8, power: 2.2, scale: 'mag', slow: 0.35, slowDur: 3 }),
      S('wi2', 'Hỏa Ngục', '🌋', 'aoe', { mp: 30, cd: 12, power: 2.4, radius: 7, scale: 'mag', reqLv: 10 }),
      S('wi3', 'Lôi Bạo', '🌩️', 'bolt', { mp: 26, cd: 9, power: 3.0, scale: 'mag', reqLv: 18 }),
    ],
  },
  warlock: {
    race: 'europe', slot: 'main', name: 'Hắc Ám Sư', sub: 'Warlock · Nguyền rủa', em: '☠️', weapon: 'staff', line: 'Phép thuật',
    desc: 'Gieo độc, nguyền rủa, hút máu kẻ địch. Đánh lâu nhưng bền bỉ và khắc chế boss.',
    skills: [
      S('wl1', 'Nguyền Độc', '☠️', 'debuff', { mp: 12, cd: 4.5, power: 1.2, scale: 'mag', dot: 1.0, dotDur: 8 }),
      S('wl2', 'Hút Sinh Lực', '🩸', 'bolt', { mp: 18, cd: 7, power: 1.8, scale: 'mag', drain: 0.55, reqLv: 8 }),
      S('wl3', 'Suy Nhược', '🕸️', 'debuff', { mp: 22, cd: 15, power: 0.8, scale: 'mag', weaken: 0.35, weakenDur: 12, reqLv: 16 }),
    ],
  },
  bard: {
    race: 'europe', slot: 'main', name: 'Nhạc Sư', sub: 'Bard · Khúc ca chiến trận', em: '🎵', weapon: 'harp', line: 'Hỗ trợ',
    desc: 'Tăng tốc độ và sát thương, gây sát thương diện rộng bằng âm ba. Rất mạnh khi đi cùng người khác.',
    skills: [
      S('ba1', 'Âm Ba', '🎶', 'aoe', { mp: 14, cd: 5, power: 1.4, radius: 6, scale: 'mag' }),
      S('ba2', 'Khúc Hành Quân', '🎺', 'buff', { mp: 20, cd: 24, dur: 24, stat: 'spd', amount: 0.3, reqLv: 6 }),
      S('ba3', 'Khúc Chiến Ca', '🥁', 'buff', { mp: 24, cd: 28, dur: 20, stat: 'atk', amount: 0.35, reqLv: 14 }),
    ],
  },
  cleric: {
    race: 'europe', slot: 'main', name: 'Tăng Lữ', sub: 'Cleric · Thánh quang', em: '✨', weapon: 'mace', line: 'Hỗ trợ',
    desc: 'Hồi máu mạnh nhất, ban phúc tăng chỉ số, trừng phạt bằng sát thương thánh.',
    skills: [
      S('cl1', 'Thánh Quang', '✨', 'heal', { mp: 20, cd: 8, power: 0.7, scale: 'mag' }),
      S('cl2', 'Ban Phúc', '🙏', 'buff', { mp: 18, cd: 26, dur: 24, stat: 'atk', amount: 0.25, reqLv: 6 }),
      S('cl3', 'Trừng Phạt', '⚡', 'strike', { mp: 22, cd: 7, power: 2.2, scale: 'mag', reqLv: 14 }),
    ],
  },
};

export const RACES = {
  china: {
    id: 'china', name: 'Trung Hoa', em: '🐉',
    tagline: 'Tự do phối hệ · mạnh khi solo',
    desc: 'Không có class cố định. Bạn chọn 1 hệ vũ khí và 1 hệ nguyên khí rồi tự do phân bổ điểm. Đánh nhanh, hồi phục nhanh, cày một mình rất thoải mái.',
    steps: ['Chọn hệ vũ khí', 'Chọn hệ nguyên khí'],
    trees: [['bicheon', 'heuksal', 'pacheon'], ['fire', 'cold', 'light', 'force']],
    town: 'Trường An',
  },
  europe: {
    id: 'europe', name: 'Châu Âu', em: '🦁',
    tagline: 'Class rõ ràng · sát thương bùng nổ',
    desc: 'Chọn 1 class chính (quyết định vũ khí) và 1 class phụ để bù đắp điểm yếu — ví dụ Chiến Binh + Tăng Lữ để vừa trâu vừa tự hồi máu.',
    steps: ['Chọn class chính', 'Chọn class phụ'],
    trees: [
      ['warrior', 'rogue', 'wizard', 'warlock', 'bard', 'cleric'],
      ['warrior', 'rogue', 'wizard', 'warlock', 'bard', 'cleric'],
    ],
    town: 'Constantinople (đang mở rộng) — khởi đầu tại Trường An',
  },
};

// ---------------- TRANG BỊ (hệ thống bậc - degree) ----------------
export const DEGREE_NAMES = ['', 'Sắt', 'Thép', 'Hàn Thiết', 'Bạch Ngân', 'Huyền Thiết',
  'Thiên Ngân', 'Long Văn', 'Kim Cương', 'Thánh Vũ', 'Thần Binh', 'Cổ Thần', 'Bất Diệt'];
export const RARITY = [
  { id: 0, name: 'Thường', cls: '', mul: 1.0 },
  { id: 1, name: 'Hiếm', cls: 'r1', mul: 1.18 },
  { id: 2, name: 'Tinh Anh', cls: 'r2', mul: 1.4 },
  { id: 3, name: 'Truyền Thuyết', cls: 'r3', mul: 1.75 },
];
export const SLOTS = {
  weapon: { name: 'Vũ khí', em: '⚔️' },
  helm:   { name: 'Mũ', em: '🎓' },
  armor:  { name: 'Giáp', em: '🥋' },
  boots:  { name: 'Giày', em: '🥾' },
  acc:    { name: 'Trang sức', em: '💍' },
};
export const ARMOR_NAMES = { helm: 'Mũ', armor: 'Giáp', boots: 'Giày', acc: 'Ngọc Bội' };
/** Bậc trang bị theo cấp: mỗi 8 cấp lên 1 bậc (tối đa 12) */
export const degreeForLevel = (lv) => Math.max(1, Math.min(12, Math.floor((lv - 1) / 8) + 1));

// ---------------- VẬT PHẨM TIÊU HAO & HÀNG HOÁ ----------------
export const CONSUMABLES = {
  hp_s: { id: 'hp_s', name: 'Hồi Nguyên Đan (nhỏ)', em: '🧪', kind: 'potion', heal: 120, price: 60, stack: 99 },
  hp_m: { id: 'hp_m', name: 'Hồi Nguyên Đan (vừa)', em: '🍶', kind: 'potion', heal: 420, price: 220, stack: 99, reqLv: 15 },
  hp_l: { id: 'hp_l', name: 'Hồi Nguyên Đan (lớn)', em: '⚱️', kind: 'potion', heal: 1400, price: 700, stack: 99, reqLv: 30 },
  mp_s: { id: 'mp_s', name: 'Nội Lực Tán (nhỏ)', em: '💠', kind: 'mana', mana: 90, price: 70, stack: 99 },
  mp_m: { id: 'mp_m', name: 'Nội Lực Tán (vừa)', em: '🔷', kind: 'mana', mana: 320, price: 260, stack: 99, reqLv: 15 },
  scroll_town: { id: 'scroll_town', name: 'Hồi Thành Phù', em: '📜', kind: 'recall', price: 150, stack: 20 },
  repair: { id: 'repair', name: 'Đá Cường Hóa', em: '💎', kind: 'enhance', price: 900, stack: 99 },
};
export const MATERIALS = {
  hide:  { id: 'hide', name: 'Da Thú', em: '🟫', kind: 'material', price: 40, stack: 999 },
  fang:  { id: 'fang', name: 'Nanh Sói', em: '🦷', kind: 'material', price: 55, stack: 999 },
  silkw: { id: 'silkw', name: 'Kén Tơ', em: '🕸️', kind: 'material', price: 90, stack: 999 },
  sand:  { id: 'sand', name: 'Cát Huyền Bí', em: '⏳', kind: 'material', price: 130, stack: 999 },
};
// Hàng hoá thương đoàn: mua ở Trường An, bán ở Đôn Hoàng
export const GOODS = {
  silk:    { id: 'silk', name: 'Lụa Trường An', em: '🧵', kind: 'goods', buy: 900, weight: 1, jobLv: 1 },
  tea:     { id: 'tea', name: 'Trà Long Tỉnh', em: '🍵', kind: 'goods', buy: 1500, weight: 1, jobLv: 2 },
  celadon: { id: 'celadon', name: 'Gốm Sứ Thanh Hoa', em: '🏺', kind: 'goods', buy: 2600, weight: 1, jobLv: 3 },
  jade:    { id: 'jade', name: 'Ngọc Hòa Điền', em: '💎', kind: 'goods', buy: 4200, weight: 1, jobLv: 4 },
};
export const ALL_SIMPLE = { ...CONSUMABLES, ...MATERIALS, ...GOODS };

// ---------------- QUÁI VẬT ----------------
const M = (id, name, em, lv, o) => ({
  id, name, em, lv,
  hp: Math.round(30 * Math.pow(lv, 1.36)),
  atk: Math.round(8 * Math.pow(lv, 1.24)),
  def: Math.round(3.4 * Math.pow(lv, 1.16)),
  spd: 2.6, exp: Math.round(26 * Math.pow(lv, 1.5)), gold: Math.round(16 * Math.pow(lv, 1.35)),
  color: 0x8a6a4a, scale: 1, body: 'beast', range: 2.2, ...o,
});

export const MONSTERS = {
  wolf:    M('wolf', 'Sói Hoang', '🐺', 3, { color: 0x6d6f75, body: 'beast', spd: 3.2, drops: ['hide', 'fang'] }),
  boar:    M('boar', 'Heo Rừng', '🐗', 6, { color: 0x5a4636, body: 'beast', scale: 1.15, drops: ['hide'] }),
  tiger:   M('tiger', 'Hổ Trắng', '🐯', 12, { color: 0xd9d2c4, body: 'beast', scale: 1.3, spd: 3.4, drops: ['hide', 'fang'] }),
  bamboo:  M('bamboo', 'Yêu Trúc', '🎋', 10, { color: 0x4f8a3c, body: 'humanoid', drops: ['silkw'] }),
  mountain:M('mountain', 'Sơn Tặc', '🗡️', 14, { color: 0x7a4632, body: 'humanoid', drops: ['hide'], range: 2.4 }),
  scorpion:M('scorpion', 'Bọ Cạp Cát', '🦂', 19, { color: 0xc99a4e, body: 'beast', scale: 1.1, drops: ['sand'] }),
  mummy:   M('mummy', 'Xác Ướp', '🧟', 23, { color: 0xd8cdb0, body: 'humanoid', spd: 2.1, scale: 1.15, drops: ['sand'] }),
  golem:   M('golem', 'Golem Cát', '🗿', 27, { color: 0xb08c55, body: 'humanoid', scale: 1.6, spd: 1.9, hpMul: 1.6, drops: ['sand'] }),
  bandit:  M('bandit', 'Thổ Phỉ', '🪓', 25, { color: 0x8d3b2c, body: 'humanoid', drops: ['hide'], range: 2.5 }),
  archer:  M('archer', 'Cung Thủ Thổ Phỉ', '🏹', 26, { color: 0x6b4a2c, body: 'humanoid', range: 13, ranged: true, drops: [] }),
  thief:   M('thief', 'Đạo Tặc Sa Mạc', '🥷', 20, { color: 0x2f3542, body: 'humanoid', spd: 3.4, drops: [], road: true }),
  // BOSS
  chief:   M('chief', 'Đầu Lĩnh Hắc Phong', '👹', 32, {
    color: 0x9b1f1f, body: 'humanoid', scale: 2.2, elite: true, hpMul: 7, atkMul: 1.45,
    exp: 9000, gold: 12000, drops: ['sand', 'fang'],
  }),
  sandking: M('sandking', 'Sa Mạc Chi Vương', '🦂', 38, {
    color: 0xe0b155, body: 'beast', scale: 2.6, elite: true, hpMul: 9, atkMul: 1.55,
    exp: 20000, gold: 24000, drops: ['sand'],
  }),
};

// ---------------- VÙNG ĐẤT ----------------
export const ZONES = [
  { id: 'jangan', name: 'Thành Trường An', x: 0, z: 0, r: 46, safe: true },
  { id: 'field', name: 'Đồng Bằng Trường An', x: 0, z: 0, r: 150, spawn: [['wolf', 8], ['boar', 6]] },
  { id: 'bamboo', name: 'Rừng Trúc U Tịch', x: -175, z: 120, r: 105, spawn: [['bamboo', 7], ['tiger', 4], ['mountain', 6]] },
  { id: 'desert', name: 'Sa Mạc Taklamakan', x: 195, z: -60, r: 170, spawn: [['scorpion', 9], ['mummy', 6], ['golem', 3]] },
  { id: 'bandit', name: 'Trại Thổ Phỉ Hắc Phong', x: 60, z: -215, r: 78, spawn: [['bandit', 8], ['archer', 4]], boss: 'chief' },
  { id: 'ruins', name: 'Phế Tích Cổ Thành', x: 330, z: -215, r: 80, spawn: [['mummy', 6], ['golem', 5]], boss: 'sandking' },
  { id: 'donwhang', name: 'Ốc Đảo Đôn Hoàng', x: 330, z: 40, r: 44, safe: true },
];
export const TOWNS = {
  jangan: { id: 'jangan', name: 'Trường An', x: 0, z: 0, r: 46 },
  donwhang: { id: 'donwhang', name: 'Đôn Hoàng', x: 330, z: 40, r: 44 },
};

// ---------------- NPC ----------------
export const NPCS = [
  { id: 'elder', name: 'Trưởng Lão Vương', em: '🧙', role: 'quest', x: 6, z: -14, town: 'jangan', color: 0xd9c48a },
  { id: 'smith', name: 'Lý Thiết Tượng', em: '🔨', role: 'shop_gear', x: -18, z: 8, town: 'jangan', color: 0x8a5a2e },
  { id: 'apoth', name: 'Mai Nương', em: '🧪', role: 'shop_potion', x: 18, z: 10, town: 'jangan', color: 0xc45f7a },
  { id: 'caravan', name: 'Trần Quản Sự', em: '🐫', role: 'job', x: 0, z: 24, town: 'jangan', color: 0xc9a227 },
  { id: 'storage', name: 'Quản Kho Chu', em: '🏦', role: 'storage', x: -26, z: -18, town: 'jangan', color: 0x6a8fbf },
  { id: 'persian', name: 'Thương Nhân Ba Tư', em: '🧿', role: 'job_sell', x: 330, z: 58, town: 'donwhang', color: 0x2f9e8f },
  { id: 'healer', name: 'Thầy Lang Đôn Hoàng', em: '🧪', role: 'shop_potion', x: 314, z: 30, town: 'donwhang', color: 0xc45f7a },
  { id: 'smith2', name: 'Thợ Rèn Tây Vực', em: '⚒️', role: 'shop_gear', x: 348, z: 30, town: 'donwhang', color: 0x8a5a2e },
];

// ---------------- NHIỆM VỤ ----------------
export const QUESTS = [
  { id: 'q1', name: 'Sói quấy phá ngoại thành', giver: 'elder', lv: 1,
    text: 'Bầy sói hoang tràn xuống đồng bằng cắn chết gia súc. Hãy diệt 6 con Sói Hoang phía ngoài cổng thành.',
    req: { type: 'kill', target: 'wolf', count: 6 },
    reward: { exp: 260, gold: 700, items: [['hp_s', 5]] }, next: 'q2' },
  { id: 'q2', name: 'Da thú cho thợ rèn', giver: 'smith', lv: 4,
    text: 'Ta cần da thú để lót giáp. Săn 8 con Heo Rừng và mang về 5 tấm Da Thú.',
    req: { type: 'kill', target: 'boar', count: 8, need: ['hide', 5] },
    reward: { exp: 700, gold: 1400, gear: { slot: 'weapon', deg: 1, rarity: 1 } }, next: 'q3' },
  { id: 'q3', name: 'Sơn tặc rừng trúc', giver: 'elder', lv: 9,
    text: 'Rừng Trúc phía tây nam có Sơn Tặc chặn đường thương đoàn. Diệt 10 tên cho chúng biết sợ.',
    req: { type: 'kill', target: 'mountain', count: 10 },
    reward: { exp: 2200, gold: 3200, gear: { slot: 'armor', deg: 2, rarity: 1 } }, next: 'q4' },
  { id: 'q4', name: 'Chuyến hàng đầu tiên', giver: 'caravan', lv: 12,
    text: 'Muốn thành thương nhân thì phải đi một chuyến. Mua 1 kiện Lụa Trường An, dẫn lạc đà tới Đôn Hoàng bán cho Thương Nhân Ba Tư.',
    req: { type: 'trade', count: 1 },
    reward: { exp: 3200, gold: 2000, items: [['scroll_town', 3]], unlockJob: true }, next: 'q5' },
  { id: 'q5', name: 'Bọ cạp sa mạc', giver: 'persian', lv: 17,
    text: 'Bọ Cạp Cát bò đầy đường ra ốc đảo, lạc đà của ta sợ không dám đi. Diệt 12 con.',
    req: { type: 'kill', target: 'scorpion', count: 12 },
    reward: { exp: 7000, gold: 6000, gear: { slot: 'acc', deg: 3, rarity: 2 } }, next: 'q6' },
  { id: 'q6', name: 'Đầu lĩnh Hắc Phong', giver: 'elder', lv: 24,
    text: 'Trại Thổ Phỉ phía nam do Đầu Lĩnh Hắc Phong cầm đầu. Hắn là mối hoạ lớn nhất của Con Đường Tơ Lụa. Hãy kết liễu hắn.',
    req: { type: 'kill', target: 'chief', count: 1 },
    reward: { exp: 30000, gold: 25000, gear: { slot: 'weapon', deg: 5, rarity: 3 } }, next: 'q7' },
  { id: 'q7', name: 'Sa Mạc Chi Vương', giver: 'persian', lv: 33,
    text: 'Trong Phế Tích Cổ Thành có một con bọ cạp khổng lồ mà người Ba Tư gọi là Sa Mạc Chi Vương. Chưa ai trở về từ đó.',
    req: { type: 'kill', target: 'sandking', count: 1 },
    reward: { exp: 90000, gold: 70000, gear: { slot: 'armor', deg: 6, rarity: 3 } }, next: null },
];

// ---------------- JOB (thương đoàn) ----------------
export const JOB_LEVELS = [
  { lv: 1, exp: 0, slots: 1, name: 'Tiểu Thương' },
  { lv: 2, exp: 3000, slots: 2, name: 'Thương Khách' },
  { lv: 3, exp: 12000, slots: 3, name: 'Đại Thương' },
  { lv: 4, exp: 40000, slots: 4, name: 'Thương Hội Chủ' },
  { lv: 5, exp: 120000, slots: 6, name: 'Kỳ Thương Con Đường Tơ Lụa' },
];
export const JOBS = {
  trader: { id: 'trader', name: 'Thương Nhân', em: '🐫', desc: 'Mua hàng ở Trường An, áp tải lạc đà tới Đôn Hoàng bán giá cao.' },
  hunter: { id: 'hunter', name: 'Thợ Săn', em: '🛡️', desc: 'Diệt Đạo Tặc Sa Mạc trên đường thương đạo để lấy tiền thưởng và danh vọng.' },
  thief:  { id: 'thief', name: 'Đạo Tặc', em: '🥷', desc: 'Cướp hàng của thương đoàn NPC rồi bán ở chợ đen. (Đang mở khoá ở bản sau)' },
};

// ---------------- CẤP ĐỘ ----------------
export const MAX_LEVEL = 60;
export const expToLevel = (lv) => Math.round(90 * Math.pow(lv, 2.05));
