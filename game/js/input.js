// ============================================================
//  ĐIỀU KHIỂN: joystick ảo, xoay camera, chạm chọn mục tiêu
// ============================================================
import { clamp, TAU } from './util.js';

export class Input {
  constructor(G) {
    this.G = G;
    this.move = { x: 0, y: 0 };       // -1..1 (y dương = tiến)
    this.camYaw = Math.PI;            // hướng camera
    this.camPitch = 0.42;             // 0.1 .. 1.1
    this.dist = 15;                   // khoảng cách camera
    this.keys = new Set();
    this.pointers = new Map();
    this.stickId = null;
    this.dragId = null;
    this.pinch = null;
    this.onTap = null;

    this.stickBase = document.getElementById('joystick');
    this.stick = document.getElementById('stick');
    this.#bindStick();
    this.#bindCamera();
    this.#bindKeys();
  }

  #bindStick() {
    const base = this.stickBase;
    const R = 44;
    const set = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      const max = r.width / 2 - 8;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      this.stick.style.transform = `translate(${dx}px,${dy}px)`;
      const n = Math.min(1, d / max);
      const a = Math.atan2(dy, dx);
      this.move.x = Math.cos(a) * n;
      this.move.y = -Math.sin(a) * n;
    };
    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.stickId = e.pointerId;
      base.setPointerCapture(e.pointerId);
      set(e);
    });
    base.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickId) return;
      set(e);
    });
    const end = (e) => {
      if (e.pointerId !== this.stickId) return;
      this.stickId = null;
      this.move.x = this.move.y = 0;
      this.stick.style.transform = 'translate(0,0)';
    };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  #bindCamera() {
    const cv = document.getElementById('scene');
    cv.addEventListener('pointerdown', (e) => {
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: Date.now(), moved: 0 });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      p.moved += Math.abs(dx) + Math.abs(dy);
      if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.dist = clamp(this.dist * (this.pinch / Math.max(1, d)), 7, 34);
        this.pinch = d;
        return;
      }
      this.camYaw -= dx * 0.006;
      this.camPitch = clamp(this.camPitch + dy * 0.004, 0.06, 1.15);
    });
    const up = (e) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (!p) return;
      if (p.moved < 14 && Date.now() - p.t < 400) this.onTap?.(p.x0, p.y0);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      this.dist = clamp(this.dist + Math.sign(e.deltaY) * 1.6, 7, 34);
    }, { passive: true });
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }

  #bindKeys() {
    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') this.G.onSpace?.();
      if (/^Digit[1-6]$/.test(e.code)) this.G.onHotkey?.(+e.code.slice(5) - 1);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
  }

  /** Trả về vector di chuyển tổng hợp (joystick + phím) */
  axis() {
    let x = this.move.x, y = this.move.y;
    const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) y += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) y -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y, mag: Math.min(1, m) };
  }
}
