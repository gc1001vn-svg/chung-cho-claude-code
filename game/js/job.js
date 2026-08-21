// ============================================================
//  HỆ THỐNG THƯƠNG ĐOÀN (Job): Thương nhân · Thợ săn · Đạo tặc
// ============================================================
import * as THREE from 'three';
import { GOODS, JOB_LEVELS, TOWNS, MONSTERS } from './data.js';
import { makeCamel, Mob } from './entities.js';
import { clamp, rand, now, lerp } from './util.js';

export class JobSystem {
  constructor(G) {
    this.G = G;
    this.camel = null;
    this.camelHp = 0;
    this.camelMax = 0;
    this.thiefTimer = 0;
    this.roadMobs = [];
  }

  get level() {
    const p = this.G.player;
    let lv = JOB_LEVELS[0];
    for (const l of JOB_LEVELS) if (p.job.exp >= l.exp) lv = l;
    return lv;
  }
  get nextLevel() {
    return JOB_LEVELS.find(l => l.exp > this.G.player.job.exp) || null;
  }
  get slots() { return this.level.slots; }

  cost(goodsId, qty) { return GOODS[goodsId].buy * qty; }

  /** Bắt đầu một chuyến hàng */
  start(goodsId, qty) {
    const G = this.G, p = G.player;
    const g = GOODS[goodsId];
    if (!g) return 'Hàng không tồn tại';
    if (p.job.active) return 'Bạn đang áp tải một chuyến hàng rồi';
    if (this.level.lv < g.jobLv) return `Cần cấp thương nhân ${g.jobLv}`;
    qty = clamp(qty, 1, this.slots);
    const c = this.cost(goodsId, qty);
    if (p.gold < c) return 'Không đủ vàng';
    p.gold -= c;
    p.job.active = true;
    p.job.cargo = [{ id: goodsId, qty, cost: c }];
    p.recalc();
    this.spawnCamel();
    G.ui.toast(`Bắt đầu áp tải ${qty} kiện ${g.name} → Đôn Hoàng`, 'good');
    G.ui.updateQuestTrack();
    return null;
  }

  spawnCamel() {
    const G = this.G, p = G.player;
    if (this.camel) return;
    const mesh = makeCamel();
    this.camel = { mesh, x: p.x - 3, z: p.z - 3, y: 0, yaw: p.yaw, animT: 0, moving: false };
    this.camelMax = Math.round(900 + p.level * 120);
    this.camelHp = this.camelMax;
    G.scene.add(mesh);
  }
  despawnCamel() {
    if (!this.camel) return;
    this.G.scene.remove(this.camel.mesh);
    this.camel = null;
  }

  /** Giao hàng cho Thương Nhân Ba Tư */
  deliver() {
    const G = this.G, p = G.player;
    if (!p.job.active || !p.job.cargo.length) return 'Bạn không mang hàng nào';
    const t = TOWNS.donwhang;
    if (Math.hypot(p.x - t.x, p.z - t.z) > t.r + 15) return 'Phải tới Đôn Hoàng mới bán được';
    let total = 0, exp = 0;
    for (const c of p.job.cargo) {
      const g = GOODS[c.id];
      const market = 1.75 + this.level.lv * 0.05 + rand(-0.12, 0.18);
      const v = Math.round(g.buy * c.qty * market);
      total += v;
      exp += Math.round(g.buy * c.qty * 0.55);
    }
    p.gold += total;
    p.job.exp += exp;
    p.job.runs = (p.job.runs || 0) + 1;
    p.job.reputation = (p.job.reputation || 0) + 10;
    const before = this.level.lv;
    p.job.active = false;
    p.job.cargo = [];
    p.recalc();
    this.despawnCamel();
    this.clearRoadMobs();
    G.ui.toast(`Bán hàng được ${total.toLocaleString('vi-VN')} vàng (+${exp} kinh nghiệm thương đoàn)`, 'good');
    if (this.level.lv > before) G.ui.toast(`🐫 Thăng cấp thương nhân: ${this.level.name}!`, 'good');
    G.quests.onTrade?.();
    G.ui.updateQuestTrack();
    G.ui.updateVitals();
    return null;
  }

  /** Mất hàng khi lạc đà bị giết */
  loseCargo() {
    const G = this.G, p = G.player;
    p.job.active = false;
    p.job.cargo = [];
    p.job.reputation = Math.max(0, (p.job.reputation || 0) - 5);
    p.recalc();
    this.despawnCamel();
    G.ui.toast('Lạc đà bị giết! Toàn bộ hàng hoá đã mất.', 'warn');
    G.ui.updateQuestTrack();
  }

  clearRoadMobs() {
    for (const m of this.roadMobs) {
      this.G.scene.remove(m.mesh);
      const i = this.G.mobs.indexOf(m);
      if (i >= 0) this.G.mobs.splice(i, 1);
    }
    this.roadMobs = [];
  }

  /** Đạo tặc NPC phục kích trên thương đạo */
  spawnThieves() {
    const G = this.G, p = G.player;
    const n = 1 + Math.floor(Math.random() * 2 + this.level.lv * 0.4);
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), r = rand(16, 26);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const m = new Mob('thief');
      m.lv = Math.max(8, p.level);
      m.maxHp = Math.round(MONSTERS.thief.hp * Math.pow(m.lv / MONSTERS.thief.lv, 1.42));
      m.atk = Math.round(MONSTERS.thief.atk * Math.pow(m.lv / MONSTERS.thief.lv, 1.28));
      m.exp = Math.round(MONSTERS.thief.exp * Math.pow(m.lv / MONSTERS.thief.lv, 1.5));
      m.goldDrop = Math.round(m.exp * 0.9);
      m.reset(x, z);
      m.y = G.world.terrainY(x, z);
      m.sync();
      m.zone = 'road';
      m.road = true;
      m.aggro = p;
      m.state = 'chase';
      G.scene.add(m.mesh);
      G.mobs.push(m);
      this.roadMobs.push(m);
    }
    G.ui.toast('⚔️ Đạo tặc phục kích thương đoàn!', 'warn');
  }

  onThiefKilled(mob) {
    const G = this.G, p = G.player;
    const bounty = Math.round(mob.goldDrop * 1.4);
    const jexp = Math.round(mob.exp * 0.35);
    p.gold += bounty;
    p.job.exp += jexp;
    G.ui.toast(`🛡️ Thưởng thợ săn: ${bounty} vàng`, 'good');
    const i = this.roadMobs.indexOf(mob);
    if (i >= 0) this.roadMobs.splice(i, 1);
  }

  update(dt) {
    const G = this.G, p = G.player;
    if (!p.job.active) return;
    // lạc đà đi theo người chơi
    const c = this.camel;
    if (c) {
      const dx = p.x - c.x, dz = p.z - c.z;
      const d = Math.hypot(dx, dz);
      if (d > 4.5) {
        const spd = Math.min(p.moveSpd * 1.15, (d - 3.5) * 3.4);
        c.x += (dx / d) * spd * dt;
        c.z += (dz / d) * spd * dt;
        c.yaw = lerp(c.yaw, Math.atan2(dx, dz), Math.min(1, dt * 6));
        c.animT += dt * 7;
        c.moving = true;
      } else c.moving = false;
      c.y = G.world.terrainY(c.x, c.z);
      c.mesh.position.set(c.x, c.y, c.z);
      c.mesh.rotation.y = c.yaw;
      const rig = c.mesh.userData.rig;
      const s = Math.sin(c.animT) * (c.moving ? 0.6 : 0);
      rig.legs[0].rotation.x = s; rig.legs[3].rotation.x = s;
      rig.legs[1].rotation.x = -s; rig.legs[2].rotation.x = -s;
      // đạo tặc tấn công lạc đà
      for (const m of this.roadMobs) {
        if (m.dead) continue;
        if (Math.hypot(m.x - c.x, m.z - c.z) < 3.2 && Math.random() < dt * 0.6) {
          this.camelHp -= Math.round(m.atk * 0.7);
          G.combat.float(c.x, c.y + 3.4, c.z, '-' + Math.round(m.atk * 0.7), 'mine');
          if (this.camelHp <= 0) { this.loseCargo(); this.clearRoadMobs(); return; }
        }
      }
    }
    // phục kích định kỳ khi ở ngoài thành
    this.thiefTimer -= dt;
    if (this.thiefTimer <= 0) {
      this.thiefTimer = rand(28, 48);
      if (!G.world.inTown(p.x, p.z) && this.roadMobs.length < 6) this.spawnThieves();
    }
  }
}
