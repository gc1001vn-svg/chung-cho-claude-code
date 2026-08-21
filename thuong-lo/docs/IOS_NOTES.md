# Ghi chú Safari iOS

CLAUDE.md §7 yêu cầu: mỗi tính năng mới phải tự hỏi *"cái này có chạy trên Safari
iOS không?"*. File này là câu trả lời tích lũy — mỗi lần kiểm chứng một API thì
ghi vào đây, kèm ngày và cách xử lý.

---

## Đã kiểm chứng ở Phase 0

### Không khóa được hướng màn hình trên iPhone

- `screen.orientation.lock()`: **không có** trên Safari iOS.
- `orientation: "landscape"` trong web app manifest: iOS **bỏ qua hoàn toàn**.

Không có cách nào ép iPhone xoay ngang. Đây là hạn chế của nền tảng, không phải
thiếu sót cấu hình.

**Cách xử lý:** overlay `#rotate-overlay` trong `index.html`, bật/tắt bằng
`@media (orientation: portrait)` trong `src/style.css`. Dùng media query chứ
không dùng JS vì như vậy overlay đúng ngay từ khung hình đầu tiên, và vẫn đúng
kể cả khi game crash. Phần JS (`src/systems/orientation.ts`) chỉ lo việc cho
game ngủ khi máy dựng đứng.

### `display: "fullscreen"` tụt về `standalone`

Fullscreen API không có trên iPhone (iPad thì có). Manifest vẫn khai
`fullscreen` cho Android, kèm `display_override: ["fullscreen", "standalone"]`
để iOS rơi về `standalone` một cách tường minh.

Kiểm tra trên máy thật: màn hình chẩn đoán Phase 0 in ra dòng **"Chế độ hiển
thị"**. Mở từ icon màn hình chính mà thấy `standalone` là cài đúng; thấy
`browser` nghĩa là đang mở trong tab Safari chứ chưa cài.

### Âm thanh phải chờ thao tác chạm

`AudioContext` tạo lúc tải trang luôn ở trạng thái `suspended` và
`resume()` bị từ chối nếu không nằm trong một cử chỉ người dùng thật.

**Cách xử lý:** `src/systems/audio-unlock.ts`, gọi từ đúng handler chạm của nút
"Chạm để bắt đầu". Cũng probe cả `webkitAudioContext` cho bản iOS cũ.

Trong `unlockAudio()` phải gọi `new AudioContext()` **trước** mọi `await` — sau
`await` thì trình duyệt đã coi như ra khỏi cử chỉ và sẽ từ chối.

### `user-scalable=no` bị bỏ qua

iOS bỏ qua `user-scalable=no` trong thẻ viewport từ iOS 10. Chặn zoom phải làm
bằng tay:

- Pinch-zoom: chặn `gesturestart` / `gesturechange` / `gestureend` (sự kiện
  riêng của Safari, trình duyệt khác không có nên `addEventListener` chỉ nằm im).
- Double-tap zoom: nuốt cú chạm thứ hai nếu cách cú trước dưới 320 ms.

Code ở `src/systems/touch-guards.ts`.

### Kéo xuống làm mới trang

`overscroll-behavior: none` là chưa đủ trên iOS. Phải thêm
`position: fixed; inset: 0` cho `body` thì mới hết hiệu ứng kéo giãn trang.

### Vùng an toàn (tai thỏ, thanh gạt home)

Cần đủ cả hai:

1. `viewport-fit=cover` trong thẻ viewport — không có thì `env(safe-area-inset-*)`
   luôn trả 0.
2. `padding` bằng `env(safe-area-inset-*)` trên `#game`.

Phaser `Scale.FIT` sẽ co canvas vào phần còn lại, nên không có gì lọt vào vùng
vuốt hệ thống.

### `navigator.storage.persist()`

Có tồn tại trên Safari, nhưng iOS gần như chỉ cấp cho web app đã thêm vào màn
hình chính, và có thể xóa dữ liệu của site để lâu không dùng.

Màn hình chẩn đoán Phase 0 in kết quả ra để đọc trực tiếp trên máy. **Cần thử
hai lần**: một lần trong tab Safari, một lần sau khi cài vào màn hình chính — kết
quả thường khác nhau.

Đây chính là lý do §4 bắt buộc phải có xuất/nhập file save. Kết quả trả về
`false` là chuyện bình thường, không phải bug.

---

## Chưa kiểm chứng — phải thử trước khi dùng

Các API sẽ cần ở phase sau, chưa xác nhận trên iOS:

- **IndexedDB trong PWA đã cài** (Phase 6) — Safari từng có bug IndexedDB nặng;
  cần thử thật trên bản iOS hiện tại trước khi xây hệ save lên trên.
- **File System Access API** (`showSaveFilePicker`) — gần như chắc chắn iOS
  không có. Xuất file save nên dùng `<a download>` + Blob URL, sẽ phải thử xem
  Safari xử lý ra sao.
- **Web Audio nhiều nguồn cùng lúc** (Phase 10) — iOS giới hạn số node phát đồng
  thời chặt hơn Android.
- **`navigator.vibrate`** — Safari iOS **không hỗ trợ**. Nếu Phase 10 muốn có
  rung phản hồi thì phải chấp nhận chỉ Android có.

## Cách thêm mục mới

Khi dùng một web API chưa có ở đây:

1. Thử trên iPhone thật, không tin bảng tương thích.
2. Ghi kết quả vào file này.
3. Ghi chú ngay trong code chỗ dùng API đó, trỏ về mục tương ứng.
