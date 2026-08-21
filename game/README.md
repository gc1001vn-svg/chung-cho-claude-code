# Con Đường Tơ Lụa — game nhập vai 3D chơi offline trên điện thoại

Game MMORPG-style một người chơi, lấy cảm hứng từ **Silkroad Online**: hai chủng tộc
Trung Hoa / Châu Âu, hệ mastery và class, trang bị theo bậc (degree), và hệ thống
**thương đoàn** đặc trưng (Thương nhân – Đạo tặc – Thợ săn).

Toàn bộ chạy trong trình duyệt bằng WebGL (Three.js đóng gói sẵn trong thư mục
`vendor/`), **không cần mạng, không cần cài app store**, tiến trình lưu thẳng vào máy.

## Chơi thế nào

**Cách nhanh nhất — 1 file duy nhất:** tải [`dist/con-duong-to-lua.html`](dist/con-duong-to-lua.html)
(634 KB, đã gộp sẵn Three.js) vào điện thoại rồi mở bằng trình duyệt. Không cần server,
không cần mạng.

**Cách đầy đủ (cài như app, có icon trên màn hình chính):** mở `index.html`
bằng bất kỳ web server tĩnh nào:

```bash
cd game
python3 -m http.server 8000
# rồi mở http://localhost:8000 trên máy tính hoặc http://<IP-máy>:8000 trên điện thoại
```

Trên điện thoại, bấm **Chia sẻ → Thêm vào màn hình chính**. Service worker sẽ cache
toàn bộ game, từ lần sau bật máy bay vẫn chơi được.

## Điều khiển

| Thao tác | Tác dụng |
|---|---|
| Joystick trái | Di chuyển |
| Vuốt màn hình | Xoay camera · chụm 2 ngón để zoom |
| Chạm vào quái | Chọn mục tiêu, nhân vật tự chạy tới và đánh |
| ⚔ | Tự chọn quái gần nhất rồi lao vào đánh |
| Các nút kỹ năng | Tung chiêu (hết mana / đang hồi thì mờ đi) |
| 🎯 / 🧪 | Chọn mục tiêu gần nhất / uống thuốc hồi máu |
| Nút vàng giữa màn hình | Nói chuyện với NPC đang đứng gần |

Bàn phím (khi test trên máy tính): `WASD` di chuyển, `1–6` kỹ năng, `Space` chọn mục tiêu.

## Hệ thống nhân vật

**Trung Hoa** — không có class cố định, chọn 1 hệ vũ khí + 1 hệ nguyên khí:

| Hệ vũ khí | Vũ khí | Lối chơi |
|---|---|---|
| Bích Thiên | Kiếm / Đao | Cân bằng, thủ tốt, dễ chơi |
| Hắc Sát | Thương | Sát thương cao, tầm xa hơn, chí mạng tốt |
| Phá Thiên | Cung | Đánh xa an toàn, DPS đơn mục tiêu |

| Hệ nguyên khí | Vai trò |
|---|---|
| Hỏa | Sát thương bùng nổ, phụ trợ lửa cho vũ khí |
| Hàn Băng | Làm chậm, đóng băng, tăng phòng thủ |
| Lôi Điện | Tăng tốc độ, sát thương phép nhanh |
| Chân Khí | Hồi máu, tăng sinh lực — cày solo rất khoẻ |

**Châu Âu** — chọn class chính (quyết định vũ khí) + class phụ:
Chiến Binh (tank), Thích Khách (chí mạng), Pháp Sư (sát thương phép),
Hắc Ám Sư (độc/nguyền), Nhạc Sư (buff tốc độ), Tăng Lữ (hồi máu).

Mỗi cấp nhận **+1 STR, +1 INT, 3 điểm tự phân bổ và 3 điểm kỹ năng** — đúng như bản gốc.
Cấp tối đa hiện tại: 60.

## Thế giới

Trường An → Đồng bằng → Rừng Trúc → Sa mạc Taklamakan → Trại Thổ Phỉ →
Phế Tích Cổ Thành → Ốc đảo Đôn Hoàng. 13 loại quái và 2 boss (Đầu Lĩnh Hắc Phong,
Sa Mạc Chi Vương), 7 nhiệm vụ chuỗi, 8 NPC (thợ rèn, tiệm thuốc, quản kho, quản sự
thương đoàn, thương nhân Ba Tư…).

## Thương đoàn (Job)

1. Gặp **Trần Quản Sự** ở Trường An, mua hàng (lụa, trà, gốm sứ, ngọc).
2. Lạc đà thồ hàng đi theo bạn — **giữ nó sống**.
3. Áp tải tới **Đôn Hoàng**, bán cho Thương Nhân Ba Tư, lãi ~75–110% tuỳ cấp nghề và giá thị trường.
4. Dọc đường **Đạo Tặc Sa Mạc** sẽ phục kích; diệt chúng để nhận tiền thưởng thợ săn.
5. Cấp nghề 1→5 mở thêm số kiện hàng mỗi chuyến (1 → 6 kiện).

## Trang bị

Bậc 1–12 (mỗi 8 cấp lên 1 bậc), 4 độ hiếm (Thường / Hiếm / Tinh Anh / Truyền Thuyết),
cường hóa +1…+12 bằng Đá Cường Hóa tại thợ rèn (tỉ lệ giảm dần theo cấp cường hóa).

## Đóng gói lại bản 1 file

```bash
npx esbuild js/main.js --bundle --format=iife --minify \
  --alias:three=./vendor/three.module.min.js --outfile=/tmp/bundle.js
# rồi nhúng css/style.css + /tmp/bundle.js vào khung index.html
```

## Cấu trúc mã nguồn

```
game/
├── index.html          khung giao diện
├── css/style.css       toàn bộ HUD, bảng, hội thoại
├── js/
│   ├── main.js         khởi động, vòng lặp, camera, tạo nhân vật
│   ├── data.js         class, kỹ năng, quái, vật phẩm, nhiệm vụ, vùng đất
│   ├── world.js        địa hình, thành trì, thương đạo (gộp InstancedMesh)
│   ├── entities.js     mô hình nhân vật/quái/lạc đà, chỉ số người chơi
│   ├── combat.js       công thức sát thương, kỹ năng, AI quái
│   ├── items.js        sinh trang bị theo bậc, túi đồ, cường hóa
│   ├── quests.js       chuỗi nhiệm vụ
│   ├── job.js          hệ thống thương đoàn
│   ├── ui.js           HUD, các bảng, cửa hàng
│   ├── input.js        joystick, xoay camera, chạm chọn mục tiêu
│   ├── save.js         lưu/tải localStorage
│   └── audio.js        âm thanh tổng hợp bằng WebAudio
├── sw.js               service worker cache offline
├── dist/               bản gộp 1 file HTML chạy độc lập
└── vendor/             Three.js r170 (MIT)
```

## Hiệu năng

Toàn bộ nhà cửa, tường thành, cây cối gộp thành `InstancedMesh`; quái ngoài 78m bị ẩn,
ngoài 105m ngừng tính AI. Cảnh trong thành ~90 lệnh vẽ, chạy 60fps trên điện thoại tầm trung.

## Bản sau sẽ có

Nghề Đạo Tặc (cướp caravan NPC), thành Constantinople cho nhánh Châu Âu, tổ đội NPC,
cưỡi ngựa, và nâng cấp tối đa lên cấp 80.
