// ============================================================
//  NHIỆM VỤ
// ============================================================
import { QUESTS, MONSTERS } from './data.js';
import { addSimple, addGear, makeGear, countSimple, removeSimple } from './items.js';

export class Quests {
  constructor(G) { this.G = G; }

  def(id) { return QUESTS.find(q => q.id === id); }
  state(id) { return this.G.player.quests[id]?.state || 'none'; }
  prog(id) { return this.G.player.quests[id]?.prog || 0; }

  /** Nhiệm vụ đang làm (chỉ 1 chuỗi tuyến tính) */
  get active() {
    for (const q of QUESTS) if (this.state(q.id) === 'active') return q;
    return null;
  }
  /** Nhiệm vụ tiếp theo có thể nhận */
  get available() {
    for (const q of QUESTS) {
      if (this.state(q.id) !== 'none') continue;
      const prev = QUESTS[QUESTS.indexOf(q) - 1];
      if (prev && this.state(prev.id) !== 'done') return null;
      return q;
    }
    return null;
  }
  offeredBy(npcId) {
    const a = this.active;
    if (a && a.giver === npcId) return a;
    const av = this.available;
    if (av && av.giver === npcId) return av;
    return null;
  }

  accept(id) {
    const q = this.def(id);
    const p = this.G.player;
    if (!q || this.state(id) !== 'none') return false;
    if (p.level < q.lv) { this.G.ui.toast(`Cần cấp ${q.lv} mới nhận được`, 'warn'); return false; }
    p.quests[id] = { state: 'active', prog: 0 };
    this.G.ui.toast('📜 Nhận nhiệm vụ: ' + q.name, 'good');
    this.G.ui.updateQuestTrack();
    return true;
  }

  onKill(mobId) {
    const q = this.active;
    if (!q || q.req.type !== 'kill' || q.req.target !== mobId) return;
    const st = this.G.player.quests[q.id];
    if (st.prog >= q.req.count) return;
    st.prog++;
    this.G.ui.updateQuestTrack();
    if (st.prog >= q.req.count) this.G.ui.toast('✅ Đã đủ số lượng, quay về nộp nhiệm vụ', 'good');
  }

  onTrade() {
    const q = this.active;
    if (!q || q.req.type !== 'trade') return;
    const st = this.G.player.quests[q.id];
    st.prog = Math.min(q.req.count, st.prog + 1);
    this.G.ui.updateQuestTrack();
  }

  canComplete(q) {
    const st = this.G.player.quests[q.id];
    if (!st || st.state !== 'active') return false;
    if (st.prog < q.req.count) return false;
    if (q.req.need) {
      const [id, n] = q.req.need;
      if (countSimple(this.G.player, id) < n) return false;
    }
    return true;
  }

  complete(q) {
    const G = this.G, p = G.player;
    if (!this.canComplete(q)) return false;
    if (q.req.need) removeSimple(p, q.req.need[0], q.req.need[1]);
    p.quests[q.id].state = 'done';
    const r = q.reward;
    p.gold += r.gold || 0;
    const ups = p.addExp(r.exp || 0);
    for (const [id, n] of r.items || []) addSimple(p, id, n);
    if (r.gear) {
      const g = makeGear(r.gear.slot, r.gear.deg, r.gear.rarity,
        r.gear.slot === 'weapon' ? p.weaponType : 'sword');
      addGear(p, g);
      G.ui.toast('🎁 Nhận trang bị: ' + g.name, 'good');
    }
    if (r.unlockJob) { p.job.unlocked = true; G.ui.toast('🐫 Mở khoá nghề Thương Nhân!', 'good'); }
    G.ui.toast(`✅ Hoàn thành: ${q.name} (+${r.exp} EXP, +${r.gold} vàng)`, 'good');
    if (ups) G.onLevelUp(ups);
    G.ui.updateVitals();
    G.ui.updateQuestTrack();
    return true;
  }

  /** Mô tả tiến độ cho HUD */
  trackText() {
    const q = this.active;
    if (!q) {
      const av = this.available;
      return av ? `<b>Nhiệm vụ mới</b>Gặp ${this.giverName(av.giver)} để nhận: ${av.name}` : '';
    }
    const st = this.G.player.quests[q.id];
    let line;
    if (q.req.type === 'kill') {
      const m = MONSTERS[q.req.target];
      line = `Diệt ${m.name}: <span>${st.prog}/${q.req.count}</span>`;
      if (q.req.need) {
        const [id, n] = q.req.need;
        line += `<br>Nộp vật phẩm: <span>${countSimple(this.G.player, id)}/${n}</span>`;
      }
    } else if (q.req.type === 'trade') {
      line = `Giao hàng tới Đôn Hoàng: <span>${st.prog}/${q.req.count}</span>`;
    }
    if (st.prog >= q.req.count) line += `<br>→ Về gặp ${this.giverName(q.giver)}`;
    return `<b>${q.name}</b>${line}`;
  }
  giverName(id) {
    return (this.G.npcs.find(n => n.def.id === id)?.name) || id;
  }
}
