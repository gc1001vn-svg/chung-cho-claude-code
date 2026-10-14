---
name: md
description: Chuyển file người dùng gửi (PDF, Word, Excel, PowerPoint, HTML, ảnh…) sang Markdown gọn để tiết kiệm token, rồi chỉ đọc phần cần dùng. Dùng khi người dùng gõ /md, hoặc vừa tải file lên và muốn tôi đọc/xử lý nội dung file đó.
allowed-tools: Bash(${CLAUDE_SKILL_DIR}/convert.sh *) Read Grep
---

## Chuyển đổi

Chạy đúng một lệnh này, đừng gọi `markitdown` trực tiếp:

```bash
bash "${CLAUDE_SKILL_DIR}/convert.sh" [phần người dùng gõ sau /md]
```

Nếu `${CLAUDE_SKILL_DIR}` không được thay thế mà đến nguyên văn, hãy dùng đường dẫn thật của thư mục chứa SKILL.md này.

- Không tham số → đợt file vừa tải lên gần nhất.
- `all` → mọi file đã tải lên trong phiên.
- Tham số khác → đường dẫn, hoặc một phần tên file đã tải lên.

Kết quả `.md` nằm trong `.mdcache/` (gốc repo nếu đang ở repo git, ngược lại thư mục tạm), tên kèm đuôi file gốc (`bao-cao.pdf` → `bao-cao.pdf.md`) nên hai file trùng tên khác định dạng không đè nhau. Bản cũ được dùng lại khi file nguồn không đổi.

Script bỏ sẵn phần chắc chắn là rác: cột trống không tiêu đề của bảng tính, ô `NaN`, tiêu đề đầu trang lặp ở mọi trang PDF. Nội dung thật còn nguyên — thiếu chi tiết nào thì mở file gốc, đừng đoán.

## Quy tắc token — bắt buộc

Script in ước lượng token và dàn bài từng file. Căn cứ vào đó:

| Ước lượng | Việc cần làm |
|---|---|
| dưới ~10.000 token | `Read` trọn file `.md`, tóm tắt 3–5 gạch đầu dòng |
| trên ~10.000 token | **Không** `Read` trọn. Đưa dàn bài, hỏi người dùng cần phần nào, rồi `Grep` (kèm `-A`/`-B`) hoặc `Read` với `offset`/`limit` |

Có bản `.md` rồi thì **không đọc lại file gốc** — đó chính là chỗ tốn token mà lệnh này sinh ra để tránh. Chỉ mở lại file gốc khi người dùng hỏi về bố cục trang, chữ ký, con dấu, màu sắc.

## Trường hợp riêng

- **Video (.mp4, .mov)**: markitdown không đọc được. Nói rõ, đề nghị mô tả hoặc gửi ảnh chụp màn hình.
- **PDF scan**: bản `.md` gần rỗng mà PDF nhiều trang → scan chưa có lớp chữ. Báo người dùng, đừng đoán nội dung.
- **File lỗi**: script in `LOI` kèm nguyên nhân. Báo đúng nguyên nhân, không vòng vo sang công cụ khác.
- Muốn giữ bản `.md` lâu dài thì chép từ `.mdcache/` ra nơi khác; `.mdcache/` không được commit.

## Trả lời

Tiếng Việt, ngắn. Mỗi file một dòng: tên, dung lượng gốc → Markdown, ước lượng token. Sau đó nêu nội dung chính (nếu đã đọc trọn) hoặc dàn bài kèm câu hỏi cần phần nào (nếu file lớn). Không dán lại nguyên văn nội dung file.
