// ============================================================
//  THẾ GIỚI: địa hình, thương đạo, thành Trường An & Đôn Hoàng
// ============================================================
import * as THREE from 'three';
import { fbm, clamp, lerp, mulberry32, TAU } from './util.js';
import { ZONES, TOWNS } from './data.js';

export const WORLD_SIZE = 1000;

// Thương đạo: Trường An -> sa mạc -> Đôn Hoàng, và các nhánh phụ
export const ROAD = [
  [0, 30], [30, -30], [90, -55], [150, -70], [215, -55], [275, -15], [330, 25],
];
export const ROAD_BRANCHES = [
  [[-20, 20], [-70, 55], [-125, 90], [-172, 118]],   // rừng trúc
  [[100, -60], [85, -120], [70, -175], [60, -210]],  // trại thổ phỉ
  [[280, -30], [310, -110], [330, -180], [332, -210]], // phế tích
];

function distToSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const l2 = dx * dx + dz * dz;
  let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0;
  t = clamp(t, 0, 1);
  const cx = ax + dx * t, cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}
function distToPath(x, z, path) {
  let d = 1e9;
  for (let i = 0; i < path.length - 1; i++)
    d = Math.min(d, distToSeg(x, z, path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]));
  return d;
}
export function roadDistance(x, z) {
  let d = distToPath(x, z, ROAD);
  for (const b of ROAD_BRANCHES) d = Math.min(d, distToPath(x, z, b));
  return d;
}

/** Mức "sa mạc hoá" 0..1 theo vị trí (phía đông là sa mạc) */
export function desertness(x, z) {
  return clamp((x - 60) / 160, 0, 1) * clamp(1 - (z - 60) / 260, 0, 1);
}

/** Độ cao địa hình tại (x,z) */
export function terrainHeight(x, z) {
  const d = desertness(x, z);
  let h = (fbm(x * 0.0055, z * 0.0055, 3) - 0.5) * 26;          // đồi lớn
  h += (fbm(x * 0.022 + 40, z * 0.022 - 20, 2) - 0.5) * 5;       // gợn nhỏ
  h += d * Math.sin(x * 0.035) * Math.cos(z * 0.028) * 4.2;      // đụn cát
  // làm phẳng quanh thành
  for (const t of Object.values(TOWNS)) {
    const dist = Math.hypot(x - t.x, z - t.z);
    const k = 1 - clamp((dist - t.r * 0.75) / (t.r * 0.8), 0, 1);
    if (k > 0) h = lerp(h, 0, k * k * (3 - 2 * k));
  }
  // làm phẳng dọc thương đạo
  const rd = roadDistance(x, z);
  if (rd < 14) {
    const k = 1 - clamp((rd - 4) / 10, 0, 1);
    h = lerp(h, h * 0.35, k);
  }
  return h;
}

const COL_GRASS = new THREE.Color(0x5c7f3a);
const COL_GRASS2 = new THREE.Color(0x76913f);
const COL_DRY = new THREE.Color(0xa79154);
const COL_SAND = new THREE.Color(0xd8b878);
const COL_SAND2 = new THREE.Color(0xc9a464);
const COL_ROAD = new THREE.Color(0xb59a6c);
const COL_ROCK = new THREE.Color(0x6f6a5e);

function groundColor(x, z, h, out) {
  const d = desertness(x, z);
  const n = fbm(x * 0.06, z * 0.06, 2);
  const base = d > 0.5
    ? COL_SAND.clone().lerp(COL_SAND2, n)
    : COL_GRASS.clone().lerp(COL_GRASS2, n).lerp(COL_DRY, d * 1.6);
  if (h > 12) base.lerp(COL_ROCK, clamp((h - 12) / 12, 0, 1));
  const rd = roadDistance(x, z);
  if (rd < 9) base.lerp(COL_ROAD, (1 - clamp((rd - 3) / 6, 0, 1)) * 0.85);
  return out.copy(base);
}

// ------------------------------------------------------------
export class World {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];   // {x,z,r}
    this.rng = mulberry32(20260821);
  }

  build() {
    this.#sky();
    this.#ground();
    this.#props();
    this.#townJangan();
    this.#townDonwhang();
    this.#banditCamp();
    this.#ruins();
    this.#flushBatch();
    return this;
  }

  #sky() {
    const sc = this.scene;
    sc.background = new THREE.Color(0xbfd7e8);
    sc.fog = new THREE.Fog(0xd7c9a8, 120, 340);
    const hemi = new THREE.HemisphereLight(0xdfe9f5, 0x8a7b52, 1.15);
    sc.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.35);
    sun.position.set(90, 160, 40);
    sc.add(sun);
    this.sun = sun;
    // mặt trời
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(26, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false })
    );
    sunMesh.position.set(320, 420, 180);
    sc.add(sunMesh);
  }

  #ground() {
    const SEG = 170;
    const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = terrainHeight(x, z);
      pos.setY(i, h);
      groundColor(x, z, h, c);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'ground';
    this.ground = mesh;
    this.scene.add(mesh);

    // hồ nước ốc đảo Đôn Hoàng
    const t = TOWNS.donwhang;
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(17, 28),
      new THREE.MeshLambertMaterial({ color: 0x2f86a6, transparent: true, opacity: 0.85 })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(t.x - 4, 0.35, t.z - 12);
    this.scene.add(water);
  }

  // ---------- cây cối, đá, xương rồng ----------
  #props() {
    const rng = this.rng;
    const groups = {
      trunk: { geo: new THREE.CylinderGeometry(0.34, 0.5, 4.4, 5), mat: new THREE.MeshLambertMaterial({ color: 0x5a3f27 }), list: [] },
      leaf: { geo: new THREE.ConeGeometry(2.6, 6, 6), mat: new THREE.MeshLambertMaterial({ color: 0x3f6b30, flatShading: true }), list: [] },
      bamboo: { geo: new THREE.CylinderGeometry(0.22, 0.28, 11, 5), mat: new THREE.MeshLambertMaterial({ color: 0x7fa03c }), list: [] },
      rock: { geo: new THREE.DodecahedronGeometry(1.5, 0), mat: new THREE.MeshLambertMaterial({ color: 0x7d7466, flatShading: true }), list: [] },
      cactus: { geo: new THREE.CylinderGeometry(0.55, 0.7, 4.2, 6), mat: new THREE.MeshLambertMaterial({ color: 0x4d7a44 }), list: [] },
      palm: { geo: new THREE.CylinderGeometry(0.3, 0.45, 7, 5), mat: new THREE.MeshLambertMaterial({ color: 0x6b4c2c }), list: [] },
      palmleaf: { geo: new THREE.ConeGeometry(3.4, 1.6, 6), mat: new THREE.MeshLambertMaterial({ color: 0x4f9a45, flatShading: true }), list: [] },
    };
    const push = (k, x, y, z, s, ry) => groups[k].list.push({ x, y, z, s, ry });

    const isTownArea = (x, z) => Object.values(TOWNS).some(t => Math.hypot(x - t.x, z - t.z) < t.r + 8);

    for (let i = 0; i < 2600; i++) {
      const x = (rng() - 0.5) * 900, z = (rng() - 0.5) * 780;
      if (isTownArea(x, z)) continue;
      if (roadDistance(x, z) < 7) continue;
      const h = terrainHeight(x, z);
      const d = desertness(x, z);
      const s = 0.7 + rng() * 0.7;
      const ry = rng() * TAU;
      if (d > 0.55) {
        if (rng() < 0.42) { push('cactus', x, h, z, s, ry); this.colliders.push({ x, z, r: 0.9 }); }
        else push('rock', x, h + 0.4, z, s * (0.6 + rng()), ry);
      } else if (x < -70 && z > 30 && rng() < 0.75) {
        // rừng trúc
        for (let b = 0; b < 3; b++)
          push('bamboo', x + (rng() - .5) * 2.4, h, z + (rng() - .5) * 2.4, 0.7 + rng() * 0.5, rng() * TAU);
        this.colliders.push({ x, z, r: 1.2 });
      } else if (rng() < 0.6) {
        push('trunk', x, h, z, s, ry);
        push('leaf', x, h + 3.6 * s, z, s, ry);
        this.colliders.push({ x, z, r: 1.1 });
      } else {
        push('rock', x, h + 0.3, z, s * 0.8, ry);
      }
    }
    // cọ quanh ốc đảo
    const t = TOWNS.donwhang;
    for (let i = 0; i < 26; i++) {
      const a = rng() * TAU, r = 15 + rng() * 26;
      const x = t.x - 4 + Math.cos(a) * r, z = t.z - 12 + Math.sin(a) * r;
      const h = terrainHeight(x, z);
      push('palm', x, h, z, 1, rng() * TAU);
      push('palmleaf', x, h + 6.6, z, 1, rng() * TAU);
    }

    const dummy = new THREE.Object3D();
    for (const k in groups) {
      const g = groups[k];
      if (!g.list.length) continue;
      const im = new THREE.InstancedMesh(g.geo, g.mat, g.list.length);
      g.list.forEach((p, i) => {
        dummy.position.set(p.x, p.y + (g.geo.parameters.height ? g.geo.parameters.height * p.s / 2 : 0), p.z);
        dummy.rotation.set(0, p.ry, 0);
        dummy.scale.setScalar(p.s);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.frustumCulled = true;
      this.scene.add(im);
    }
  }

  // ---------- vật liệu dùng chung ----------
  get mats() {
    if (!this._mats) {
      const M = (c, o = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
      this._mats = {
        wall: M(0xc9b18c), wood: M(0x8a4b2a), roof: M(0x9d2b23), roof2: M(0x2f4858),
        gold: M(0xd8b13f), stone: M(0x8d8577), adobe: M(0xd0a978), adobe2: M(0xb98f5f),
        cloth: M(0xc4552f), dark: M(0x4a3a26), white: M(0xe6ddc4),
      };
    }
    return this._mats;
  }

  // Gom toàn bộ khối tĩnh của thành phố vào InstancedMesh
  // => vài chục nghìn khối chỉ tốn dăm lệnh vẽ, chạy mượt trên điện thoại yếu.
  #push(kind, mat, seg, sx, sy, sz, x, y, z, ry) {
    this._batch ||= new Map();
    const key = `${kind}|${mat.color.getHex()}|${seg}`;
    let b = this._batch.get(key);
    if (!b) {
      const geo = kind === 'box'
        ? new THREE.BoxGeometry(1, 1, 1)
        : new THREE.ConeGeometry(1, 1, seg);
      b = { geo, mat, list: [] };
      this._batch.set(key, b);
    }
    b.list.push({ sx, sy, sz, x, y, z, ry });
  }
  #box(mat, w, h, d, x, y, z, ry = 0, kx = 1, ky = 1, kz = 1) {
    this.#push('box', mat, 0, w * kx, h * ky, d * kz, x, y, z, ry);
  }
  #cone(mat, r, h, seg, x, y, z, ry = 0, kx = 1, ky = 1, kz = 1) {
    this.#push('cone', mat, seg, r * kx, h * ky, r * kz, x, y, z, ry);
  }
  #flushBatch() {
    if (!this._batch) return;
    const d = new THREE.Object3D();
    for (const b of this._batch.values()) {
      const im = new THREE.InstancedMesh(b.geo, b.mat, b.list.length);
      b.list.forEach((e, i) => {
        d.position.set(e.x, e.y, e.z);
        d.rotation.set(0, e.ry, 0);
        d.scale.set(e.sx, e.sy, e.sz);
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      this.scene.add(im);
    }
    this._batch.clear();
  }

  /** Nhà kiểu Trung Hoa: thân + mái cong đỏ + hiên */
  #chineseHouse(x, z, w = 9, d = 7, hgt = 5, ry = 0) {
    const m = this.mats;
    const y0 = terrainHeight(x, z);
    this.#box(m.wall, w, hgt, d, x, y0 + hgt / 2, z, ry);
    // hiên gỗ
    this.#box(m.wood, w + 1.6, 0.5, d + 1.6, x, y0 + hgt + 0.25, z, ry);
    // mái
    this.#cone(m.roof, Math.max(w, d) * 0.82, 3.4, 4, x, y0 + hgt + 2.1, z, ry + Math.PI / 4, 1.15, 1, 0.95);
    // cột đỏ
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const px = x + sx * (w / 2 + 0.5) * Math.cos(ry) - sz * (d / 2 + 0.5) * Math.sin(ry);
      const pz = z + sx * (w / 2 + 0.5) * Math.sin(ry) + sz * (d / 2 + 0.5) * Math.cos(ry);
      this.#box(m.wood, 0.5, hgt, 0.5, px, y0 + hgt / 2, pz);
    }
    this.colliders.push({ x, z, r: Math.max(w, d) * 0.62 });
  }

  #townJangan() {
    const m = this.mats, t = TOWNS.jangan;
    // quảng trường
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(20, 32), new THREE.MeshLambertMaterial({ color: 0xa89877 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.set(t.x, 0.12, t.z);
    this.scene.add(plaza);

    // tường thành 4 mặt, chừa 2 cổng
    const R = t.r;
    const segs = 62;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU;
      // chừa cổng nam (z+) và cổng đông (x+)
      const deg = (a * 180 / Math.PI);
      if ((deg > 78 && deg < 102) || (deg > 348 || deg < 12)) continue;
      const x = t.x + Math.cos(a) * R, z = t.z + Math.sin(a) * R;
      const y = terrainHeight(x, z);
      this.#box(m.stone, 5.6, 7.5, 2.6, x, y + 3.7, z, -a);
      if (i % 8 === 0) this.#box(m.roof, 4.2, 1.3, 4.2, x, y + 8.1, z, -a);
      this.colliders.push({ x, z, r: 2.2 });
    }
    // cổng chính (nam)
    const gx = t.x, gz = t.z + R;
    const gy = terrainHeight(gx, gz);
    for (const sx of [-5.5, 5.5]) {
      this.#box(m.stone, 4, 10, 4, gx + sx, gy + 5, gz);
      this.colliders.push({ x: gx + sx, z: gz, r: 2.4 });
    }
    this.#box(m.wood, 16, 2.2, 5, gx, gy + 11, gz);
    this.#cone(m.roof, 11, 3.2, 4, gx, gy + 13.6, gz, Math.PI / 4, 1.1, 1, 0.55);

    // nhà cửa
    const spots = [
      [-18, 8, 10, 8, 5, 0], [18, 10, 10, 8, 5, 0.2], [6, -14, 11, 9, 6, 0],
      [-26, -18, 9, 8, 5, 0.5], [0, 24, 9, 7, 4.6, 0], [26, -8, 8, 7, 4.6, -0.3],
      [-8, -26, 10, 8, 5.2, 0.1], [30, 18, 8, 7, 4.4, 0.6], [-30, 16, 8, 7, 4.4, -0.6],
    ];
    for (const [x, z, w, d, h, ry] of spots) this.#chineseHouse(t.x + x, t.z + z, w, d, h, ry);

    // tháp trung tâm
    const cy = terrainHeight(t.x, t.z);
    this.#box(m.wall, 7, 9, 7, t.x, cy + 4.5, t.z);
    this.#cone(m.roof, 6.6, 3, 4, t.x, cy + 10.5, t.z, Math.PI / 4, 1.1, 1, 1.1);
    this.#box(m.wall, 5, 7, 5, t.x, cy + 14.5, t.z);
    this.#cone(m.roof, 5, 3, 4, t.x, cy + 19.4, t.z, Math.PI / 4);
    this.#box(m.gold, 0.6, 2, 0.6, t.x, cy + 21.6, t.z);
    this.colliders.push({ x: t.x, z: t.z, r: 5 });

    // đèn lồng dọc quảng trường
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const x = t.x + Math.cos(a) * 22, z = t.z + Math.sin(a) * 22;
      const y = terrainHeight(x, z);
      this.#box(m.wood, 0.35, 4.5, 0.35, x, y + 2.25, z);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff6b4a }));
      l.position.set(x, y + 5, z);
      this.scene.add(l);
    }
  }

  #townDonwhang() {
    const m = this.mats, t = TOWNS.donwhang;
    const spots = [[-16, 6], [14, 8], [4, 20], [-20, -6], [20, -4], [-6, 26], [26, 16], [-26, 18]];
    for (const [dx, dz] of spots) {
      const x = t.x + dx, z = t.z + dz, y = terrainHeight(x, z);
      const w = 7 + this.rng() * 4, h = 4 + this.rng() * 2;
      this.#box(m.adobe, w, h, w * 0.85, x, y + h / 2, z, this.rng());
      // mái vòm
      const dome = new THREE.Mesh(new THREE.SphereGeometry(w * 0.5, 10, 6, 0, TAU, 0, Math.PI / 2), m.adobe2);
      dome.position.set(x, y + h, z);
      this.scene.add(dome);
      this.colliders.push({ x, z, r: w * 0.58 });
    }
    // lều chợ
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      const x = t.x + Math.cos(a) * 30, z = t.z + Math.sin(a) * 30, y = terrainHeight(x, z);
      this.#box(m.wood, 0.25, 3, 0.25, x - 2, y + 1.5, z);
      this.#box(m.wood, 0.25, 3, 0.25, x + 2, y + 1.5, z);
      this.#cone(m.cloth, 3.6, 1.6, 4, x, y + 3.6, z, Math.PI / 4);
    }
    // cột mốc thương đạo
    const y = terrainHeight(t.x, t.z + 40);
    this.#box(m.stone, 1.4, 6, 1.4, t.x, y + 3, t.z + 40);
    this.#box(m.gold, 2, 0.6, 0.4, t.x, y + 6.4, t.z + 40);
  }

  #banditCamp() {
    const z0 = ZONES.find(z => z.id === 'bandit');
    const m = this.mats;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      const x = z0.x + Math.cos(a) * (16 + this.rng() * 14);
      const z = z0.z + Math.sin(a) * (16 + this.rng() * 14);
      const y = terrainHeight(x, z);
      this.#cone(m.cloth, 3.2, 4.4, 6, x, y + 2.2, z, this.rng() * TAU);
      this.colliders.push({ x, z, r: 2.4 });
    }
    // lửa trại
    const y = terrainHeight(z0.x, z0.z);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 6), new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
    fire.position.set(z0.x, y + 1.5, z0.z);
    fire.name = 'campfire';
    this.scene.add(fire);
    this.fire = fire;
    // hàng rào gỗ
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      const x = z0.x + Math.cos(a) * 40, z = z0.z + Math.sin(a) * 40;
      if (Math.abs(a - Math.PI * 1.5) < 0.35) continue;
      this.#box(m.wood, 1.2, 3.4, 0.4, x, terrainHeight(x, z) + 1.7, z, -a);
    }
  }

  #ruins() {
    const z0 = ZONES.find(z => z.id === 'ruins');
    const m = this.mats;
    for (let i = 0; i < 22; i++) {
      const a = this.rng() * TAU, r = 10 + this.rng() * 44;
      const x = z0.x + Math.cos(a) * r, z = z0.z + Math.sin(a) * r;
      const y = terrainHeight(x, z);
      const h = 3 + this.rng() * 9;
      this.#box(m.stone, 2, h, 2, x, y + h / 2, z, this.rng());
      this.colliders.push({ x, z, r: 1.4 });
    }
    // cổng đá lớn
    const y = terrainHeight(z0.x, z0.z);
    this.#box(m.stone, 3, 16, 3, z0.x - 8, y + 8, z0.z);
    this.#box(m.stone, 3, 16, 3, z0.x + 8, y + 8, z0.z);
    this.#box(m.stone, 22, 3, 4, z0.x, y + 17, z0.z);
  }

  // ---------- truy vấn ----------
  terrainY(x, z) { return terrainHeight(x, z); }

  zoneAt(x, z) {
    // vùng nhỏ hơn (thành, trại) được ưu tiên hơn vùng lớn bao ngoài
    let best = null;
    for (const zn of ZONES) {
      if (Math.hypot(x - zn.x, z - zn.z) >= zn.r) continue;
      if (!best || zn.r < best.r) best = zn;
    }
    return best || { id: 'wild', name: 'Hoang Mạc', r: 0 };
  }

  /** Rút ngắn khoảng cách camera nếu có vật cản giữa người chơi và camera */
  cameraDistance(px, pz, dirX, dirZ, want) {
    let d = want;
    for (const c of this.colliders) {
      if (c.r < 1.6) continue;              // cây, xương rồng thì kệ, chỉ né nhà và tường
      const ox = c.x - px, oz = c.z - pz;
      const t = ox * dirX + oz * dirZ;            // chiếu tâm vật cản lên tia
      if (t < 0 || t > want) continue;
      const perp = Math.hypot(ox - dirX * t, oz - dirZ * t);
      const rr = c.r + 0.8;
      if (perp < rr) d = Math.min(d, Math.max(3, t - Math.sqrt(rr * rr - perp * perp)));
    }
    return d;
  }
  inTown(x, z) {
    for (const t of Object.values(TOWNS)) if (Math.hypot(x - t.x, z - t.z) < t.r) return t;
    return null;
  }
  /** Đẩy vị trí ra khỏi vật cản, trả về {x,z} hợp lệ */
  resolve(x, z, r = 0.7) {
    for (const c of this.colliders) {
      const dx = x - c.x, dz = z - c.z;
      const d = Math.hypot(dx, dz), min = c.r + r;
      if (d < min && d > 0.0001) {
        x = c.x + (dx / d) * min;
        z = c.z + (dz / d) * min;
      }
    }
    const lim = WORLD_SIZE / 2 - 8;
    return { x: clamp(x, -lim, lim), z: clamp(z, -lim, lim) };
  }
}
