# Nguồn & giấy phép tài nguyên

Theo CLAUDE.md §0.3: mọi asset phải là **tự tạo**, **mua bản quyền**, hoặc
**CC0/CC-BY**. Không có ngoại lệ, và mỗi file phải có một dòng trong bảng dưới
trước khi được commit.

Tuyệt đối không trích xuất, sao chép hay tái tạo file tài nguyên từ game thương
mại, và không dùng tên riêng của game khác.

---

## Đang dùng

| File | Loại | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|---|
| `assets-src/icon.svg` | Vector | Tự vẽ cho dự án này | Thuộc dự án | Lạc đà thồ hàng lúc hoàng hôn, dựng bằng hình học thuần |
| `public/pwa-64x64.png` | PNG | Sinh từ `icon.svg` | Thuộc dự án | |
| `public/pwa-192x192.png` | PNG | Sinh từ `icon.svg` | Thuộc dự án | |
| `public/pwa-512x512.png` | PNG | Sinh từ `icon.svg` | Thuộc dự án | |
| `public/maskable-icon-512x512.png` | PNG | Sinh từ `icon.svg` | Thuộc dự án | Tràn viền, để Android tự cắt mặt nạ |
| `public/apple-touch-icon-180x180.png` | PNG | Sinh từ `icon.svg` | Thuộc dự án | Tràn viền, để iOS tự bo góc |
| `public/favicon.ico`, `public/favicon.svg` | Icon | Sinh từ `icon.svg` | Thuộc dự án | |

**Font:** không tải font web nào. Dùng font hệ thống
(`-apple-system`, `Segoe UI`, `Roboto`…) — đều hiển thị đủ dấu tiếng Việt trên
iOS lẫn Android, và không tốn byte nào trong ngân sách 30 MB.

**Âm thanh:** chưa có file nào.

## Sinh lại bộ icon

Sửa `assets-src/icon.svg` rồi chạy:

```bash
npm run icons
mv assets-src/*.png assets-src/favicon.ico public/
cp assets-src/icon.svg public/favicon.svg
```

Cấu hình ở `pwa-assets.config.ts`. Lưu ý ở đó đã đặt `padding: 0` cho bản
maskable và bản Apple: preset mặc định chừa 30% viền, vốn hợp với logo trên nền
trơn, nhưng icon này là một cảnh tràn viền và cả hai nền tảng đều tự cắt mặt nạ
— để nguyên mặc định thì icon hiện ra như một tấm thẻ nhỏ lọt thỏm trong khung.

## Sắp cần

Danh sách chi tiết những gì phải đi tìm hoặc thuê vẽ nằm ở
[`ASSETS_TODO.md`](ASSETS_TODO.md).

Nguồn CC0 nên ưu tiên:

- [Kenney.nl](https://kenney.nl) — CC0, có sẵn bộ isometric
- [OpenGameArt](https://opengameart.org) — đọc kỹ giấy phép từng file, lẫn lộn nhiều loại
- [itch.io, lọc CC0](https://itch.io/game-assets/free) — kiểm tra kỹ điều khoản tác giả ghi
- [Freesound](https://freesound.org) — âm thanh, lọc theo CC0

Khi thêm asset: tải về, ghi một dòng vào bảng trên (kèm **link gốc** và **tên tác
giả** nếu giấy phép là CC-BY), rồi mới commit.
