// ============================================================
//  ÂM THANH: tổng hợp bằng WebAudio (không cần file, chạy offline)
// ============================================================
export class Audio {
  constructor() {
    try { this.enabled = localStorage.getItem('cdtl.sound') !== '0'; } catch { this.enabled = true; }
    this.ctx = null;
  }
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  }
  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('cdtl.sound', this.enabled ? '1' : '0'); } catch {}
  }
  play(kind) {
    if (!this.enabled) return;
    this.init();
    const c = this.ctx;
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    const P = {
      hit:   { type: 'square',   f: 220, f2: 90,  d: 0.12, v: 0.10 },
      crit:  { type: 'sawtooth', f: 340, f2: 120, d: 0.18, v: 0.13 },
      skill: { type: 'triangle', f: 520, f2: 880, d: 0.22, v: 0.10 },
      coin:  { type: 'sine',     f: 880, f2: 1320,d: 0.14, v: 0.09 },
      level: { type: 'triangle', f: 440, f2: 1200,d: 0.55, v: 0.13 },
      hurt:  { type: 'square',   f: 180, f2: 70,  d: 0.20, v: 0.11 },
      death: { type: 'sawtooth', f: 260, f2: 50,  d: 0.9,  v: 0.14 },
      quest: { type: 'sine',     f: 660, f2: 990, d: 0.35, v: 0.10 },
    }[kind] || { type: 'sine', f: 440, f2: 440, d: 0.1, v: 0.08 };
    o.type = P.type;
    o.frequency.setValueAtTime(P.f, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, P.f2), t + P.d);
    g.gain.setValueAtTime(P.v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + P.d);
    o.start(t); o.stop(t + P.d + 0.02);
  }
}
