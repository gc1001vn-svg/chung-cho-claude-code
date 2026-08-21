# CLAUDE.md — Dự án "Thương Lộ" (ARPG offline, web/PWA, chơi trên Android + iOS)

> Đặt file này ở thư mục gốc repo. Claude Code đọc nó mỗi phiên làm việc.

---

## 0. Nguyên tắc bắt buộc

1. Đây là **game gốc**, chỉ *lấy cảm hứng cơ chế* từ dòng MMORPG bối cảnh Con đường tơ lụa. Cơ chế trò chơi không được bảo hộ bản quyền — nhưng **asset, tên riêng, cốt truyện, map, icon, âm thanh thì có**.
2. Tuyệt đối không trích xuất, sao chép, tái tạo file tài nguyên từ game thương mại. Không dùng tên riêng của game khác (tên phái, tên kỹ năng, tên thành, tên quái, tên NPC).
3. Asset chỉ lấy từ: tự tạo, mua bản quyền, hoặc CC0/CC-BY (Kenney.nl, itch.io CC0, OpenGameArt, Freesound). Ghi nguồn + giấy phép trong `ASSETS.md`.
4. Yêu cầu nào của tôi vi phạm mục 1–3, nói thẳng và đề xuất phương án thay thế.

## 1. Ràng buộc sản phẩm (đã chốt, không đổi)

| Hạng mục | Quyết định |
|---|---|
| Máy phát triển | **Windows 10**. Không có Mac. Không được yêu cầu công cụ chỉ chạy trên macOS. |
| Nền tảng chơi | **Điện thoại Android + iPhone**, qua trình duyệt, cài dạng PWA vào màn hình chính. Landscape. |
| Lý do chọn web | Không có Mac → không thể build app iOS native. Web là con đường duy nhất phủ được cả hai. |
| Kết nối | Chơi **offline hoàn toàn** sau lần tải đầu. Không tài khoản, không server, không gọi API ngoài. |
| Lưu game | IndexedDB, nhiều slot, **kèm xuất/nhập file save** (bắt buộc — xem mục 4). |
| Đồ họa | **2D isometric sprite-based**. Không 3D. |
| Stack | **TypeScript + Phaser 3 + Vite + vite-plugin-pwa** |
| Triển khai | GitHub Pages (miễn phí, có https — bắt buộc để PWA hoạt động) |
| Hiệu năng mục tiêu | 60 FPS trên điện thoại tầm trung; tổng asset tải lần đầu < 30 MB |

## 2. Thiết kế gameplay

### 2.1 Vòng lặp cốt lõi
Đánh quái → nhận EXP + **Điểm Kỹ Năng (SP)** + đồ rơi → nâng mastery/skill → đủ cấp mở nghề → **chạy chuyến buôn** kiếm vàng → mua trang bị tốt hơn → mở vùng bản đồ mới.

### 2.2 Chỉ số nhân vật
- Hai chỉ số: **Lực** (vật lý) và **Khí** (phép thuật).
- Mỗi cấp: tự động +1 Lực, +1 Khí, cộng **3 điểm tự phân bổ**.
- Cho phép build thuần Lực, thuần Khí, hoặc lai. Mỗi build phải khả thi — kiểm tra bằng test cân bằng.
- Lực → HP, sát thương vật lý, phòng thủ vật lý. Khí → MP, sát thương phép, kháng phép.

### 2.3 Hệ thống Mastery (cốt lõi, làm cho đúng)
- Nhân vật **không chọn class cố định**. Chọn nhánh mastery và tự tạo build.
- 3 nhánh **vũ khí**: kiếm+khiên (thủ, cân bằng); thương/đại đao (sát thương cao, chí mạng); cung (tầm xa, đơn mục tiêu).
- 4 nhánh **nguyên tố**: Hỏa (sát thương + buff công), Băng (phòng thủ + làm chậm/đóng băng), Lôi (tốc độ + né/đỡ), Nguyên (hồi máu + hỗ trợ).
- Quy tắc: **cấp mastery không được vượt cấp nhân vật**. Có **trần tổng điểm mastery** (ví dụ cap cấp 60 → tối đa 180 điểm cộng lại) → buộc chuyên môn hóa, thường 1 vũ khí + 1–2 nguyên tố.
- SP kiếm được khi giết quái, **tính riêng khỏi EXP**. Skill mở theo cấp mastery, nâng theo bậc.
- Toàn bộ tên nhánh và tên skill do dự án tự đặt (tiếng Việt, kèm bản tiếng Anh).

### 2.4 Kỹ năng
Kiểu `SkillData`: id, tên, nhánh, cấp mastery yêu cầu, loại (đánh/buff/debuff/hồi), MP cost, cooldown, cast time, tầm, hệ số damage, hiệu ứng phụ (chảy máu / choáng / đóng băng / độc / giảm tốc), bậc 1→5.
- Có **buff tự thân** (tăng công/thủ có thời hạn) và **imbue** (phù vũ khí bằng nguyên tố trong N đòn).
- Thanh **Cuồng Nộ**: tích khi đánh/bị đánh, đầy thì kích hoạt chế độ tăng sức mạnh có thời hạn.

### 2.5 Quái vật
- `MonsterData`: cấp, stat, tốc độ, bán kính aggro, tầm đánh, kháng nguyên tố, loot table, AI profile.
- 4 hạng: **thường / hiếm (có buff) / tinh anh / thủ lĩnh vùng** — hạng cao đổi màu, to hơn, rơi đồ tốt hơn.
- AI state machine dùng chung: idle → tuần tra → truy đuổi → tấn công → bỏ chạy khi máu thấp (một số loại) → về điểm spawn.
- Spawner theo vùng, giới hạn số lượng đồng thời, hồi sinh theo thời gian.

### 2.6 Trang bị & vật phẩm
- Trang bị chia **bậc 1→10** theo cấp nhân vật. Bộ đồ: mũ, áo, quần, găng, giày, vũ khí, khiên, 2 phụ kiện.
- **Cường hóa +0 → +12**: tỷ lệ thành công giảm dần, thất bại có thể vỡ (có bùa bảo hộ). Phải cân bằng kỹ, không để thành cái bẫy gây ức chế.
- **Đá thuộc tính**: cộng Lực/Khí/HP/kháng vào trang bị.
- Độ bền giảm khi chết, sửa ở NPC. Bình HP/MP, cuộn hồi thành.

### 2.7 Hệ thống Nghề — thế mạnh riêng của game
Mở ở cấp 20. Chọn 1 trong 3, đổi được nhưng mất hết cấp nghề đang có.

- **Thương nhân**: mua hàng ở thành A, chất lên **lạc đà thồ** (chậm, có HP, mất hàng nếu bị giết), đi qua vùng hoang, bán ở thành B. Hàng **1→5 sao**: sao càng cao lãi càng lớn nhưng cướp NPC càng mạnh và càng đông.
- **Săn tiêu**: nhận hợp đồng hộ tống đoàn buôn NPC. Kiếm EXP nghề khi chuyến hàng về đích an toàn và khi diệt cướp.
- **Cướp đường**: chặn đoàn buôn NPC, giết xe thồ, cướp hàng, chở về **trại cướp** bán. Bị NPC săn tiêu truy lùng, có **mức truy nã** tăng dần.

Cấp nghề tính riêng với cấp nhân vật, mở **kỹ năng nghề** (tăng tốc xe thồ, tăng tải trọng, phát hiện phục kích, ẩn thân...) và uy tín để mua hàng hiếm.

**Giá biến động**: mỗi thành có bảng cung–cầu. Bán nhiều một mặt hàng thì giá rớt, có trần và sàn, hồi phục dần theo thời gian trong game. Có khung giờ "hàng giá hời".

### 2.8 Thế giới
- 3 vùng văn hóa dọc thương lộ (phương Đông – Trung Á – phương Tây), mỗi vùng 1 thành chính + 2–3 điểm dừng + vùng săn quái theo dải cấp.
- Bản đồ **thu nhỏ có chủ đích**: đi bộ giữa hai thành mất 3–6 phút — đủ để chuyến buôn có rủi ro nhưng không gây chán.
- Quest: chuỗi nhiệm vụ chính dẫn qua từng vùng + nhiệm vụ lặp (săn X con, thu thập Y).

## 3. Yêu cầu kỹ thuật riêng cho web trên điện thoại

### 3.1 PWA
- `vite-plugin-pwa` với manifest: `display: "fullscreen"`, `orientation: "landscape"`, đủ bộ icon (bao gồm `apple-touch-icon` 180×180 — iOS bắt buộc, thiếu là icon ra xấu).
- Service worker precache toàn bộ asset để chơi offline sau lần tải đầu.
- Có thông báo "Đã có bản mới, tải lại?" khi service worker cập nhật.
- Thêm meta `apple-mobile-web-app-capable` và `viewport-fit=cover`.

### 3.2 Riêng iOS (Safari) — chỗ dễ vỡ nhất, chú ý
- **Âm thanh chỉ phát được sau thao tác chạm đầu tiên.** Phải có màn hình "Chạm để bắt đầu" khởi tạo AudioContext.
- Xử lý **safe area** (tai thỏ, thanh gạt home) bằng `env(safe-area-inset-*)`. Không đặt nút vào vùng vuốt hệ thống.
- Chặn double-tap zoom, chặn pull-to-refresh, chặn menu giữ lâu.
- Trước khi dùng bất kỳ API web nào lạ, kiểm tra hỗ trợ trên iOS Safari trước và ghi rõ vào code.
- Giữ tổng dung lượng cache nhỏ — iOS giới hạn khắt khe hơn Android nhiều.

### 3.3 Điều khiển & giao diện
- Chạm để di chuyển + joystick ảo (chọn được trong Cài đặt). Chạm quái để chọn mục tiêu.
- Thanh skill 6 nút góc phải, nút bình máu/mana góc trái. Vùng chạm tối thiểu 48px.
- **Auto-combat tùy chọn**: tự đánh quái trong bán kính, tự uống bình dưới ngưỡng %. Bắt buộc có — game grind trên điện thoại không có tính năng này thì không chơi nổi.
- Hỗ trợ tỉ lệ 16:9 → 21:9. Dùng Phaser `Scale.FIT` + `autoCenter`.
- Tự pause khi tab ẩn (`visibilitychange`), không chạy nền hao pin.

### 3.4 Hiệu năng
- Object pool cho quái, đạn, số damage bay lên. Không tạo/hủy object mỗi frame.
- Texture atlas, ảnh nén WebP có fallback PNG.
- Giới hạn số sprite hoạt động cùng lúc; cull những gì ngoài màn hình.
- Overlay đo FPS, bật/tắt được.

## 4. Hệ thống lưu game (yêu cầu quan trọng nhất của tôi)

**Bối cảnh:** iOS có thể xóa dữ liệu web của ứng dụng sau thời gian dài không dùng. Vì vậy save phải có hai lớp.

**Lớp 1 — IndexedDB (dùng hằng ngày)**
- Dùng thư viện `idb`. Tối đa 3 slot nhân vật.
- Gọi `navigator.storage.persist()` mỗi lần khởi động, ghi log kết quả để tôi biết trình duyệt có cấp quyền không.
- Ghi theo transaction, có `save_version` để migrate khi cập nhật game.
- Autosave khi: lên cấp, đổi vùng, xong chuyến buôn, tab bị ẩn. Kèm nút lưu thủ công.

**Lớp 2 — Xuất/nhập file (lưới an toàn, KHÔNG được bỏ)**
- Nút **"Xuất file save"**: tải về file `.save` (JSON nén + checksum).
- Nút **"Nhập file save"**: chọn file, kiểm tra checksum, xác nhận trước khi ghi đè.
- Nhắc người chơi xuất save sau mỗi mốc quan trọng (cấp 10, 20, 30...).

**Nội dung save:** chỉ số, phân bổ điểm, mastery + skill, túi đồ + trang bị + cường hóa, vàng, cấp nghề + uy tín + truy nã, tiến độ quest, vị trí, bảng giá hàng hóa từng thành, cài đặt.

**Test bắt buộc:** sinh state ngẫu nhiên → lưu → nạp → so khớp toàn bộ. Thêm test migrate giữa hai `save_version`.

## 5. Lộ trình phase — xong mới sang phase sau

| Phase | Nội dung | Nghiệm thu |
|---|---|---|
| 0 | Khởi tạo Vite + TS + Phaser, cấu hình PWA, deploy GitHub Pages, `docs/DEPLOY.md` | Mở link trên iPhone, thêm vào MH chính, thấy màn hình chạy được |
| 1 | Di chuyển isometric, camera bám, điều khiển chạm, va chạm, 1 vùng map | Chạy quanh map trên điện thoại, mượt, đúng safe area |
| 2 | Stat + combat cơ bản (auto-attack, HP/MP, chết/hồi sinh), 1 loại quái | Đánh chết quái, lên cấp |
| 3 | AI quái đầy đủ, 4 hạng, spawner, loot, drop | Quái aggro/đuổi/bỏ chạy đúng, rơi đồ |
| 4 | Túi đồ, trang bị, cường hóa, NPC bán/sửa | Nhặt–mặc–cường hóa–bán được |
| 5 | Mastery + skill tree + UI phân bổ SP, 12–16 skill | Lên cấp, mở mastery, dùng skill trong combat |
| 6 | **Save/load hoàn chỉnh: IndexedDB + 3 slot + xuất/nhập file** | Đóng app, mở lại, mọi thứ nguyên vẹn. Xuất rồi nhập lại khớp 100%. |
| 7 | Nghề Thương nhân: xe thồ, cướp NPC, giá biến động | Hoàn thành 1 chuyến buôn có lãi |
| 8 | Hai nghề còn lại, mức truy nã, kỹ năng nghề | Chơi được cả 3 vai |
| 9 | Quest chính + NPC dialogue + 2 vùng còn lại | Chơi thông từ cấp 1 đến cấp 30 |
| 10 | Đánh bóng: âm thanh, hiệu ứng, cân bằng, auto-combat, tối ưu | Chơi 1 giờ liên tục trên điện thoại, không crash, không tụt FPS |

## 6. Quy ước kỹ thuật

- Thư mục: `src/scenes/`, `src/systems/`, `src/entities/`, `src/ui/`, `src/data/`, `public/assets/`, `tests/`, `docs/`.
- Toàn bộ số liệu cân bằng nằm trong `src/data/*.json` (`stats.json`, `skills.json`, `monsters.json`, `items.json`, `trade_goods.json`). **Không hardcode số trong code.**
- TypeScript strict mode. Logic thuần (damage formula, loot roll, giá cung–cầu, save/load) tách khỏi Phaser scene, test bằng Vitest.
- i18n từ đầu: `vi` mặc định, `en` dự phòng. Không hardcode chuỗi hiển thị.
- Comment code tiếng Anh, tài liệu `docs/` tiếng Việt.
- Git: commit nhỏ, Conventional Commits. GitHub Actions tự deploy lên Pages khi push nhánh `main`.

## 7. Cách làm việc với tôi

- Đầu mỗi phase: trình bày kế hoạch ngắn (file nào, vì sao, rủi ro), chờ tôi duyệt rồi mới code.
- Cuối mỗi phase: nói rõ cái gì chạy được, cái gì còn thiếu, **cách tôi tự kiểm tra trên điện thoại**, và cập nhật `docs/CHANGELOG.md`.
- Không tự nhảy phase, không tự thêm tính năng ngoài đặc tả.
- Asset đồ họa/âm thanh không tạo được: dùng placeholder hình học (khối màu, hình tròn) và ghi mô tả chi tiết vào `ASSETS_TODO.md` để tôi đi tìm hoặc thuê vẽ.
- Yêu cầu nào của tôi bất khả thi hoặc sai kỹ thuật thì nói thẳng ngay, kèm lý do và phương án thay thế.
- **Mỗi tính năng mới phải tự hỏi: cái này có chạy trên Safari iOS không?** Không chắc thì nói ra thay vì cứ viết.

---

## Lệnh phiên đầu tiên

> Đọc `CLAUDE.md`. Làm **Phase 0**: khởi tạo project Vite + TypeScript + Phaser 3, cấu hình vite-plugin-pwa (fullscreen, landscape, đủ icon kể cả apple-touch-icon), viết GitHub Actions tự deploy lên GitHub Pages, tạo scene trống hiển thị "Thương Lộ" và nút "Chạm để bắt đầu", viết `docs/DEPLOY.md` hướng dẫn tôi bật GitHub Pages và cài lên iPhone/Android.
> Trình bày kế hoạch và danh sách file sẽ tạo cho tôi duyệt trước khi code.
