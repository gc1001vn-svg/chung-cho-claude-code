// ============================================================
//  GIAO DIỆN: HUD, bảng thông tin, cửa hàng, hội thoại NPC
// ============================================================
import * as THREE from 'three';
import { $, elem, clamp, fmt, now } from './util.js';
import {
  TREES, RACES, SLOTS, RARITY, CONSUMABLES, MATERIALS, GOODS, ALL_SIMPLE,
  JOB_LEVELS, MONSTERS, degreeForLevel, MAX_LEVEL, WEAPONS,
} from './data.js';
import {
  makeGear, fullName, itemDesc, sellPrice, withEnh, equipItem, unequip,
  addGear, addSimple, removeUid, removeSimple, countSimple, enhanceRate, BAG_SIZE, gearPrice,
} from './items.js';

const V = new THREE.Vector3();

export class UI {
  constructor(G) {
    this.G = G;
    this.panel = $('#panel');
    this.panelBody = $('#panel-body');
    this.panelTitle = $('#panel-title');
    this.plates = [];
    this.plateHost = $('#nameplates');
    this.current = null;
    this.shopNpc = null;
    this.plateTick = 0;
    // cache DOM cho HUD (cập nhật mỗi khung hình)
    this.el = {
      name: $('#p-name'), lv: $('#p-lv'), gold: $('#p-gold'), portrait: $('#portrait'),
      hp: $('#hp-bar'), mp: $('#mp-bar'), xp: $('#xp-bar'),
      hpT: $('#hp-txt'), mpT: $('#mp-txt'), pot: $('#pot-count'),
      spDot: $('#sp-dot'), qDot: $('#q-dot'), track: $('#quest-track'),
      tFrame: $('#target-frame'), tName: $('#t-name'), tLv: $('#t-lv'), tHp: $('#t-hp'),
      zone: $('#zone-name'),
    };
    this.cacheV = {};

    $('#panel-close').addEventListener('click', () => this.closePanel());
    this.panel.addEventListener('click', (e) => { if (e.target === this.panel) this.closePanel(); });
    document.querySelectorAll('.sysbtns .ico').forEach(b =>
      b.addEventListener('click', () => this.openPanel(b.dataset.panel)));
    $('#dialog').addEventListener('click', (e) => { if (e.target.id === 'dialog') this.closeDialog(); });
  }

  // ------------------------------------------------ thông báo
  toast(msg, kind = '') {
    const host = $('#toasts');
    const t = elem('div', 'toast ' + kind, msg);
    host.appendChild(t);
    setTimeout(() => t.remove(), 2400);
    while (host.children.length > 5) host.firstChild.remove();
  }

  // ------------------------------------------------ HUD
  updateVitals() {
    const p = this.G.player;
    if (!p) return;
    const e = this.el, c = this.cacheV;
    const set = (key, node, prop, val) => { if (c[key] !== val) { c[key] = val; node[prop] = val; } };
    set('name', e.name, 'textContent', p.name);
    set('lv', e.lv, 'textContent', 'Lv.' + p.level);
    set('gold', e.gold, 'textContent', fmt(p.gold));
    set('por', e.portrait, 'textContent', TREES[p.main]?.em || '🐉');
    e.hp.style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
    e.mp.style.width = clamp(p.mp / p.maxMp * 100, 0, 100) + '%';
    e.xp.style.width = clamp(p.exp / p.expNeed * 100, 0, 100) + '%';
    set('hpT', e.hpT, 'textContent', `${Math.max(0, Math.round(p.hp))}/${p.maxHp}`);
    set('mpT', e.mpT, 'textContent', `${Math.round(p.mp)}/${p.maxMp}`);
    set('pot', e.pot, 'textContent', String(countSimple(p, 'hp_s') + countSimple(p, 'hp_m') + countSimple(p, 'hp_l')));
    const sp = p.skillPoints <= 0 && p.statPoints <= 0;
    if (c.sp !== sp) { c.sp = sp; e.spDot.classList.toggle('hidden', sp); }
    const q = this.G.quests;
    const qd = !(q.available || (q.active && q.canComplete(q.active)));
    if (c.qd !== qd) { c.qd = qd; e.qDot.classList.toggle('hidden', qd); }
  }

  updateTarget() {
    const t = this.G.player?.target;
    const e = this.el;
    if (!t || t.dead) { e.tFrame.classList.add('hidden'); return; }
    e.tFrame.classList.remove('hidden');
    e.tName.textContent = t.def.name;
    e.tLv.textContent = 'Lv.' + t.lv;
    e.tHp.style.width = clamp(t.hp / t.maxHp * 100, 0, 100) + '%';
  }

  updateQuestTrack() {
    const p = this.G.player;
    let html = this.G.quests.trackText();
    if (p?.job.active && p.job.cargo.length) {
      const c = p.job.cargo[0];
      html += `<br><b>🐫 Áp tải hàng</b>${GOODS[c.id].name} ×${c.qty} → Đôn Hoàng<br>Lạc đà: <span>${Math.max(0, Math.round(this.G.job.camelHp))}</span>`;
    }
    if (this.cacheV.track !== html) { this.cacheV.track = html; this.el.track.innerHTML = html; }
  }

  // ------------------------------------------------ thanh kỹ năng
  buildSkillbar() {
    const bar = $('#skillbar');
    bar.innerHTML = '';
    const p = this.G.player;
    this.skillBtns = [];
    p.skills.forEach((s) => {
      const b = elem('button', 'skill', `<span class="si">${s.em}</span><span class="sn">${s.name}</span>`);
      b.dataset.id = s.id;
      b.addEventListener('click', () => this.G.combat.useSkill(s.id));
      bar.appendChild(b);
      this.skillBtns.push(b);
    });
  }
  updateCooldowns() {
    const p = this.G.player;
    const T = now();
    for (const b of this.skillBtns || []) {
      const s = p.skillById(b.dataset.id);
      const learned = (s?.rank || 0) > 0 && p.level >= s.reqLv;
      b.classList.toggle('off', !learned);
      const left = (p.cds[b.dataset.id] || 0) - T;
      let cd = b.querySelector('.cd');
      if (left > 0) {
        if (!cd) { cd = elem('i', 'cd'); b.appendChild(cd); }
        cd.textContent = left > 1 ? Math.ceil(left) : left.toFixed(1);
      } else cd?.remove();
    }
  }

  // ------------------------------------------------ bảng tên trên đầu
  updatePlates(dt) {
    this.plateTick += dt;
    if (this.plateTick < 0.06) return;
    this.plateTick = 0;
    // cache DOM cho HUD (cập nhật mỗi khung hình)
    this.el = {
      name: $('#p-name'), lv: $('#p-lv'), gold: $('#p-gold'), portrait: $('#portrait'),
      hp: $('#hp-bar'), mp: $('#mp-bar'), xp: $('#xp-bar'),
      hpT: $('#hp-txt'), mpT: $('#mp-txt'), pot: $('#pot-count'),
      spDot: $('#sp-dot'), qDot: $('#q-dot'), track: $('#quest-track'),
      tFrame: $('#target-frame'), tName: $('#t-name'), tLv: $('#t-lv'), tHp: $('#t-hp'),
      zone: $('#zone-name'),
    };
    this.cacheV = {};
    const G = this.G, cam = G.camera, p = G.player;
    const list = [];
    for (const m of G.mobs) {
      if (m.dead || !m.mesh.visible) continue;
      const d = Math.hypot(m.x - p.x, m.z - p.z);
      if (d > 55) continue;
      list.push({ x: m.x, y: m.y + 3.4 * (m.def.scale || 1), z: m.z, d,
        name: `${m.def.name} <i style="color:#c9a05f">Lv${m.lv}</i>`, hp: m.hp / m.maxHp, cls: m.elite ? 'elite' : '' });
    }
    for (const n of G.npcs) {
      const d = Math.hypot(n.x - p.x, n.z - p.z);
      if (d > 45) continue;
      list.push({ x: n.x, y: n.y + 3.5, z: n.z, d, name: `${n.def.em} ${n.name}`, hp: 1, cls: 'npc' });
    }
    if (G.job.camel && p.job.active) {
      const c = G.job.camel;
      list.push({ x: c.x, y: c.y + 4, z: c.z, d: 0, name: '🐫 Lạc đà thồ', hp: G.job.camelHp / G.job.camelMax, cls: '' });
    }
    list.sort((a, b) => a.d - b.d);
    const use = list.slice(0, 14);
    while (this.plates.length < use.length) {
      const el = elem('div', 'plate', '<span class="pn"></span><div class="pb"><i></i></div>');
      this.plateHost.appendChild(el);
      this.plates.push(el);
    }
    this.plates.forEach((el, i) => {
      const it = use[i];
      if (!it) { el.style.display = 'none'; return; }
      V.set(it.x, it.y, it.z).project(cam);
      if (V.z > 1 || Math.abs(V.x) > 1.1 || Math.abs(V.y) > 1.1) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      el.className = 'plate ' + it.cls;
      el.style.left = (V.x * 0.5 + 0.5) * 100 + '%';
      el.style.top = (-V.y * 0.5 + 0.5) * 100 + '%';
      el.firstChild.innerHTML = it.name;
      el.lastChild.firstChild.style.width = clamp(it.hp * 100, 0, 100) + '%';
    });
  }

  // ------------------------------------------------ panel chung
  openPanel(name) {
    this.current = name;
    this.panel.classList.remove('hidden');
    const R = {
      char: ['Nhân vật', () => this.renderChar()],
      bag: ['Túi đồ', () => this.renderBag()],
      skill: ['Kỹ năng', () => this.renderSkill()],
      quest: ['Nhiệm vụ', () => this.renderQuest()],
      job: ['Thương đoàn', () => this.renderJob()],
      sys: ['Hệ thống', () => this.renderSys()],
      shop: ['Cửa hàng', () => this.renderShop()],
      storage: ['Kho', () => this.renderStorage()],
    }[name];
    if (!R) return;
    this.panelTitle.textContent = R[0];
    this.panelBody.innerHTML = '';
    R[1]();
  }
  closePanel() { this.panel.classList.add('hidden'); this.current = null; }
  refresh() { if (this.current) this.openPanel(this.current); this.updateVitals(); }

  // ------------------------------------------------ nhân vật
  renderChar() {
    const p = this.G.player;
    const b = this.panelBody;
    const race = RACES[p.race];
    const t1 = TREES[p.main], t2 = TREES[p.sub];
    b.innerHTML = `
      <div class="mono" style="margin-bottom:10px">
        <b>${p.name}</b> · ${race.em} ${race.name} · Lv.${p.level}${p.level >= MAX_LEVEL ? ' (tối đa)' : ''}<br>
        ${t1.em} ${t1.name} <span style="opacity:.6">(${t1.sub || 'chính'})</span> +
        ${t2.em} ${t2.name} <span style="opacity:.6">(${t2.sub || 'phụ'})</span><br>
        Kinh nghiệm: <b>${fmt(p.exp)}</b> / ${fmt(p.expNeed)}
      </div>`;

    if (p.statPoints > 0) {
      const box = elem('div', '', `<div class="h4">Điểm chưa dùng: ${p.statPoints}</div>`);
      for (const [k, label, note] of [['str', 'SỨC MẠNH (STR)', 'HP, công vật lý, thủ'], ['int', 'TRÍ TUỆ (INT)', 'MP, công phép, kháng phép']]) {
        const row = elem('div', 'pt', `<b>${label} <small style="color:#8f7d59">${note}</small></b><span style="color:#f0d99b;min-width:34px;text-align:right">${p[k]}</span>`);
        const plus = elem('button', 'plus', '+');
        plus.addEventListener('click', () => {
          if (p.statPoints <= 0) return;
          p.statPoints--; p[k]++; p.recalc();
          this.G.save();
          this.refresh();
        });
        row.appendChild(plus);
        box.appendChild(row);
      }
      b.appendChild(box);
    }

    const e = withEnh;
    const stat = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
    b.insertAdjacentHTML('beforeend', `
      <div class="h4">Chỉ số</div>
      <div class="stats">
        ${stat('Sinh lực', `${Math.round(p.hp)}/${p.maxHp}`)}
        ${stat('Nội lực', `${Math.round(p.mp)}/${p.maxMp}`)}
        ${stat('STR', p.str)}${stat('INT', p.int)}
        ${stat('Công vật lý', p.phyAtk)}${stat('Công phép', p.magAtk)}
        ${stat('Thủ vật lý', p.phyDef)}${stat('Kháng phép', p.magDef)}
        ${stat('Chí mạng', (p.crit * 100).toFixed(1) + '%')}
        ${stat('Tốc đánh', p.atkInterval.toFixed(2) + 's')}
        ${stat('Vũ khí', WEAPONS[p.weaponType].name)}
        ${stat('Tầm đánh', p.range.toFixed(1) + 'm')}
      </div>
      <div class="h4">Trang bị</div>`);

    const list = elem('div', 'rowlist');
    for (const [slot, meta] of Object.entries(SLOTS)) {
      const it = p.equip[slot];
      const row = elem('div', 'row', it
        ? `<div class="em">${it.em}</div><div class="rt"><b>${fullName(it)}</b><small>${itemDesc(it)}</small></div>`
        : `<div class="em" style="opacity:.35">${meta.em}</div><div class="rt"><b style="opacity:.45">${meta.name} — trống</b></div>`);
      if (it) {
        const btn = elem('button', 'sec', 'Tháo');
        btn.addEventListener('click', () => {
          const r = unequip(p, slot);
          if (r === 'full') return this.toast('Túi đầy', 'warn');
          this.G.onGearChange();
          this.refresh();
        });
        row.appendChild(btn);
      }
      list.appendChild(row);
    }
    b.appendChild(list);

    if (p.buffs.length || p.imbue) {
      b.insertAdjacentHTML('beforeend', '<div class="h4">Trạng thái</div>');
      const T = now();
      const buffs = [...p.buffs, ...(p.imbue ? [p.imbue] : [])].filter(x => x.until > T);
      b.insertAdjacentHTML('beforeend',
        '<div class="mono">' + buffs.map(x => `${x.em} <b>${x.name}</b> — còn ${Math.ceil(x.until - T)}s`).join('<br>') + '</div>');
    }
  }

  // ------------------------------------------------ túi đồ
  renderBag(mode = 'bag') {
    const p = this.G.player, b = this.panelBody;
    b.innerHTML = `<div class="mono" style="margin-bottom:8px">Ô trống: <b>${BAG_SIZE - p.inventory.length}</b>/${BAG_SIZE} · Vàng: <b>${fmt(p.gold)}</b></div>`;
    if (!p.inventory.length) { b.insertAdjacentHTML('beforeend', '<div class="empty">Túi trống trơn</div>'); return; }
    const grid = elem('div', 'grid');
    for (const it of p.inventory) {
      const cell = elem('div', 'cell has ' + (it.kind === 'gear' ? RARITY[it.rarity].cls : ''),
        `${it.em || ALL_SIMPLE[it.id]?.em || '📦'}
         ${it.qty > 1 ? `<span class="qty">${it.qty}</span>` : ''}
         ${it.kind === 'gear' ? `<span class="dg">${it.deg}${it.enh ? '+' + it.enh : ''}</span>` : ''}`);
      cell.addEventListener('click', () => this.itemMenu(it));
      grid.appendChild(cell);
    }
    b.appendChild(grid);
  }

  itemMenu(it) {
    const p = this.G.player;
    const opts = [];
    if (it.kind === 'gear') {
      opts.push(['Trang bị', () => {
        const r = equipItem(p, it);
        if (r === 'lowlv') return this.toast(`Cần cấp ${it.reqLv}`, 'warn');
        if (r === 'wrongtype') return this.toast(`Bạn chỉ dùng được ${WEAPONS[p.weaponType].name}`, 'warn');
        this.G.onGearChange();
        this.toast('Đã trang bị ' + fullName(it), 'good');
        this.refresh();
      }]);
    } else if (it.kind === 'potion' || it.kind === 'mana') {
      opts.push(['Sử dụng', () => { this.G.usePotion(it.id); this.refresh(); }]);
    } else if (it.kind === 'recall') {
      opts.push(['Dịch chuyển về thành', () => { this.G.recall(); this.closeDialog(); this.closePanel(); }]);
    }
    opts.push([`Bán (${fmt(sellPrice(it))} vàng)`, () => {
      p.gold += sellPrice(it) * (it.qty || 1);
      removeUid(p, it.uid);
      this.toast('Đã bán ' + fullName(it), 'good');
      this.refresh();
    }]);
    opts.push(['Vứt bỏ', () => { removeUid(p, it.uid); this.refresh(); }]);
    this.dialog(fullName(it), itemDesc(it), opts);
  }

  // ------------------------------------------------ kỹ năng
  renderSkill() {
    const p = this.G.player, b = this.panelBody;
    b.innerHTML = `<div class="mono" style="margin-bottom:10px">Điểm kỹ năng: <b>${p.skillPoints}</b> · Mỗi cấp nhận 3 điểm</div>`;
    for (const treeId of [p.main, p.sub]) {
      const t = TREES[treeId];
      b.insertAdjacentHTML('beforeend', `<div class="h4">${t.em} ${t.name} — ${t.sub || ''}</div>`);
      const list = elem('div', 'rowlist');
      for (const s of t.skills) {
        const rank = p.ranks[s.id] || 0;
        const locked = p.level < s.reqLv;
        const cost = rank + 1;
        const power = (s.power * (1 + Math.max(0, rank - 1) * 0.14)).toFixed(2);
        const info = rank
          ? `Cấp ${rank}/10 · Hệ số ${power} · MP ${Math.round(s.mp * (1 + (rank - 1) * 0.08))} · Hồi ${s.cd}s`
          : `Chưa học · Yêu cầu Lv.${s.reqLv} · Tốn ${cost} điểm`;
        const row = elem('div', 'row',
          `<div class="em">${s.em}</div><div class="rt"><b>${s.name}</b><small>${info}</small></div>`);
        const btn = elem('button', rank ? 'sec' : '', rank ? `Nâng (${cost})` : `Học (${cost})`);
        btn.disabled = locked || p.skillPoints < cost || rank >= 10;
        if (locked) btn.textContent = `Lv.${s.reqLv}`;
        btn.addEventListener('click', () => {
          if (p.skillPoints < cost) return this.toast('Không đủ điểm kỹ năng', 'warn');
          p.skillPoints -= cost;
          p.ranks[s.id] = rank + 1;
          this.G.save();
          this.buildSkillbar();
          this.toast(`${s.name} → cấp ${rank + 1}`, 'good');
          this.refresh();
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
      b.appendChild(list);
    }
  }

  // ------------------------------------------------ nhiệm vụ
  renderQuest() {
    const b = this.panelBody, q = this.G.quests;
    const a = q.active, av = q.available;
    if (!a && !av) { b.innerHTML = '<div class="empty">Đã hoàn thành mọi nhiệm vụ hiện có.<br>Bản sau sẽ mở thêm Constantinople.</div>'; return; }
    if (a) {
      const st = this.G.player.quests[a.id];
      b.innerHTML = `<div class="h4">Đang làm</div>
        <div class="mono"><b>${a.name}</b><br>${a.text}<br><br>
        Tiến độ: <b>${st.prog}/${a.req.count}</b> · Người giao: <b>${q.giverName(a.giver)}</b><br>
        Thưởng: <b>${fmt(a.reward.exp)} EXP</b>, <b>${fmt(a.reward.gold)} vàng</b>${a.reward.gear ? ', 1 trang bị' : ''}</div>`;
    }
    if (av) {
      b.insertAdjacentHTML('beforeend', `<div class="h4">Có thể nhận</div>
        <div class="mono"><b>${av.name}</b> (Lv.${av.lv})<br>${av.text}<br>Gặp <b>${q.giverName(av.giver)}</b> tại ${av.giver.includes('persian') ? 'Đôn Hoàng' : 'Trường An'}.</div>`);
    }
    const done = Object.entries(this.G.player.quests).filter(([, v]) => v.state === 'done');
    if (done.length) b.insertAdjacentHTML('beforeend',
      `<div class="h4">Đã hoàn thành (${done.length})</div><div class="mono">` +
      done.map(([id]) => '✔ ' + q.def(id).name).join('<br>') + '</div>');
  }

  // ------------------------------------------------ thương đoàn
  renderJob() {
    const G = this.G, p = G.player, b = this.panelBody, J = G.job;
    const lv = J.level, nx = J.nextLevel;
    b.innerHTML = `
      <div class="mono">
        Nghề: <b>🐫 ${lv.name}</b> (cấp ${lv.lv}/5) · Số kiện tối đa: <b>${lv.slots}</b><br>
        Kinh nghiệm thương đoàn: <b>${fmt(p.job.exp)}</b>${nx ? ` / ${fmt(nx.exp)} → ${nx.name}` : ' (tối đa)'}<br>
        Chuyến đã đi: <b>${p.job.runs || 0}</b> · Danh vọng: <b>${p.job.reputation || 0}</b>
      </div>`;
    if (p.job.active) {
      const c = p.job.cargo[0];
      b.insertAdjacentHTML('beforeend', `<div class="h4">Đang áp tải</div>
        <div class="mono">${GOODS[c.id].em} <b>${GOODS[c.id].name} ×${c.qty}</b> — vốn ${fmt(c.cost)} vàng<br>
        Lạc đà: <b>${Math.max(0, Math.round(J.camelHp))}/${J.camelMax}</b><br>
        Đưa tới <b>Đôn Hoàng</b> gặp Thương Nhân Ba Tư để bán. Cẩn thận đạo tặc dọc đường!</div>`);
      const row = elem('div', 'row', '<div class="em">❌</div><div class="rt"><b>Bỏ chuyến hàng</b><small>Mất toàn bộ vốn đã bỏ ra</small></div>');
      const btn = elem('button', 'sec', 'Bỏ');
      btn.addEventListener('click', () => { J.loseCargo(); this.refresh(); });
      row.appendChild(btn);
      b.appendChild(row);
      return;
    }
    b.insertAdjacentHTML('beforeend', `<div class="h4">Mua hàng (tại Trường An)</div>`);
    const inJangan = G.world.inTown(p.x, p.z)?.id === 'jangan';
    if (!inJangan) b.insertAdjacentHTML('beforeend', '<div class="mono" style="color:#c58b6a">Phải đứng trong thành Trường An mới mua được hàng.</div>');
    const list = elem('div', 'rowlist');
    for (const g of Object.values(GOODS)) {
      const qty = lv.slots;
      const cost = g.buy * qty;
      const row = elem('div', 'row',
        `<div class="em">${g.em}</div><div class="rt"><b>${g.name}</b>
         <small>Giá vốn ${fmt(g.buy)}/kiện · Cần nghề cấp ${g.jobLv} · Lãi dự kiến ~${Math.round((0.75 + lv.lv * 0.05) * 100)}%</small></div>`);
      const btn = elem('button', '', `Mua ${qty}`);
      btn.disabled = !inJangan || lv.lv < g.jobLv || p.gold < cost;
      btn.addEventListener('click', () => {
        const err = J.start(g.id, qty);
        if (err) return this.toast(err, 'warn');
        this.closePanel();
        this.updateVitals();
      });
      row.appendChild(btn);
      list.appendChild(row);
    }
    b.appendChild(list);
    b.insertAdjacentHTML('beforeend', `<div class="h4">Nghề khác</div>
      <div class="mono">🛡️ <b>Thợ Săn</b> — diệt Đạo Tặc Sa Mạc xuất hiện lúc áp tải để nhận tiền thưởng và kinh nghiệm nghề.<br>
      🥷 <b>Đạo Tặc</b> — cướp hàng thương đoàn NPC (mở ở bản cập nhật sau).</div>`);
  }

  // ------------------------------------------------ hệ thống
  renderSys() {
    const G = this.G, b = this.panelBody;
    const mm = Math.floor(G.player.playtime / 60);
    b.innerHTML = `<div class="mono">Thời gian chơi: <b>${Math.floor(mm / 60)}h ${mm % 60}p</b><br>
      Game tự động lưu mỗi 15 giây và khi bạn thoát.<br>Dữ liệu nằm trong máy bạn, không cần mạng.</div>`;
    const list = elem('div', 'rowlist');
    const mk = (em, name, note, label, fn, cls = '') => {
      const row = elem('div', 'row', `<div class="em">${em}</div><div class="rt"><b>${name}</b><small>${note}</small></div>`);
      const btn = elem('button', cls, label);
      btn.addEventListener('click', fn);
      row.appendChild(btn);
      list.appendChild(row);
    };
    mk('💾', 'Lưu ngay', 'Ghi tiến trình vào máy', 'Lưu', () => { G.save(true); });
    mk('🏯', 'Về thành', 'Dịch chuyển về Trường An', 'Đi', () => { G.recall(); this.closePanel(); }, 'sec');
    mk('🔊', 'Âm thanh', G.audio.enabled ? 'Đang bật' : 'Đang tắt', G.audio.enabled ? 'Tắt' : 'Bật',
      () => { G.audio.toggle(); this.refresh(); }, 'sec');
    mk('🚪', 'Về menu chính', 'Lưu lại rồi thoát ra menu', 'Thoát', () => {
      G.save(true); location.reload();
    }, 'sec');
    b.appendChild(list);
  }

  // ------------------------------------------------ kho
  renderStorage() {
    const p = this.G.player, b = this.panelBody;
    p.storage ||= [];
    b.innerHTML = `<div class="mono" style="margin-bottom:8px">Kho giữ đồ giúp bạn (${p.storage.length}/60). Chạm để chuyển qua lại.</div>`;
    const mk = (title, arr, move) => {
      b.insertAdjacentHTML('beforeend', `<div class="h4">${title}</div>`);
      if (!arr.length) { b.insertAdjacentHTML('beforeend', '<div class="empty">Trống</div>'); return; }
      const grid = elem('div', 'grid');
      for (const it of [...arr]) {
        const cell = elem('div', 'cell has ' + (it.kind === 'gear' ? RARITY[it.rarity].cls : ''),
          `${it.em || ALL_SIMPLE[it.id]?.em || '📦'}${it.qty > 1 ? `<span class="qty">${it.qty}</span>` : ''}`);
        cell.addEventListener('click', () => { move(it); this.refresh(); });
        grid.appendChild(cell);
      }
      b.appendChild(grid);
    };
    mk('Túi đồ → Kho', p.inventory, (it) => {
      if (p.storage.length >= 60) return this.toast('Kho đầy', 'warn');
      removeUid(p, it.uid); p.storage.push(it);
    });
    mk('Kho → Túi đồ', p.storage, (it) => {
      if (p.inventory.length >= BAG_SIZE) return this.toast('Túi đầy', 'warn');
      p.storage.splice(p.storage.indexOf(it), 1); p.inventory.push(it);
    });
  }

  // ------------------------------------------------ cửa hàng
  openShop(npc, tab = 'buy') {
    this.shopNpc = npc;
    this.shopTab = tab;
    this.openPanel('shop');
    this.panelTitle.textContent = npc.name;
  }
  shopStock(npc) {
    const p = this.G.player;
    if (npc.def.role === 'shop_potion') {
      return Object.values(CONSUMABLES).filter(c => (c.reqLv || 1) <= p.level + 2)
        .map(c => ({ simple: c.id, price: c.price, em: c.em, name: c.name, desc: itemDesc({ kind: c.kind, id: c.id }) }));
    }
    // thợ rèn: bán trang bị quanh bậc phù hợp cấp người chơi
    const deg = degreeForLevel(p.level);
    const out = [];
    for (const d of [Math.max(1, deg - 1), deg, Math.min(12, deg + 1)]) {
      for (const slot of ['weapon', 'helm', 'armor', 'boots', 'acc']) {
        const it = makeGear(slot, d, d === deg + 1 ? 1 : 0, p.weaponType);
        out.push({ gear: it, price: Math.round(gearPrice(it) * 2.1), em: it.em, name: it.name, desc: itemDesc(it) });
      }
    }
    return out;
  }
  renderShop() {
    const npc = this.shopNpc, p = this.G.player, b = this.panelBody;
    const tabs = elem('div', 'tabs');
    const isSmith = npc.def.role === 'shop_gear';
    const defs = [['buy', 'Mua'], ['sell', 'Bán'], ...(isSmith ? [['enh', 'Cường hóa']] : [])];
    for (const [id, label] of defs) {
      const t = elem('div', 'tab' + (this.shopTab === id ? ' on' : ''), label);
      t.addEventListener('click', () => { this.shopTab = id; this.openPanel('shop'); this.panelTitle.textContent = npc.name; });
      tabs.appendChild(t);
    }
    b.appendChild(tabs);
    b.insertAdjacentHTML('beforeend', `<div class="mono" style="margin-bottom:8px">Vàng: <b>${fmt(p.gold)}</b></div>`);
    const list = elem('div', 'rowlist');

    if (this.shopTab === 'buy') {
      for (const s of this.shopStock(npc)) {
        const row = elem('div', 'row',
          `<div class="em">${s.em}</div><div class="rt"><b>${s.name}</b><small>${s.desc} · ${fmt(s.price)} vàng</small></div>`);
        const btn = elem('button', '', 'Mua');
        btn.disabled = p.gold < s.price;
        btn.addEventListener('click', () => {
          if (p.gold < s.price) return this.toast('Không đủ vàng', 'warn');
          if (p.inventory.length >= BAG_SIZE) return this.toast('Túi đầy', 'warn');
          p.gold -= s.price;
          if (s.simple) addSimple(p, s.simple, 1);
          else addGear(p, makeGear(s.gear.slot, s.gear.deg, s.gear.rarity, s.gear.type || p.weaponType));
          this.G.audio.play('coin');
          this.toast('Đã mua ' + s.name, 'good');
          this.refresh();
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
    } else if (this.shopTab === 'sell') {
      if (!p.inventory.length) list.innerHTML = '<div class="empty">Không có gì để bán</div>';
      for (const it of [...p.inventory]) {
        const price = sellPrice(it) * (it.qty || 1);
        const row = elem('div', 'row',
          `<div class="em">${it.em || ALL_SIMPLE[it.id]?.em || '📦'}</div>
           <div class="rt"><b>${fullName(it)}${it.qty > 1 ? ' ×' + it.qty : ''}</b><small>${itemDesc(it)}</small></div>`);
        const btn = elem('button', 'sec', fmt(price) + ' 💰');
        btn.addEventListener('click', () => {
          p.gold += price;
          removeUid(p, it.uid);
          this.G.audio.play('coin');
          this.refresh();
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
    } else {
      const stones = countSimple(p, 'repair');
      b.insertAdjacentHTML('beforeend',
        `<div class="mono" style="margin-bottom:8px">Đá Cường Hóa: <b>${stones}</b> · Mỗi lần +1 tăng 9% chỉ số.<br>Thất bại chỉ mất đá, trang bị vẫn còn.</div>`);
      const gears = [...Object.values(p.equip), ...p.inventory.filter(i => i.kind === 'gear')];
      if (!gears.length) list.innerHTML = '<div class="empty">Chưa có trang bị nào</div>';
      for (const it of gears) {
        const rate = enhanceRate(it.enh);
        const row = elem('div', 'row',
          `<div class="em">${it.em}</div><div class="rt"><b>${fullName(it)}</b>
           <small>${itemDesc(it)} · Tỉ lệ thành công <b>${Math.round(rate * 100)}%</b></small></div>`);
        const btn = elem('button', '', '+1');
        btn.disabled = stones < 1 || it.enh >= 12;
        btn.addEventListener('click', () => {
          if (!removeSimple(p, 'repair', 1)) return this.toast('Hết Đá Cường Hóa', 'warn');
          if (Math.random() < rate) {
            it.enh++;
            if (it.base) { const e = withEnh({ ...it, ...it.base }); it.atk = e.atk; it.def = e.def; it.hp = e.hp; it.mp = e.mp; }
            this.G.audio.play('level');
            this.toast(`✨ Thành công! ${fullName(it)}`, 'good');
            p.recalc();
          } else this.toast('💥 Cường hóa thất bại', 'warn');
          this.refresh();
        });
        row.appendChild(btn);
        list.appendChild(row);
      }
    }
    b.appendChild(list);
  }

  // ------------------------------------------------ hội thoại
  dialog(who, text, options) {
    $('#dlg-npc').textContent = who;
    $('#dlg-text').innerHTML = text;
    const host = $('#dlg-opts');
    host.innerHTML = '';
    for (const [label, fn] of options) {
      const btn = elem('button', '', label);
      btn.addEventListener('click', () => { this.closeDialog(); fn?.(); });
      host.appendChild(btn);
    }
    const close = elem('button', '', 'Đóng');
    close.addEventListener('click', () => this.closeDialog());
    host.appendChild(close);
    $('#dialog').classList.remove('hidden');
  }
  closeDialog() { $('#dialog').classList.add('hidden'); }

  showInteract(label, fn) {
    const box = $('#interact'), btn = $('#btn-interact');
    if (this._ilabel !== label) { btn.textContent = label; this._ilabel = label; }
    box.classList.remove('hidden');
    this.interactFn = fn;
  }
  hideInteract() { $('#interact').classList.add('hidden'); this.interactFn = null; this._ilabel = null; }
}
