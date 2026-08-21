# Changelog

Ghi theo phase, mới nhất ở trên.

---

## Phase 0 — Khởi tạo dự án

### Chạy được

- Dự án Vite + TypeScript (strict) + Phaser 3.90, build sạch, không cảnh báo.
- PWA đầy đủ: manifest, service worker precache 16 file (~1,2 MB), cài được vào
  màn hình chính trên cả iPhone và Android, chơi được khi ngắt mạng.
- Bộ icon PWA sinh từ một file SVG tự vẽ: 64 / 192 / 512 / maskable 512 /
  apple-touch-icon 180.
- Màn hình tiêu đề: nền hoàng hôn sa mạc vẽ bằng hình học, chữ "Thương Lộ", nút
  "Chạm để bắt đầu".
- Chạm vào sẽ: mở `AudioContext` (cách duy nhất iOS cho phép), chạy
  `navigator.storage.persist()`, rồi hiện bảng chẩn đoán — âm thanh, quyền lưu
  trữ bền, dung lượng, chế độ hiển thị.
- Overlay "Xoay ngang điện thoại" khi máy dựng đứng; game ngủ phía sau.
- Banner "Đã có bản mới — Tải lại", không tự tải lại giữa chừng.
- Overlay FPS bật/tắt được.
- i18n từ đầu: `vi` mặc định, `en` dự phòng, không hardcode chuỗi hiển thị.
- 11 test Vitest cho i18n, gồm cả kiểm tra hai file ngôn ngữ không lệch key.
- GitHub Actions tự deploy lên Pages, chặn typecheck/test trước khi build.

### Quyết định đáng chú ý

- **Độ phân giải thiết kế 1280×640 (2:1)**, không phải 16:9. Với `Scale.FIT`,
  canvas 16:9 mất 18% chiều ngang màn hình iPhone 13 vào viền đen. Tỉ lệ 2:1 nằm
  giữa dải 16:9–21:9 mà đặc tả yêu cầu, đưa trường hợp xấu nhất về 11–14%; phần
  viền còn lại được `style.css` tô cùng dải màu hoàng hôn nên không đọc ra thành
  viền đen.
- **`maximumFileSizeToCacheInBytes` nâng lên 4 MiB.** Bundle hiện tại 1,2 MB vẫn
  dưới ngưỡng mặc định 2 MiB của Workbox, nhưng texture atlas của Phase 1 thì
  không. Workbox bỏ qua file quá lớn mà **không báo lỗi build** — hỏng offline
  chứ không hỏng CI, nên chặn trước.
- **TypeScript 5.9 chứ không phải 7.0.** Type defs Phaser 3.90 và toolchain
  Vite/Vitest chưa chứng minh ổn định với compiler mới.
- **`@vite-pwa/assets-generator` kèm `overrides.sharp ^0.35.3`.** Bản sharp mà
  generator kéo về theo mặc định dính 4 CVE của libvips; ép lên bản đã vá đưa
  `npm audit` về 0.

### Còn thiếu / cố ý chưa làm

- Chưa có gì để **chơi** — chưa map, chưa nhân vật, chưa di chuyển. Đó là Phase 1.
- Chưa có âm thanh thật. `AudioContext` mở được nhưng chưa phát gì.
- `src/data/` còn rỗng; số liệu cân bằng bắt đầu từ Phase 2.
- Icon là **placeholder tự vẽ** — xem `ASSETS_TODO.md`.
- `BootScene` và `PreloadScene` mới là khung; thanh tiến trình đã nối vào loader
  thật nhưng hàng đợi đang rỗng.

### Cách tự kiểm tra trên điện thoại

Xem [`DEPLOY.md`](DEPLOY.md) mục 3–5. Tóm tắt nghiệm thu:

1. Mở link bằng **Safari** trên iPhone → Chia sẻ → Thêm vào MH chính.
2. Mở từ icon: phải nằm ngang, không có thanh địa chỉ, chữ không chui vào tai thỏ.
3. Chạm nút → đọc bảng chẩn đoán. Dòng "Chế độ hiển thị" phải là `standalone`.
4. Thử double-tap (không được zoom), vuốt xuống (không được refresh), giữ lâu
   (không hiện menu copy).
5. Xoay dọc máy → phải hiện màn "Xoay ngang điện thoại".
6. Bật chế độ máy bay, tắt hẳn app, mở lại từ icon → phải chạy được.

Ghi lại giúp kết quả dòng **"Lưu trữ bền"** ở bước 3 — cả trong tab Safari lẫn
sau khi cài vào màn hình chính. Con số đó quyết định Phase 6 phải nhắc xuất file
save gắt tới mức nào.
