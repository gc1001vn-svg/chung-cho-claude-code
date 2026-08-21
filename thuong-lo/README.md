# Thương Lộ

ARPG offline lấy bối cảnh con đường thương mại cổ. Chạy thẳng trong trình duyệt
điện thoại, cài vào màn hình chính như một ứng dụng, **chơi được khi không có
mạng** — không tài khoản, không server.

Game gốc, chỉ lấy cảm hứng cơ chế từ dòng MMORPG cùng bối cảnh. Toàn bộ tên
riêng, cốt truyện và tài nguyên là của dự án này.

> **Trạng thái: Phase 0 / 10** — khung dự án đã chạy và deploy được. Chưa có gì
> để chơi. Lộ trình đầy đủ trong [`CLAUDE.md`](CLAUDE.md) §5.

## Chơi thử

<https://gc1001vn-svg.github.io/thuong-lo/>

Cài lên điện thoại: xem [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Chạy trên máy

```bash
npm install
npm run dev        # http://localhost:5173/thuong-lo/
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Máy chủ dev (không bật service worker) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Xem thử bản build — **dùng cái này để thử PWA** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run icons` | Sinh lại bộ icon PWA từ `assets-src/icon.svg` |

## Công nghệ

TypeScript (strict) · Phaser 3.90 · Vite 8 · vite-plugin-pwa · Vitest ·
GitHub Pages

Đồ họa 2D isometric sprite-based. Không 3D, không framework UI, không phụ thuộc
mạng lúc chạy.

## Cấu trúc

```
src/
├─ scenes/     Boot → Preload → Title
├─ systems/    i18n, audio, hướng màn hình, service worker, lưu trữ
├─ locales/    vi.json (mặc định) · en.json (dự phòng)
├─ data/       Số liệu cân bằng dạng JSON — từ Phase 2
└─ theme.ts    Màu, font, hằng số bố cục
tests/         Vitest, chỉ test logic thuần
docs/          Tài liệu tiếng Việt
assets-src/    File nguồn của asset (SVG…)
public/        Asset đã sinh, copy thẳng vào bản build
```

Quy ước: comment trong code viết tiếng Anh, tài liệu `docs/` viết tiếng Việt.
Số liệu cân bằng **không hardcode trong code** — nằm ở `src/data/*.json`.

## Tài liệu

| File | Nội dung |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Đặc tả đầy đủ: gameplay, ràng buộc, lộ trình 10 phase |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Bật Pages, cài lên iPhone/Android, thử offline |
| [`docs/IOS_NOTES.md`](docs/IOS_NOTES.md) | Giới hạn Safari iOS đã kiểm chứng |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Xong gì, thiếu gì, theo từng phase |
| [`ASSETS.md`](ASSETS.md) | Nguồn và giấy phép từng asset |
| [`ASSETS_TODO.md`](ASSETS_TODO.md) | Asset cần tìm hoặc thuê vẽ |
