// ============================================================
//  NHÂN VẬT: người chơi, quái vật, NPC, lạc đà thồ
// ============================================================
import * as THREE from 'three';
import { clamp, lerp, rand, randInt, TAU } from './util.js';
import { WEAPONS, TREES, MONSTERS, NPCS, ZONES, expToLevel, MAX_LEVEL } from './data.js';

const mat = (c) => new THREE.MeshLambertMaterial({ color: c });
const cache = {};
const M = (c) => (cache[c] ||= mat(c));

function boxPart(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color));
  m.position.set(x, y, z);
  return m;
}

/** Người: thân, đầu, 2 tay, 2 chân + chỗ cầm vũ khí */
export function makeHumanoid({ cloth = 0x9a3b2f, skin = 0xe0b48a, hair = 0x241a12, scale = 1 } = {}) {
  const g = new THREE.Group();
  const torso = boxPart(1.05, 1.35, 0.6, cloth, 0, 1.62, 0);
  const hip = boxPart(0.95, 0.35, 0.58, 0x33261a, 0, 0.92, 0);
  const head = boxPart(0.66, 0.66, 0.62, skin, 0, 2.62, 0);
  const hairM = boxPart(0.72, 0.22, 0.68, hair, 0, 2.92, 0);
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.68, 2.2, 0); armR.position.set(0.68, 2.2, 0);
  armL.add(boxPart(0.3, 1.15, 0.3, skin, 0, -0.55, 0));
  armR.add(boxPart(0.3, 1.15, 0.3, skin, 0, -0.55, 0));
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.27, 0.92, 0); legR.position.set(0.27, 0.92, 0);
  legL.add(boxPart(0.36, 1.0, 0.38, 0x2c2418, 0, -0.5, 0));
  legR.add(boxPart(0.36, 1.0, 0.38, 0x2c2418, 0, -0.5, 0));
  const hand = new THREE.Group();
  hand.position.set(0, -1.05, 0);
  armR.add(hand);
  g.add(torso, hip, head, hairM, armL, armR, legL, legR);
  g.scale.setScalar(scale);
  g.userData.rig = { torso, head, armL, armR, legL, legR, hand };
  return g;
}

/** Thú 4 chân */
export function makeBeast({ color = 0x6d6f75, scale = 1 } = {}) {
  const g = new THREE.Group();
  const body = boxPart(1.05, 0.9, 2.0, color, 0, 1.15, 0);
  const head = boxPart(0.72, 0.68, 0.85, color, 0, 1.45, 1.35);
  const snout = boxPart(0.36, 0.32, 0.45, 0x2b2b2b, 0, 1.32, 1.85);
  const ear1 = boxPart(0.2, 0.3, 0.12, color, -0.24, 1.86, 1.3);
  const ear2 = boxPart(0.2, 0.3, 0.12, color, 0.24, 1.86, 1.3);
  const tail = boxPart(0.2, 0.2, 0.9, color, 0, 1.3, -1.2);
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const l = new THREE.Group();
    l.position.set(sx * 0.4, 0.75, sz * 0.72);
    l.add(boxPart(0.26, 0.75, 0.26, color, 0, -0.37, 0));
    legs.push(l); g.add(l);
  }
  g.add(body, head, snout, ear1, ear2, tail);
  g.scale.setScalar(scale);
  g.userData.rig = { body, head, legs, tail };
  return g;
}

export function makeWeaponModel(type) {
  const g = new THREE.Group();
  const steel = M(0xcfd6dd), wood = M(0x6b4a2c), gold = M(0xd8b13f);
  const add = (geo, m, x, y, z, rx = 0) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); e.rotation.x = rx; g.add(e); };
  switch (type) {
    case 'sword':
      add(new THREE.BoxGeometry(0.12, 1.9, 0.3), steel, 0, 0.95, 0);
      add(new THREE.BoxGeometry(0.1, 0.4, 0.12), wood, 0, -0.2, 0);
      add(new THREE.BoxGeometry(0.5, 0.1, 0.16), gold, 0, 0.05, 0); break;
    case 'spear':
      add(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 5), wood, 0, 1.0, 0);
      add(new THREE.ConeGeometry(0.16, 0.7, 4), steel, 0, 2.9, 0); break;
    case 'bow':
      add(new THREE.TorusGeometry(0.8, 0.06, 5, 12, Math.PI * 1.3), wood, 0, 0.6, 0);
      add(new THREE.BoxGeometry(0.02, 1.5, 0.02), M(0xe8e2d0), 0.55, 0.6, 0); break;
    case 'dagger':
      add(new THREE.BoxGeometry(0.1, 0.9, 0.22), steel, 0, 0.5, 0);
      add(new THREE.BoxGeometry(0.09, 0.3, 0.1), wood, 0, -0.05, 0); break;
    case 'staff':
      add(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 5), wood, 0, 0.9, 0);
      add(new THREE.OctahedronGeometry(0.32), M(0x7fd6ff), 0, 2.5, 0); break;
    case 'mace':
      add(new THREE.CylinderGeometry(0.07, 0.07, 1.6, 5), wood, 0, 0.6, 0);
      add(new THREE.DodecahedronGeometry(0.34), steel, 0, 1.5, 0); break;
    case 'harp':
      add(new THREE.TorusGeometry(0.55, 0.08, 5, 10, Math.PI), gold, 0, 0.7, 0);
      add(new THREE.BoxGeometry(0.08, 1.1, 0.08), wood, -0.5, 0.55, 0); break;
  }
  g.rotation.z = Math.PI; // cầm chúc xuống, sẽ xoay khi vung
  g.rotation.x = -0.3;
  return g;
}

// ------------------------------------------------------------
class Actor {
  constructor(mesh) {
    this.mesh = mesh;
    this.x = 0; this.z = 0; this.y = 0; this.yaw = 0;
    this.animT = 0; this.moving = false; this.atkAnim = 0;
    this.dead = false;
  }
  setPos(x, z, y) { this.x = x; this.z = z; if (y != null) this.y = y; this.sync(); }
  sync() { this.mesh.position.set(this.x, this.y, this.z); this.mesh.rotation.y = this.yaw; }
  animate(dt, speed = 1) {
    const rig = this.mesh.userData.rig;
    if (!rig) return;
    if (this.moving) this.animT += dt * 8 * speed; else this.animT = lerp(this.animT, 0, dt * 8);
    const s = Math.sin(this.animT) * (this.moving ? 0.85 : 0.15);
    if (rig.legs) { // thú
      rig.legs[0].rotation.x = s; rig.legs[3].rotation.x = s;
      rig.legs[1].rotation.x = -s; rig.legs[2].rotation.x = -s;
      rig.body.position.y = 1.15 + Math.abs(s) * 0.06;
      rig.tail.rotation.y = Math.sin(this.animT * 0.7) * 0.4;
    } else {
      rig.legL.rotation.x = s; rig.legR.rotation.x = -s;
      rig.armL.rotation.x = -s * 0.75;
      rig.torso.position.y = 1.62 + Math.abs(s) * 0.045;
      if (this.atkAnim > 0) {
        this.atkAnim = Math.max(0, this.atkAnim - dt * 3.4);
        const k = Math.sin((1 - this.atkAnim) * Math.PI);
        rig.armR.rotation.x = -2.3 * k;
        rig.torso.rotation.y = -0.35 * k;
      } else {
        rig.armR.rotation.x = lerp(rig.armR.rotation.x, s * 0.75, dt * 10);
        rig.torso.rotation.y = lerp(rig.torso.rotation.y, 0, dt * 10);
      }
    }
  }
  swing() { this.atkAnim = 1; }
}

// ------------------------------------------------------------
export class Player extends Actor {
  constructor(save) {
    const cls = TREES[save.main];
    super(makeHumanoid({
      cloth: save.race === 'china' ? 0x9a3b2f : 0x37507a,
      scale: 1,
    }));
    Object.assign(this, {
      name: save.name, race: save.race, main: save.main, sub: save.sub,
      level: save.level ?? 1, exp: save.exp ?? 0,
      str: save.str ?? 20, int: save.int ?? 20,
      statPoints: save.statPoints ?? 0, skillPoints: save.skillPoints ?? 3,
      gold: save.gold ?? 500,
      inventory: save.inventory ?? [], equip: save.equip ?? {},
      ranks: save.ranks ?? {}, buffs: [], imbue: null,
      quests: save.quests ?? {}, kills: save.kills ?? {},
      job: save.job ?? { lv: 1, exp: 0, cargo: [], active: false, reputation: 0, runs: 0 },
      playtime: save.playtime ?? 0,
    });
    this.weaponType = cls?.weapon || TREES[save.sub]?.weapon || 'sword';
    this.hand = this.mesh.userData.rig.hand;
    this.refreshWeaponModel();
    this.recalc();
    this.hp = save.hp ?? this.maxHp;
    this.mp = save.mp ?? this.maxMp;
    this.attackCd = 0;
    this.cds = {};
    this.target = null;
    this.autoMove = null;
  }

  refreshWeaponModel() {
    if (this.wpnMesh) this.hand.remove(this.wpnMesh);
    this.wpnMesh = makeWeaponModel(this.weaponType);
    this.hand.add(this.wpnMesh);
  }

  get skills() {
    const out = [];
    for (const t of [this.main, this.sub]) {
      const tree = TREES[t];
      if (!tree) continue;
      for (const s of tree.skills) out.push({ ...s, tree: t, rank: this.ranks[s.id] || 0 });
    }
    return out;
  }
  skillById(id) { return this.skills.find(s => s.id === id); }

  buffMul(stat) {
    let m = 1;
    for (const b of this.buffs) if (b.stat === stat) m += b.amount;
    return m;
  }

  recalc() {
    const eq = this.equip;
    const w = eq.weapon;
    const wp = WEAPONS[this.weaponType];
    const wAtk = w ? w.atk : 8;
    let def = 0, hpB = 0, mpB = 0, critB = 0;
    for (const k of ['helm', 'armor', 'boots', 'acc']) {
      const it = eq[k];
      if (!it) continue;
      def += it.def || 0; hpB += it.hp || 0; mpB += it.mp || 0; critB += it.crit || 0;
    }
    this.maxHp = Math.round((240 + this.str * 27 + this.level * 36 + hpB) * this.buffMul('hp'));
    this.maxMp = Math.round(150 + this.int * 23 + this.level * 20 + mpB);
    this.phyAtk = Math.round((wAtk + this.str * 2.3 + this.level * 2.2) * wp.phy * this.buffMul('atk'));
    this.magAtk = Math.round((wAtk * 0.8 + this.int * 2.6 + this.level * 2.2) * wp.mag * this.buffMul('atk'));
    this.phyDef = Math.round((def + this.str * 0.95 + this.level * 1.5) * this.buffMul('def'));
    this.magDef = Math.round((def * 0.8 + this.int * 0.95 + this.level * 1.5) * this.buffMul('def'));
    this.crit = 0.05 + this.level * 0.0012 + critB / 100;
    this.range = wp.range;
    this.atkInterval = wp.spd;
    this.moveSpd = 8.4 * this.buffMul('spd') * (this.job.active ? 0.82 : 1);
    this.expNeed = expToLevel(this.level);
    this.hp = Math.min(this.hp ?? this.maxHp, this.maxHp);
    this.mp = Math.min(this.mp ?? this.maxMp, this.maxMp);
  }

  addExp(n) {
    if (this.level >= MAX_LEVEL) return 0;
    this.exp += n;
    let ups = 0;
    while (this.exp >= this.expNeed && this.level < MAX_LEVEL) {
      this.exp -= this.expNeed;
      this.level++;
      this.str += 1; this.int += 1;         // giống Silkroad: mỗi cấp +1 STR +1 INT
      this.statPoints += 3;                  // và 3 điểm tự phân bổ
      this.skillPoints += 3;
      this.recalc();
      this.hp = this.maxHp; this.mp = this.maxMp;
      ups++;
    }
    return ups;
  }
}

// ------------------------------------------------------------
export class Mob extends Actor {
  constructor(defId, opts = {}) {
    const d = MONSTERS[defId];
    const scale = (d.scale || 1);
    super(d.body === 'beast'
      ? makeBeast({ color: d.color, scale })
      : makeHumanoid({ cloth: d.color, skin: 0xcaa079, scale }));
    this.def = d; this.id = defId;
    this.lv = d.lv;
    this.maxHp = Math.round(d.hp * (d.hpMul || 1));
    this.hp = this.maxHp;
    this.atk = Math.round(d.atk * (d.atkMul || 1));
    this.defense = d.def;
    this.spd = d.spd;
    this.range = d.range;
    this.exp = d.exp; this.goldDrop = d.gold;
    this.elite = !!d.elite;
    this.state = 'idle';
    this.homeX = opts.x || 0; this.homeZ = opts.z || 0;
    this.wanderT = rand(0, 3);
    this.atkCd = 0;
    this.aggro = null;
    this.respawn = 0;
    this.slowUntil = 0; this.slowAmt = 0; this.freezeUntil = 0;
    this.dots = [];
    this.weakUntil = 0; this.weakAmt = 0;
    this.road = !!d.road;
    if (d.body !== 'beast') {
      const w = makeWeaponModel(d.ranged ? 'bow' : (d.id === 'chief' ? 'mace' : 'sword'));
      this.mesh.userData.rig.hand.add(w);
    }
  }
  reset(x, z) {
    this.hp = this.maxHp; this.dead = false; this.state = 'idle';
    this.homeX = x; this.homeZ = z;
    this.aggro = null; this.dots = [];
    this.slowUntil = 0; this.freezeUntil = 0; this.weakUntil = 0;
    this.mesh.visible = true;
    this.setPos(x, z);
  }
}

// ------------------------------------------------------------
export class Npc extends Actor {
  constructor(def) {
    super(makeHumanoid({ cloth: def.color, scale: 1.02 }));
    this.def = def;
    this.name = def.name;
  }
}

/** Lạc đà thồ hàng cho hệ thống thương đoàn */
export function makeCamel() {
  const g = new THREE.Group();
  const c = 0xd2b183;
  const body = boxPart(1.2, 1.2, 2.6, c, 0, 1.7, 0);
  const neck = boxPart(0.5, 1.3, 0.5, c, 0, 2.6, 1.15);
  const head = boxPart(0.55, 0.5, 0.9, c, 0, 3.2, 1.5);
  const hump1 = boxPart(0.9, 0.6, 0.8, c, 0, 2.5, 0.35);
  const hump2 = boxPart(0.9, 0.55, 0.7, c, 0, 2.45, -0.6);
  const cargo = boxPart(1.5, 0.9, 1.5, 0x8b3a2c, 0, 2.6, -0.15);
  const legs = [];
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const l = new THREE.Group();
    l.position.set(sx * 0.45, 1.15, sz * 0.9);
    l.add(boxPart(0.24, 1.15, 0.24, c, 0, -0.57, 0));
    legs.push(l); g.add(l);
  }
  g.add(body, neck, head, hump1, hump2, cargo);
  g.userData.rig = { body, head, legs, tail: neck };
  g.userData.cargo = cargo;
  return g;
}

// ------------------------------------------------------------
export function spawnNpcs(scene, world) {
  return NPCS.map(def => {
    const n = new Npc(def);
    n.setPos(def.x, def.z, world.terrainY(def.x, def.z));
    n.yaw = Math.atan2(-def.x, -def.z);
    n.sync();
    scene.add(n.mesh);
    return n;
  });
}

/** Tạo toàn bộ quái theo vùng */
export function spawnMobs(scene, world) {
  const mobs = [];
  for (const zn of ZONES) {
    if (!zn.spawn) continue;
    for (const [id, count] of zn.spawn) {
      for (let i = 0; i < count; i++) {
        const m = new Mob(id);
        const p = randomPointInZone(zn, world);
        m.reset(p.x, p.z);
        m.y = world.terrainY(p.x, p.z);
        m.sync();
        m.zone = zn.id;
        scene.add(m.mesh);
        mobs.push(m);
      }
    }
    if (zn.boss) {
      const b = new Mob(zn.boss);
      b.reset(zn.x, zn.z + (zn.id === 'ruins' ? -6 : 0));
      b.y = world.terrainY(b.x, b.z);
      b.sync();
      b.zone = zn.id; b.isBoss = true;
      scene.add(b.mesh);
      mobs.push(b);
    }
  }
  return mobs;
}

export function randomPointInZone(zn, world) {
  for (let i = 0; i < 30; i++) {
    const a = rand(0, TAU), r = Math.sqrt(Math.random()) * zn.r * 0.92;
    const x = zn.x + Math.cos(a) * r, z = zn.z + Math.sin(a) * r;
    if (world.inTown(x, z)) continue;
    if (zn.id === 'field' && Math.hypot(x, z) < 62) continue;   // đừng spawn sát cổng thành
    return { x, z };
  }
  return { x: zn.x + rand(-10, 10), z: zn.z + rand(-10, 10) };
}
