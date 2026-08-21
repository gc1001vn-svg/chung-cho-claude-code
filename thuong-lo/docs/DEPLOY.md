# Triển khai & cài lên điện thoại

Tài liệu này làm một lần rồi hầu như không phải đụng lại. Từ lần sau, mỗi lần
push lên `main` là site tự cập nhật.

---

## 1. Bật GitHub Pages (chỉ làm một lần)

1. Vào repo trên GitHub → tab **Settings**
2. Cột trái, mục **Pages**
3. Ở **Build and deployment → Source**, chọn **GitHub Actions**

   > Quan trọng: **không** chọn "Deploy from a branch". Dự án này build bằng
   > Vite, thư mục `dist/` không được commit, nên chế độ branch sẽ chỉ ra trang
   > trắng.

4. Không cần bấm Save — GitHub lưu ngay.

## 2. Chạy lần deploy đầu

Deploy tự chạy khi có push lên `main`. Muốn chạy tay:

1. Tab **Actions** → workflow **Deploy to GitHub Pages**
2. Bấm **Run workflow** → chọn nhánh `main` → **Run workflow**

Workflow chạy lần lượt: cài gói → kiểm tra kiểu → chạy test → build → đẩy lên
Pages. Nếu một trong bốn bước đầu hỏng thì **không có gì được deploy** — đó là
chủ ý, để một commit lỗi không bao giờ ra tới điện thoại.

Xong sẽ hiện link dạng:

```
https://gc1001vn-svg.github.io/thuong-lo/
```

Lần đầu có thể mất 1–2 phút để DNS của Pages ăn.

## 3. Cài lên iPhone

**Bắt buộc dùng Safari.** Chrome/Firefox trên iOS không cài được PWA — đó là
giới hạn của iOS, không phải lỗi trình duyệt.

1. Mở link bằng **Safari**
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên đi lên, ở thanh dưới)
3. Vuốt xuống, chọn **Thêm vào MH chính** / *Add to Home Screen*
4. Bấm **Thêm**
5. Thoát Safari, mở game từ **icon con lạc đà** trên màn hình chính

Mở từ icon khác với mở trong Safari: chỉ khi mở từ icon mới không còn thanh địa
chỉ, và service worker mới được phép cache đầy đủ.

## 4. Cài lên Android

1. Mở link bằng **Chrome**
2. Menu ⋮ → **Cài đặt ứng dụng** / *Install app*
   (nếu không thấy, chọn **Thêm vào màn hình chính**)
3. Mở game từ icon

Android tôn trọng `orientation: landscape` trong manifest nên game tự xoay ngang.
iPhone thì không — xem mục 6.

## 5. Kiểm tra chơi offline

Đây mới là nghiệm thu thật của Phase 0:

1. Mở game từ icon, chờ hiện dòng **"Đã tải xong — chơi được cả khi mất mạng."**
2. Bật **chế độ máy bay**
3. Tắt hẳn game (vuốt khỏi danh sách app đang chạy)
4. Mở lại từ icon → phải chạy bình thường

Không chạy được thì service worker chưa cache xong. Tắt máy bay, mở lại, chờ dòng
thông báo hiện rồi thử lại.

## 6. Những chỗ iPhone làm khác Android

Đã kiểm chứng, không phải lỗi cấu hình — chi tiết trong
[`IOS_NOTES.md`](IOS_NOTES.md):

| Việc | Android | iPhone |
|---|---|---|
| Tự khóa ngang màn hình | Có | **Không** — game hiện màn "Xoay ngang điện thoại" |
| `display: fullscreen` | Có | Tụt về `standalone` (vẫn không có thanh địa chỉ) |
| Âm thanh trước khi chạm | Có | **Không** — phải chạm một lần |

## 7. Cập nhật phiên bản

Push lên `main` → Actions chạy → site mới lên.

Trên điện thoại, lần mở game kế tiếp sẽ hiện banner **"Đã có bản mới."** với nút
**Tải lại**. Game *không* tự tải lại giữa chừng — đó là chủ ý, để không bị mất
tiến trình đang chơi.

Muốn biết máy đã nhận bản mới chưa: nhìn dãy số mờ ở **góc dưới bên phải** màn
hình, đó là thời điểm build.

## 8. Chạy thử trên máy Windows

```bash
npm install
npm run dev          # mở http://localhost:5173/thuong-lo/
```

Muốn thử trên điện thoại thật trong cùng WiFi:

```bash
npm run dev -- --host
```

Rồi mở `http://<IP-máy-tính>:5173/thuong-lo/` trên điện thoại.

> Lưu ý: `npm run dev` **không** bật service worker (cố ý — để khỏi phải xóa
> cache liên tục khi đang code). Muốn thử đúng hành vi PWA thì dùng:
>
> ```bash
> npm run build
> npm run preview
> ```
