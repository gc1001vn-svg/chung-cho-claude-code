---
name: md
description: Chuyển file người dùng gửi (PDF, Word, Excel, PowerPoint, HTML, ảnh…) sang Markdown gọn để tiết kiệm token, rồi chỉ đọc phần cần dùng. Dùng khi người dùng gõ /md, hoặc vừa tải file lên và muốn tôi đọc/xử lý nội dung file đó.
argument-hint: "[để trống = file vừa gửi] [tên file] [all]"
allowed-tools: Bash Read Grep
---

## Chuyển đổi

Chạy script (một lệnh duy nhất, không tự gọi `markitdown` trực tiếp):

```bash
bash "$(git rev-parse --show-toplevel)/.claude/skills/md/convert.sh" $ARGUMENTS
```

- Không có tham số → chuyển đợt file người dùng vừa tải lên gần nhất.
- `all` → chuyển mọi file đã tải lên trong phiên.
- Có tham số khác → coi là đường dẫn, hoặc một phần tên file đã tải lên.

Kết quả `.md` nằm trong `.mdcache/` ở gốc repo (đã bị git bỏ qua). Script tự dùng lại bản đã chuyển nếu file nguồn không đổi.

## Quy tắc token — phần cốt lõi, phải tuân thủ

Script in ra ước lượng token và dàn bài của từng file. Căn cứ vào đó:

| Ước lượng | Việc cần làm |
|---|---|
| dưới ~10.000 token | `Read` trọn file `.md`, rồi tóm tắt 3–5 gạch đầu dòng |
| trên ~10.000 token | **Không** `Read` trọn. Đưa dàn bài cho người dùng, hỏi họ cần phần nào, rồi dùng `Grep` (kèm `-A`/`-B`) hoặc `Read` với `offset`/`limit` để lấy đúng đoạn đó |

Sau khi đã có bản `.md`, **tuyệt đối không đọc lại file gốc** (PDF/DOCX/ảnh) nữa — đó chính là chỗ tốn token mà lệnh này sinh ra để tránh. Chỉ quay lại file gốc khi người dùng hỏi về bố cục trang, chữ ký, con dấu hay màu sắc — những thứ Markdown không giữ được.

## Trường hợp riêng

- **Video (.mp4, .mov)**: markitdown không đọc được. Nói rõ và đề nghị người dùng mô tả hoặc gửi ảnh chụp màn hình.
- **PDF ảnh scan**: nếu bản `.md` gần như rỗng trong khi PDF nhiều trang thì đó là bản scan chưa có lớp chữ. Báo người dùng, đừng đoán nội dung.
- **File lỗi**: script in `LOI` kèm nguyên nhân. Báo lại đúng nguyên nhân, không thử vòng vo bằng công cụ khác.
- Người dùng muốn giữ lại bản `.md` lâu dài thì chép từ `.mdcache/` vào repo rồi commit; `.mdcache/` tự nó không được commit.

## Trả lời

Báo cáo ngắn gọn bằng tiếng Việt: mỗi file một dòng gồm tên, dung lượng gốc → dung lượng Markdown, ước lượng token. Sau đó nêu nội dung chính (nếu đã đọc trọn) hoặc dàn bài kèm câu hỏi người dùng cần phần nào (nếu file lớn). Không dán lại nguyên văn nội dung file.
