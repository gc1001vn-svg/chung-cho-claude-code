// ============================================================
//  CHIẾN ĐẤU: sát thương, kỹ năng, đạn phép, AI quái
// ============================================================
import * as THREE from 'three';
import { clamp, rand, randInt, chance, now, elem } from './util.js';
import { MONSTERS, ZONES } from './data.js';
import { randomPointInZone } from './entities.js';

const V = new THREE.Vector3();

export class Combat {
  constructor(G) {
    this.G = G;
    this.projectiles = [];
    this.effects = [];
    this.dmgLayer = document.getElementById('dmg-layer');
    this.projGeo = new THREE.SphereGeometry(0.32, 8, 6);
    this.arrowGeo = new THREE.ConeGeometry(0.12, 1.1, 5);
  }

  // ---------- công thức ----------
  calcDamage(atk, def, atkLv, { crit = 0, critBonus = 0, mult = 1 } = {}) {
    const red = def / (def + 90 + atkLv * 14);
    let dmg = atk * (1 - red) * rand(0.9, 1.12) * mult;
    const isCrit = Math.random() < (crit + critBonus);
    if (isCrit) dmg *= 1.95;
    return { dmg: Math.max(1, Math.round(dmg)), crit: isCrit };
  }

  float(x, y, z, text, cls = '') {
    const G = this.G;
    V.set(x, y, z).project(G.camera);
    if (V.z > 1) return;
    const el = elem('div', 'dmg ' + cls, text);
    el.style.left = (V.x * 0.5 + 0.5) * 100 + '%';
    el.style.top = (-V.y * 0.5 + 0.5) * 100 + '%';
    this.dmgLayer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  // ---------- người chơi đánh ----------
  inRange(mob, extra = 0) {
    const p = this.G.player;
    return Math.hypot(mob.x - p.x, mob.z - p.z) <= p.range + extra + (mob.def.scale || 1) * 0.7;
  }

  autoAttack(dt) {
    const G = this.G, p = G.player;
    p.attackCd -= dt;
    const t = p.target;
    if (!t || t.dead || p.dead) return;
    if (!this.inRange(t)) return;
    if (p.attackCd > 0) return;
    p.attackCd = p.atkInterval;
    p.swing();
    p.yaw = Math.atan2(t.x - p.x, t.z - p.z);
    const phys = p.phyAtk >= p.magAtk;
    const atk = phys ? p.phyAtk : p.magAtk;
    if (p.range > 6) {
      this.shoot(p, t, () => this.hitMob(t, atk, { crit: p.crit, phys }));
    } else {
      setTimeout(() => { if (!t.dead) this.hitMob(t, atk, { crit: p.crit, phys }); }, 130);
    }
  }

  hitMob(mob, atk, opts = {}) {
    if (mob.dead) return;
    const p = this.G.player;
    let bonus = 0;
    if (p.imbue && p.imbue.until > now()) bonus = atk * p.imbue.amount;
    const def = opts.phys === false ? Math.round(mob.defense * 0.8) : mob.defense;
    const r = this.calcDamage(atk + bonus, def, p.level, opts);
    this.applyMobDamage(mob, r.dmg, r.crit);
    if (p.imbue && p.imbue.slow) this.slow(mob, p.imbue.slow, 3);
    if (opts.drain) {
      const heal = Math.round(r.dmg * opts.drain);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      this.float(p.x, p.y + 3.2, p.z, '+' + heal, 'heal');
    }
  }

  applyMobDamage(mob, dmg, crit) {
    if (mob.dead) return;
    mob.hp -= dmg;
    mob.aggro = this.G.player;
    mob.state = 'chase';
    this.float(mob.x, mob.y + 3 * (mob.def.scale || 1), mob.z, String(dmg), crit ? 'crit' : '');
    this.flash(mob);
    if (mob.hp <= 0) this.killMob(mob);
    else if (this.G.player.target === mob) this.G.ui.updateTarget();
  }

  flash(mob) {
    const rig = mob.mesh;
    rig.traverse(o => {
      if (o.isMesh && o.material && !o.userData.f) {
        o.userData.f = true;
        const old = o.material;
        o.material = old.clone();
        o.material.emissive = new THREE.Color(0x992222);
        setTimeout(() => { o.material.dispose?.(); o.material = old; o.userData.f = false; }, 110);
      }
    });
  }

  killMob(mob) {
    const G = this.G, p = G.player;
    mob.dead = true;
    mob.hp = 0;
    mob.state = 'dead';
    mob.mesh.visible = false;
    mob.respawn = now() + (mob.isBoss ? 90 : mob.road ? 1e9 : 14 + Math.random() * 8);
    if (p.target === mob) { p.target = null; G.ui.updateTarget(); }
    G.onKill(mob);
  }

  // ---------- kỹ năng ----------
  useSkill(id) {
    const G = this.G, p = G.player;
    if (p.dead) return;
    const s = p.skillById(id);
    if (!s) return;
    if ((s.rank || 0) < 1) return G.ui.toast('Kỹ năng chưa được học', 'warn');
    if (p.level < s.reqLv) return G.ui.toast(`Cần cấp ${s.reqLv}`, 'warn');
    const cd = p.cds[id] || 0;
    if (cd > now()) return;
    const mp = Math.round(s.mp * (1 + (s.rank - 1) * 0.08));
    if (p.mp < mp) return G.ui.toast('Không đủ nội lực', 'warn');

    const needTarget = ['strike', 'bolt', 'debuff'].includes(s.kind);
    const t = p.target;
    if (needTarget) {
      if (!t || t.dead) return G.ui.toast('Chưa chọn mục tiêu', 'warn');
      const far = Math.hypot(t.x - p.x, t.z - p.z) > (s.kind === 'strike' ? p.range + 1 : Math.max(p.range, 16));
      if (far) return G.ui.toast('Mục tiêu quá xa', 'warn');
    }
    p.mp -= mp;
    p.cds[id] = now() + s.cd;
    const power = s.power * (1 + (s.rank - 1) * 0.14);
    const scaleAtk = s.scale === 'mag' ? p.magAtk : p.phyAtk;
    const atk = scaleAtk * power;
    p.swing();
    if (t) p.yaw = Math.atan2(t.x - p.x, t.z - p.z);

    switch (s.kind) {
      case 'strike':
        this.hitMob(t, atk, { crit: p.crit + (s.critBonus || 0), phys: s.scale !== 'mag' });
        this.burst(t.x, t.y + 1.5, t.z, s.scale === 'mag' ? 0x9fd8ff : 0xffd07a);
        break;
      case 'bolt': {
        const hits = s.hits || 1;
        for (let i = 0; i < hits; i++)
          setTimeout(() => {
            if (t.dead) return;
            this.shoot(p, t, () => {
              this.hitMob(t, atk / (hits > 1 ? 1.0 : 1), { crit: p.crit, phys: s.scale !== 'mag', drain: s.drain });
              if (s.slow) this.slow(t, s.slow, s.slowDur || 3);
              if (s.splash) this.aoeAt(t.x, t.z, s.splash, atk * 0.6, s);
            }, s.scale === 'mag' ? 0x8fd0ff : 0xe8d9a0);
          }, i * 140);
        break;
      }
      case 'aoe':
        this.ring(p.x, p.y, p.z, s.radius);
        this.aoeAt(p.x, p.z, s.radius, atk, s);
        break;
      case 'heal': {
        const amount = Math.round(p.maxHp * s.power * 0.35 * (1 + (s.rank - 1) * 0.14) + p.magAtk * 0.5);
        p.hp = Math.min(p.maxHp, p.hp + amount);
        this.float(p.x, p.y + 3.4, p.z, '+' + amount, 'heal');
        this.burst(p.x, p.y + 1.6, p.z, 0x7ee59b);
        break;
      }
      case 'buff': {
        p.buffs = p.buffs.filter(b => b.id !== s.id);
        p.buffs.push({ id: s.id, name: s.name, em: s.em, stat: s.stat, amount: s.amount * (1 + (s.rank - 1) * 0.1), until: now() + s.dur });
        p.recalc();
        this.burst(p.x, p.y + 1.6, p.z, 0xffe08a);
        G.ui.updateBuffs?.();
        break;
      }
      case 'imbue':
        p.imbue = { id: s.id, name: s.name, em: s.em, amount: s.amount, slow: s.slow || 0, until: now() + s.dur };
        this.burst(p.x, p.y + 1.6, p.z, 0xff9a4a);
        break;
      case 'debuff':
        this.hitMob(t, atk, { phys: false });
        if (s.dot) t.dots.push({ dmg: (s.scale === 'mag' ? p.magAtk : p.phyAtk) * s.dot * 0.2, until: now() + s.dotDur, next: now() + 1 });
        if (s.freeze) { t.freezeUntil = now() + s.freeze; }
        if (s.weaken) { t.weakUntil = now() + s.weakenDur; t.weakAmt = s.weaken; }
        this.burst(t.x, t.y + 1.5, t.z, 0xb07ad8);
        break;
    }
    G.ui.updateVitals();
  }

  aoeAt(x, z, radius, atk, s) {
    const p = this.G.player;
    for (const m of this.G.mobs) {
      if (m.dead) continue;
      if (Math.hypot(m.x - x, m.z - z) > radius) continue;
      this.hitMob(m, atk, { crit: p.crit, phys: s.scale !== 'mag' });
      if (s.taunt) { m.aggro = p; m.state = 'chase'; }
      if (s.slow) this.slow(m, s.slow, s.slowDur || 3);
    }
  }
  slow(mob, amt, dur) { mob.slowUntil = now() + dur; mob.slowAmt = amt; }

  // ---------- hiệu ứng ----------
  shoot(from, to, onHit, color = 0xffe08a) {
    const isArrow = color === 0xe8d9a0 || color === 0xffe08a;
    const mesh = new THREE.Mesh(isArrow ? this.arrowGeo : this.projGeo,
      new THREE.MeshBasicMaterial({ color }));
    mesh.position.set(from.x, from.y + 1.8, from.z);
    this.G.scene.add(mesh);
    this.projectiles.push({ mesh, to, onHit, spd: 42, life: 2.2 });
  }
  burst(x, y, z, color) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    m.position.set(x, y, z);
    this.G.scene.add(m);
    this.effects.push({ mesh: m, t: 0, dur: 0.35, grow: 4 });
  }
  ring(x, y, z, r) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.2, r * 0.28, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y + 0.2, z);
    this.G.scene.add(m);
    this.effects.push({ mesh: m, t: 0, dur: 0.4, grow: 4.2 });
  }

  updateEffects(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      const tx = p.to.x, ty = p.to.y + 1.4, tz = p.to.z;
      const d = new THREE.Vector3(tx - p.mesh.position.x, ty - p.mesh.position.y, tz - p.mesh.position.z);
      const len = d.length();
      if (len < 1.2 || p.life <= 0) {
        if (len < 1.6) p.onHit?.();
        this.G.scene.remove(p.mesh);
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
        continue;
      }
      d.normalize();
      p.mesh.position.addScaledVector(d, Math.min(p.spd * dt, len));
      p.mesh.lookAt(tx, ty, tz);
      p.mesh.rotateX(Math.PI / 2);
    }
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      e.t += dt;
      const k = e.t / e.dur;
      e.mesh.scale.setScalar(1 + k * e.grow);
      e.mesh.material.opacity = Math.max(0, 0.85 * (1 - k));
      if (k >= 1) {
        this.G.scene.remove(e.mesh);
        e.mesh.material.dispose();
        this.effects.splice(i, 1);
      }
    }
  }

  // ---------- AI quái ----------
  updateMobs(dt) {
    const G = this.G, p = G.player, T = now();
    const safe = !!G.world.inTown(p.x, p.z);
    for (const m of G.mobs) {
      if (m.dead) {
        if (m.respawn && T > m.respawn) {
          if (m.road) { G.removeRoadMob?.(m); continue; }
          const zn = ZONES.find(z => z.id === m.zone);
          const pt = zn ? randomPointInZone(zn, G.world) : { x: m.homeX, z: m.homeZ };
          m.reset(m.isBoss ? zn.x : pt.x, m.isBoss ? zn.z : pt.z);
          m.y = G.world.terrainY(m.x, m.z);
          m.sync();
        }
        continue;
      }
      const dx = p.x - m.x, dz = p.z - m.z;
      const dist = Math.hypot(dx, dz);
      m.mesh.visible = dist < 78;
      if (dist > 105) continue;

      // hiệu ứng theo thời gian
      for (let i = m.dots.length - 1; i >= 0; i--) {
        const d = m.dots[i];
        if (T > d.until) { m.dots.splice(i, 1); continue; }
        if (T > d.next) {
          d.next = T + 1;
          this.applyMobDamage(m, Math.max(1, Math.round(d.dmg)), false);
          if (m.dead) break;
        }
      }
      if (m.dead) continue;
      const frozen = T < m.freezeUntil;
      let spd = m.spd * (T < m.slowUntil ? 1 - m.slowAmt : 1);
      if (frozen) spd = 0;

      // gây hấn
      const aggroR = m.isBoss ? 26 : m.elite ? 20 : 13;
      if (!m.aggro && !safe && !p.dead && dist < aggroR) m.aggro = p;
      if (m.aggro && (p.dead || safe || Math.hypot(m.x - m.homeX, m.z - m.homeZ) > 85)) {
        m.aggro = null; m.state = 'return';
      }

      if (m.aggro) {
        m.state = 'chase';
        const reach = m.range + 0.6;
        if (dist > reach) {
          if (!frozen) this.step(m, dx / dist, dz / dist, spd, dt);
          m.moving = spd > 0;
        } else {
          m.moving = false;
          m.yaw = Math.atan2(dx, dz);
          m.atkCd -= dt;
          if (m.atkCd <= 0 && !frozen) {
            m.atkCd = m.isBoss ? 1.9 : 2.3;
            m.swing();
            if (m.def.ranged) {
              this.shoot(m, p, () => this.hitPlayer(m), 0xd0b070);
            } else {
              setTimeout(() => { if (!m.dead) this.hitPlayer(m); }, 150);
            }
          }
        }
      } else if (m.state === 'return') {
        const hx = m.homeX - m.x, hz = m.homeZ - m.z;
        const hd = Math.hypot(hx, hz);
        if (hd < 1.5) { m.state = 'idle'; m.moving = false; m.hp = m.maxHp; }
        else { this.step(m, hx / hd, hz / hd, m.spd * 1.4, dt); m.moving = true; }
      } else {
        // đi lang thang
        m.wanderT -= dt;
        if (m.wanderT <= 0) {
          m.wanderT = rand(2.5, 6);
          m.wanderDir = Math.random() < 0.45 ? null : rand(0, Math.PI * 2);
        }
        if (m.wanderDir != null && dist < 90) {
          const near = Math.hypot(m.x - m.homeX, m.z - m.homeZ);
          const dir = near > 16 ? Math.atan2(m.homeX - m.x, m.homeZ - m.z) : m.wanderDir;
          this.step(m, Math.sin(dir), Math.cos(dir), m.spd * 0.42, dt);
          m.moving = true;
        } else m.moving = false;
      }
      m.y = G.world.terrainY(m.x, m.z);
      m.sync();
      m.animate(dt, m.moving ? 1 : 0.2);
    }
  }

  step(m, nx, nz, spd, dt) {
    const G = this.G;
    const nxp = m.x + nx * spd * dt, nzp = m.z + nz * spd * dt;
    const r = G.world.resolve(nxp, nzp, 0.8);
    m.x = r.x; m.z = r.z;
    m.yaw = Math.atan2(nx, nz);
  }

  hitPlayer(mob) {
    const G = this.G, p = G.player;
    if (p.dead || mob.dead) return;
    if (Math.hypot(p.x - mob.x, p.z - mob.z) > mob.range + 3) return;
    if (G.world.inTown(p.x, p.z)) return;
    const weak = now() < mob.weakUntil ? 1 - mob.weakAmt : 1;
    const r = this.calcDamage(mob.atk * weak, p.phyDef, mob.lv, { crit: 0.05 });
    p.hp -= r.dmg;
    this.float(p.x, p.y + 3.4, p.z, '-' + r.dmg, 'mine' + (r.crit ? ' crit' : ''));
    G.ui.updateVitals();
    G.hurtFlash?.();
    if (p.hp <= 0) G.onPlayerDeath();
  }
}
