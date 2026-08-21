# Tài nguyên cần tìm hoặc thuê vẽ

Theo CLAUDE.md §7: cái gì không tự tạo được thì dùng placeholder hình học và mô
tả chi tiết ở đây để anh đi tìm hoặc thuê vẽ.

Mỗi mục ghi rõ **cần gì**, **kích thước**, và **phase nào cần** — để không phải
đi tìm cả kho khi mới chỉ làm tới Phase 1.

---

## Ưu tiên 1 — Phase 1 cần ngay

### Tileset isometric mặt đất

- **Cần:** ít nhất 3 kiểu nền (cát, đá sỏi, đường mòn) + góc chuyển tiếp giữa chúng.
- **Kích thước:** ô isometric 2:1, gợi ý 128×64 px, hoặc 64×32 nếu muốn nhẹ hơn.
- **Định dạng:** PNG rời (sẽ tự gộp thành atlas) hoặc atlas kèm file JSON.
- **Ghi chú:** dùng cùng một cỡ ô cho toàn bộ dự án — đổi giữa chừng là phải làm
  lại toàn bộ toạ độ map.
- **Gợi ý nguồn:** Kenney "Isometric Tiles" (CC0).
- **Hiện đang:** ô hình thoi vẽ bằng `Graphics`.

### Sprite nhân vật chính

- **Cần:** đi bộ theo **8 hướng**, mỗi hướng 4–8 khung. Thêm đứng yên và đánh
  thường (Phase 2).
- **Kích thước:** cao khoảng 64–96 px để cân với ô 128×64.
- **Ghi chú:** phải là **một** nhân vật thay được vũ khí/áo giáp bằng cách xếp
  lớp, hoặc chấp nhận vẽ lại toàn bộ khi Phase 4 thêm trang bị. Nói rõ với người
  vẽ ngay từ đầu, đây là chỗ đắt tiền nhất.
- **Hiện đang:** hình tròn màu.

## Ưu tiên 2 — Phase 3

### Sprite quái vật

- **Cần:** 4–6 loại quái, mỗi loại: đi, đánh, chết.
- **Kích thước:** 48–128 px tuỳ loại; thủ lĩnh vùng to gấp rưỡi loại thường.
- **Ghi chú:** đặc tả chia 4 hạng (thường / hiếm / tinh anh / thủ lĩnh) **phân
  biệt bằng đổi màu và phóng to**, nên mỗi loại chỉ cần một bộ sprite gốc.

### Hiệu ứng đòn đánh

- **Cần:** chém, đâm, bắn tên, và một hiệu ứng cho mỗi hệ nguyên tố (Hỏa, Băng,
  Lôi, Nguyên).
- **Kích thước:** 128×128, khoảng 6–10 khung.

## Ưu tiên 3 — Phase 4–5

### Icon vật phẩm & kỹ năng

- **Cần:** ~60 icon vật phẩm (9 ô trang bị × các bậc) + ~16 icon kỹ năng.
- **Kích thước:** 64×64, nền trong suốt.
- **Ghi chú:** cần khung viền riêng theo bậc/độ hiếm — làm khung rời thì một bộ
  icon dùng được cho mọi bậc.

### Sprite lạc đà thồ

- **Cần:** đi 8 hướng, có phân biệt **có hàng / không hàng**.
- **Ghi chú:** đây là hình ảnh nhận diện của cả game (§2.7). Đáng để đầu tư nhất
  sau nhân vật chính.

## Ưu tiên 4 — Phase 9–10

### Chân dung NPC

- **Cần:** 8–12 chân dung cho hội thoại, đủ ba vùng văn hoá.
- **Kích thước:** 256×256.

### Âm thanh

- **Cần:** ~20 hiệu ứng (chém, trúng đòn, nhặt đồ, lên cấp, mở túi, bước chân) +
  3 nhạc nền vòng lặp, mỗi vùng một bài.
- **Định dạng:** `.ogg` kèm `.mp3` dự phòng — Safari cũ không nuốt hết `.ogg`.
- **Ghi chú:** tổng dung lượng âm thanh nên dưới ~8 MB. Ngân sách tải lần đầu
  của cả game là 30 MB (§1) và art sẽ ăn phần lớn.
- **Gợi ý nguồn:** Freesound (lọc CC0), Kenney "Audio" packs.

---

## Nhắc lại ràng buộc

- Không lấy từ game thương mại, kể cả "chỉ để tạm". Một file lọt vào repo là dính
  vĩnh viễn trong lịch sử git.
- CC-BY thì **phải** ghi tên tác giả trong `ASSETS.md`.
- Trước khi commit bất kỳ asset nào: thêm một dòng vào bảng trong `ASSETS.md`.
