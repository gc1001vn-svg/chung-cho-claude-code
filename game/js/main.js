// ============================================================
//  CON ĐƯỜNG TƠ LỤA — điểm khởi động & vòng lặp game
// ============================================================
import * as THREE from 'three';
import { $, clamp, lerp, elem, rand, randInt, chance, now, fmt, TAU } from './util.js';
import { World } from './world.js';
import { Player, spawnMobs, spawnNpcs } from './entities.js';
import { Combat } from './combat.js';
import { UI } from './ui.js';
import { Input } from './input.js';
import { Quests } from './quests.js';
import { JobSystem } from './job.js';
import { Audio } from './audio.js';
import { hasSave, loadSave, writeSave, wipeSave, saveInfo } from './save.js';
import {
  RACES, TREES, TOWNS, MONSTERS, ALL_SIMPLE, CONSUMABLES, MAX_LEVEL, GOODS,
} from './data.js';
import {
  makeGear, addGear, addSimple, countSimple, removeSimple, equipItem,
  rollDrop, seedUid, BAG_SIZE, fullName,
} from './items.js';

const G = {
  scene: null, camera: null, renderer: null, world: null,
  player: null, mobs: [], npcs: [], running: false, paused: false,
  audio: new Audio(),
};
window.G = G;

// ------------------------------------------------------------ khởi động
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
G.renderer = renderer;
G.scene = new THREE.Scene();
G.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 600);
function fitCamera() {
  renderer.setSize(innerWidth, innerHeight);
  G.camera.aspect = innerWidth / innerHeight;
  // màn hình dọc hẹp ngang -> mở góc nhìn rộng hơn cho đỡ bí
  G.camera.fov = G.camera.aspect < 1 ? 72 : 58;
  G.camera.updateProjectionMatrix();
}
addEventListener('resize', fitCamera);
addEventListener('orientationchange', () => setTimeout(fitCamera, 200));
fitCamera();

const steps = [
  ['Đang dựng địa hình Tây Vực…', () => { G.world = new World(G.scene); }],
  ['Đang xây thành Trường An…', () => { G.world.build(); }],
  ['Đang gọi thương nhân và quái vật…', () => { G.ui = new UI(G); G.quests = new Quests(G); G.job = new JobSystem(G); G.combat = new Combat(G); }],
  ['Xong!', () => { G.input = new Input(G); bindButtons(); }],
];
let si = 0;
function bootStep() {
  const [label, fn] = steps[si];
  $('#loadtxt').textContent = label;
  $('#loadbar').style.width = ((si + 1) / steps.length * 100) + '%';
  requestAnimationFrame(() => {
    try { fn(); } catch (e) { console.error(e); $('#loadtxt').textContent = 'Lỗi: ' + e.message; return; }
    si++;
    if (si < steps.length) setTimeout(bootStep, 16);
    else setTimeout(showMenu, 120);
  });
}
setTimeout(bootStep, 50);

// ------------------------------------------------------------ menu
function showMenu() {
  $('#loading').classList.add('hidden');
  $('#menu').classList.remove('hidden');
  const info = saveInfo();
  if (info) {
    $('#btn-continue').classList.remove('hidden');
    const t = TREES[info.main];
    $('#menu-save').innerHTML = `Nhân vật đã lưu: <b style="color:#e8be5f">${info.name}</b> · ${t?.em || ''} ${t?.name || ''} · Lv.${info.level} · ${info.mins} phút`;
  }
  G.menuMode = true;
  loop(performance.now());
}

$('#btn-continue').addEventListener('click', () => { G.audio.init(); startGame(loadSave()); });
$('#btn-new').addEventListener('click', () => {
  G.audio.init();
  if (hasSave() && !confirm('Tạo nhân vật mới sẽ xoá nhân vật đang lưu. Tiếp tục?')) return;
  $('#menu').classList.add('hidden');
  charCreate();
});
$('#btn-howto').addEventListener('click', () => {
  G.ui.dialog('Hướng dẫn chơi', `• <b>Joystick trái</b>: di chuyển. Vuốt màn hình để xoay camera, chụm 2 ngón để phóng to/thu nhỏ.
• <b>Chạm vào quái</b> để chọn mục tiêu — nhân vật tự chạy tới và đánh.
• Nút <b>⚔</b> tự chọn quái gần nhất, các nút bên cạnh là <b>kỹ năng</b>, nút 🧪 uống thuốc.
• Tới gần NPC sẽ hiện nút vàng để nói chuyện, mua bán, nhận nhiệm vụ.
• <b>Thương đoàn 🐫</b>: mua hàng ở Trường An, áp tải lạc đà tới Đôn Hoàng bán lãi — nhưng coi chừng đạo tặc.
• Game tự lưu, tắt máy bay vẫn chơi được.`, []);
});

// ------------------------------------------------------------ tạo nhân vật
function charCreate() {
  const screen = $('#create');
  screen.classList.remove('hidden');
  const pick = { race: null, t1: null, t2: null, name: '' };
  let step = 0;
  const body = $('#cc-body'), next = $('#cc-next'), title = $('#cc-title');

  const dots = () => {
    const host = document.querySelector('.cc-steps');
    host.innerHTML = '';
    for (let i = 0; i < 4; i++) host.appendChild(elem('i', i <= step ? 'on' : ''));
  };
  const card = (em, name, sub, desc, sel, on, tag) => {
    const c = elem('div', 'pick' + (sel ? ' sel' : ''),
      `<div class="em">${em}</div><div><b>${name}${tag ? `<span class="tag">${tag}</span>` : ''}</b>
       <small>${sub ? `<i style="color:#c9a05f">${sub}</i><br>` : ''}${desc}</small></div>`);
    c.addEventListener('click', on);
    return c;
  };

  function render() {
    dots();
    body.innerHTML = '';
    next.disabled = true;
    if (step === 0) {
      title.textContent = 'Chọn chủng tộc';
      for (const r of Object.values(RACES)) {
        body.appendChild(card(r.em, r.name, r.tagline, r.desc, pick.race === r.id, () => {
          pick.race = r.id; pick.t1 = pick.t2 = null; render();
        }));
      }
      next.disabled = !pick.race;
    } else if (step === 1 || step === 2) {
      const R = RACES[pick.race];
      title.textContent = R.steps[step - 1];
      const key = step === 1 ? 't1' : 't2';
      for (const id of R.trees[step - 1]) {
        if (step === 2 && id === pick.t1) continue;
        const t = TREES[id];
        body.appendChild(card(t.em, t.name, t.sub, t.desc, pick[key] === id, () => { pick[key] = id; render(); },
          t.line));
      }
      if (step === 2) body.insertAdjacentHTML('beforeend',
        `<div class="cc-note">${pick.race === 'china'
          ? 'Hệ nguyên khí quyết định kỹ năng phép và phụ trợ. Ví dụ Bích Thiên + Chân Khí = vừa đánh vừa tự hồi máu, cày rất khoẻ.'
          : 'Class phụ cho bạn 3 kỹ năng nữa. Ví dụ Chiến Binh + Tăng Lữ = trâu bò và tự hồi máu; Pháp Sư + Nhạc Sư = sát thương cao lại chạy nhanh.'}</div>`);
      next.disabled = !pick[key];
    } else {
      title.textContent = 'Đặt tên nhân vật';
      const t1 = TREES[pick.t1], t2 = TREES[pick.t2], R = RACES[pick.race];
      const inp = elem('input', 'cc-name');
      inp.maxLength = 14;
      inp.placeholder = 'Tên nhân vật';
      inp.value = pick.name;
      inp.addEventListener('input', () => { pick.name = inp.value.trim(); next.disabled = pick.name.length < 2; });
      body.appendChild(inp);
      body.insertAdjacentHTML('beforeend', `
        <dl class="sum">
          <dt>Chủng tộc</dt><dd>${R.em} ${R.name}</dd>
          <dt>${pick.race === 'china' ? 'Hệ vũ khí' : 'Class chính'}</dt><dd>${t1.em} ${t1.name}</dd>
          <dt>${pick.race === 'china' ? 'Hệ nguyên khí' : 'Class phụ'}</dt><dd>${t2.em} ${t2.name}</dd>
          <dt>Vũ khí</dt><dd>${(t1.weapon ? WEAPON_NAME(t1.weapon) : WEAPON_NAME(t2.weapon || 'sword'))}</dd>
          <dt>Khởi đầu</dt><dd>Thành Trường An</dd>
        </dl>
        <div class="cc-note">Mỗi cấp bạn nhận +1 STR, +1 INT, 3 điểm tự phân bổ và 3 điểm kỹ năng — giống hệ thống gốc của Silkroad.</div>`);
      next.disabled = pick.name.length < 2;
      setTimeout(() => inp.focus(), 60);
    }
  }
  const WEAPON_NAME = (w) => ({ sword: 'Kiếm', spear: 'Thương', bow: 'Cung', dagger: 'Song Đao', staff: 'Trượng', mace: 'Chùy', harp: 'Đàn' })[w];

  $('#cc-back').onclick = () => {
    if (step === 0) { screen.classList.add('hidden'); $('#menu').classList.remove('hidden'); return; }
    step--; render();
  };
  next.onclick = () => {
    if (step < 3) { step++; render(); return; }
    screen.classList.add('hidden');
    wipeSave();
    startGame(newCharacter(pick));
  };
  render();
}

function newCharacter(pick) {
  const main = pick.race === 'china' ? pick.t1 : pick.t1;
  const sub = pick.t2;
  return {
    name: pick.name, race: pick.race, main, sub,
    level: 1, exp: 0, str: 20, int: 20, statPoints: 0, skillPoints: 3,
    gold: 1200, inventory: [], equip: {}, ranks: {}, quests: {}, kills: {},
    job: { lv: 1, exp: 0, cargo: [], active: false, reputation: 0, runs: 0 },
    playtime: 0, fresh: true,
  };
}

// ------------------------------------------------------------ bắt đầu chơi
function startGame(data) {
  if (!data) return;
  $('#menu').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  G.menuMode = false;
  seedUid(data.inventory);

  const p = new Player(data);
  G.player = p;

  if (data.fresh) {
    // trang bị khởi đầu
    const w = makeGear('weapon', 1, 0, p.weaponType);
    addGear(p, w); equipItem(p, w);
    const a = makeGear('armor', 1, 0); addGear(p, a); equipItem(p, a);
    addSimple(p, 'hp_s', 12); addSimple(p, 'mp_s', 8); addSimple(p, 'scroll_town', 2);
    addSimple(p, 'repair', 3);
    // học sẵn kỹ năng đầu tiên của hệ chính
    const first = TREES[p.main].skills[0];
    p.ranks[first.id] = 1; p.skillPoints -= 1;
    p.quests = {};
    p.setPos(TOWNS.jangan.x, TOWNS.jangan.z + 58);
    p.yaw = Math.PI;
  } else {
    p.setPos(data.pos?.x ?? 0, data.pos?.z ?? 30);
    p.yaw = data.pos?.yaw ?? 0;
    p.storage = data.storage || [];
  }
  p.y = G.world.terrainY(p.x, p.z);
  p.sync();
  G.scene.add(p.mesh);

  G.npcs = spawnNpcs(G.scene, G.world);
  G.mobs = spawnMobs(G.scene, G.world);

  G.input.camYaw = p.yaw + Math.PI;
  G.ui.buildSkillbar();
  G.ui.updateVitals();
  G.ui.updateQuestTrack();
  G.running = true;
  G.lastSave = now();
  if (data.fresh) {
    setTimeout(() => G.ui.dialog('Trưởng Lão Vương',
      `Hoan nghênh ${p.name} đến Trường An — điểm khởi đầu của Con Đường Tơ Lụa.\n\nRa khỏi cổng nam sẽ gặp bầy sói. Hãy chạm vào chúng để chọn mục tiêu, nhân vật sẽ tự áp sát và đánh.\n\nKhi đủ mạnh, hãy tìm ta để nhận nhiệm vụ.`,
      [['Bắt đầu hành trình', () => G.quests.accept('q1')]]), 500);
  }
}

// ------------------------------------------------------------ nút bấm
function bindButtons() {
  $('#btn-attack').addEventListener('click', () => {
    const p = G.player;
    if (!p) return;
    if (!p.target || p.target.dead) targetNearest();
    if (p.target) p.autoMove = p.target;
  });
  $('#btn-pickup').textContent = '🎯';
  $('#btn-pickup').addEventListener('click', () => targetNearest());
  $('#btn-pot').addEventListener('click', () => usePotion());
  $('#btn-interact').addEventListener('click', () => G.ui.interactFn?.());
  $('#btn-revive').addEventListener('click', () => revive());
  G.onHotkey = (i) => { const s = G.player?.skills[i]; if (s) G.combat.useSkill(s.id); };
  G.onSpace = () => { const p = G.player; if (!p) return; if (!p.target || p.target.dead) targetNearest(); };

  G.input.onTap = (sx, sy) => {
    if (!G.running || !G.player) return;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((sx / innerWidth) * 2 - 1, -(sy / innerHeight) * 2 + 1), G.camera);
    const targets = [];
    for (const m of G.mobs) if (!m.dead && m.mesh.visible) targets.push(m.mesh);
    for (const n of G.npcs) targets.push(n.mesh);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) return;
    let o = hit.object;
    while (o.parent && !o.userData.rig) o = o.parent;
    const mob = G.mobs.find(m => m.mesh === o);
    if (mob) { G.player.target = mob; G.player.autoMove = mob; G.ui.updateTarget(); return; }
    const npc = G.npcs.find(n => n.mesh === o);
    if (npc) { G.player.autoMove = { x: npc.x, z: npc.z, npc }; }
  };
  addEventListener('visibilitychange', () => { if (document.hidden) G.save(true); });
  addEventListener('pagehide', () => G.save(true));
}

function targetNearest() {
  const p = G.player;
  let best = null, bd = 45;
  for (const m of G.mobs) {
    if (m.dead || !m.mesh.visible) continue;
    const d = Math.hypot(m.x - p.x, m.z - p.z);
    if (d < bd) { bd = d; best = m; }
  }
  p.target = best;
  G.ui.updateTarget();
  if (best) p.autoMove = best;
  else G.ui.toast('Không có mục tiêu gần đây');
}

function usePotion(id) {
  const p = G.player;
  if (!p) return;
  const order = id ? [id] : ['hp_l', 'hp_m', 'hp_s'];
  for (const k of order) {
    if (countSimple(p, k) > 0) {
      const d = CONSUMABLES[k];
      removeSimple(p, k, 1);
      if (d.heal) { p.hp = Math.min(p.maxHp, p.hp + d.heal); G.combat.float(p.x, p.y + 3.4, p.z, '+' + d.heal, 'heal'); }
      if (d.mana) { p.mp = Math.min(p.maxMp, p.mp + d.mana); G.combat.float(p.x, p.y + 3.4, p.z, '+' + d.mana, 'heal'); }
      G.audio.play('coin');
      G.ui.updateVitals();
      return;
    }
  }
  G.ui.toast('Hết thuốc hồi phục', 'warn');
}
G.usePotion = usePotion;

// ------------------------------------------------------------ sự kiện game
G.save = (announce) => {
  if (!G.player) return;
  G.player.storage = G.player.storage || [];
  const ok = writeSave(G);
  G.lastSave = now();
  if (announce) G.ui.toast(ok ? '💾 Đã lưu' : 'Không lưu được', ok ? 'good' : 'warn');
};

G.onGearChange = () => {
  const p = G.player;
  p.recalc();
  G.ui.updateVitals();
  G.save();
};

G.onLevelUp = (n) => {
  const p = G.player;
  G.audio.play('level');
  G.combat.burst(p.x, p.y + 1.8, p.z, 0xffe08a);
  G.ui.toast(`⭐ Lên cấp ${p.level}! +3 điểm chỉ số, +3 điểm kỹ năng`, 'good');
  G.ui.updateVitals();
};

G.onKill = (mob) => {
  const p = G.player;
  G.audio.play('hit');
  // kinh nghiệm giảm nếu chênh lệch cấp lớn
  const diff = p.level - mob.lv;
  const k = diff > 10 ? 0.25 : diff > 6 ? 0.55 : diff < -6 ? 1.25 : 1;
  const exp = Math.round(mob.exp * k);
  const gold = Math.round(mob.goldDrop * rand(0.8, 1.25));
  p.gold += gold;
  const ups = p.addExp(exp);
  G.combat.float(mob.x, mob.y + 4, mob.z, `+${fmt(exp)} EXP`, 'heal');
  p.kills[mob.id] = (p.kills[mob.id] || 0) + 1;

  // rơi nguyên liệu
  for (const d of mob.def.drops || []) if (chance(0.45)) addSimple(p, d, 1);
  if (chance(mob.elite ? 1 : 0.16)) {
    const it = rollDrop(mob.lv, mob.elite);
    if (addGear(p, it)) G.ui.toast(`🎁 Nhặt được ${fullName(it)}`, 'good');
    else G.ui.toast('Túi đầy, mất đồ rơi!', 'warn');
  }
  if (chance(0.3)) addSimple(p, 'hp_s', 1);
  if (mob.elite) addSimple(p, 'repair', randInt(2, 5));

  if (mob.road) G.job.onThiefKilled(mob);
  G.quests.onKill(mob.id);
  if (ups) G.onLevelUp(ups);
  G.ui.updateVitals();
};

G.removeRoadMob = (m) => {
  G.scene.remove(m.mesh);
  const i = G.mobs.indexOf(m);
  if (i >= 0) G.mobs.splice(i, 1);
  const j = G.job.roadMobs.indexOf(m);
  if (j >= 0) G.job.roadMobs.splice(j, 1);
};

G.hurtFlash = () => {
  G.audio.play('hurt');
  document.body.animate?.([{ filter: 'none' }, { filter: 'brightness(1.35) saturate(1.4)' }, { filter: 'none' }], 180);
};

G.onPlayerDeath = () => {
  const p = G.player;
  if (p.dead) return;
  p.dead = true;
  p.hp = 0;
  p.target = null;
  p.autoMove = null;
  G.audio.play('death');
  const lost = Math.round(p.exp * 0.03);
  p.exp = Math.max(0, p.exp - lost);
  $('#dead-sub').textContent = `Mất ${fmt(lost)} điểm kinh nghiệm.` + (p.job.active ? ' Hàng hoá đã mất!' : '');
  if (p.job.active) G.job.loseCargo();
  $('#death').classList.remove('hidden');
  G.ui.updateTarget();
};

function revive() {
  const p = G.player;
  const t = Math.hypot(p.x - TOWNS.donwhang.x, p.z - TOWNS.donwhang.z) < 260 ? TOWNS.donwhang : TOWNS.jangan;
  p.dead = false;
  p.hp = Math.round(p.maxHp * 0.6);
  p.mp = Math.round(p.maxMp * 0.6);
  p.setPos(t.x, t.z + 12, G.world.terrainY(t.x, t.z + 12));
  for (const m of G.mobs) if (m.aggro === p) { m.aggro = null; m.state = 'return'; }
  $('#death').classList.add('hidden');
  G.ui.updateVitals();
  G.save();
}

G.recall = () => {
  const p = G.player;
  if (countSimple(p, 'scroll_town') > 0) removeSimple(p, 'scroll_town', 1);
  const t = Math.hypot(p.x - TOWNS.donwhang.x, p.z - TOWNS.donwhang.z) < 200 ? TOWNS.donwhang : TOWNS.jangan;
  p.setPos(t.x, t.z + 12, G.world.terrainY(t.x, t.z + 12));
  p.autoMove = null;
  G.ui.toast('Đã về ' + t.name, 'good');
  G.ui.updateVitals();
};

// ------------------------------------------------------------ tương tác NPC
function npcDialog(npc) {
  const p = G.player, ui = G.ui, role = npc.def.role;
  const q = G.quests.offeredBy(npc.def.id);
  const opts = [];
  if (q) {
    const st = G.quests.state(q.id);
    if (st === 'none') opts.push(['📜 Nhận nhiệm vụ: ' + q.name, () => { G.audio.play('quest'); G.quests.accept(q.id); }]);
    else if (G.quests.canComplete(q)) opts.push(['✅ Nộp nhiệm vụ: ' + q.name, () => { G.audio.play('quest'); G.quests.complete(q); }]);
  }
  if (role === 'shop_gear') opts.push(['⚒️ Xem hàng (vũ khí, giáp)', () => ui.openShop(npc)],
    ['✨ Cường hóa trang bị', () => ui.openShop(npc, 'enh')]);
  if (role === 'shop_potion') opts.push(['🧪 Mua thuốc', () => ui.openShop(npc)]);
  if (role === 'storage') opts.push(['🏦 Mở kho', () => ui.openPanel('storage')]);
  if (role === 'job') opts.push(['🐫 Thương đoàn', () => ui.openPanel('job')]);
  if (role === 'job_sell') {
    opts.push(['💰 Bán hàng thương đoàn', () => {
      const err = G.job.deliver();
      if (err) ui.toast(err, 'warn'); else G.audio.play('coin');
    }]);
    opts.push(['🧪 Mua thuốc', () => ui.openShop(npc)]);
  }
  const lines = {
    quest: 'Con đường tơ lụa lắm kẻ gian, thiếu hiệp sĩ như ngươi thì loạn mất.',
    shop_gear: 'Sắt tốt, lửa già — binh khí của ta chém đá cũng không mẻ.',
    shop_potion: 'Thuốc mới sắc xong, uống vào khoẻ như trâu.',
    job: 'Muốn giàu thì theo thương đoàn. Mua rẻ ở đây, bán đắt ở Đôn Hoàng.',
    job_sell: 'Hàng Trung Nguyên ở đây quý lắm, ta trả giá cao.',
    storage: 'Đồ đạc cứ gửi ta, mất một món ta đền mười.',
  };
  ui.dialog(`${npc.def.em} ${npc.name}`, lines[role] || '...', opts);
}

// ------------------------------------------------------------ cập nhật người chơi
function updatePlayer(dt) {
  const p = G.player, inp = G.input, T = now();
  p.playtime += dt;

  // buff hết hạn
  let dirty = false;
  for (let i = p.buffs.length - 1; i >= 0; i--) if (p.buffs[i].until <= T) { p.buffs.splice(i, 1); dirty = true; }
  if (p.imbue && p.imbue.until <= T) p.imbue = null;
  if (dirty) p.recalc();

  // hồi phục
  const inTown = !!G.world.inTown(p.x, p.z);
  const regen = inTown ? 0.06 : 0.014;
  if (!p.dead) {
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * regen * dt);
    p.mp = Math.min(p.maxMp, p.mp + p.maxMp * (regen + 0.01) * dt);
  }

  if (p.dead) { p.moving = false; p.animate(dt); return; }

  // di chuyển
  const ax = inp.axis();
  let vx = 0, vz = 0;
  if (ax.mag > 0.05) {
    p.autoMove = null;
    const yaw = inp.camYaw;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    vx = fx * ax.y + rx * ax.x;
    vz = fz * ax.y + rz * ax.x;
  } else if (p.autoMove) {
    const t = p.autoMove;
    if (t.dead) p.autoMove = null;
    else {
      const dx = t.x - p.x, dz = t.z - p.z;
      const d = Math.hypot(dx, dz);
      const stop = t.npc ? 4 : Math.max(1.6, p.range * 0.85);
      if (d > stop) { vx = dx / d; vz = dz / d; }
      else {
        if (t.npc) { npcDialog(t.npc); }
        p.autoMove = null;
      }
    }
  }
  const mag = Math.hypot(vx, vz);
  p.moving = mag > 0.02;
  if (p.moving) {
    const spd = p.moveSpd * Math.min(1, ax.mag || 1);
    const nx = p.x + (vx / mag) * spd * dt;
    const nz = p.z + (vz / mag) * spd * dt;
    const r = G.world.resolve(nx, nz, 0.8);
    p.x = r.x; p.z = r.z;
    p.yaw = lerp(p.yaw, Math.atan2(vx, vz), Math.min(1, dt * 12));
  }
  p.y = G.world.terrainY(p.x, p.z);
  p.sync();
  p.animate(dt);

  // mục tiêu quá xa thì bỏ
  if (p.target && (p.target.dead || Math.hypot(p.target.x - p.x, p.target.z - p.z) > 60)) {
    p.target = null; G.ui.updateTarget();
  }
  G.combat.autoAttack(dt);

  // NPC gần
  let near = null, nd = 7;
  for (const n of G.npcs) {
    const d = Math.hypot(n.x - p.x, n.z - p.z);
    if (d < nd) { nd = d; near = n; }
  }
  if (near) G.ui.showInteract(`${near.def.em} ${near.name}`, () => npcDialog(near));
  else G.ui.hideInteract();

  // tên vùng
  const zn = G.world.zoneAt(p.x, p.z);
  if (zn.name !== G.zoneName) {
    G.zoneName = zn.name;
    $('#zone-name').textContent = zn.name;
  }
}

function updateCamera(dt) {
  const p = G.player, inp = G.input, cam = G.camera;
  const cp = Math.cos(inp.camPitch), sp = Math.sin(inp.camPitch);
  const dx = Math.sin(inp.camYaw), dz = Math.cos(inp.camYaw);
  const want = inp.dist * (cam.aspect < 1 ? 1.4 : 1);
  const dist = G.world.cameraDistance(p.x, p.z, dx, dz, want);
  const tx = p.x + dx * cp * dist;
  const tz = p.z + dz * cp * dist;
  const ty = p.y + 2.4 + sp * dist;
  const gh = G.world.terrainY(tx, tz) + 1.8;
  const k = Math.min(1, dt * 9);
  cam.position.x = lerp(cam.position.x, tx, k);
  cam.position.z = lerp(cam.position.z, tz, k);
  cam.position.y = lerp(cam.position.y, Math.max(ty, gh), k);
  cam.lookAt(p.x, p.y + 2.2, p.z);
}

// ------------------------------------------------------------ vòng lặp
let last = performance.now();
let menuAngle = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = clamp((t - last) / 1000, 0, 0.06);
  last = t;

  if (G.menuMode) {
    menuAngle += dt * 0.06;
    const r = 78;
    G.camera.position.set(Math.cos(menuAngle) * r, 46, Math.sin(menuAngle) * r);
    G.camera.lookAt(0, 6, 0);
  } else if (G.running && G.player) {
    updatePlayer(dt);
    G.combat.updateMobs(dt);
    G.combat.updateEffects(dt);
    G.job.update(dt);
    updateCamera(dt);
    G.ui.updatePlates(dt);
    G.ui.updateCooldowns();
    G.ui.updateVitals();
    if (G.player.target) G.ui.updateTarget();
    if (G.world.fire) G.world.fire.scale.setScalar(1 + Math.sin(t / 90) * 0.12);
    if (now() - G.lastSave > 15) G.save();
  }
  G.renderer.render(G.scene, G.camera);
}

// ------------------------------------------------------------ PWA
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
